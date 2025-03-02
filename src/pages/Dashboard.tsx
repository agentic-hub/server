import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useIntegrationStore } from '../store/integrationStore';
import { PlusCircle, ArrowRight, Zap, Youtube, Calendar, Mail, HardDrive, Activity, Folder, Instagram, Facebook, Linkedin, Twitter, Pin } from 'lucide-react';
import { apiService } from '../services/api';
import CategoryBadge from '../components/CategoryBadge';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { integrations, credentials, categories, fetchIntegrations, fetchCredentials, fetchCategories, loading } = useIntegrationStore();
  const [apiLogs, setApiLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    fetchIntegrations();
    fetchCredentials();
    fetchCategories();
    fetchApiLogs();
  }, [fetchIntegrations, fetchCredentials, fetchCategories]);

  const fetchApiLogs = async () => {
    try {
      setLogsLoading(true);
      const logs = await apiService.getLogs(5, 0);
      setApiLogs(logs || []);
    } catch (error) {
      console.error('Error fetching API logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const connectedIntegrations = credentials.length;
  const availableIntegrations = integrations.length;
  const categoryCount = categories.length;

  // Render the integration icon based on the integration name
  const renderIntegrationIcon = (integration: any) => {
    if (!integration) return null;
    
    const lowerName = integration.name?.toLowerCase() || '';
    
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

  // Get status color based on response status
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 300 && status < 400) return 'text-blue-400';
    if (status >= 400 && status < 500) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-dark-900 pt-16">
      <header className="bg-dark-800 shadow-md">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white glow-text">Dashboard</h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Welcome section */}
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-dark-800 overflow-hidden shadow-md rounded-lg border border-dark-600">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg leading-6 font-medium text-white">
                  Welcome, {user?.full_name || user?.email}!
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Connect your favorite APIs and start building integrations.
                </p>
              </div>
            </div>
          </div>

          {/* Stats section */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 px-4 sm:px-0">
            <div className="bg-dark-800 overflow-hidden shadow-md rounded-lg border border-dark-600">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">
                    Connected Integrations
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-white">
                    {loading ? (
                      <div className="animate-pulse h-8 w-16 bg-dark-600 rounded"></div>
                    ) : (
                      <span className="glow-text">{connectedIntegrations}</span>
                    )}
                  </dd>
                </dl>
              </div>
              <div className="bg-dark-700 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link to="/integrations" className="font-medium text-glow-purple hover:text-purple-400 transition-colors">
                    View all integrations <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-dark-800 overflow-hidden shadow-md rounded-lg border border-dark-600">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">
                    Available Integrations
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-white">
                    {loading ? (
                      <div className="animate-pulse h-8 w-16 bg-dark-600 rounded"></div>
                    ) : (
                      <span className="glow-text-blue">{availableIntegrations}</span>
                    )}
                  </dd>
                </dl>
              </div>
              <div className="bg-dark-700 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link to="/integrations" className="font-medium text-glow-blue hover:text-blue-400 transition-colors">
                    Browse integrations <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-dark-800 overflow-hidden shadow-md rounded-lg border border-dark-600">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">
                    Integration Categories
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-white">
                    {loading ? (
                      <div className="animate-pulse h-8 w-16 bg-dark-600 rounded"></div>
                    ) : (
                      <span className="glow-text-cyan">{categoryCount}</span>
                    )}
                  </dd>
                </dl>
              </div>
              <div className="bg-dark-700 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <Link to="/integrations" className="font-medium text-glow-cyan hover:text-cyan-400 transition-colors">
                    View categories <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-dark-800 overflow-hidden shadow-md rounded-lg border border-dark-600">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">
                    Recent API Calls
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-white">
                    {logsLoading ? (
                      <div className="animate-pulse h-8 w-16 bg-dark-600 rounded"></div>
                    ) : (
                      <span className="glow-text-cyan">{apiLogs.length}</span>
                    )}
                  </dd>
                </dl>
              </div>
              <div className="bg-dark-700 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <button 
                    onClick={fetchApiLogs}
                    className="font-medium text-glow-cyan hover:text-cyan-400 transition-colors"
                  >
                    Refresh logs <span aria-hidden="true">&rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Categories section */}
          <div className="mt-8 px-4 sm:px-0">
            <div className="bg-dark-800 shadow-md sm:rounded-lg border border-dark-600">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-white">
                    Integration Categories
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-400">
                    Browse integrations by category.
                  </p>
                </div>
                <Link
                  to="/integrations"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-glow-cyan hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-cyan shadow-glow-cyan-sm hover:shadow-glow-cyan-md transition-all"
                >
                  <Folder className="h-4 w-4 mr-2" />
                  View All
                </Link>
              </div>
              <div className="border-t border-dark-600">
                {loading ? (
                  <div className="px-4 py-5 sm:p-6">
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <div className="rounded-full bg-dark-600 h-12 w-12"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-dark-600 rounded w-3/4"></div>
                            <div className="h-4 bg-dark-600 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : categories.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {categories.map((category) => {
                      const categoryIntegrations = integrations.filter(i => i.category_id === category.id);
                      const connectedCount = credentials.filter(c => 
                        categoryIntegrations.some(i => i.id === c.integration_id)
                      ).length;
                      
                      return (
                        <Link 
                          key={category.id}
                          to={`/integrations?category=${category.id}`}
                          className="bg-dark-700 rounded-lg p-4 hover:bg-dark-600 transition-colors"
                        >
                          <div className="flex items-center">
                            <CategoryBadge categoryName={category.name} size="lg" />
                            <span className="ml-2 text-xs text-gray-400 bg-dark-800 px-2 py-1 rounded-full">
                              {categoryIntegrations.length} integration{categoryIntegrations.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-400">{category.description}</p>
                          {connectedCount > 0 && (
                            <div className="mt-2 text-xs text-green-400">
                              {connectedCount} connected
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-5 sm:p-6 text-center">
                    <p className="text-gray-400 text-sm">
                      No categories found.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent integrations */}
          <div className="mt-8 px-4 sm:px-0">
            <div className="bg-dark-800 shadow-md sm:rounded-lg border border-dark-600">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-white">
                    Recent Integrations
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-400">
                    Your recently connected API integrations.
                  </p>
                </div>
                <Link
                  to="/integrations"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-glow-purple hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple shadow-glow-sm hover:shadow-glow-md transition-all"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add New
                </Link>
              </div>
              <div className="border-t border-dark-600">
                {loading ? (
                  <div className="px-4 py-5 sm:px-6">
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <div className="rounded-full bg-dark-600 h-12 w-12"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-dark-600 rounded w-3/4"></div>
                            <div className="h-4 bg-dark-600 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : credentials.length > 0 ? (
                  <ul className="divide-y divide-dark-600">
                    {credentials.slice(0, 5).map((credential) => {
                      const integration = integrations.find(i => i.id === credential.integration_id);
                      return (
                        <li key={credential.id}>
                          <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 bg-dark-700 rounded-full flex items-center justify-center shadow-glow-blue-sm">
                                {renderIntegrationIcon(integration)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-glow-purple">
                                  {credential.name}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {integration?.name || 'Unknown Integration'}
                                  {integration?.category && (
                                    <span className="ml-2">
                                      <CategoryBadge categoryName={integration.category.name} size="sm" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="ml-2 flex-shrink-0 flex">
                              <Link
                                to={`/api-test/${integration?.id}`}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-glow-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-blue transition-colors mr-2"
                              >
                                Test API
                              </Link>
                              <Link
                                to={`/integrations/${integration?.id}`}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-dark-700 hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors"
                              >
                                Manage
                                <ArrowRight className="ml-1 h-4 w-4" />
                              </Link>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="px-4 py-5 sm:px-6 text-center">
                    <p className="text-gray-400 text-sm">
                      You haven't connected any integrations yet.
                    </p>
                    <Link
                      to="/integrations"
                      className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-dark-700 hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors"
                    >
                      Browse available integrations
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Recent API Logs */}
          <div className="mt-8 px-4 sm:px-0">
            <div className="bg-dark-800 shadow-md sm:rounded-lg border border-dark-600">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-white">
                  Recent API Activity
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-400">
                  Your recent API calls and their status.
                </p>
              </div>
              <div className="border-t border-dark-600">
                {logsLoading ? (
                  <div className="px-4 py-5 sm:px-6">
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map((i) => (
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
                ) : apiLogs.length > 0 ? (
                  <ul className="divide-y divide-dark-600">
                    {apiLogs.map((log) => (
                      <li key={log.id}>
                        <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-dark-700 rounded-full flex items-center justify-center">
                              <Activity className="h-5 w-5 text-glow-blue" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">
                                {log.request_method} {log.request_path}
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(log.created_at).toLocaleString()} • 
                                {log.duration_ms && <span className="ml-1">{log.duration_ms}ms</span>}
                              </div>
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(log.response_status)} bg-dark-700`}>
                              {log.response_status}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-5 sm:px-6 text-center">
                    <p className="text-gray-400 text-sm">
                      No API activity recorded yet.
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      API calls will appear here once you start using the integrations.
                    </p>
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

export default Dashboard;