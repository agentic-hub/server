// Replace with Supabase Edge Functions URL
const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || 'https://uvlkspixjskmgcnkxpjq.supabase.co/functions/v1';

/**
 * Initiates the OAuth flow for a specific provider
 * @param provider The OAuth provider (e.g., 'google', 'slack')
 * @param integrationId The ID of the integration in our system
 * @param selectedScopes Optional array of scopes to request
 * @param options Optional parameters for saving credentials
 * @returns void - redirects the browser to the OAuth provider
 */
export const initiateOAuth = async (
  provider: string, 
  integrationId: string, 
  selectedScopes: string[] = [],
  options?: {
    userId?: string;
    save?: boolean;
    name?: string;
  }
): Promise<void> => {
  // Current URL to redirect back to after OAuth
  const redirectClient = window.location.origin + window.location.pathname;
  
  // Prepare the request payload
  const payload = {
    integration_id: integrationId,
    redirect_client: redirectClient,
    ...(selectedScopes.length > 0 && { scopes: selectedScopes }),
    ...(options?.save && { save: true }),
    ...(options?.userId && { userId: options.userId }),
    ...(options?.name && { name: options.name })
  };
  
  try {
    // Make POST request to the OAuth init endpoint
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/oauth/init/${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`OAuth initialization failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Redirect to the authorization URL returned from the server
    if (data.authorizationUrl) {
      window.location.href = data.authorizationUrl;
    } else {
      throw new Error('No authorization URL returned from the server');
    }
  } catch (error) {
    console.error('Error initiating OAuth flow:', error);
    throw error;
  }
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
    let url = `${SUPABASE_FUNCTIONS_URL}/oauth/credentials/${credentialId}`;
    
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
    
    const response = await fetch(url, {
      credentials: 'include'
    });
    
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
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/api/provider/${provider}/scopes`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to retrieve scopes for ${provider}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error retrieving scopes for ${provider}:`, error);
    throw error;
  }
};