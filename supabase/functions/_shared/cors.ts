// CORS headers for Edge Functions
export const corsHeaders = (req: Request) => {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3001',
    'https://agentic-hub.github.io',
    'https://uvlkspixjskmgcnkxpjq.supabase.co'
  ];
  
  // Check if the request origin is allowed
  const allowOrigin = allowedOrigins.includes(origin) ? origin : '*';
  
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-auth, x-supabase-client',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  };
}; 