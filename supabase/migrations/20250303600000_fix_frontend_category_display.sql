/*
  # Fix Frontend Category Display Issues

  This migration:
  1. Ensures the relationship between integrations and categories is properly established
  2. Adds a foreign key constraint if it doesn't exist
  3. Updates the category_id column to use the correct UUID format
  4. Refreshes the materialized views if they exist
*/

-- First, ensure the category_id column in integrations table is of UUID type
DO $$
BEGIN
    -- Check if the column exists and is not already UUID type
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'integrations' 
        AND column_name = 'category_id'
        AND data_type != 'uuid'
    ) THEN
        -- Alter the column type to UUID
        ALTER TABLE integrations ALTER COLUMN category_id TYPE uuid USING category_id::uuid;
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc 
        JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name 
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'integrations' 
        AND ccu.column_name = 'category_id'
    ) THEN
        ALTER TABLE integrations 
        ADD CONSTRAINT fk_integration_category 
        FOREIGN KEY (category_id) 
        REFERENCES integration_categories(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Update all integrations to ensure they have the correct category_id format
UPDATE integrations 
SET category_id = '11111111-1111-1111-1111-111111111111'
WHERE (name LIKE '%Google%' OR name = 'Gmail' OR name = 'Google Calendar' OR name = 'Google Drive' OR name = 'YouTube' OR name = 'Google Sheets')
AND (category_id IS NULL OR category_id::text != '11111111-1111-1111-1111-111111111111');

UPDATE integrations 
SET category_id = '22222222-2222-2222-2222-222222222222'
WHERE (name IN ('Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'Pinterest', 'TikTok'))
AND (category_id IS NULL OR category_id::text != '22222222-2222-2222-2222-222222222222');

UPDATE integrations 
SET category_id = '33333333-3333-3333-3333-333333333333'
WHERE name = 'Twilio'
AND (category_id IS NULL OR category_id::text != '33333333-3333-3333-3333-333333333333');

-- Set any remaining integrations without a category to Uncategorized
UPDATE integrations
SET category_id = '77777777-7777-7777-7777-777777777777'
WHERE category_id IS NULL;

-- Refresh materialized views if they exist
DO $$
DECLARE
    view_name text;
BEGIN
    FOR view_name IN 
        SELECT matviewname FROM pg_matviews
    LOOP
        EXECUTE 'REFRESH MATERIALIZED VIEW ' || view_name;
    END LOOP;
END $$;

-- Update the RLS policies to ensure they work with the category relationship
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."integration_categories";
    DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."integrations";
    
    -- Create new policies
    CREATE POLICY "Enable read access for all users" 
    ON "public"."integration_categories" 
    FOR SELECT 
    USING (true);
    
    CREATE POLICY "Enable read access for all users" 
    ON "public"."integrations" 
    FOR SELECT 
    USING (true);
END $$; 