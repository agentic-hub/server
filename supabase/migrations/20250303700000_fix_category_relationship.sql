/*
  # Fix Category Relationship in Database

  This migration:
  1. Creates a function to ensure the category relationship is properly established
  2. Updates the integrations table to include the category relationship
  3. Creates a trigger to maintain the relationship
*/

-- Create a function to update the category relationship
CREATE OR REPLACE FUNCTION update_integration_category()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the category information
    SELECT id, name, description, icon, "order"
    INTO NEW.category
    FROM integration_categories
    WHERE id = NEW.category_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_integration_category ON integrations;

-- Create a trigger to update the category relationship
CREATE TRIGGER trigger_update_integration_category
BEFORE INSERT OR UPDATE ON integrations
FOR EACH ROW
EXECUTE FUNCTION update_integration_category();

-- Update the integrations view to include the category relationship
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

-- Create a function to refresh the view
CREATE OR REPLACE FUNCTION refresh_integrations_view()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW integrations_with_categories;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh the view
DROP TRIGGER IF EXISTS trigger_refresh_integrations_view_insert ON integrations;
DROP TRIGGER IF EXISTS trigger_refresh_integrations_view_update ON integrations;
DROP TRIGGER IF EXISTS trigger_refresh_integrations_view_delete ON integrations;
DROP TRIGGER IF EXISTS trigger_refresh_categories_view_insert ON integration_categories;
DROP TRIGGER IF EXISTS trigger_refresh_categories_view_update ON integration_categories;
DROP TRIGGER IF EXISTS trigger_refresh_categories_view_delete ON integration_categories;

CREATE TRIGGER trigger_refresh_integrations_view_insert
AFTER INSERT ON integrations
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_integrations_view();

CREATE TRIGGER trigger_refresh_integrations_view_update
AFTER UPDATE ON integrations
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_integrations_view();

CREATE TRIGGER trigger_refresh_integrations_view_delete
AFTER DELETE ON integrations
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_integrations_view();

CREATE TRIGGER trigger_refresh_categories_view_insert
AFTER INSERT ON integration_categories
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_integrations_view();

CREATE TRIGGER trigger_refresh_categories_view_update
AFTER UPDATE ON integration_categories
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_integrations_view();

CREATE TRIGGER trigger_refresh_categories_view_delete
AFTER DELETE ON integration_categories
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_integrations_view(); 