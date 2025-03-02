import React, { useState } from 'react';
import GoogleOAuthButton from '../components/GoogleOAuthButton';

const GoogleOAuthExample: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected'>('disconnected');
  const [connectionData, setConnectionData] = useState<Record<string, string> | null>(null);

  // Handle successful OAuth connection
  const handleOAuthSuccess = async (data: Record<string, string>): Promise<void> => {
    console.log('OAuth connection successful:', data);
    setConnectionStatus('connected');
    setConnectionData(data);
    
    // In a real application, you would save this data to your database
    // or use it to make API calls to the connected service
    return Promise.resolve();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Google OAuth Integration Example</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Connect with Google</h2>
        
        {connectionStatus === 'disconnected' ? (
          <div>
            <p className="mb-4 text-gray-700">
              Click the button below to connect your Google account. This will allow the application to access your Gmail.
            </p>
            
            <GoogleOAuthButton
              integrationId="ec0949ea-4ecc-4b7f-b4c8-6c4ecacd6dbf"
              scopes={['gmail']}
              onSuccess={handleOAuthSuccess}
            />
          </div>
        ) : (
          <div>
            <div className="flex items-center mb-4">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span className="font-medium">Connected to Google</span>
            </div>
            
            <p className="mb-4 text-gray-700">
              Your Google account is now connected. You can use the access token to make API calls to Gmail.
            </p>
            
            <button
              onClick={() => {
                setConnectionStatus('disconnected');
                setConnectionData(null);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
      
      {connectionData && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Connection Data</h2>
          
          <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
            <pre className="text-sm">
              {JSON.stringify(connectionData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleOAuthExample; 