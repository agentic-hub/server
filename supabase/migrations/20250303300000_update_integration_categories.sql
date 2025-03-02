/*
  # Update Integration Category Assignments

  This migration:
  1. Updates Google Sheets to be in the Google category (ID: 11111111-1111-1111-1111-111111111111)
  2. Updates Twilio to be in the Productivity category
  3. Creates these integrations if they don't exist
  
  This migration does NOT delete any existing data.
*/

-- Update Google Sheets to be in the Google category with specific ID
UPDATE integrations 
SET category_id = '11111111-1111-1111-1111-111111111111'  -- Google category
WHERE name LIKE '%Google Sheets%' OR name LIKE '%Sheets%';

-- Update Twilio to be in the Productivity category
UPDATE integrations 
SET category_id = (SELECT id FROM integration_categories WHERE name IN ('Productivity') LIMIT 1)
WHERE name LIKE '%Twilio%';

-- Create Twilio integration if it doesn't exist
INSERT INTO integrations (name, description, icon, category_id)
SELECT 
  'Twilio', 
  'Send SMS, make calls, and build communication workflows with Twilio.', 
  'twilio', 
  (SELECT id FROM integration_categories WHERE name = 'Productivity' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM integrations WHERE name = 'Twilio'
);

-- Create Google Sheets integration if it doesn't exist
INSERT INTO integrations (name, description, icon, category_id)
SELECT 
  'Google Sheets', 
  'Create, edit, and collaborate on spreadsheets with Google Sheets.', 
  'sheets', 
  '11111111-1111-1111-1111-111111111111'  -- Google category
WHERE NOT EXISTS (
  SELECT 1 FROM integrations WHERE name = 'Google Sheets'
);

-- Ensure all social media integrations are in the Social Media category
UPDATE integrations
SET category_id = (
  SELECT id FROM integration_categories 
  WHERE name IN ('Social Media', 'Social') 
  ORDER BY name = 'Social Media' DESC 
  LIMIT 1
)
WHERE name IN ('Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'Pinterest', 'TikTok')
AND (
  category_id IS NULL OR 
  category_id NOT IN (
    SELECT id FROM integration_categories 
    WHERE name IN ('Social Media', 'Social')
  )
); 