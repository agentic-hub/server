/*
  # Add Toolkits and Tools

  This migration:
  1. Creates a `tools` table for storing tool configurations
  2. Creates a `toolkits` table for grouping tools together
  3. Creates a `toolkit_tools` junction table for many-to-many relationships
  4. Sets up appropriate foreign key constraints and RLS policies
*/

-- Create tools table
CREATE TABLE IF NOT EXISTS tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  integration_id uuid REFERENCES integrations(id) ON DELETE CASCADE,
  credential_id uuid REFERENCES credentials(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  configuration jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create toolkits table
CREATE TABLE IF NOT EXISTS toolkits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create junction table for toolkit-tool relationships
CREATE TABLE IF NOT EXISTS toolkit_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  toolkit_id uuid REFERENCES toolkits(id) ON DELETE CASCADE,
  tool_id uuid REFERENCES tools(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(toolkit_id, tool_id)
);

-- Enable Row Level Security
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE toolkits ENABLE ROW LEVEL SECURITY;
ALTER TABLE toolkit_tools ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tools
CREATE POLICY "Users can view their own tools"
  ON tools
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own tools"
  ON tools
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tools"
  ON tools
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own tools"
  ON tools
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create RLS policies for toolkits
CREATE POLICY "Users can view their own toolkits"
  ON toolkits
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own toolkits"
  ON toolkits
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own toolkits"
  ON toolkits
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own toolkits"
  ON toolkits
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create RLS policies for toolkit_tools
CREATE POLICY "Users can view their own toolkit_tools"
  ON toolkit_tools
  FOR SELECT
  TO authenticated
  USING (
    toolkit_id IN (
      SELECT id FROM toolkits WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own toolkit_tools"
  ON toolkit_tools
  FOR INSERT
  TO authenticated
  WITH CHECK (
    toolkit_id IN (
      SELECT id FROM toolkits WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own toolkit_tools"
  ON toolkit_tools
  FOR UPDATE
  TO authenticated
  USING (
    toolkit_id IN (
      SELECT id FROM toolkits WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own toolkit_tools"
  ON toolkit_tools
  FOR DELETE
  TO authenticated
  USING (
    toolkit_id IN (
      SELECT id FROM toolkits WHERE user_id = auth.uid()
    )
  );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_tools_updated_at
BEFORE UPDATE ON tools
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_toolkits_updated_at
BEFORE UPDATE ON toolkits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 