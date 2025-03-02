// Supabase Edge Function for API endpoints
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

// Define OAuth scopes for different providers
const OAUTH_SCOPES = {
  google: {
    default: ['profile', 'email'],
    gmail: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'],
    sheets: ['https://www.googleapis.com/auth/spreadsheets'],
    drive: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.file'],
    calendar: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.readonly'],
    youtube: ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/youtube.upload']
  },
  github: {
    default: ['user:email', 'read:user'],
    repos: ['repo', 'public_repo'],
    admin: ['admin:org', 'admin:repo_hook'],
    notifications: ['notifications', 'read:discussion']
  },
  slack: {
    default: ['identity.basic'],
    messages: ['chat:write', 'chat:write.public'],
    channels: ['channels:read', 'channels:history', 'groups:read'],
    users: ['users:read', 'users:read.email'],
    files: ['files:read', 'files:write']
  },
  facebook: {
    default: ['email', 'public_profile'],
    pages: ['pages_show_list', 'pages_read_engagement'],
    publishing: ['pages_manage_posts', 'pages_manage_engagement'],
    instagram: ['instagram_basic', 'instagram_content_publish']
  }
};

// Create a Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// Helper functions for OAuth scopes
function getGoogleScopes(requestedScopes = []) {
  // Start with default scopes
  const scopes = [...OAUTH_SCOPES.google.default];
  
  // Add requested service scopes
  if (requestedScopes && requestedScopes.length > 0) {
    requestedScopes.forEach(service => {
      if (OAUTH_SCOPES.google[service]) {
        scopes.push(...OAUTH_SCOPES.google[service]);
      }
    });
  }
  
  // Add custom scopes if provided
  if (requestedScopes && requestedScopes.some(scope => scope.startsWith('https://www.googleapis.com'))) {
    requestedScopes.forEach(scope => {
      if (scope.startsWith('https://www.googleapis.com') && !scopes.includes(scope)) {
        scopes.push(scope);
      }
    });
  }
  
  return scopes;
}

function getProviderScopes(provider, requestedScopes = []) {
  if (provider === 'google') {
    return getGoogleScopes(requestedScopes);
  }
  
  // For other providers with scope categories
  if (OAUTH_SCOPES[provider]) {
    const scopes = [...OAUTH_SCOPES[provider].default];
    
    // Add requested category scopes
    if (requestedScopes && requestedScopes.length > 0) {
      requestedScopes.forEach(category => {
        if (OAUTH_SCOPES[provider][category]) {
          scopes.push(...OAUTH_SCOPES[provider][category]);
        } else if (!scopes.includes(category)) {
          // If it's not a category but a direct scope, add it
          scopes.push(category);
        }
      });
    }
    
    return [...new Set(scopes)]; // Remove duplicates
  }
  
  // For providers without defined scopes, use the requested scopes directly
  return requestedScopes;
}

// Main handler function for the Edge Function
serve(async (req: Request) => {
  // Handle CORS for preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const params = Object.fromEntries(url.searchParams.entries());

    // API to retrieve stored credentials
    if (path.match(/\/api\/credentials\/[^/]+/)) {
      if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const id = path.split('/').pop();
      
      // Get credentials from the database using Supabase RPC function
      const { data, error } = await supabaseClient.rpc('get_oauth_credentials', {
        p_id: id
      });
      
      if (error) {
        console.error('Error fetching credentials:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch credentials' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (!data) {
        return new Response(JSON.stringify({ error: 'Credentials not found or expired' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Check if credentials have expired
      if (new Date(data.expires_at) < new Date()) {
        // Delete expired credentials using Supabase RPC function
        await supabaseClient.rpc('delete_oauth_credentials', {
          p_id: id
        });
        return new Response(JSON.stringify({ error: 'Credentials have expired' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Format the credentials for the client
      const formattedCredentials = {
        provider: data.provider,
        integration_id: data.data.integration_id,
        access_token: data.data.access_token,
        refresh_token: data.data.refresh_token,
        user_id: data.data.user.id,
        user_name: data.data.user.displayName || '',
        user_email: data.data.user.email || '',
        expires_at: data.data.params?.expires_at || null,
        scope: data.data.params?.scope || '',
        scopes: data.data.requestedScopes || [],
        token_type: data.data.params?.token_type || 'Bearer'
      };
      
      // Check for save parameter in both URL query and stored credentials
      const shouldSave = params.save === 'true' || data.data.save === 'true';
      const userId = params.userId || data.data.userId || data.user_id;
      const integrationName = params.name || data.data.name || data.name;
      
      // Save credentials to user_integrations table if requested
      if (shouldSave && userId) {
        try {
          // Save to user_integrations table
          const { data: savedIntegration, error: saveError } = await supabaseClient.rpc('save_user_integration', {
            p_user_id: userId,
            p_integration_id: formattedCredentials.integration_id,
            p_name: integrationName,
            p_provider: formattedCredentials.provider,
            p_access_token: formattedCredentials.access_token,
            p_refresh_token: formattedCredentials.refresh_token,
            p_token_type: formattedCredentials.token_type,
            p_expires_at: formattedCredentials.expires_at ? new Date(formattedCredentials.expires_at) : null,
            p_scopes: formattedCredentials.scopes.length > 0 ? formattedCredentials.scopes : null,
            p_user_data: {
              user_id: formattedCredentials.user_id,
              user_name: formattedCredentials.user_name,
              user_email: formattedCredentials.user_email
            },
            p_metadata: null
          });
          
          if (saveError) {
            console.error('Error saving to user_integrations:', saveError);
            // Continue to return credentials even if saving fails
          } else {
            console.log('Successfully saved user integration:', savedIntegration);
            // Add the saved flag to the response
            formattedCredentials.saved = true;
            
            // Delete the temporary credentials after saving to permanent storage using Supabase RPC function
            await supabaseClient.rpc('delete_oauth_credentials', {
              p_id: id
            });
          }
        } catch (saveError) {
          console.error('Error saving credentials:', saveError);
          // Continue to return credentials even if saving fails
        }
      }
      
      return new Response(JSON.stringify(formattedCredentials), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get available Google scopes
    if (path === '/api/google/scopes') {
      if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const googleScopes = {
        default: OAUTH_SCOPES.google.default,
        services: {
          gmail: {
            name: 'Gmail',
            scopes: OAUTH_SCOPES.google.gmail,
            description: 'Access to Gmail for sending and reading emails'
          },
          sheets: {
            name: 'Google Sheets',
            scopes: OAUTH_SCOPES.google.sheets,
            description: 'Access to Google Sheets for reading and writing data'
          },
          drive: {
            name: 'Google Drive',
            scopes: OAUTH_SCOPES.google.drive,
            description: 'Access to Google Drive for file management'
          },
          calendar: {
            name: 'Google Calendar',
            scopes: OAUTH_SCOPES.google.calendar,
            description: 'Access to Google Calendar for event management'
          },
          youtube: {
            name: 'YouTube',
            scopes: OAUTH_SCOPES.google.youtube,
            description: 'Access to YouTube for video management and analytics'
          }
        }
      };
      
      return new Response(JSON.stringify(googleScopes), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get available scopes for any provider
    if (path.match(/\/api\/provider\/[^/]+\/scopes/)) {
      if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const provider = path.split('/')[3];
      
      if (!OAUTH_SCOPES[provider]) {
        return new Response(JSON.stringify({ error: `Provider ${provider} not found` }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const providerScopes = {
        default: OAUTH_SCOPES[provider].default
      };
      
      // Add categories for each provider
      if (provider === 'google') {
        providerScopes.categories = {
          gmail: {
            name: 'Gmail',
            scopes: OAUTH_SCOPES.google.gmail,
            description: 'Access to Gmail for sending and reading emails'
          },
          sheets: {
            name: 'Google Sheets',
            scopes: OAUTH_SCOPES.google.sheets,
            description: 'Access to Google Sheets for reading and writing data'
          },
          drive: {
            name: 'Google Drive',
            scopes: OAUTH_SCOPES.google.drive,
            description: 'Access to Google Drive for file management'
          },
          calendar: {
            name: 'Google Calendar',
            scopes: OAUTH_SCOPES.google.calendar,
            description: 'Access to Google Calendar for event management'
          },
          youtube: {
            name: 'YouTube',
            scopes: OAUTH_SCOPES.google.youtube,
            description: 'Access to YouTube for video management and analytics'
          }
        };
      } else if (provider === 'github') {
        providerScopes.categories = {
          repos: {
            name: 'Repositories',
            scopes: OAUTH_SCOPES.github.repos,
            description: 'Access to public and private repositories'
          },
          admin: {
            name: 'Administration',
            scopes: OAUTH_SCOPES.github.admin,
            description: 'Administrative access to organizations and webhooks'
          },
          notifications: {
            name: 'Notifications',
            scopes: OAUTH_SCOPES.github.notifications,
            description: 'Access to notifications and discussions'
          }
        };
      } else if (provider === 'slack') {
        providerScopes.categories = {
          messages: {
            name: 'Messages',
            scopes: OAUTH_SCOPES.slack.messages,
            description: 'Send messages to channels and users'
          },
          channels: {
            name: 'Channels',
            scopes: OAUTH_SCOPES.slack.channels,
            description: 'Access to channel information and history'
          },
          users: {
            name: 'Users',
            scopes: OAUTH_SCOPES.slack.users,
            description: 'Access to user information and profiles'
          },
          files: {
            name: 'Files',
            scopes: OAUTH_SCOPES.slack.files,
            description: 'Access to files and file management'
          }
        };
      } else if (provider === 'facebook') {
        providerScopes.categories = {
          pages: {
            name: 'Pages',
            scopes: OAUTH_SCOPES.facebook.pages,
            description: 'Access to Facebook Pages information'
          },
          publishing: {
            name: 'Publishing',
            scopes: OAUTH_SCOPES.facebook.publishing,
            description: 'Publish content to Facebook Pages'
          },
          instagram: {
            name: 'Instagram',
            scopes: OAUTH_SCOPES.facebook.instagram,
            description: 'Access to connected Instagram accounts'
          }
        };
      }
      
      return new Response(JSON.stringify(providerScopes), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user integrations
    if (path === '/api/user-integrations') {
      if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { userId } = params;
      
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Get user integrations from the database
      const { data, error } = await supabaseClient
        .from('user_integrations')
        .select(`
          *,
          integration:integration_id (
            id,
            name,
            description,
            icon,
            category_id
          )
        `)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching user integrations:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch user integrations' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Delete user integration
    if (path.match(/\/api\/user-integrations\/[^/]+/) && req.method === 'DELETE') {
      const id = path.split('/').pop();
      const { userId } = params;
      
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Delete the user integration
      const { error } = await supabaseClient
        .from('user_integrations')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error deleting user integration:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete user integration' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Get user credentials for the dashboard
    if (path === '/api/user-credentials') {
      if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { userId } = params;
      
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Get user credentials from the database
      const { data, error } = await supabaseClient
        .from('user_integrations')
        .select(`
          id,
          user_id,
          integration_id,
          name,
          provider,
          created_at,
          updated_at,
          integration:integration_id (
            id,
            name,
            description,
            icon,
            category_id
          )
        `)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching user credentials:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch user credentials' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Format the credentials for the client
      const formattedCredentials = data.map(cred => ({
        id: cred.id,
        user_id: cred.user_id,
        integration_id: cred.integration_id,
        name: cred.name,
        provider: cred.provider,
        created_at: cred.created_at,
        updated_at: cred.updated_at,
        integration: cred.integration
      }));
      
      return new Response(JSON.stringify(formattedCredentials), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If no route matches, return 404
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in API edge function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 