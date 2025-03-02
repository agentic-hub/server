/*
  # Add Social Media Integrations

  1. New Integrations
    - Add Instagram, Facebook, LinkedIn, Twitter, Pinterest, and TikTok integrations
    - Associate them with the Social Media category
  
  2. Updates
    - Update descriptions for better clarity
*/

-- Add social media integrations
INSERT INTO integrations (name, description, icon, category_id)
VALUES 
  ('Instagram', 'Connect to Instagram for content management, analytics, and automated posting.', 'instagram', '22222222-2222-2222-2222-222222222222'),
  ('Facebook', 'Integrate with Facebook Pages and Groups for content management and engagement.', 'facebook', '22222222-2222-2222-2222-222222222222'),
  ('LinkedIn', 'Connect with LinkedIn for professional networking, content sharing, and recruitment.', 'linkedin', '22222222-2222-2222-2222-222222222222'),
  ('Twitter', 'Integrate with Twitter for automated tweets, engagement tracking, and analytics.', 'twitter', '22222222-2222-2222-2222-222222222222'),
  ('Pinterest', 'Connect to Pinterest for pin management, board organization, and analytics.', 'pinterest', '22222222-2222-2222-2222-222222222222');

-- Update TikTok description for consistency
UPDATE integrations 
SET description = 'Connect to TikTok for content creation, engagement tracking, and analytics.'
WHERE name = 'TikTok';