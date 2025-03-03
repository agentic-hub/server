import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// Supabase Edge Functions URL
const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || 'https://uvlkspixjskmgcnkxpjq.supabase.co/functions/v1';

/**
 * Base API service for making requests to external services
 * through the Supabase backend functions
 */
export class ApiService {
  private userId: string | null = null;
  
  constructor() {
    // Get the current user ID from the auth store
    const user = useAuthStore.getState().user;
    this.userId = user?.id || null;
  }
  
  /**
   * Create a new API connection
   * @param integrationId The integration ID
   * @param credentialId The credential ID
   * @param metadata Additional metadata for the connection
   * @returns The created connection ID
   */
  async createConnection(integrationId: string, credentialId: string, metadata: Record<string, any> = {}) {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase.rpc('create_api_connection', {
      p_user_id: this.userId,
      p_integration_id: integrationId,
      p_credential_id: credentialId,
      p_metadata: metadata
    });
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get active connections for the current user
   * @returns Array of active connections
   */
  async getConnections() {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('api_connections')
      .select(`
        id,
        status,
        last_used_at,
        metadata,
        created_at,
        updated_at,
        integrations (
          id,
          name,
          description,
          icon
        ),
        credentials (
          id,
          name,
          data
        )
      `)
      .eq('user_id', this.userId)
      .eq('status', 'active');
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Log an API request
   * @param params Request and response details
   * @returns The log ID
   */
  async logApiRequest(params: {
    connectionId?: string;
    integrationId: string;
    requestMethod: string;
    requestPath: string;
    requestHeaders: Record<string, any>;
    requestBody: Record<string, any>;
    responseStatus: number;
    responseHeaders: Record<string, any>;
    responseBody: Record<string, any>;
    errorMessage?: string;
    durationMs?: number;
  }) {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase.rpc('log_api_request', {
      p_user_id: this.userId,
      p_connection_id: params.connectionId || null,
      p_integration_id: params.integrationId,
      p_request_method: params.requestMethod,
      p_request_path: params.requestPath,
      p_request_headers: params.requestHeaders,
      p_request_body: params.requestBody,
      p_response_status: params.responseStatus,
      p_response_headers: params.responseHeaders,
      p_response_body: params.responseBody,
      p_error_message: params.errorMessage || null,
      p_duration_ms: params.durationMs || null
    });
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get API logs for the current user
   * @param limit Maximum number of logs to return
   * @param offset Offset for pagination
   * @returns Array of API logs
   */
  async getLogs(limit = 20, offset = 0) {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('api_logs')
      .select(`
        id,
        request_method,
        request_path,
        response_status,
        error_message,
        duration_ms,
        created_at,
        integrations (
          id,
          name,
          icon
        )
      `)
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get active credentials for a specific integration
   * @param integrationId The integration ID
   * @returns Array of credentials
   */
  async getActiveCredentials(integrationId: string) {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase.rpc('get_active_credentials', {
      p_user_id: this.userId,
      p_integration_id: integrationId
    });
    
    if (error) throw error;
    return data;
  }

  /**
   * Make a request to an external API through the Supabase Edge Function
   * @param integrationId The integration ID
   * @param credentialId The credential ID
   * @param method The HTTP method
   * @param path The API path
   * @param body The request body
   * @param headers Additional headers
   * @returns The API response
   */
  async makeApiRequest(
    integrationId: string,
    credentialId: string,
    method: string,
    path: string,
    body: Record<string, unknown> = {},
    headers: Record<string, string> = {}
  ) {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }
    
    const startTime = Date.now();
    
    try {
      // Prepare the request to the Edge Function
      const requestOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          integration_id: integrationId,
          credential_id: credentialId,
          method,
          path,
          body,
          user_id: this.userId
        })
      };
      
      // Make the request to the Edge Function
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/api/proxy`, requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }
      
      const responseData = await response.json();
      
      // Log the API request (this still uses Supabase RPC)
      await this.logApiRequest({
        connectionId: responseData.connection_id,
        integrationId,
        requestMethod: method,
        requestPath: path,
        requestHeaders: headers,
        requestBody: body || {},
        responseStatus: response.status,
        responseHeaders: responseData.headers || {},
        responseBody: responseData.data || {},
        durationMs: Date.now() - startTime
      });
      
      return responseData.data;
    } catch (error: any) {
      // Log the error
      await this.logApiRequest({
        integrationId,
        requestMethod: method,
        requestPath: path,
        requestHeaders: headers,
        requestBody: body || {},
        responseStatus: 500,
        responseHeaders: {},
        responseBody: {},
        errorMessage: error.message,
        durationMs: Date.now() - startTime
      });
      
      throw error;
    }
  }
}

/**
 * Google API service for interacting with Google services
 */
export class GoogleApiService extends ApiService {
  /**
   * Send an email using Gmail API
   * @param credentialId The credential ID to use
   * @param params Email parameters
   * @returns The response from the API
   */
  async sendEmail(credentialId: string, params: {
    to: string;
    subject: string;
    body: string;
    isHtml?: boolean;
  }) {
    // Get the integration ID for Gmail
    const { data: integrations } = await supabase
      .from('integrations')
      .select('id')
      .ilike('name', '%gmail%')
      .limit(1);
    
    if (!integrations || integrations.length === 0) {
      throw new Error('Gmail integration not found');
    }
    
    const integrationId = integrations[0].id;
    
    // Use the makeApiRequest method to call the Edge Function
    return this.makeApiRequest(
      integrationId,
      credentialId,
      'POST',
      '/gmail/v1/users/me/messages/send',
      {
        to: params.to,
        subject: params.subject,
        body: params.body,
        isHtml: params.isHtml || false
      }
    );
  }
  
  /**
   * List YouTube videos
   * @param credentialId The credential ID to use
   * @param params Query parameters
   * @returns The response from the API
   */
  async listYouTubeVideos(credentialId: string, params: {
    channelId?: string;
    maxResults?: number;
    order?: 'date' | 'rating' | 'viewCount';
  }) {
    // Get the integration ID for YouTube
    const { data: integrations } = await supabase
      .from('integrations')
      .select('id')
      .ilike('name', '%youtube%')
      .limit(1);
    
    if (!integrations || integrations.length === 0) {
      throw new Error('YouTube integration not found');
    }
    
    const integrationId = integrations[0].id;
    
    // Use the makeApiRequest method to call the Edge Function
    return this.makeApiRequest(
      integrationId,
      credentialId,
      'GET',
      '/youtube/v3/search',
      {
        part: 'snippet',
        forMine: true,
        type: 'video',
        channelId: params.channelId,
        maxResults: params.maxResults || 10,
        order: params.order || 'date'
      }
    );
  }
}

// Export instances of the services
export const apiService = new ApiService();
export const googleApiService = new GoogleApiService();