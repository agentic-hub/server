import { getFromSupabaseFunction, postToSupabaseFunction } from '../utils/supabaseEdgeFunctions';

interface OAuthCredentialResponse {
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
}

interface OAuthInitResponse {
  redirectUrl: string;
  state?: string;
}

/**
 * Initiates the OAuth flow for Google
 * @param integrationId The ID of the integration in our system
 * @param scopes Array of scopes to request (e.g., ['gmail'])
 * @param options Optional parameters for saving credentials
 * @returns Promise with the redirect URL
 */
export const initiateGoogleOAuth = async (
  integrationId: string,
  scopes: string[] = [],
  options?: {
    userId?: string;
    save?: boolean;
    name?: string;
  }
): Promise<string> => {
  try {
    // Prepare request body
    const requestBody: Record<string, string | string[] | boolean> = {
      integration_id: integrationId,
      redirect_client: window.location.origin + window.location.pathname
    };
    
    // Add scopes if provided
    if (scopes && scopes.length > 0) {
      requestBody.scopes = scopes;
    }
    
    // Add additional parameters
    if (options) {
      if (options.save) {
        requestBody.save = true;
      }
      if (options.userId) {
        requestBody.userId = options.userId;
      }
      if (options.name) {
        requestBody.name = options.name;
      }
    }
    
    // Make the authenticated request
    const response = await postToSupabaseFunction<OAuthInitResponse>(
      '/oauth/init/google', 
      requestBody
    );
    
    // Store state in localStorage if provided
    if (response.state) {
      localStorage.setItem('oauth_state', response.state);
    }
    
    return response.redirectUrl;
  } catch (error) {
    console.error('Error initiating Google OAuth flow:', error);
    throw error;
  }
};

/**
 * Handles the OAuth callback after successful authentication
 * @param code The authorization code from Google
 * @param state The state parameter for security validation
 * @returns Promise with the credential data
 */
export const handleGoogleOAuthCallback = async (
  code: string,
  state: string
): Promise<OAuthCredentialResponse> => {
  try {
    // Make the authenticated request
    return await getFromSupabaseFunction<OAuthCredentialResponse>(
      '/oauth/google/callback',
      { code, state }
    );
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    throw error;
  }
}; 