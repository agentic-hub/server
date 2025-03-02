/*
  # API Hub Backend Services

  1. New Tables
    - `api_connections` - Stores active API connections with metadata
    - `api_logs` - Logs API requests and responses
    - `api_keys` - Stores encrypted API keys for services
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Create secure functions for API operations
*/

-- Create API connections table
CREATE TABLE IF NOT EXISTS api_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  integration_id uuid REFERENCES integrations NOT NULL,
  credential_id uuid REFERENCES credentials NOT NULL,
  status text NOT NULL DEFAULT 'active',
  last_used_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create API logs table
CREATE TABLE IF NOT EXISTS api_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  connection_id uuid REFERENCES api_connections,
  integration_id uuid REFERENCES integrations,
  request_method text,
  request_path text,
  request_headers jsonb,
  request_body jsonb,
  response_status integer,
  response_headers jsonb,
  response_body jsonb,
  error_message text,
  duration_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Create API keys table (for storing service API keys)
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  integration_id uuid REFERENCES integrations NOT NULL,
  key_name text NOT NULL,
  key_value text NOT NULL,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE api_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- API connections policies
CREATE POLICY "Users can view their own API connections"
  ON api_connections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API connections"
  ON api_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API connections"
  ON api_connections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API connections"
  ON api_connections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- API logs policies
CREATE POLICY "Users can view their own API logs"
  ON api_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API logs"
  ON api_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- API keys policies
CREATE POLICY "Users can view their own API keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON api_keys
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON api_keys
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to create an API connection
CREATE OR REPLACE FUNCTION create_api_connection(
  p_user_id uuid,
  p_integration_id uuid,
  p_credential_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_connection_id uuid;
BEGIN
  -- Verify the user owns the credential
  IF NOT EXISTS (
    SELECT 1 FROM credentials 
    WHERE id = p_credential_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Credential not found or not owned by user';
  END IF;

  -- Create the connection
  INSERT INTO api_connections (
    user_id, 
    integration_id, 
    credential_id, 
    metadata
  ) 
  VALUES (
    p_user_id, 
    p_integration_id, 
    p_credential_id, 
    p_metadata
  )
  RETURNING id INTO v_connection_id;

  RETURN v_connection_id;
END;
$$;

-- Create function to log API requests
CREATE OR REPLACE FUNCTION log_api_request(
  p_user_id uuid,
  p_connection_id uuid,
  p_integration_id uuid,
  p_request_method text,
  p_request_path text,
  p_request_headers jsonb,
  p_request_body jsonb,
  p_response_status integer,
  p_response_headers jsonb,
  p_response_body jsonb,
  p_error_message text DEFAULT NULL,
  p_duration_ms integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO api_logs (
    user_id,
    connection_id,
    integration_id,
    request_method,
    request_path,
    request_headers,
    request_body,
    response_status,
    response_headers,
    response_body,
    error_message,
    duration_ms
  )
  VALUES (
    p_user_id,
    p_connection_id,
    p_integration_id,
    p_request_method,
    p_request_path,
    p_request_headers,
    p_request_body,
    p_response_status,
    p_response_headers,
    p_response_body,
    p_error_message,
    p_duration_ms
  )
  RETURNING id INTO v_log_id;

  -- Update the last_used_at timestamp for the connection
  IF p_connection_id IS NOT NULL THEN
    UPDATE api_connections
    SET last_used_at = now()
    WHERE id = p_connection_id;
  END IF;

  RETURN v_log_id;
END;
$$;

-- Create function to get active credentials for a user and integration
CREATE OR REPLACE FUNCTION get_active_credentials(
  p_user_id uuid,
  p_integration_id uuid
)
RETURNS TABLE (
  id uuid,
  name text,
  data jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.data, c.created_at
  FROM credentials c
  WHERE c.user_id = p_user_id
    AND c.integration_id = p_integration_id;
END;
$$;