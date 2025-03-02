/*
  # Update Frontend Query

  This migration:
  1. Creates a function to get integrations with categories that can be used by the frontend
  2. Ensures the function is accessible to all roles
*/

-- Create a function to get integrations with categories for the frontend
CREATE OR REPLACE FUNCTION public.get_integrations_with_categories_for_frontend()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  icon text,
  category_id uuid,
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
    i.category
  FROM 
    integrations_with_categories_materialized i;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_integrations_with_categories_for_frontend() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_integrations_with_categories_for_frontend() TO anon;
GRANT EXECUTE ON FUNCTION public.get_integrations_with_categories_for_frontend() TO service_role;

-- Create a comment to instruct frontend developers
COMMENT ON FUNCTION public.get_integrations_with_categories_for_frontend() IS 
'Use this function in the frontend to get integrations with their categories.
Example usage in the frontend:
```typescript
const { data, error } = await supabase.rpc("get_integrations_with_categories_for_frontend");
```';

-- Create a view for easier access
CREATE OR REPLACE VIEW public.integrations_with_categories_view AS
SELECT * FROM public.get_integrations_with_categories_for_frontend();

-- Grant select permission on the view
GRANT SELECT ON public.integrations_with_categories_view TO authenticated;
GRANT SELECT ON public.integrations_with_categories_view TO anon;
GRANT SELECT ON public.integrations_with_categories_view TO service_role; 