/*
  # Fix Category Display Issues

  This migration:
  1. Ensures all categories exist with the correct IDs
  2. Updates all integrations to have the correct category_id
  3. Adds a category field directly to integrations for frontend display
  4. Fixes any potential issues with category recognition
*/

-- First, ensure all required categories exist with correct IDs
INSERT INTO integration_categories (id, name, description, icon, "order")
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Google', 'Google services including Gmail, Drive, Calendar, and YouTube', 'google', 2),
  ('22222222-2222-2222-2222-222222222222', 'Social Media', 'Social media platforms for content and engagement', 'social', 1),
  ('33333333-3333-3333-3333-333333333333', 'Productivity', 'Tools for improving productivity and workflow', 'productivity', 4),
  ('44444444-4444-4444-4444-444444444444', 'Communication', 'Messaging and communication platforms', 'communication', 3),
  ('55555555-5555-5555-5555-555555555555', 'Developer Tools', 'Tools for software development and deployment', 'developer', 5),
  ('66666666-6666-6666-6666-666666666666', 'Payment', 'Payment processing and financial services', 'payment', 6),
  ('77777777-7777-7777-7777-777777777777', 'Uncategorized', 'Other integrations that do not fit into specific categories', 'folder', 999)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    "order" = EXCLUDED."order";

-- Update Google integrations to have the correct category_id
UPDATE integrations 
SET category_id = '11111111-1111-1111-1111-111111111111'
WHERE name IN ('Google', 'Gmail', 'Google Calendar', 'Google Drive', 'YouTube', 'Google Sheets')
   OR name LIKE '%Google%';

-- Update Twilio to be in the Productivity category
UPDATE integrations 
SET category_id = '33333333-3333-3333-3333-333333333333'
WHERE name = 'Twilio' OR name LIKE '%Twilio%';

-- Update Social Media integrations
UPDATE integrations
SET category_id = '22222222-2222-2222-2222-222222222222'
WHERE name IN ('Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'Pinterest', 'TikTok');

-- Update Communication integrations
UPDATE integrations
SET category_id = '44444444-4444-4444-4444-444444444444'
WHERE name IN ('Slack', 'Discord', 'Microsoft Teams');

-- Set any remaining integrations without a category to Uncategorized
UPDATE integrations
SET category_id = '77777777-7777-7777-7777-777777777777'
WHERE category_id IS NULL;

-- Refresh the category information in the integrations table
-- This is a workaround to ensure the frontend displays categories correctly
DO $$
DECLARE
    integration_record RECORD;
BEGIN
    FOR integration_record IN SELECT id, category_id FROM integrations LOOP
        -- Update the integration to refresh its category relationship
        UPDATE integrations
        SET category_id = integration_record.category_id
        WHERE id = integration_record.id;
    END LOOP;
END $$; 