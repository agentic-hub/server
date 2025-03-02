/*
  # Add integration categories

  1. New Tables
    - `integration_categories`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `icon` (text)
      - `created_at` (timestamptz)
  
  2. Changes
    - Add `category_id` column to `integrations` table
    - Create RLS policies for the new table
    - Add sample categories
    - Update existing integrations with category assignments
*/

-- Create integration categories table
CREATE TABLE IF NOT EXISTS integration_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  created_at timestamptz DEFAULT now()
);

-- Add category_id to integrations table
ALTER TABLE integrations ADD COLUMN category_id uuid REFERENCES integration_categories(id);

-- Enable Row Level Security
ALTER TABLE integration_categories ENABLE ROW LEVEL SECURITY;

-- Integration categories policies (public read access)
CREATE POLICY "Integration categories are viewable by all authenticated users"
  ON integration_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample categories
INSERT INTO integration_categories (id, name, description, icon)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Google', 'Google services including Gmail, Drive, Calendar, and YouTube', 'google'),
  ('22222222-2222-2222-2222-222222222222', 'Social Media', 'Social media platforms for content and engagement', 'social'),
  ('33333333-3333-3333-3333-333333333333', 'Productivity', 'Tools for improving productivity and workflow', 'productivity'),
  ('44444444-4444-4444-4444-444444444444', 'Communication', 'Messaging and communication platforms', 'communication'),
  ('55555555-5555-5555-5555-555555555555', 'Developer Tools', 'Tools for software development and deployment', 'developer'),
  ('66666666-6666-6666-6666-666666666666', 'Payment', 'Payment processing and financial services', 'payment');

-- Update existing integrations with categories
UPDATE integrations SET category_id = '11111111-1111-1111-1111-111111111111' WHERE name IN ('Google', 'Gmail', 'YouTube', 'Google Calendar', 'Google Drive');
UPDATE integrations SET category_id = '22222222-2222-2222-2222-222222222222' WHERE name IN ('TikTok');
UPDATE integrations SET category_id = '44444444-4444-4444-4444-444444444444' WHERE name IN ('Slack');
UPDATE integrations SET category_id = '55555555-5555-5555-5555-555555555555' WHERE name IN ('GitHub');
UPDATE integrations SET category_id = '66666666-6666-6666-6666-666666666666' WHERE name IN ('Stripe');
UPDATE integrations SET category_id = '33333333-3333-3333-3333-333333333333' WHERE name IN ('Airtable', 'Mailchimp', 'HubSpot');