/*
  # Ensure Google Category ID

  This migration:
  1. Ensures the Google category has the ID '11111111-1111-1111-1111-111111111111'
  2. Updates any integrations that were linked to the old Google category
  
  This migration is important for maintaining consistent category IDs across environments.
*/

-- First, check if a Google category with the correct ID already exists
DO $$
DECLARE
    correct_id_exists BOOLEAN;
    old_google_id UUID;
BEGIN
    -- Check if the Google category with the correct ID exists
    SELECT EXISTS(
        SELECT 1 FROM integration_categories 
        WHERE id = '11111111-1111-1111-1111-111111111111' AND name = 'Google'
    ) INTO correct_id_exists;
    
    -- If it doesn't exist, we need to fix it
    IF NOT correct_id_exists THEN
        -- Get the current Google category ID if it exists
        SELECT id INTO old_google_id FROM integration_categories WHERE name = 'Google' LIMIT 1;
        
        -- If there's an existing Google category with a different ID
        IF old_google_id IS NOT NULL THEN
            -- Update all integrations that use the old Google category ID
            UPDATE integrations 
            SET category_id = '11111111-1111-1111-1111-111111111111' 
            WHERE category_id = old_google_id;
            
            -- Delete the old Google category
            DELETE FROM integration_categories WHERE id = old_google_id;
        END IF;
        
        -- Insert the Google category with the correct ID
        INSERT INTO integration_categories (id, name, description, icon, "order")
        VALUES (
            '11111111-1111-1111-1111-111111111111',
            'Google',
            'Google services including Gmail, Drive, Calendar, and YouTube',
            'google',
            2
        )
        ON CONFLICT (id) DO UPDATE 
        SET name = 'Google',
            description = 'Google services including Gmail, Drive, Calendar, and YouTube',
            icon = 'google',
            "order" = 2;
    END IF;
END $$; 