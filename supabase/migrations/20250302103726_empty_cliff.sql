/*
  # Initial schema setup for API Hub

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `avatar_url` (text)
      - `updated_at` (timestamp)
    - `integrations`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `icon` (text)
      - `created_at` (timestamp)
    - `credentials`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `integration_id` (uuid, references integrations)
      - `name` (text)
      - `data` (jsonb, encrypted)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  updated_at timestamptz DEFAULT now()
);

-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  created_at timestamptz DEFAULT now()
);

-- Create credentials table
CREATE TABLE IF NOT EXISTS credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  integration_id uuid REFERENCES integrations NOT NULL,
  name text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Integrations policies (public read access)
CREATE POLICY "Integrations are viewable by all authenticated users"
  ON integrations
  FOR SELECT
  TO authenticated
  USING (true);

-- Credentials policies
CREATE POLICY "Users can view their own credentials"
  ON credentials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials"
  ON credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials"
  ON credentials
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials"
  ON credentials
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert sample integrations
INSERT INTO integrations (name, description, icon)
VALUES 
  ('Google Sheets', 'Connect to Google Sheets to read and write data.', 'sheets'),
  ('Slack', 'Send messages and notifications to Slack channels.', 'slack'),
  ('GitHub', 'Trigger actions based on GitHub events.', 'github'),
  ('Stripe', 'Process payments and manage subscriptions.', 'stripe'),
  ('Mailchimp', 'Manage email campaigns and subscribers.', 'mailchimp'),
  ('Airtable', 'Connect to Airtable bases to manage structured data.', 'airtable'),
  ('Twilio', 'Send SMS and make phone calls programmatically.', 'twilio'),
  ('HubSpot', 'Manage your CRM data and marketing campaigns.', 'hubspot');

-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create a profile when a new user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();