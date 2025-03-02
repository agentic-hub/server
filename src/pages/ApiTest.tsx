import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIntegrationStore } from '../store/integrationStore';
import { googleApiService } from '../services/api';
import { Send, Youtube, AlertCircle, Check, Loader, Zap, Mail, Calendar, HardDrive, Instagram, Facebook, Linkedin, Twitter, Pin } from 'lucide-react';

const ApiTest: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { integrations, credentials, fetchIntegrations, fetchCredentials } = useIntegrationStore();
  
  const [selectedCredential, setSelectedCredential] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  
  // Gmail test form
  const [emailTo, setEmailTo] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('Test Email from AI Agent MPC Hub');
  const [emailBody, setEmailBody] = useState<string>('This is a test email sent from the AI Agent MPC Hub.');
  
  // YouTube test form
  const [channelId, setChannelId] = useState<string>('');
  const [maxResults, setMaxResults] = useState<number>(5);
  
  // Social media test form
  const [postText, setPostText] = useState<string>('This is a test post from AI Agent MPC Hub.');
  const [postUrl, setPostUrl] = useState<string>('');
  
  useEffect(() => {
    fetchIntegrations();
    fetchCredentials();
  }, [fetchIntegrations, fetchCredentials]);
  
  const integration = integrations.find(i => i.id === id);
  const integrationCredentials = credentials.filter(c => c.integration_id === id);
  
  if (!integration) {
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
  
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCredential) {
      setError('Please select a credential');
      return;
    }
    
    if (!emailTo) {
      setError('Please enter a recipient email address');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    setApiResponse(null);
    
    try {
      const response = await googleApiService.sendEmail(selectedCredential, {
        to: emailTo,
        subject: emailSubject,
        body: emailBody,
        isHtml: false
      });
      
      setSuccess('Email sent successfully!');
      setApiResponse(response);
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };
  
  const handleListYouTubeVideos = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCredential) {
      setError('Please select a credential');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    setApiResponse(null);
    
    try {
      const response = await googleApiService.listYouTubeVideos(selectedCredential, {
        channelId: channelId || undefined,
        maxResults,
        order: 'date'
      });
      
      setSuccess('Videos retrieved successfully!');
      setApiResponse(response);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve videos');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSocialMediaPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCredential) {
      setError('Please select a credential');
      return;
    }
    
    if (!postText) {
      setError('Please enter post text');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    setApiResponse(null);
    
    try {
      // Simulate API response for social media post
      const response = {
        id: `post_${Math.random().toString(36).substring(2, 15)}`,
        text: postText,
        url: postUrl || null,
        created_at: new Date().toISOString(),
        status: 'published'
      };
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Post created successfully!');
      setApiResponse(response);
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };
  
  const renderTestForm = () => {
    const lowerName = integration.name.toLowerCase();
    
    if (lowerName.includes('gmail')) {
      return (
        <form onSubmit={handleSendEmail} className="space-y-4">
          <div>
            <label htmlFor="emailTo" className="block text-sm font-medium text-gray-300">
              Recipient Email
            </label>
            <input
              type="email"
              id="emailTo"
              className="mt-1 block w-full border border-dark-500 rounded-md shadow-sm py-2 px-3 bg-dark-600 text-white focus:outline-none focus:ring-glow-purple focus:border-glow-purple sm:text-sm"
              placeholder="recipient@example.com"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="emailSubject" className="block text-sm font-medium text-gray-300">
              Subject
            </label>
            <input
              type="text"
              id="emailSubject"
              className="mt-1 block w-full border border-dark-500 rounded-md shadow-sm py-2 px-3 bg-dark-600 text-white focus:outline-none focus:ring-glow-purple focus:border-glow-purple sm:text-sm"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="emailBody" className="block text-sm font-medium text-gray-300">
              Email Body
            </label>
            <textarea
              id="emailBody"
              rows={4}
              className="mt-1 block w-full border border-dark-500 rounded-md shadow-sm py-2 px-3 bg-dark-600 text-white focus:outline-none focus:ring-glow-purple focus:border-glow-purple sm:text-sm"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              required
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-glow-purple hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple disabled:opacity-50 shadow-glow-sm hover:shadow-glow-md transition-all"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Email
                </>
              )}
            </button>
          </div>
        </form>
      );
    } else if (lowerName.includes('youtube')) {
      return (
        <form onSubmit={handleListYouTubeVideos} className="space-y-4">
          <div>
            <label htmlFor="channelId" className="block text-sm font-medium text-gray-300">
              Channel ID (optional)
            </label>
            <input
              type="text"
              id="channelId"
              className="mt-1 block w-full border border-dark-500 rounded-md shadow-sm py-2 px-3 bg-dark-600 text-white focus:outline-none focus:ring-glow-purple focus:border-glow-purple sm:text-sm"
              placeholder="UC..."
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-400">
              Leave blank to get videos from your own channel
            </p>
          </div>
          
          <div>
            <label htmlFor="maxResults" className="block text-sm font-medium text-gray-300">
              Max Results
            </label>
            <input
              type="number"
              id="maxResults"
              min={1}
              max={50}
              className="mt-1 block w-full border border-dark-500 rounded-md shadow-sm py-2 px-3 bg-dark-600 text-white focus:outline-none focus:ring-glow-purple focus:border-glow-purple sm:text-sm"
              value={maxResults}
              onChange={(e) => setMaxResults(parseInt(e.target.value))}
              required
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-glow-purple hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple disabled:opacity-50 shadow-glow-sm hover:shadow-glow-md transition-all"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <Youtube className="h-4 w-4 mr-2" />
                  List Videos
                </>
              )}
            </button>
          </div>
        </form>
      );
    } else if (lowerName.includes('instagram') || lowerName.includes('facebook') || lowerName.includes('linkedin') || lowerName.includes('twitter') || lowerName.includes('pinterest')) {
      return (
        <form onSubmit={handleSocialMediaPost} className="space-y-4">
          <div>
            <label htmlFor="postText" className="block text-sm font-medium text-gray-300">
              Post Text
            </label>
            <textarea
              id="postText"
              rows={4}
              className="mt-1 block w-full border border-dark-500 rounded-md shadow-sm py-2 px-3 bg-dark-600 text-white focus:outline-none focus:ring-glow-purple focus:border-glow-purple sm:text-sm"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="postUrl" className="block text-sm font-medium text-gray-300">
              URL (optional)
            </label>
            <input
              type="url"
              id="postUrl"
              className="mt-1 block w-full border border-dark-500 rounded-md shadow-sm py-2 px-3 bg-dark-600 text-white focus:outline-none focus:ring-glow-purple focus:border-glow-purple sm:text-sm"
              placeholder="https://example.com"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-glow-purple hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple disabled:opacity-50 shadow-glow-sm hover:shadow-glow-md transition-all"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Posting...
                </>
              ) : (
                <>
                  {lowerName.includes('instagram') ? <Instagram className="h-4 w-4 mr-2" /> : 
                   lowerName.includes('facebook') ? <Facebook className="h-4 w-4 mr-2" /> :
                   lowerName.includes('linkedin') ? <Linkedin className="h-4 w-4 mr-2" /> :
                   lowerName.includes('twitter') ? <Twitter className="h-4 w-4 mr-2" /> :
                   <Pin className="h-4 w-4 mr-2" />}
                  Create Test Post
                </>
              )}
            </button>
          </div>
        </form>
      );
    } else {
      return (
        <div className="text-center py-8">
          <p className="text-gray-400">
            No test form available for this integration yet.
          </p>
        </div>
      );
    }
  };
  
  // Render the integration icon based on the integration name
  const renderIntegrationIcon = () => {
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
                Test {integration.name} API
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Test your integration with the {integration.name} API
              </p>
            </div>
          </div>
        </div>
      </header>
      
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <div className="bg-dark-800 shadow-md sm:rounded-lg border border-dark-600">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-white">
                  API Test Console
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-400">
                  Select a credential and test the {integration.name} API integration
                </p>
              </div>
              
              <div className="border-t border-dark-600 px-4 py-5 sm:p-6">
                {integrationCredentials.length > 0 ? (
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="credential" className="block text-sm font-medium text-gray-300">
                        Select Credential
                      </label>
                      <select
                        id="credential"
                        className="mt-1 block w-full border border-dark-500 rounded-md shadow-sm py-2 px-3 bg-dark-600 text-white focus:outline-none focus:ring-glow-purple focus:border-glow-purple sm:text-sm"
                        value={selectedCredential}
                        onChange={(e) => setSelectedCredential(e.target.value)}
                        required
                      >
                        <option value="">Select a credential</option>
                        {integrationCredentials.map((cred) => (
                          <option key={cred.id} value={cred.id}>
                            {cred.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {error && (
                      <div className="bg-red-900/30 p-4 rounded-lg border border-red-500 flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                        <p className="text-red-300">{error}</p>
                      </div>
                    )}
                    
                    {success && (
                      <div className="bg-green-900/30 p-4 rounded-lg border border-green-500 flex items-center">
                        <Check className="h-5 w-5 text-green-400 mr-3" />
                        <p className="text-green-300">{success}</p>
                      </div>
                    )}
                    
                    {renderTestForm()}
                    
                    {apiResponse && (
                      <div className="mt-6">
                        <h4 className="text-md font-medium text-white mb-2">API Response:</h4>
                        <div className="bg-dark-700 p-4 rounded-lg border border-dark-500 overflow-auto max-h-96">
                          <pre className="text-gray-300 text-sm">
                            {JSON.stringify(apiResponse, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">
                      You haven't added any credentials for this integration yet.
                    </p>
                    <button
                      onClick={() => navigate(`/integrations/${id}`)}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-dark-700 hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors"
                    >
                      Add Credentials
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

export default ApiTest;