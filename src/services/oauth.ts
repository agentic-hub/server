import { supabase } from '../lib/supabase';

// Base URL for the OAuth server
const OAUTH_SERVER_URL = 'http://localhost:3001';

/**
 * Initiates the OAuth flow for a specific provider
 * @param provider The OAuth provider (e.g., 'google', 'slack')
 * @param integrationId The ID of the integration in our system
 * @returns void - redirects the browser to the OAuth provider
 */
export const initiateOAuth = (provider: string, integrationId: string): void => {
  // Current URL to redirect back to after OAuth
  const redirectClient = window.location.origin + window.location.pathname;
  
  // Redirect to the OAuth server to start the flow
  window.location.href = `${OAUTH_SERVER_URL}/auth/init/${provider}?integration_id=${integrationId}&redirect_client=${encodeURIComponent(redirectClient)}`;
};

/**
 * Retrieves OAuth credentials after successful authentication
 * @param credentialId The temporary credential ID returned from the OAuth server
 * @returns Promise with the credential data
 */
export const getOAuthCredentials = async (credentialId: string): Promise<any> => {
  try {
    const response = await fetch(`${OAUTH_SERVER_URL}/api/credentials/${credentialId}`);
    
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
export const saveOAuthCredentials = async (name: string, oauthData: any): Promise<any> => {
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