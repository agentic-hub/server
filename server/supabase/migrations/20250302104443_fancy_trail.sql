/*
  # Add new API integrations

  1. New Integrations
    - Add Google, TikTok, Gmail, and Slack integrations to the integrations table
    
  2. Changes
    - Updates existing integrations with better descriptions
*/

-- Add new integrations
INSERT INTO integrations (name, description, icon)
VALUES 
  ('Google', 'Connect to Google services including Drive, Sheets, and Calendar.', 'google'),
  ('TikTok', 'Integrate with TikTok for content creation and analytics.', 'tiktok'),
  ('Gmail', 'Send and receive emails through Gmail API.', 'gmail'),
  ('Slack', 'Post messages, create channels, and manage your Slack workspace.', 'slack');

-- Update existing integrations with better descriptions
UPDATE integrations 
SET description = 'Process payments, manage subscriptions, and handle invoices.'
WHERE name = 'Stripe';

UPDATE integrations 
SET description = 'Manage email campaigns, subscribers, and track email performance.'
WHERE name = 'Mailchimp';