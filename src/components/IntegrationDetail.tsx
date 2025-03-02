import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useIntegrationStore } from '../store/integrationStore';
import { Plus, Zap, AlertCircle, PlayCircle, Youtube, Calendar, Mail, HardDrive, Instagram, Facebook, Linkedin, Twitter, Pin, Trash2 } from 'lucide-react';
import { getOAuthCredentials } from '../services/oauth';
import { UserIntegration } from '../types';

const IntegrationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    integrations, 
    userIntegrations,
    fetchIntegrations, 
    fetchUserIntegrations,
    removeUserIntegration,
    loading 
  } = useIntegrationStore();

  const [oauthError, setOauthError] = useState<string | null>(null);
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);

  useEffect(() => {
    fetchIntegrations();
    fetchUserIntegrations();
  }, [fetchIntegrations, fetchUserIntegrations]);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const credentialId = searchParams.get('credential_id');
      const error = searchParams.get('error');
      
      // Clear the URL parameters
      if (credentialId || error) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
      
      if (error) {
        setOauthError('Authentication failed. Please try again.');
        return;
      }
      
      if (credentialId) {
        try {
          setIsProcessingOAuth(true);
          
          // Get the OAuth credentials from the server
          const oauthData = await getOAuthCredentials(credentialId);
          
          // Check if this is a different integration
          if (oauthData.integration_id !== id) {
            // Refresh integrations to get the newly created one
            await fetchIntegrations();
            await fetchUserIntegrations();
            
            // Navigate to the new integration detail page
            navigate(`/integrations/${oauthData.integration_id}?credential_id=${credentialId}`);
            return;
          }
          
          // Refresh the user integrations list
          await fetchUserIntegrations();
          
        } catch (error) {
          console.error('Error processing OAuth callback:', error);
          setOauthError('Failed to save connection. Please try again.');
        } finally {
          setIsProcessingOAuth(false);
        }
      }
    };
    
    handleOAuthCallback();
  }, [location.search, id, navigate, fetchUserIntegrations, fetchIntegrations]);

  const integration = integrations.find(i => i.id === id);
  const integrationConnections = userIntegrations.filter(c => c.integration_id === id);

  if (!integration && !loading) {
    return (
      <div className="min-h-screen bg-dark-900 pt-16 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-white">Integration not found</h3>
          <button
            onClick={() => navigate('/integrations')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-dark-700 hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors"
          >
            Back to Integrations
          </button>
        </div>
      </div>
    );
  }

  const handleAddConnection = () => {
    if (!id) return;
    
    // Redirect to OAuth flow
    window.location.href = `/auth/init/${integration?.name.toLowerCase()}?integration_id=${id}`;
  };

  const handleRemoveConnection = async (userIntegrationId: string) => {
    if (window.confirm('Are you sure you want to remove this connection?')) {
      await removeUserIntegration(userIntegrationId);
    }
  };

  // Render the integration icon based on the integration name
  const renderIntegrationIcon = () => {
    if (!integration) return null;
    
    const lowerName = integration.name.toLowerCase();
    
    if (lowerName.includes('youtube')) {
      return <Youtube className="h-6 w-6 text-red-500" />;
    } else if (lowerName.includes('calendar')) {
      return <Calendar className="h-6 w-6 text-blue-500" />;
    } else if (lowerName.includes('gmail') || lowerName.includes('mail')) {
      return <Mail className="h-6 w-6 text-red-400" />;
    } else if (lowerName.includes('drive')) {
      return <HardDrive className="h-6 w-6 text-green-500" />;
    } else if (lowerName.includes('instagram')) {
      return <Instagram className="h-6 w-6 text-pink-500" />;
    } else if (lowerName.includes('facebook')) {
      return <Facebook className="h-6 w-6 text-blue-600" />;
    } else if (lowerName.includes('linkedin')) {
      return <Linkedin className="h-6 w-6 text-blue-700" />;
    } else if (lowerName.includes('twitter')) {
      return <Twitter className="h-6 w-6 text-blue-400" />;
    } else if (lowerName.includes('pinterest')) {
      return <Pin className="h-6 w-6 text-red-600" />;
    } else {
      return <Zap className="h-6 w-6 text-glow-purple" />;
    }
  };

  // Render a user integration item
  const UserIntegrationItem = ({ userIntegration }: { userIntegration: UserIntegration }) => {
    return (
      <div className="px-4 py-4 sm:px-6 border-b border-dark-600 last:border-b-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 bg-dark-700 rounded-full flex items-center justify-center">
              {renderIntegrationIcon()}
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-medium text-white">{userIntegration.name}</h4>
              <div className="mt-1 flex items-center">
                <span className="text-xs text-gray-400">
                  Connected: {new Date(userIntegration.created_at).toLocaleDateString()}
                </span>
                {userIntegration.scopes && userIntegration.scopes.length > 0 && (
                  <span className="ml-2 text-xs text-gray-400">
                    • {userIntegration.scopes.length} scopes
                  </span>
                )}
                {userIntegration.user_data?.user_email && (
                  <span className="ml-2 text-xs text-gray-400">
                    • {userIntegration.user_data.user_email}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex">
            <button
              onClick={() => handleRemoveConnection(userIntegration.id)}
              className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-300 hover:text-white bg-dark-700 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-900 pt-16">
      <header className="bg-dark-800 shadow-md">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 bg-dark-700 rounded-full flex items-center justify-center shadow-glow-blue-sm">
              {renderIntegrationIcon()}
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-white glow-text">
                {loading ? 'Loading...' : integration?.name}
              </h1>
              {integration && (
                <p className="mt-1 text-sm text-gray-400">{integration.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {isProcessingOAuth && (
            <div className="mb-6 px-4 sm:px-0">
              <div className="bg-dark-800 p-4 rounded-lg border border-dark-600 flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-glow-purple mr-3"></div>
                <p className="text-white">Processing your authentication...</p>
              </div>
            </div>
          )}
          
          {oauthError && (
            <div className="mb-6 px-4 sm:px-0">
              <div className="bg-red-900/30 p-4 rounded-lg border border-red-500 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                <p className="text-red-300">{oauthError}</p>
              </div>
            </div>
          )}
          
          <div className="px-4 sm:px-0">
            <div className="bg-dark-800 shadow-md sm:rounded-lg border border-dark-600">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-white">
                    Connected Accounts
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-400">
                    Manage your connections for this integration.
                  </p>
                </div>
                <button
                  onClick={handleAddConnection}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-glow-purple hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple shadow-glow-sm hover:shadow-glow-md transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Account
                </button>
              </div>
              <div className="border-t border-dark-600">
                {loading ? (
                  <div className="px-4 py-5 sm:p-6">
                    <div className="animate-pulse space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <div className="rounded-full bg-dark-600 h-10 w-10"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-dark-600 rounded w-3/4"></div>
                            <div className="h-4 bg-dark-600 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : integrationConnections.length > 0 ? (
                  <div>
                    {integrationConnections.map((userIntegration) => (
                      <UserIntegrationItem 
                        key={userIntegration.id}
                        userIntegration={userIntegration}
                      />
                    ))}
                    
                    {/* Test API Button */}
                    <div className="px-4 py-4 sm:px-6 flex justify-center">
                      <Link
                        to={`/api-test/${id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-glow-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-blue shadow-glow-blue-sm hover:shadow-glow-blue-md transition-all"
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Test API Integration
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-5 sm:p-6 text-center">
                    <p className="text-gray-400 text-sm">
                      You haven't connected any accounts for this integration yet.
                    </p>
                    <button
                      onClick={handleAddConnection}
                      className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-dark-700 hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Connect your first account
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IntegrationDetail;