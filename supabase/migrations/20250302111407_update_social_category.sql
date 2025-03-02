/*
  # Update categories
  
  1. Rename "Social Media" to "Social"
  2. Add "Uncategorized" category
*/

-- Rename "Social Media" to "Social"
UPDATE integration_categories 
SET name = 'Social', description = 'Social media platforms and social networking services'
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Add "Uncategorized" category if it doesn't exist
INSERT INTO integration_categories (id, name, description, icon)
VALUES 
  ('77777777-7777-7777-7777-777777777777', 'Uncategorized', 'Other integrations that do not fit into specific categories', 'folder')
ON CONFLICT (id) DO NOTHING;

-- Move integrations without a category to "Uncategorized"
UPDATE integrations 
SET category_id = '77777777-7777-7777-7777-777777777777'
WHERE category_id IS NULL; 