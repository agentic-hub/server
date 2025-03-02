/*
  # Add user_integrations table

  This migration adds a user_integrations table to store user connections with tokens.
  Instead of creating new integrations, users will connect to existing integrations
  and store their tokens in this table.
*/

-- Create user_integrations table
CREATE TABLE IF NOT EXISTS user_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  integration_id uuid REFERENCES integrations NOT NULL,
  name text NOT NULL,
  provider text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  token_type text DEFAULT 'Bearer',
  expires_at timestamptz,
  scopes jsonb,
  user_data jsonb, -- Store user profile data from the provider
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, integration_id, name)
);

-- Enable Row Level Security
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- User integrations policies
CREATE POLICY "Users can view their own integrations"
  ON user_integrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
  ON user_integrations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON user_integrations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON user_integrations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_integration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_user_integration_updated_at
BEFORE UPDATE ON user_integrations
FOR EACH ROW
EXECUTE FUNCTION update_user_integration_updated_at();

-- Create function to save user integration
CREATE OR REPLACE FUNCTION save_user_integration(
  p_user_id uuid,
  p_integration_id uuid,
  p_name text,
  p_provider text,
  p_access_token text,
  p_refresh_token text DEFAULT NULL,
  p_token_type text DEFAULT 'Bearer',
  p_expires_at timestamptz DEFAULT NULL,
  p_scopes jsonb DEFAULT NULL,
  p_user_data jsonb DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_integration_id uuid;
BEGIN
  -- Insert or update the user integration
  INSERT INTO user_integrations (
    user_id,
    integration_id,
    name,
    provider,
    access_token,
    refresh_token,
    token_type,
    expires_at,
    scopes,
    user_data,
    metadata
  )
  VALUES (
    p_user_id,
    p_integration_id,
    p_name,
    p_provider,
    p_access_token,
    p_refresh_token,
    p_token_type,
    p_expires_at,
    p_scopes,
    p_user_data,
    p_metadata
  )
  ON CONFLICT (user_id, integration_id, name)
  DO UPDATE SET
    access_token = p_access_token,
    refresh_token = p_refresh_token,
    token_type = p_token_type,
    expires_at = p_expires_at,
    scopes = p_scopes,
    user_data = p_user_data,
    metadata = p_metadata,
    updated_at = now()
  RETURNING id INTO v_integration_id;

  RETURN v_integration_id;
END;
$$; 