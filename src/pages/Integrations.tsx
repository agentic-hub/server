import React, { useEffect, useState } from 'react';
import { useIntegrationStore } from '../store/integrationStore';
import { Search, Filter, ChevronDown, ChevronUp, Folder, Zap } from 'lucide-react';
import IntegrationCard from '../components/IntegrationCard';

const Integrations: React.FC = () => {
  const { integrations, credentials, categories, fetchIntegrations, fetchCredentials, fetchCategories, loading } = useIntegrationStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchIntegrations();
    fetchCredentials();
    fetchCategories();
  }, [fetchIntegrations, fetchCredentials, fetchCategories]);

  const filteredIntegrations = integrations.filter(integration => {
    // Filter by search term
    const matchesSearch = 
      integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by category
    const matchesCategory = selectedCategory ? integration.category_id === selectedCategory : true;
    
    return matchesSearch && matchesCategory;
  });

  // Get connected status for each integration
  const getConnectedStatus = (integrationId: string) => {
    return credentials.some(cred => cred.integration_id === integrationId);
  };

  // Group integrations by category
  const groupedIntegrations = filteredIntegrations.reduce((acc, integration) => {
    const categoryId = integration.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  return (
    <div className="min-h-screen bg-dark-900 pt-16">
      <header className="bg-dark-800 shadow-md">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white glow-text">Integrations</h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <div className="bg-dark-800 shadow-md overflow-hidden sm:rounded-lg border border-dark-600">
              <div className="px-4 py-5 sm:px-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-white">
                      Available Integrations
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-400">
                      Connect your favorite APIs and services.
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 w-full sm:w-auto flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="focus:ring-glow-purple focus:border-glow-purple block w-full pl-10 sm:text-sm border-dark-500 rounded-md bg-dark-700 text-white placeholder-gray-400"
                        placeholder="Search integrations"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="inline-flex items-center px-3 py-2 border border-dark-500 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-dark-700 hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                      {showFilters ? (
                        <ChevronUp className="h-4 w-4 ml-2" />
                      ) : (
                        <ChevronDown className="h-4 w-4 ml-2" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Category filters */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-dark-600">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          selectedCategory === null
                            ? 'bg-glow-purple text-white'
                            : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                        } transition-colors`}
                      >
                        All Categories
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            selectedCategory === category.id
                              ? 'bg-glow-purple text-white'
                              : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                          } transition-colors`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-dark-600">
                {loading ? (
                  <div className="px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="animate-pulse bg-dark-700 rounded-lg shadow p-6">
                          <div className="rounded-full bg-dark-600 h-12 w-12 mb-4"></div>
                          <div className="h-4 bg-dark-600 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-dark-600 rounded w-full mb-2"></div>
                          <div className="h-4 bg-dark-600 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : filteredIntegrations.length > 0 ? (
                  <div className="px-4 py-5 sm:p-6 space-y-8">
                    {/* Display by category */}
                    {Object.keys(groupedIntegrations).map((categoryId) => (
                      <div key={categoryId} className="space-y-4">
                        <div className="flex items-center">
                          <Folder className="h-5 w-5 text-glow-blue mr-2" />
                          <h3 className="text-lg font-medium text-white">
                            {getCategoryName(categoryId)}
                          </h3>
                          <span className="ml-2 text-xs text-gray-400 bg-dark-700 px-2 py-1 rounded-full">
                            {groupedIntegrations[categoryId].length} integration{groupedIntegrations[categoryId].length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {groupedIntegrations[categoryId].map((integration) => (
                            <IntegrationCard 
                              key={integration.id}
                              integration={integration}
                              isConnected={getConnectedStatus(integration.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-5 sm:p-6 text-center">
                    <Zap className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No integrations found matching your search.</p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory(null);
                      }}
                      className="mt-2 text-glow-purple hover:text-purple-400 transition-colors"
                    >
                      Clear filters
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

export default Integrations;