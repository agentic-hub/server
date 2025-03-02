/*
  # Add Category Ordering

  This migration:
  1. Adds an `order` column to the `integration_categories` table
  2. Updates existing categories with the specified order:
     - Social (1)
     - Google (2)
     - Communication (3)
     - Productivity (4)
     - Others (5+)
  3. Updates Google Sheets to be in the Google category
  4. Updates Twilio to be in the Productivity category
*/

-- Add order column to integration_categories table
ALTER TABLE integration_categories ADD COLUMN "order" integer DEFAULT 999;

-- Update categories with the specified order
UPDATE integration_categories SET "order" = 1 WHERE name = 'Social';
UPDATE integration_categories SET "order" = 2 WHERE name = 'Google';
UPDATE integration_categories SET "order" = 3 WHERE name = 'Communication';
UPDATE integration_categories SET "order" = 4 WHERE name = 'Productivity';
UPDATE integration_categories SET "order" = 5 WHERE name = 'Developer Tools';
UPDATE integration_categories SET "order" = 6 WHERE name = 'Payment';
UPDATE integration_categories SET "order" = 999 WHERE name = 'Uncategorized';

-- Update Google Sheets to be in the Google category
UPDATE integrations 
SET category_id = '11111111-1111-1111-1111-111111111111'  -- Google category
WHERE name LIKE '%Google Sheets%' OR name LIKE '%Sheets%';

-- Update Twilio to be in the Productivity category
UPDATE integrations 
SET category_id = '33333333-3333-3333-3333-333333333333'  -- Productivity category
WHERE name LIKE '%Twilio%';

-- Create Twilio integration if it doesn't exist
INSERT INTO integrations (name, description, icon, category_id)
SELECT 
  'Twilio', 
  'Send SMS, make calls, and build communication workflows with Twilio.', 
  'twilio', 
  '33333333-3333-3333-3333-333333333333'  -- Productivity category
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