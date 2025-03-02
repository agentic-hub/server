/*
  # Reset Categories and Integrations

  This migration:
  1. Deletes all existing integrations and categories
  2. Inserts new categories with the specified order:
     - Social Media (1)
     - Google (2)
     - Communication (3)
     - Productivity (4)
  3. Inserts integrations with proper category assignments
*/

-- First, delete all existing credentials to avoid foreign key constraints
DELETE FROM credentials;

-- Delete all existing integrations
DELETE FROM integrations;

-- Delete all existing categories
DELETE FROM integration_categories;

-- Insert new categories with proper ordering
INSERT INTO integration_categories (id, name, description, icon, "order")
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'Social Media', 'Social media platforms for content and engagement', 'social', 1),
  ('11111111-1111-1111-1111-111111111111', 'Google', 'Google services including Gmail, Drive, Calendar, and YouTube', 'google', 2),
  ('44444444-4444-4444-4444-444444444444', 'Communication', 'Messaging and communication platforms', 'communication', 3),
  ('33333333-3333-3333-3333-333333333333', 'Productivity', 'Tools for improving productivity and workflow', 'productivity', 4),
  ('55555555-5555-5555-5555-555555555555', 'Developer Tools', 'Tools for software development and deployment', 'developer', 5),
  ('66666666-6666-6666-6666-666666666666', 'Payment', 'Payment processing and financial services', 'payment', 6),
  ('77777777-7777-7777-7777-777777777777', 'Uncategorized', 'Other integrations that do not fit into specific categories', 'folder', 999);

-- Insert Social Media integrations
INSERT INTO integrations (name, description, icon, category_id)
VALUES 
  ('Instagram', 'Connect to Instagram for content management, analytics, and automated posting.', 'instagram', '22222222-2222-2222-2222-222222222222'),
  ('Facebook', 'Integrate with Facebook Pages and Groups for content management and engagement.', 'facebook', '22222222-2222-2222-2222-222222222222'),
  ('LinkedIn', 'Connect with LinkedIn for professional networking, content sharing, and recruitment.', 'linkedin', '22222222-2222-2222-2222-222222222222'),
  ('Twitter', 'Integrate with Twitter for automated tweets, engagement tracking, and analytics.', 'twitter', '22222222-2222-2222-2222-222222222222'),
  ('Pinterest', 'Connect to Pinterest for pin management, board organization, and analytics.', 'pinterest', '22222222-2222-2222-2222-222222222222'),
  ('TikTok', 'Connect to TikTok for content creation, engagement tracking, and analytics.', 'tiktok', '22222222-2222-2222-2222-222222222222');

-- Insert Google integrations
INSERT INTO integrations (name, description, icon, category_id)
VALUES 
  ('Gmail', 'Access and manage emails, send automated responses, and organize your inbox.', 'gmail', '11111111-1111-1111-1111-111111111111'),
  ('Google Calendar', 'Schedule events, create appointments, and manage your calendar.', 'calendar', '11111111-1111-1111-1111-111111111111'),
  ('Google Drive', 'Store, access, and share files and documents securely in the cloud.', 'drive', '11111111-1111-1111-1111-111111111111'),
  ('YouTube', 'Upload videos, manage your channel, and analyze performance metrics.', 'youtube', '11111111-1111-1111-1111-111111111111'),
  ('Google Sheets', 'Create, edit, and collaborate on spreadsheets with Google Sheets.', 'sheets', '11111111-1111-1111-1111-111111111111');

-- Insert Communication integrations
INSERT INTO integrations (name, description, icon, category_id)
VALUES 
  ('Slack', 'Post messages, create channels, and manage your Slack workspace.', 'slack', '44444444-4444-4444-4444-444444444444'),
  ('Discord', 'Manage servers, channels, and communicate with your community.', 'discord', '44444444-4444-4444-4444-444444444444'),
  ('Microsoft Teams', 'Collaborate with your team, share files, and manage projects.', 'teams', '44444444-4444-4444-4444-444444444444');

-- Insert Productivity integrations
INSERT INTO integrations (name, description, icon, category_id)
VALUES 
  ('Trello', 'Organize projects, track tasks, and collaborate with your team.', 'trello', '33333333-3333-3333-3333-333333333333'),
  ('Asana', 'Manage projects, assign tasks, and track progress with your team.', 'asana', '33333333-3333-3333-3333-333333333333'),
  ('Notion', 'Create documents, wikis, and databases for your team.', 'notion', '33333333-3333-3333-3333-333333333333'),
  ('Airtable', 'Build databases, track work, and organize your information.', 'airtable', '33333333-3333-3333-3333-333333333333'),
  ('Twilio', 'Send SMS, make calls, and build communication workflows with Twilio.', 'twilio', '33333333-3333-3333-3333-333333333333');

-- Insert Developer Tools integrations
INSERT INTO integrations (name, description, icon, category_id)
VALUES 
  ('GitHub', 'Manage repositories, track issues, and collaborate on code.', 'github', '55555555-5555-5555-5555-555555555555'),
  ('GitLab', 'Manage Git repositories, CI/CD pipelines, and track issues.', 'gitlab', '55555555-5555-5555-5555-555555555555'),
  ('Jira', 'Track issues, manage projects, and plan sprints for software development.', 'jira', '55555555-5555-5555-5555-555555555555');

-- Insert Payment integrations
INSERT INTO integrations (name, description, icon, category_id)
VALUES 
  ('Stripe', 'Process payments, manage subscriptions, and handle financial transactions.', 'stripe', '66666666-6666-6666-6666-666666666666'),
  ('PayPal', 'Send and receive payments, manage transactions, and handle invoices.', 'paypal', '66666666-6666-6666-6666-666666666666'); 