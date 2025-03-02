/*
  # Add new API integrations

  1. New Integrations
    - Add Google as a single connector with preset scopes for various services
    - Add TikTok integration
    
  2. Changes
    - Updates existing integrations with better descriptions
    - Remove duplicate Slack integration
*/

-- Remove duplicate Slack integration if it exists
DELETE FROM integrations WHERE name = 'Slack' AND id NOT IN (
  SELECT id FROM integrations WHERE name = 'Slack' ORDER BY created_at ASC LIMIT 1
);

-- Add new integrations
INSERT INTO integrations (name, description, icon)
VALUES 
  ('Google', 'Connect to Google services including Gmail, Drive, Sheets, Calendar, and YouTube.', 'google'),
  ('TikTok', 'Integrate with TikTok for content creation and analytics.', 'tiktok');

-- Update existing integrations with better descriptions
UPDATE integrations 
SET description = 'Process payments, manage subscriptions, and handle invoices.'
WHERE name = 'Stripe';

UPDATE integrations 
SET description = 'Manage email campaigns, subscribers, and track email performance.'
WHERE name = 'Mailchimp';

-- Update Slack description
UPDATE integrations
SET description = 'Post messages, create channels, and manage your Slack workspace.'
WHERE name = 'Slack';

-- Add scopes column to credentials table if it doesn't exist
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS scopes jsonb;