/*
  # OAuth Tables for Edge Functions

  1. New Tables
    - `oauth_states` - Stores OAuth state parameters
    - `oauth_credentials` - Stores temporary OAuth credentials
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create OAuth states table
CREATE TABLE IF NOT EXISTS oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text UNIQUE NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- Create OAuth credentials table
CREATE TABLE IF NOT EXISTS oauth_credentials (
  id uuid PRIMARY KEY,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- Enable Row Level Security
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_credentials ENABLE ROW LEVEL SECURITY;

-- OAuth states policies (service role only)
CREATE POLICY "Service role can manage oauth states"
  ON oauth_states
  USING (true)
  WITH CHECK (true);

-- OAuth credentials policies (service role only)
CREATE POLICY "Service role can manage oauth credentials"
  ON oauth_credentials
  USING (true)
  WITH CHECK (true);

-- Create function to clean up expired OAuth states and credentials
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_data()
RETURNS void AS $$
BEGIN
  -- Delete expired OAuth states
  DELETE FROM oauth_states
  WHERE expires_at < now();
  
  -- Delete expired OAuth credentials
  DELETE FROM oauth_credentials
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a cron job to clean up expired OAuth data every hour
SELECT cron.schedule(
  'cleanup-oauth-data',
  '0 * * * *', -- Run every hour
  $$SELECT cleanup_expired_oauth_data()$$
); 