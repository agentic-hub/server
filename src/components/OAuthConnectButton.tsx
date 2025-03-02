import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { Integration } from '../types';
import { initiateOAuth, getOAuthCredentials } from '../services/oauth';
import { useAuthStore } from '../store/authStore';
import { useLocation } from 'react-router-dom';

interface OAuthConnectButtonProps {
  integration: Integration;
  onSuccess: (data: Record<string, string>) => Promise<void>;
}

const OAuthConnectButton: React.FC<OAuthConnectButtonProps> = ({ integration, onSuccess }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const location = useLocation();

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const credentialId = searchParams.get('credential_id');
      const errorParam = searchParams.get('error');
      
      // Clear the URL parameters if they exist
      if (credentialId || errorParam) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
      
      if (errorParam) {
        setError('Authentication failed. Please try again.');
        setIsConnecting(false);
        return;
      }
      
      if (credentialId && user) {
        try {
          // Get the OAuth credentials from the server
          const oauthData = await getOAuthCredentials(credentialId, {
            save: true,
            userId: user.id,
            name: `${integration.name} Connection`
          });
          
          // Convert oauthData to Record<string, string> for the onSuccess callback
          const formattedData: Record<string, string> = {
            provider: oauthData.provider,
            integration_id: oauthData.integration_id,
            access_token: oauthData.access_token,
            user_id: oauthData.user_id,
            token_type: oauthData.token_type || 'Bearer',
          };
          
          // Add optional fields if they exist
          if (oauthData.refresh_token) formattedData.refresh_token = oauthData.refresh_token;
          if (oauthData.user_name) formattedData.user_name = oauthData.user_name;
          if (oauthData.user_email) formattedData.user_email = oauthData.user_email;
          if (oauthData.expires_at) formattedData.expires_at = oauthData.expires_at.toString();
          if (oauthData.scope) formattedData.scope = oauthData.scope;
          if (oauthData.scopes) formattedData.scopes = JSON.stringify(oauthData.scopes);
          
          // Call the onSuccess callback with the formatted data
          await onSuccess(formattedData);
        } catch (error) {
          console.error('Error processing OAuth callback:', error);
          setError('Failed to save connection. Please try again.');
        } finally {
          setIsConnecting(false);
        }
      }
    };
    
    // Only process the callback if we're in a connecting state
    if (isConnecting) {
      handleOAuthCallback();
    }
  }, [location.search, integration.name, onSuccess, user, isConnecting]);

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

  // Get predefined scopes based on integration name
  const getPredefinedScopes = (integrationName: string): string[] => {
    const lowerName = integrationName.toLowerCase();
    
    if (lowerName.includes('youtube')) {
      return ['youtube'];
    } else if (lowerName.includes('gmail')) {
      return ['gmail'];
    } else if (lowerName.includes('calendar')) {
      return ['calendar'];
    } else if (lowerName.includes('drive')) {
      return ['drive'];
    } else if (lowerName.includes('sheets')) {
      return ['sheets'];
    } else if (lowerName.includes('slack')) {
      return ['messages', 'channels'];
    } else if (lowerName.includes('github')) {
      return ['repos'];
    } else if (lowerName.includes('instagram')) {
      return ['instagram'];
    } else if (lowerName.includes('facebook')) {
      return ['pages', 'publishing'];
    } else if (lowerName.includes('linkedin')) {
      return [];  // Default scopes will be used
    } else if (lowerName.includes('twitter')) {
      return [];  // Default scopes will be used
    } else if (lowerName.includes('pinterest')) {
      return [];  // Default scopes will be used
    } else if (lowerName.includes('google')) {
      return [];  // Default scopes will be used
    } else {
      return [];  // Default scopes will be used
    }
  };

  // Handle OAuth connection
  const handleOAuthConnect = async () => {
    try {
      if (!user) {
        console.error('User not authenticated');
        setError('User not authenticated. Please log in and try again.');
        return;
      }

      setIsConnecting(true);
      setError(null);
      
      // Get the appropriate OAuth provider
      const provider = getOAuthProvider(integration.name);
      
      // Get predefined scopes based on integration name
      const predefinedScopes = getPredefinedScopes(integration.name);
      
      // Initiate the OAuth flow with predefined scopes and save options
      initiateOAuth(
        provider, 
        integration.id, 
        predefinedScopes,
        {
          userId: user.id,
          save: true,
          name: `${integration.name} Connection`
        }
      );
      
      // Note: The page will redirect to the OAuth provider,
      // and the callback will be handled by the server and the useEffect above
    } catch (error) {
      console.error('Error initiating OAuth flow:', error);
      setError('Failed to initiate authentication. Please try again.');
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
    <div>
      {error && (
        <div className="text-red-500 text-sm mb-2">
          {error}
        </div>
      )}
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
    </div>
  );
};

export default OAuthConnectButton;