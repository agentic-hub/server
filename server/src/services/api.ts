import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

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
    const startTime = Date.now();
    
    try {
      // In a real implementation, this would call a Supabase Edge Function
      // that would use the credential to send the email via Gmail API
      
      // For now, we'll just log the request and simulate a response
      const requestBody = {
        to: params.to,
        subject: params.subject,
        body: params.body,
        isHtml: params.isHtml || false
      };
      
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
      
      // Create a connection if it doesn't exist
      const connectionId = await this.createConnection(integrationId, credentialId);
      
      // Simulate API response
      const responseBody = {
        messageId: `msg_${Math.random().toString(36).substring(2, 15)}`,
        threadId: `thread_${Math.random().toString(36).substring(2, 15)}`,
        labelIds: ['SENT']
      };
      
      // Log the API request
      await this.logApiRequest({
        connectionId,
        integrationId,
        requestMethod: 'POST',
        requestPath: '/gmail/v1/users/me/messages/send',
        requestHeaders: { 'Content-Type': 'application/json' },
        requestBody,
        responseStatus: 200,
        responseHeaders: { 'Content-Type': 'application/json' },
        responseBody,
        durationMs: Date.now() - startTime
      });
      
      return responseBody;
    } catch (error: any) {
      // Log the error
      const { data: integrations } = await supabase
        .from('integrations')
        .select('id')
        .ilike('name', '%gmail%')
        .limit(1);
      
      if (integrations && integrations.length > 0) {
        await this.logApiRequest({
          integrationId: integrations[0].id,
          requestMethod: 'POST',
          requestPath: '/gmail/v1/users/me/messages/send',
          requestHeaders: { 'Content-Type': 'application/json' },
          requestBody: {
            to: params.to,
            subject: params.subject
          },
          responseStatus: 500,
          responseHeaders: {},
          responseBody: {},
          errorMessage: error.message,
          durationMs: Date.now() - startTime
        });
      }
      
      throw error;
    }
  }
  
  /**
   * List videos from a YouTube channel
   * @param credentialId The credential ID to use
   * @param params Query parameters
   * @returns The response from the API
   */
  async listYouTubeVideos(credentialId: string, params: {
    channelId?: string;
    maxResults?: number;
    order?: 'date' | 'rating' | 'viewCount';
  }) {
    const startTime = Date.now();
    
    try {
      // In a real implementation, this would call a Supabase Edge Function
      // that would use the credential to fetch videos via YouTube API
      
      // For now, we'll just log the request and simulate a response
      const requestBody = {
        part: 'snippet',
        channelId: params.channelId,
        maxResults: params.maxResults || 10,
        order: params.order || 'date'
      };
      
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
      
      // Create a connection if it doesn't exist
      const connectionId = await this.createConnection(integrationId, credentialId);
      
      // Simulate API response
      const responseBody = {
        kind: 'youtube#searchListResponse',
        etag: 'etag',
        nextPageToken: 'nextPageToken',
        pageInfo: {
          totalResults: 10,
          resultsPerPage: 10
        },
        items: Array.from({ length: 5 }, (_, i) => ({
          kind: 'youtube#searchResult',
          etag: `etag_${i}`,
          id: {
            kind: 'youtube#video',
            videoId: `video_${Math.random().toString(36).substring(2, 15)}`
          },
          snippet: {
            publishedAt: new Date().toISOString(),
            channelId: params.channelId || `channel_${Math.random().toString(36).substring(2, 15)}`,
            title: `Sample Video ${i + 1}`,
            description: `This is a sample video description ${i + 1}`,
            thumbnails: {
              default: {
                url: `https://i.ytimg.com/vi/sample_${i}/default.jpg`,
                width: 120,
                height: 90
              },
              medium: {
                url: `https://i.ytimg.com/vi/sample_${i}/mqdefault.jpg`,
                width: 320,
                height: 180
              },
              high: {
                url: `https://i.ytimg.com/vi/sample_${i}/hqdefault.jpg`,
                width: 480,
                height: 360
              }
            },
            channelTitle: 'Sample Channel',
            liveBroadcastContent: 'none'
          }
        }))
      };
      
      // Log the API request
      await this.logApiRequest({
        connectionId,
        integrationId,
        requestMethod: 'GET',
        requestPath: '/youtube/v3/search',
        requestHeaders: { 'Content-Type': 'application/json' },
        requestBody,
        responseStatus: 200,
        responseHeaders: { 'Content-Type': 'application/json' },
        responseBody,
        durationMs: Date.now() - startTime
      });
      
      return responseBody;
    } catch (error: any) {
      // Log the error
      const { data: integrations } = await supabase
        .from('integrations')
        .select('id')
        .ilike('name', '%youtube%')
        .limit(1);
      
      if (integrations && integrations.length > 0) {
        await this.logApiRequest({
          integrationId: integrations[0].id,
          requestMethod: 'GET',
          requestPath: '/youtube/v3/search',
          requestHeaders: { 'Content-Type': 'application/json' },
          requestBody: {
            channelId: params.channelId,
            maxResults: params.maxResults
          },
          responseStatus: 500,
          responseHeaders: {},
          responseBody: {},
          errorMessage: error.message,
          durationMs: Date.now() - startTime
        });
      }
      
      throw error;
    }
  }
}

// Export instances of the services
export const apiService = new ApiService();
export const googleApiService = new GoogleApiService();