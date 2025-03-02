/*
  # Create Integrations With Categories Materialized View

  This migration:
  1. Creates a materialized view for integrations with their associated categories
  2. Creates an index on the materialized view for faster lookups
  3. Sets up triggers to refresh the materialized view when data changes
  4. Ensures proper permissions are set for the materialized view
*/

-- Drop the materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS integrations_with_categories_materialized;

-- Create the materialized view for integrations with categories
CREATE MATERIALIZED VIEW integrations_with_categories_materialized AS
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

-- Create an index on the materialized view
CREATE UNIQUE INDEX idx_integrations_with_categories_materialized_id ON integrations_with_categories_materialized (id);

-- Grant permissions on the materialized view
GRANT SELECT ON integrations_with_categories_materialized TO public;

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_integrations_materialized_view()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW integrations_with_categories_materialized;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_refresh_integrations_mat_view_insert ON integrations;
DROP TRIGGER IF EXISTS trigger_refresh_integrations_mat_view_update ON integrations;
DROP TRIGGER IF EXISTS trigger_refresh_integrations_mat_view_delete ON integrations;
DROP TRIGGER IF EXISTS trigger_refresh_categories_mat_view_insert ON integration_categories;
DROP TRIGGER IF EXISTS trigger_refresh_categories_mat_view_update ON integration_categories;
DROP TRIGGER IF EXISTS trigger_refresh_categories_mat_view_delete ON integration_categories;

-- Create triggers to refresh the materialized view
CREATE TRIGGER trigger_refresh_integrations_mat_view_insert
AFTER INSERT ON integrations
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_integrations_materialized_view();

CREATE TRIGGER trigger_refresh_integrations_mat_view_update
AFTER UPDATE ON integrations
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_integrations_materialized_view();

CREATE TRIGGER trigger_refresh_integrations_mat_view_delete
AFTER DELETE ON integrations
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_integrations_materialized_view();

CREATE TRIGGER trigger_refresh_categories_mat_view_insert
AFTER INSERT ON integration_categories
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_integrations_materialized_view();

CREATE TRIGGER trigger_refresh_categories_mat_view_update
AFTER UPDATE ON integration_categories
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_integrations_materialized_view();

CREATE TRIGGER trigger_refresh_categories_mat_view_delete
AFTER DELETE ON integration_categories
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_integrations_materialized_view();

-- Refresh the materialized view initially
REFRESH MATERIALIZED VIEW integrations_with_categories_materialized; 