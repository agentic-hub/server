/*
  # Add OAuth Credentials Functions

  This migration adds functions to manage OAuth credentials in the database.
  These functions provide a secure way to store, retrieve, and manage temporary OAuth credentials.
*/

-- Create oauth_credentials table if it doesn't exist
CREATE TABLE IF NOT EXISTS oauth_credentials (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  integration_id uuid REFERENCES integrations NOT NULL,
  provider text NOT NULL,
  name text NOT NULL,
  data jsonb NOT NULL, -- Encrypted credentials and metadata
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  UNIQUE(user_id, integration_id, name)
);

-- Enable Row Level Security
ALTER TABLE oauth_credentials ENABLE ROW LEVEL SECURITY;

-- OAuth credentials policies
CREATE POLICY "Users can view their own oauth credentials"
  ON oauth_credentials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own oauth credentials"
  ON oauth_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own oauth credentials"
  ON oauth_credentials
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own oauth credentials"
  ON oauth_credentials
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to store OAuth credentials
CREATE OR REPLACE FUNCTION store_oauth_credentials(
  p_id uuid,
  p_user_id uuid,
  p_integration_id uuid,
  p_provider text,
  p_name text,
  p_data jsonb,
  p_expires_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Insert the OAuth credentials
  INSERT INTO oauth_credentials (
    id,
    user_id,
    integration_id,
    provider,
    name,
    data,
    expires_at
  )
  VALUES (
    p_id,
    p_user_id,
    p_integration_id,
    p_provider,
    p_name,
    p_data,
    p_expires_at
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Create function to get OAuth credentials
CREATE OR REPLACE FUNCTION get_oauth_credentials(
  p_id uuid
)
RETURNS oauth_credentials
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credentials oauth_credentials;
BEGIN
  -- Get the OAuth credentials
  SELECT * INTO v_credentials
  FROM oauth_credentials
  WHERE id = p_id;
  
  RETURN v_credentials;
END;
$$;

-- Create function to delete OAuth credentials
CREATE OR REPLACE FUNCTION delete_oauth_credentials(
  p_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete the OAuth credentials
  DELETE FROM oauth_credentials
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$;

-- Create function to clean up expired OAuth credentials
CREATE OR REPLACE FUNCTION cleanup_expired_credentials()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Delete expired OAuth credentials
  DELETE FROM oauth_credentials
  WHERE expires_at < now()
  RETURNING count(*) INTO v_count;
  
  RETURN v_count;
END;
$$; 