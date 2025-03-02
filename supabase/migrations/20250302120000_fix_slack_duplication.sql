/*
  # Fix Slack Integration Duplication

  This migration:
  1. Removes duplicate Slack integrations, keeping only the oldest one
  2. Ensures the remaining Slack integration has the correct description and category
*/

-- Remove duplicate Slack integrations if they exist
DELETE FROM integrations 
WHERE name = 'Slack' 
AND id NOT IN (
  SELECT id FROM (
    SELECT id FROM integrations 
    WHERE name = 'Slack' 
    ORDER BY created_at ASC 
    LIMIT 1
  ) AS oldest_slack
);

-- Ensure the remaining Slack integration has the correct description and category
UPDATE integrations
SET 
  description = 'Post messages, create channels, and manage your Slack workspace.',
  category_id = '44444444-4444-4444-4444-444444444444'  -- Communication category
WHERE name = 'Slack'; 