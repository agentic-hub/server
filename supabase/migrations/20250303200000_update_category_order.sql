/*
  # Update Category Order

  This migration:
  1. Adds an `order` column to the `integration_categories` table if it doesn't exist
  2. Updates the order of existing categories to match the specified sequence:
     - Social Media (1)
     - Google (2)
     - Communication (3)
     - Productivity (4)
     - Developer Tools (5)
     - Payment (6)
     - Uncategorized (999)
  
  This migration does NOT delete any existing data.
*/

-- Add order column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'integration_categories' 
        AND column_name = 'order'
    ) THEN
        ALTER TABLE integration_categories ADD COLUMN "order" integer DEFAULT 999;
    END IF;
END $$;

-- Update categories with the specified order
UPDATE integration_categories SET "order" = 1 WHERE name = 'Social Media';
UPDATE integration_categories SET "order" = 1 WHERE name = 'Social'; -- In case it's named 'Social' instead of 'Social Media'
UPDATE integration_categories SET "order" = 2 WHERE name = 'Google';
UPDATE integration_categories SET "order" = 3 WHERE name = 'Communication';
UPDATE integration_categories SET "order" = 4 WHERE name = 'Productivity';
UPDATE integration_categories SET "order" = 5 WHERE name = 'Developer Tools';
UPDATE integration_categories SET "order" = 6 WHERE name = 'Payment';
UPDATE integration_categories SET "order" = 999 WHERE name = 'Uncategorized';

-- Set default order for any categories not explicitly ordered above
UPDATE integration_categories 
SET "order" = 100 
WHERE "order" IS NULL 
AND name NOT IN ('Social Media', 'Social', 'Google', 'Communication', 'Productivity', 'Developer Tools', 'Payment', 'Uncategorized');

-- Create index on order column for faster sorting
CREATE INDEX IF NOT EXISTS idx_integration_categories_order ON integration_categories ("order");

-- Add comment to the order column
COMMENT ON COLUMN integration_categories."order" IS 'Determines the display order of categories in the UI. Lower numbers appear first.'; 