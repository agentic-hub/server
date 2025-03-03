import { supabase } from '../lib/supabase';

const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || 'https://uvlkspixjskmgcnkxpjq.supabase.co/functions/v1';

/**
 * Makes an authenticated request to a Supabase Edge Function
 * @param path The path of the Edge Function (e.g., '/oauth/init/google')
 * @param method The HTTP method to use (default: 'GET')
 * @param body The request body for POST/PUT requests
 * @param queryParams Optional query parameters
 * @returns Promise with the response data
 */
export const callSupabaseFunction = async <T, B = Record<string, unknown>>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: B,
  queryParams?: Record<string, string>
): Promise<T> => {
  try {
    // Get the current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }
    
    // Build the URL with query parameters
    let url = `${SUPABASE_FUNCTIONS_URL}${path}`;
    
    if (queryParams && Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        params.append(key, value);
      });
      url += `?${params.toString()}`;
    }
    
    // Prepare request options
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    };
    
    // Add body for POST/PUT requests
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }
    
    // Make the request
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to call Supabase function: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling Supabase function:', error);
    throw error;
  }
};

/**
 * Makes an authenticated POST request to a Supabase Edge Function
 * @param path The path of the Edge Function
 * @param body The request body
 * @param queryParams Optional query parameters
 * @returns Promise with the response data
 */
export const postToSupabaseFunction = async <T, B = Record<string, unknown>>(
  path: string,
  body: B,
  queryParams?: Record<string, string>
): Promise<T> => {
  return callSupabaseFunction<T, B>(path, 'POST', body, queryParams);
};

/**
 * Makes an authenticated GET request to a Supabase Edge Function
 * @param path The path of the Edge Function
 * @param queryParams Optional query parameters
 * @returns Promise with the response data
 */
export const getFromSupabaseFunction = async <T>(
  path: string,
  queryParams?: Record<string, string>
): Promise<T> => {
  return callSupabaseFunction<T>(path, 'GET', undefined, queryParams);
}; 