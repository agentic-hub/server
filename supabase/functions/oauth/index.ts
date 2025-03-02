// Supabase Edge Function for OAuth handling
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

// Define OAuth scopes for different providers
const OAUTH_SCOPES = {
  google: {
    default: ['profile', 'email'],
    gmail: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'],
    sheets: ['https://www.googleapis.com/auth/spreadsheets'],
    drive: ['https://www.googleapis.com/auth/drive.readonly'],
    calendar: ['https://www.googleapis.com/auth/calendar'],
    youtube: ['https://www.googleapis.com/auth/youtube.readonly']
  },
  github: ['user:email', 'read:user'],
  slack: ['users:read', 'chat:write', 'channels:read'],
  facebook: ['email', 'public_profile']
};

// In-memory storage is not suitable for Edge Functions as they are stateless
// We'll use Supabase database to store OAuth states and credentials
interface StateData {
  provider: string;
  integration_id: string;
  redirect_client: string;
  requestedScopes: string[];
  timestamp: number;
}

interface CredentialData {
  provider: string;
  integration_id: string;
  user: UserProfile;
  requestedScopes: string[];
  timestamp: number;
}

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  params?: {
    expires_at: number | null;
    scope: string;
    token_type: string;
  };
}

// Helper functions for OAuth scopes
function getGoogleScopes(requestedScopes: string[] = []): string[] {
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

function getProviderScopes(provider: string, requestedScopes: string[] = []): string[] {
  if (provider === 'google') {
    return getGoogleScopes(requestedScopes);
  }
  
  // For other providers, use default scopes and add custom ones
  const defaultScopes = OAUTH_SCOPES[provider] || [];
  
  // Combine default with custom scopes
  return [...new Set([...defaultScopes, ...requestedScopes])];
}

// Helper function to get provider configuration
function getProviderConfig(provider: string) {
  // In a real app, these would come from your database
  const configs = {
    github: {
      authorizationURL: 'https://github.com/login/oauth/authorize',
      tokenURL: 'https://github.com/login/oauth/access_token',
      clientID: Deno.env.get('GITHUB_CLIENT_ID'),
      clientSecret: Deno.env.get('GITHUB_CLIENT_SECRET'),
      profileURL: 'https://api.github.com/user'
    },
    slack: {
      authorizationURL: 'https://slack.com/oauth/v2/authorize',
      tokenURL: 'https://slack.com/api/oauth.v2.access',
      clientID: Deno.env.get('SLACK_CLIENT_ID'),
      clientSecret: Deno.env.get('SLACK_CLIENT_SECRET'),
      profileURL: 'https://slack.com/api/users.identity'
    },
    facebook: {
      authorizationURL: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenURL: 'https://graph.facebook.com/v18.0/oauth/access_token',
      clientID: Deno.env.get('FACEBOOK_CLIENT_ID'),
      clientSecret: Deno.env.get('FACEBOOK_CLIENT_SECRET'),
      profileURL: 'https://graph.facebook.com/v18.0/me?fields=id,name,email'
    },
    google: {
      authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenURL: 'https://oauth2.googleapis.com/token',
      clientID: Deno.env.get('GOOGLE_CLIENT_ID'),
      clientSecret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
      profileURL: 'https://www.googleapis.com/oauth2/v1/userinfo'
    }
  };
  
  return configs[provider];
}

// Create a Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

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

    // Initialize OAuth flow
    if (path.startsWith('/oauth/init')) {
      const provider = path.split('/').pop();
      if (!provider) {
        return new Response(JSON.stringify({ error: 'Provider not specified' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { integration_id, redirect_client, scopes } = params;
      
      // Parse requested scopes if provided
      const requestedScopes = scopes ? JSON.parse(decodeURIComponent(scopes)) : [];
      
      // Generate a state parameter to prevent CSRF
      const state = crypto.randomUUID();
      
      // Store state in Supabase
      const stateData: StateData = {
        provider,
        integration_id: integration_id || '',
        redirect_client: redirect_client || 'http://localhost:5173/integrations',
        requestedScopes,
        timestamp: Date.now()
      };
      
      // Store state in the database
      const { error: stateError } = await supabaseClient
        .from('oauth_states')
        .insert({
          state,
          data: stateData,
          expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour expiry
        });
      
      if (stateError) {
        console.error('Error storing OAuth state:', stateError);
        return new Response(JSON.stringify({ error: 'Failed to initialize OAuth flow' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Get provider config
      const providerConfig = getProviderConfig(provider);
      if (!providerConfig) {
        return new Response(JSON.stringify({ error: `Unsupported provider: ${provider}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Build authorization URL
      const scopes = getProviderScopes(provider, requestedScopes);
      const scopeParam = provider === 'google' ? 'scope' : 'scope';
      const redirectUri = `${url.origin}/oauth/${provider}/callback`;
      
      const authUrl = new URL(providerConfig.authorizationURL);
      authUrl.searchParams.append('client_id', providerConfig.clientID);
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append(scopeParam, scopes.join(' '));
      authUrl.searchParams.append('state', state);
      authUrl.searchParams.append('response_type', 'code');
      
      if (provider === 'google') {
        authUrl.searchParams.append('access_type', 'offline');
        authUrl.searchParams.append('prompt', 'consent');
      }
      
      // Redirect to authorization URL
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': authUrl.toString()
        }
      });
    }
    
    // Handle OAuth callback
    if (path.match(/\/oauth\/[^/]+\/callback/)) {
      const provider = path.split('/')[2];
      const { code, state } = params;
      
      if (!code || !state) {
        return new Response(JSON.stringify({ error: 'Missing code or state parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Retrieve state from database
      const { data: stateData, error: stateError } = await supabaseClient
        .from('oauth_states')
        .select('data')
        .eq('state', state)
        .single();
      
      if (stateError || !stateData) {
        return new Response(JSON.stringify({ error: 'Invalid or expired state' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const stateInfo: StateData = stateData.data;
      
      // Get provider config
      const providerConfig = getProviderConfig(provider);
      if (!providerConfig) {
        return new Response(JSON.stringify({ error: `Unsupported provider: ${provider}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Exchange code for tokens
      const redirectUri = `${url.origin}/oauth/${provider}/callback`;
      const tokenResponse = await fetch(providerConfig.tokenURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: providerConfig.clientID,
          client_secret: providerConfig.clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });
      
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.access_token) {
        return new Response(JSON.stringify({ error: 'Failed to obtain access token' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Fetch user profile if available
      let profileData = {};
      if (providerConfig.profileURL) {
        const profileResponse = await fetch(providerConfig.profileURL, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        });
        
        profileData = await profileResponse.json();
      }
      
      // Create user object
      const user = {
        id: profileData.id || crypto.randomUUID(),
        displayName: profileData.name || profileData.display_name || 'User',
        email: profileData.email || '',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || '',
        params: {
          expires_at: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : null,
          scope: tokenData.scope || '',
          token_type: tokenData.token_type || 'Bearer'
        }
      };
      
      // Store credentials temporarily with a unique ID
      const credentialId = crypto.randomUUID();
      const credentials: CredentialData = {
        provider,
        integration_id: stateInfo.integration_id,
        user,
        requestedScopes: stateInfo.requestedScopes,
        timestamp: Date.now()
      };
      
      // Store credentials in the database
      const { error: credError } = await supabaseClient
        .from('oauth_credentials')
        .insert({
          id: credentialId,
          data: credentials,
          expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour expiry
        });
      
      if (credError) {
        console.error('Error storing OAuth credentials:', credError);
        return new Response(JSON.stringify({ error: 'Failed to store credentials' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Clean up state
      await supabaseClient
        .from('oauth_states')
        .delete()
        .eq('state', state);
      
      // Redirect back to client with credential ID
      const redirectUrl = `${stateInfo.redirect_client || 'http://localhost:5173/integrations'}/${stateInfo.integration_id}?credential_id=${credentialId}`;
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': redirectUrl
        }
      });
    }
    
    // API to retrieve stored credentials
    if (path === '/oauth/credentials' && req.method === 'GET') {
      const { id } = params;
      
      if (!id) {
        return new Response(JSON.stringify({ error: 'Credential ID not provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Retrieve credentials from database
      const { data: credData, error: credError } = await supabaseClient
        .from('oauth_credentials')
        .select('data')
        .eq('id', id)
        .single();
      
      if (credError || !credData) {
        return new Response(JSON.stringify({ error: 'Credentials not found or expired' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const credentials: CredentialData = credData.data;
      
      // Format the credentials for the client
      const formattedCredentials = {
        provider: credentials.provider,
        integration_id: credentials.integration_id,
        access_token: credentials.user.accessToken,
        refresh_token: credentials.user.refreshToken || '',
        user_id: credentials.user.id,
        user_name: credentials.user.displayName || '',
        user_email: credentials.user.email || '',
        expires_at: credentials.user.params?.expires_at || null,
        scope: credentials.user.params?.scope || '',
        scopes: credentials.requestedScopes || [],
        token_type: credentials.user.params?.token_type || 'Bearer'
      };
      
      // Delete the temporary credentials after retrieval
      await supabaseClient
        .from('oauth_credentials')
        .delete()
        .eq('id', id);
      
      return new Response(JSON.stringify(formattedCredentials), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Add an endpoint to get available Google scopes
    if (path === '/oauth/google/scopes' && req.method === 'GET') {
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // If no route matches
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in OAuth Edge Function:', error);
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 