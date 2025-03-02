/*
  # Add scopes to credentials

  1. Changes
    - Add scopes column to credentials table to store user-defined scopes
*/

-- Add scopes column to credentials table if it doesn't exist
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS scopes jsonb;

-- Update existing Google credentials to include default scopes
UPDATE credentials
SET scopes = '["profile", "email"]'
WHERE scopes IS NULL AND data->>'provider' = 'google';

-- Update existing Slack credentials to include default scopes
UPDATE credentials
SET scopes = '["users:read", "chat:write", "channels:read"]'
WHERE scopes IS NULL AND data->>'provider' = 'slack'; 