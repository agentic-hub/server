/*
  # Add Coming Soon Flag to Integrations

  This migration:
  1. Adds a coming_soon flag to the integrations table
  2. Sets all integrations to coming_soon = true except Gmail
  3. Updates the views and materialized views to include this new field
*/

-- Add coming_soon column to integrations table
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS coming_soon boolean DEFAULT true;

-- Set Gmail to not be coming soon (available now)
UPDATE integrations SET coming_soon = false WHERE name = 'Gmail';

-- Update the regular view to include the coming_soon flag
DROP VIEW IF EXISTS integrations_with_categories;
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

-- Drop and recreate the materialized view to include the coming_soon flag
DROP MATERIALIZED VIEW IF EXISTS integrations_with_categories_materialized;
CREATE MATERIALIZED VIEW integrations_with_categories_materialized AS
SELECT 
    i.id,
    i.name,
    i.description,
    i.icon,
    i.category_id,
    i.coming_soon,
    i.created_at,
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

-- Drop the view that depends on the function first
DROP VIEW IF EXISTS public.integrations_with_categories_view;

-- Drop the existing function before recreating it with the new return type
DROP FUNCTION IF EXISTS public.get_integrations_with_categories_for_frontend();

-- Update the frontend function to include the coming_soon flag
CREATE OR REPLACE FUNCTION public.get_integrations_with_categories_for_frontend()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  icon text,
  category_id uuid,
  coming_soon boolean,
  created_at timestamptz,
  category_name text,
  category_description text,
  category_icon text,
  category_order integer,
  category jsonb
) AS $$
BEGIN
  -- Return the data from the materialized view
  RETURN QUERY
  SELECT 
    i.id,
    i.name,
    i.description,
    i.icon,
    i.category_id,
    i.coming_soon,
    i.created_at,
    i.category_name,
    i.category_description,
    i.category_icon,
    i.category_order,
    i.category
  FROM 
    integrations_with_categories_materialized i;
END;
$$ LANGUAGE plpgsql;

-- Update the comment on the function
COMMENT ON FUNCTION public.get_integrations_with_categories_for_frontend() IS 
'Use this function in the frontend to get integrations with their categories.
The coming_soon flag indicates whether an integration is available (false) or coming soon (true).
Example usage in the frontend:
```typescript
const { data, error } = await supabase.rpc("get_integrations_with_categories_for_frontend");
```';

-- Create the view that depends on the function
CREATE OR REPLACE VIEW public.integrations_with_categories_view AS
SELECT * FROM public.get_integrations_with_categories_for_frontend();

-- Grant select permission on the view
GRANT SELECT ON public.integrations_with_categories_view TO authenticated;
GRANT SELECT ON public.integrations_with_categories_view TO anon;
GRANT SELECT ON public.integrations_with_categories_view TO service_role; 