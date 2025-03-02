import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Integration } from '../types';
import { initiateOAuth } from '../services/oauth';

interface OAuthConnectButtonProps {
  integration: Integration;
  onSuccess: (data: Record<string, string>) => Promise<void>;
}

const OAuthConnectButton: React.FC<OAuthConnectButtonProps> = ({ integration, onSuccess }) => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);

  // Get the OAuth provider based on integration name
  const getOAuthProvider = (integrationName: string): string => {
    const lowerName = integrationName.toLowerCase();
    
    if (lowerName.includes('google') || 
        lowerName.includes('gmail') || 
        lowerName.includes('youtube') || 
        lowerName.includes('calendar') || 
        lowerName.includes('drive')) {
      return 'google';
    } else if (lowerName.includes('slack')) {
      return 'slack';
    } else if (lowerName.includes('github')) {
      return 'github';
    } else if (lowerName.includes('tiktok')) {
      return 'tiktok';
    } else if (lowerName.includes('instagram') || lowerName.includes('facebook')) {
      return 'facebook';
    } else if (lowerName.includes('linkedin')) {
      return 'linkedin';
    } else if (lowerName.includes('twitter')) {
      return 'twitter';
    } else if (lowerName.includes('pinterest')) {
      return 'pinterest';
    } else {
      // Default to the lowercase integration name
      return lowerName;
    }
  };

  // Handle OAuth connection
  const handleOAuthConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Get the appropriate OAuth provider
      const provider = getOAuthProvider(integration.name);
      
      // Initiate the OAuth flow
      initiateOAuth(provider, integration.id);
      
      // Note: The page will redirect to the OAuth provider,
      // and the callback will be handled by the server
    } catch (error) {
      console.error('Error initiating OAuth flow:', error);
      setIsConnecting(false);
    }
  };

  // Get button text based on integration type
  const getButtonText = (integrationName: string): string => {
    const lowerName = integrationName.toLowerCase();
    
    if (lowerName.includes('google') || 
        lowerName.includes('gmail') || 
        lowerName.includes('youtube') || 
        lowerName.includes('calendar') || 
        lowerName.includes('drive')) {
      return 'Connect with Google';
    } else if (lowerName.includes('slack')) {
      return 'Connect with Slack';
    } else if (lowerName.includes('tiktok')) {
      return 'Connect with TikTok';
    } else if (lowerName.includes('github')) {
      return 'Connect with GitHub';
    } else if (lowerName.includes('instagram')) {
      return 'Connect with Instagram';
    } else if (lowerName.includes('facebook')) {
      return 'Connect with Facebook';
    } else if (lowerName.includes('linkedin')) {
      return 'Connect with LinkedIn';
    } else if (lowerName.includes('twitter')) {
      return 'Connect with Twitter';
    } else if (lowerName.includes('pinterest')) {
      return 'Connect with Pinterest';
    } else {
      return `Connect with ${integrationName}`;
    }
  };

  // Get button style based on integration type
  const getButtonStyle = (integrationName: string): string => {
    const lowerName = integrationName.toLowerCase();
    
    if (lowerName.includes('google') || 
        lowerName.includes('gmail') || 
        lowerName.includes('youtube') || 
        lowerName.includes('calendar') || 
        lowerName.includes('drive')) {
      return 'bg-white text-dark-800 hover:bg-gray-100';
    } else if (lowerName.includes('slack')) {
      return 'bg-[#4A154B] text-white hover:bg-[#611f64]';
    } else if (lowerName.includes('tiktok')) {
      return 'bg-black text-white hover:bg-gray-900';
    } else if (lowerName.includes('github')) {
      return 'bg-[#24292e] text-white hover:bg-[#2c3338]';
    } else if (lowerName.includes('instagram')) {
      return 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white hover:opacity-90';
    } else if (lowerName.includes('facebook')) {
      return 'bg-[#1877F2] text-white hover:bg-[#0e6ae4]';
    } else if (lowerName.includes('linkedin')) {
      return 'bg-[#0A66C2] text-white hover:bg-[#0958a8]';
    } else if (lowerName.includes('twitter')) {
      return 'bg-[#1DA1F2] text-white hover:bg-[#0d8fd9]';
    } else if (lowerName.includes('pinterest')) {
      return 'bg-[#E60023] text-white hover:bg-[#d1001f]';
    } else {
      return 'bg-glow-blue text-white hover:bg-blue-600';
    }
  };

  return (
    <button
      onClick={handleOAuthConnect}
      disabled={isConnecting}
      className={`w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-all disabled:opacity-50 ${getButtonStyle(integration.name)}`}
    >
      {isConnecting ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Connecting...
        </div>
      ) : (
        <>
          <ExternalLink className="h-4 w-4 mr-2" />
          {getButtonText(integration.name)}
        </>
      )}
    </button>
  );
};

export default OAuthConnectButton;