import { supabase } from '../lib/supabase';

// Base URL for the OAuth server
const OAUTH_SERVER_URL = 'http://localhost:3001';

/**
 * Initiates the OAuth flow for a specific provider
 * @param provider The OAuth provider (e.g., 'google', 'slack')
 * @param integrationId The ID of the integration in our system
 * @param selectedScopes Optional array of scopes to request
 * @returns void - redirects the browser to the OAuth provider
 */
export const initiateOAuth = (provider: string, integrationId: string, selectedScopes: string[] = []): void => {
  // Current URL to redirect back to after OAuth
  const redirectClient = window.location.origin + window.location.pathname;
  
  // Prepare the scopes parameter if scopes are selected
  const scopesParam = selectedScopes.length > 0 
    ? `&scopes=${encodeURIComponent(JSON.stringify(selectedScopes))}` 
    : '';
  
  // Redirect to the OAuth server to start the flow
  window.location.href = `${OAUTH_SERVER_URL}/auth/init/${provider}?integration_id=${integrationId}&redirect_client=${encodeURIComponent(redirectClient)}${scopesParam}`;
};

/**
 * Retrieves OAuth credentials after successful authentication
 * @param credentialId The temporary credential ID returned from the OAuth server
 * @param options Optional parameters for saving credentials
 * @returns Promise with the credential data
 */
export const getOAuthCredentials = async (
  credentialId: string,
  options?: {
    save?: boolean;
    userId?: string;
    name?: string;
  }
): Promise<{
  provider: string;
  integration_id: string;
  access_token: string;
  refresh_token?: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  expires_at?: number;
  scope?: string;
  scopes?: string[];
  token_type?: string;
}> => {
  try {
    let url = `${OAUTH_SERVER_URL}/api/credentials/${credentialId}`;
    
    // Add save parameters if provided
    if (options?.save) {
      const params = new URLSearchParams();
      params.append('save', 'true');
      
      if (options.userId) {
        params.append('userId', options.userId);
      }
      
      if (options.name) {
        params.append('name', options.name);
      }
      
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to retrieve OAuth credentials');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error retrieving OAuth credentials:', error);
    throw error;
  }
};

/**
 * Saves OAuth credentials to the database
 * @param name Display name for the credential
 * @param oauthData OAuth data from the server
 * @returns Promise with the saved credential
 */
export const saveOAuthCredentials = async (
  name: string, 
  oauthData: {
    provider: string;
    integration_id: string;
    access_token: string;
    refresh_token?: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
    expires_at?: number;
    scope?: string;
    token_type?: string;
  }
): Promise<{
  id: string;
  integration_id: string;
  user_id: string;
  name: string;
  data: Record<string, unknown>;
  created_at: string;
}> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) {
      throw new Error('User not authenticated');
    }
    
    // Format the credential data for storage
    const credentialData = {
      integration_id: oauthData.integration_id,
      user_id: userData.user.id,
      name: name || `${oauthData.provider.charAt(0).toUpperCase() + oauthData.provider.slice(1)} Connection`,
      data: {
        provider: oauthData.provider,
        access_token: oauthData.access_token,
        refresh_token: oauthData.refresh_token,
        user_id: oauthData.user_id,
        user_name: oauthData.user_name,
        user_email: oauthData.user_email,
        expires_at: oauthData.expires_at,
        scope: oauthData.scope,
        token_type: oauthData.token_type,
        redirect_uri: `${OAUTH_SERVER_URL}/auth/${oauthData.provider}/callback`
      }
    };
    
    // Save to database
    const { data, error } = await supabase
      .from('credentials')
      .insert([credentialData])
      .select();
    
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error('Error saving OAuth credentials:', error);
    throw error;
  }
};

/**
 * Fetches available scopes for a provider
 * @param provider The OAuth provider (e.g., 'google', 'slack')
 * @returns Promise with the available scopes
 */
export const getProviderScopes = async (provider: string): Promise<{
  default: string[];
  categories?: Record<string, {
    name: string;
    scopes: string[];
    description: string;
  }>;
}> => {
  try {
    const response = await fetch(`${OAUTH_SERVER_URL}/api/provider/${provider}/scopes`);
    
    if (!response.ok) {
      throw new Error(`Failed to retrieve scopes for ${provider}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error retrieving scopes for ${provider}:`, error);
    throw error;
  }
};