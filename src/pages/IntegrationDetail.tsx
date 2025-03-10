import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useIntegrationStore } from '../store/integrationStore';
import { useAuthStore } from '../store/authStore';
import { Plus, Zap, AlertCircle, Check, ExternalLink } from 'lucide-react';
import CredentialForm from '../components/CredentialForm';
import CredentialItem from '../components/CredentialItem';
import { getOAuthCredentials } from '../services/oauth';

const IntegrationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    integrations, 
    credentials, 
    userIntegrations,
    fetchIntegrations, 
    fetchCredentials,
    fetchUserIntegrations,
    addCredential, 
    removeCredential, 
    loading 
  } = useIntegrationStore();
  const { user } = useAuthStore();

  const [isAddingCredential, setIsAddingCredential] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    fetchIntegrations();
    fetchCredentials();
    fetchUserIntegrations();
  }, [fetchIntegrations, fetchCredentials, fetchUserIntegrations]);

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
      
      if (credentialId && user) {
        try {
          setIsProcessingOAuth(true);
          
          // Generate a default name for the credential
          const integration = integrations.find(i => i.id === id);
          const credentialName = `${integration?.name || 'OAuth'} Connection`;
          
          // Get the OAuth credentials from the server and save them directly
          // The server will handle encryption and database storage
          await getOAuthCredentials(credentialId, {
            save: true,
            userId: user.id,
            name: credentialName
          });
          
          // Refresh the credentials list
          await fetchCredentials();
          await fetchUserIntegrations();
          
          // Show success message
          setShowSuccessMessage(true);
          
          // Hide success message after 5 seconds
          setTimeout(() => {
            setShowSuccessMessage(false);
          }, 5000);
          
        } catch (error) {
          console.error('Error processing OAuth callback:', error);
          setOauthError('Failed to save credentials. Please try again.');
        } finally {
          setIsProcessingOAuth(false);
        }
      }
    };
    
    handleOAuthCallback();
  }, [location.search, id, integrations, fetchCredentials, fetchUserIntegrations, user]);

  const integration = integrations.find(i => i.id === id);
  const integrationCredentials = credentials.filter(c => c.integration_id === id);
  const integrationUserIntegrations = userIntegrations.filter(ui => ui.integration_id === id);

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

  const handleAddCredential = async (name: string, data: Record<string, string>) => {
    if (!id) return;
    
    try {
      await addCredential({
        integration_id: id,
        name: name,
        data: data
      });
      
      setIsAddingCredential(false);
    } catch (error) {
      console.error('Error adding credential:', error);
      throw error;
    }
  };

  // Render the integration icon based on the icon URL from the database
  const renderIntegrationIcon = () => {
    if (integration?.icon) {
      return (
        <div className="flex-shrink-0 h-12 w-12 bg-dark-700 rounded-full flex items-center justify-center shadow-glow-blue-sm">
          <img 
            src={integration.icon} 
            alt={`${integration.name} icon`} 
            className="h-6 w-6"
            onError={(e) => {
              // Fallback to default icon if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<span class="h-6 w-6 text-glow-purple"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg></span>';
            }}
          />
        </div>
      );
    }
    
    // Default icon if no icon URL is provided
    return (
      <div className="flex-shrink-0 h-12 w-12 bg-glow-purple bg-opacity-20 rounded-full flex items-center justify-center shadow-glow-sm">
        <Zap className="h-6 w-6 text-glow-purple" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-900 pt-16">
      <header className="bg-dark-800 shadow-md">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            {integration && renderIntegrationIcon()}
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
          {/* Success message */}
          {showSuccessMessage && (
            <div className="fixed top-20 right-4 bg-green-800 text-white p-4 rounded-md shadow-lg z-50 flex items-center">
              <Check className="h-5 w-5 mr-2 text-green-400" />
              <span>Successfully connected to {integration?.name}!</span>
            </div>
          )}
          
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
          
          {/* User Integrations Section */}
          {integrationUserIntegrations.length > 0 && (
            <div className="mb-6 px-4 sm:px-0">
              <div className="bg-dark-800 shadow-md overflow-hidden sm:rounded-lg border border-dark-600">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-white">
                    Your {integration?.name} Connections
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-400">
                    Manage your connected {integration?.name} accounts.
                  </p>
                </div>
                <div className="border-t border-dark-600">
                  <ul className="divide-y divide-dark-600">
                    {integrationUserIntegrations.map((userIntegration) => (
                      <li key={userIntegration.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-dark-700 rounded-full flex items-center justify-center">
                              {renderIntegrationIcon()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-glow-purple">
                                {userIntegration.name}
                              </div>
                              <div className="text-xs text-gray-400">
                                Provider: {userIntegration.provider}
                                {userIntegration.user_data?.user_email && (
                                  <span className="ml-2">• {userIntegration.user_data.user_email}</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Connected: {new Date(userIntegration.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => navigate(`/api-test/${integration?.id}?credential=${userIntegration.id}`)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-glow-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-blue transition-colors"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Test API
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to remove this connection?')) {
                                  // Call the API to remove the user integration
                                  fetch(`/api/user-integrations/${userIntegration.id}?userId=${user?.id}`, {
                                    method: 'DELETE',
                                    headers: {
                                      'Content-Type': 'application/json'
                                    }
                                  })
                                  .then(response => {
                                    if (response.ok) {
                                      // Refresh the user integrations list
                                      fetchUserIntegrations();
                                    } else {
                                      throw new Error('Failed to remove connection');
                                    }
                                  })
                                  .catch(error => {
                                    console.error('Error removing connection:', error);
                                    alert('Failed to remove connection. Please try again.');
                                  });
                                }
                              }}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="px-4 sm:px-0">
            <div className="bg-dark-800 shadow-md sm:rounded-lg border border-dark-600">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-white">
                    API Credentials
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-400">
                    Manage your API credentials for this integration.
                  </p>
                </div>
                {!isAddingCredential && (
                  <button
                    onClick={() => setIsAddingCredential(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-glow-purple hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple shadow-glow-sm hover:shadow-glow-md transition-all"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Credential
                  </button>
                )}
              </div>
              <div className="border-t border-dark-600">
                {isAddingCredential && integration && (
                  <div className="px-4 py-5 sm:px-6">
                    <CredentialForm 
                      integration={integration}
                      onSave={handleAddCredential}
                      onCancel={() => setIsAddingCredential(false)}
                    />
                  </div>
                )}
                
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
                ) : integrationCredentials.length > 0 ? (
                  <div>
                    {integrationCredentials.map((credential) => (
                      <CredentialItem 
                        key={credential.id}
                        credential={credential}
                        integration={integration!}
                        onRemove={removeCredential}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-5 sm:p-6 text-center">
                    <p className="text-gray-400 text-sm">
                      You haven't added any credentials for this integration yet.
                    </p>
                    {!isAddingCredential && (
                      <button
                        onClick={() => setIsAddingCredential(true)}
                        className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-dark-700 hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add your first credential
                      </button>
                    )}
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