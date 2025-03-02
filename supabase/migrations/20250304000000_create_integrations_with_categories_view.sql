/*
  # Create Integrations With Categories View

  This migration:
  1. Creates a view for integrations with their associated categories
  2. Ensures proper permissions are set for the view
*/

-- Drop the view if it exists
DROP VIEW IF EXISTS integrations_with_categories;

-- Create the view for integrations with categories
CREATE OR REPLACE VIEW integrations_with_categories AS
SELECT 
    i.*,
    c.name AS category_name,
    c.description AS category_description,
    c.icon AS category_icon,
    c."order" AS category_order,
    jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'description', c.description,
        'icon', c.icon,
        'order', c."order"
    ) AS category
FROM 
    integrations i
LEFT JOIN 
    integration_categories c ON i.category_id = c.id;

-- Grant permissions on the view
GRANT SELECT ON integrations_with_categories TO public;

-- Create a comment to document the view
COMMENT ON VIEW integrations_with_categories IS 
'This view joins integrations with their associated categories, providing a convenient way to access integration data with category information.'; 