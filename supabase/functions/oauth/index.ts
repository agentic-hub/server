// Supabase Edge Function for OAuth handling
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9.0.0';

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
  userId?: string;
  save?: string;
  name?: string;
  timestamp: number;
}

interface CredentialData {
  provider: string;
  integration_id: string;
  user: UserProfile;
  requestedScopes: string[];
  userId?: string;
  save?: string;
  name?: string;
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

// Helper function to fetch user profile
async function fetchUserProfile(provider: string, accessToken: string, profileURL: string): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(profileURL, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: unknown) {
    console.error('Error fetching user profile:', error);
    return {};
  }
}

// Helper function to exchange code for tokens
async function exchangeCodeForTokens(provider: string, code: string, redirectUri: string): Promise<Record<string, unknown>> {
  const providerConfig = getProviderConfig(provider);
  
  if (!providerConfig) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  
  const tokenURL = providerConfig.tokenURL;
  const clientID = providerConfig.clientID;
  const clientSecret = providerConfig.clientSecret;
  
  const params = new URLSearchParams();
  params.append('client_id', clientID);
  params.append('client_secret', clientSecret);
  params.append('code', code);
  params.append('redirect_uri', redirectUri);
  params.append('grant_type', 'authorization_code');
  
  try {
    const response = await fetch(tokenURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
}

// Main handler function for the Edge Function
serve(async (req: Request) => {
  // Handle CORS for preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
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
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
        });
      }

      // Get parameters from request body if it's a POST request, otherwise from query params
      let requestData: Record<string, unknown> = params;
      
      if (req.method === 'POST') {
        try {
          const contentType = req.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const body = await req.json() as Record<string, unknown>;
            requestData = { ...requestData, ...body };
          }
        } catch (error: unknown) {
          console.error('Error parsing request body:', error);
        }
      }
      
      const { integration_id, redirect_client, scopes, userId, save, name } = requestData as {
        integration_id?: string;
        redirect_client?: string;
        scopes?: string | string[];
        userId?: string;
        save?: string | boolean;
        name?: string;
      };
      
      // Parse requested scopes if provided
      let requestedScopes: string[] = [];
      if (scopes) {
        // Handle both string and array formats
        if (typeof scopes === 'string') {
          try {
            requestedScopes = JSON.parse(decodeURIComponent(scopes));
          } catch {
            // If parsing fails, treat it as a single scope
            requestedScopes = [scopes];
          }
        } else if (Array.isArray(scopes)) {
          requestedScopes = scopes;
        }
      }
      
      // Generate a state parameter to prevent CSRF
      const state = uuidv4();
      
      // Store state in Supabase
      const stateData: StateData = {
        provider,
        integration_id: integration_id || '',
        redirect_client: redirect_client || 'http://localhost:5173/integrations',
        requestedScopes,
        userId,
        save: save ? String(save) : undefined,
        name,
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
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
        });
      }
      
      // Get provider config
      const providerConfig = getProviderConfig(provider);
      if (!providerConfig) {
        return new Response(JSON.stringify({ error: `Unsupported provider: ${provider}` }), {
          status: 400,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
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
      
      // Return JSON response with redirect URL for API usage
      if (req.method === 'POST') {
        return new Response(
          JSON.stringify({ 
            redirectUrl: authUrl.toString(),
            state
          }),
          {
            status: 200,
            headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
          }
        );
      } else {
        // For GET requests, maintain backward compatibility with redirect
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders(req),
            'Location': authUrl.toString()
          }
        });
      }
    }
    
    // Handle OAuth callback
    if (path.match(/\/oauth\/[^/]+\/callback/)) {
      const provider = path.split('/')[2];
      const { code, state } = params;
      
      if (!code || !state) {
        return new Response(JSON.stringify({ error: 'Missing code or state parameter' }), {
          status: 400,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
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
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
        });
      }
      
      const { provider: stateProvider, integration_id, redirect_client, requestedScopes, userId, save, name } = stateData.data as StateData;
      
      // Verify provider matches
      if (provider !== stateProvider) {
        return new Response(JSON.stringify({ error: 'Provider mismatch' }), {
          status: 400,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
        });
      }
      
      // Exchange code for tokens
      const redirectUri = `${url.origin}/oauth/${provider}/callback`;
      let tokenData;
      
      try {
        tokenData = await exchangeCodeForTokens(provider, code, redirectUri);
      } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        return new Response(JSON.stringify({ error: 'Failed to exchange code for tokens' }), {
          status: 500,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
        });
      }
      
      // Extract tokens
      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token || null;
      const expiresIn = tokenData.expires_in || 3600;
      const tokenType = tokenData.token_type || 'Bearer';
      const scope = tokenData.scope || '';
      
      // Calculate expiration time
      const expiresAt = Date.now() + expiresIn * 1000;
      
      // Fetch user profile
      const providerConfig = getProviderConfig(provider);
      let userProfile = null;
      
      if (providerConfig && providerConfig.profileURL) {
        userProfile = await fetchUserProfile(provider, accessToken, providerConfig.profileURL);
      }
      
      // Create user object
      const user: UserProfile = {
        id: userProfile?.id || userProfile?.sub || uuidv4(),
        displayName: userProfile?.name || userProfile?.display_name || 'User',
        email: userProfile?.email || '',
        accessToken,
        refreshToken,
        params: {
          expires_at: expiresAt,
          scope,
          token_type: tokenType
        }
      };
      
      // Create a unique ID for the credentials
      const credentialId = uuidv4();
      
      // Store credentials in database
      const credentialData: CredentialData = {
        provider,
        integration_id,
        user,
        requestedScopes,
        userId,
        save,
        name,
        timestamp: Date.now()
      };
      
      // Insert into credentials table using Supabase RPC function
      const { error: credentialError } = await supabaseClient.rpc('store_oauth_credentials', {
        p_id: credentialId,
        p_user_id: userId || user.id,
        p_integration_id: integration_id,
        p_provider: provider,
        p_name: name || `${provider.charAt(0).toUpperCase() + provider.slice(1)} Connection`,
        p_data: credentialData,
        p_expires_at: new Date(Date.now() + 3600000) // Expires in 1 hour
      });
      
      if (credentialError) {
        console.error('Error storing credentials:', credentialError);
        return new Response(JSON.stringify({ error: 'Failed to store credentials' }), {
          status: 500,
          headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
        });
      }
      
      // Build redirect URL with credential ID
      let redirectUrl = `${redirect_client || 'http://localhost:5173/integrations'}/${integration_id}?credential_id=${credentialId}`;
      
      // Add additional parameters if they exist
      if (userId) {
        redirectUrl += `&userId=${encodeURIComponent(userId)}`;
      }
      if (save) {
        redirectUrl += `&save=${encodeURIComponent(save)}`;
      }
      if (name) {
        redirectUrl += `&name=${encodeURIComponent(name)}`;
      }
      
      // Redirect back to client
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders(req),
          'Location': redirectUrl
        }
      });
    }
    
    // If no route matches, return 404
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in OAuth edge function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
    });
  }
}); 