/*
  # Cleanup Previous Migrations

  This migration:
  1. Drops any conflicting triggers or functions from previous migrations
  2. Ensures a clean state for subsequent migrations
*/

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_integration_category ON integrations;
DROP TRIGGER IF EXISTS trigger_refresh_integrations_view_insert ON integrations;
DROP TRIGGER IF EXISTS trigger_refresh_integrations_view_update ON integrations;
DROP TRIGGER IF EXISTS trigger_refresh_integrations_view_delete ON integrations;
DROP TRIGGER IF EXISTS trigger_refresh_categories_view_insert ON integration_categories;
DROP TRIGGER IF EXISTS trigger_refresh_categories_view_update ON integration_categories;
DROP TRIGGER IF EXISTS trigger_refresh_categories_view_delete ON integration_categories;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS update_integration_category();
DROP FUNCTION IF EXISTS refresh_integrations_view();

-- Drop views if they exist
DROP VIEW IF EXISTS integrations_with_categories;
DROP MATERIALIZED VIEW IF EXISTS integrations_with_categories; 