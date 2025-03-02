import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { initiateGoogleOAuth, handleGoogleOAuthCallback } from '../services/googleOAuth';

interface GoogleOAuthButtonProps {
  integrationId: string;
  scopes?: string[];
  buttonText?: string;
  onSuccess?: (data: Record<string, string>) => Promise<void>;
  className?: string;
}

const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  integrationId,
  scopes = ['gmail'],
  buttonText = 'Connect with Google',
  onSuccess,
  className = '',
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      
      // Clear the URL parameters
      if (code || state || errorParam) {
        navigate(location.pathname, { replace: true });
      }
      
      if (errorParam) {
        setError('Authentication failed. Please try again.');
        setIsConnecting(false);
        return;
      }
      
      if (code && state && user) {
        try {
          // Handle the OAuth callback
          const oauthData = await handleGoogleOAuthCallback(code, state);
          
          // Format the data for the onSuccess callback
          if (onSuccess) {
            const formattedData: Record<string, string> = {
              provider: 'google',
              integration_id: integrationId,
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
            
            await onSuccess(formattedData);
          }
        } catch (error) {
          console.error('Error processing OAuth callback:', error);
          setError('Failed to complete authentication. Please try again.');
        } finally {
          setIsConnecting(false);
        }
      }
    };
    
    // Process the callback if we're in a connecting state or have code/state params
    const searchParams = new URLSearchParams(location.search);
    if (isConnecting || searchParams.get('code') || searchParams.get('state')) {
      handleCallback();
    }
  }, [location.search, integrationId, onSuccess, user, isConnecting, location.pathname, navigate]);

  // Handle OAuth connection
  const handleConnect = async () => {
    try {
      if (!user) {
        setError('User not authenticated. Please log in and try again.');
        return;
      }

      setIsConnecting(true);
      setError(null);
      
      // Initiate the OAuth flow
      const redirectUrl = await initiateGoogleOAuth(
        integrationId,
        scopes,
        {
          userId: user.id,
          save: true,
          name: 'Google Connection'
        }
      );
      
      // Redirect to Google's OAuth page
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Error initiating OAuth flow:', error);
      setError('Failed to initiate authentication. Please try again.');
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`flex items-center justify-center px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      >
        {isConnecting ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Connecting...
          </span>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="#4285F4" />
              <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="#34A853" clipPath="url(#b)" transform="translate(0 6)" />
              <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="#FBBC05" clipPath="url(#c)" transform="translate(0 12)" />
              <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="#EA4335" clipPath="url(#d)" transform="translate(0 18)" />
            </svg>
            {buttonText}
          </>
        )}
      </button>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default GoogleOAuthButton; 