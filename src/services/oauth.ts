// Base URL for the OAuth server
const OAUTH_SERVER_URL = 'http://localhost:3001';

/**
 * Initiates the OAuth flow for a specific provider
 * @param provider The OAuth provider (e.g., 'google', 'slack')
 * @param integrationId The ID of the integration in our system
 * @param selectedScopes Optional array of scopes to request
 * @param options Optional parameters for saving credentials
 * @returns void - redirects the browser to the OAuth provider
 */
export const initiateOAuth = (
  provider: string, 
  integrationId: string, 
  selectedScopes: string[] = [],
  options?: {
    userId?: string;
    save?: boolean;
    name?: string;
  }
): void => {
  // Current URL to redirect back to after OAuth
  const redirectClient = window.location.origin + window.location.pathname;
  
  // Prepare the scopes parameter if scopes are selected
  const scopesParam = selectedScopes.length > 0 
    ? `&scopes=${encodeURIComponent(JSON.stringify(selectedScopes))}` 
    : '';
    
  // Prepare additional parameters for saving credentials
  let additionalParams = '';
  if (options) {
    if (options.save) {
      additionalParams += '&save=true';
    }
    if (options.userId) {
      additionalParams += `&userId=${encodeURIComponent(options.userId)}`;
    }
    if (options.name) {
      additionalParams += `&name=${encodeURIComponent(options.name)}`;
    }
  }
  
  // Redirect to the OAuth server to start the flow
  window.location.href = `${OAUTH_SERVER_URL}/auth/init/${provider}?integration_id=${integrationId}&redirect_client=${encodeURIComponent(redirectClient)}${scopesParam}${additionalParams}`;
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
    
    // Add query parameters for saving credentials
    if (options) {
      const params = new URLSearchParams();
      if (options.save) {
        params.append('save', 'true');
      }
      if (options.userId) {
        params.append('userId', options.userId);
      }
      if (options.name) {
        params.append('name', options.name);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
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