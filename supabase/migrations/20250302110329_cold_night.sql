/*
  # Add additional Google integrations

  1. New Integrations
    - Add YouTube, Google Calendar, Google Drive integrations
    - Update existing Google integration descriptions
  2. Security
    - All integrations use existing RLS policies
*/

-- Add new Google integrations
INSERT INTO integrations (name, description, icon)
VALUES 
  ('YouTube', 'Manage YouTube channels, videos, and analytics.', 'youtube'),
  ('Google Calendar', 'Create and manage events, appointments, and schedules.', 'calendar'),
  ('Google Drive', 'Upload, download, and manage files in Google Drive.', 'drive');

-- Update existing Google integration with more specific description
UPDATE integrations 
SET description = 'Connect to core Google services and authenticate users.'
WHERE name = 'Google';

-- Update Gmail integration with more detailed description
UPDATE integrations 
SET description = 'Send, receive, and manage emails through Gmail API. Access inbox, drafts, and labels.'
WHERE name = 'Gmail';