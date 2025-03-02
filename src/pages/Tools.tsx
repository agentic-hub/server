import React, { useEffect, useState } from 'react';
import { useIntegrationStore } from '../store/integrationStore';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { Tool } from '../types';

const Tools: React.FC = () => {
  const { 
    tools, 
    integrations, 
    credentials, 
    fetchTools, 
    fetchIntegrations, 
    fetchCredentials, 
    addTool, 
    updateTool, 
    removeTool, 
    loading 
  } = useIntegrationStore();
  
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [newTool, setNewTool] = useState<{
    name: string;
    description: string;
    integration_id: string;
    credential_id: string;
    configuration: Record<string, unknown>;
  }>({
    name: '',
    description: '',
    integration_id: '',
    credential_id: '',
    configuration: {}
  });

  useEffect(() => {
    fetchTools();
    fetchIntegrations();
    fetchCredentials();
  }, [fetchTools, fetchIntegrations, fetchCredentials]);

  const handleAddTool = async () => {
    try {
      await addTool({
        name: newTool.name,
        description: newTool.description,
        integration_id: newTool.integration_id,
        credential_id: newTool.credential_id,
        configuration: newTool.configuration
      });
      
      // Reset form
      setNewTool({
        name: '',
        description: '',
        integration_id: '',
        credential_id: '',
        configuration: {}
      });
      setIsAddingTool(false);
    } catch (error) {
      console.error('Error adding tool:', error);
    }
  };

  const handleUpdateTool = async () => {
    if (!editingTool) return;
    
    try {
      await updateTool(editingTool.id, {
        name: newTool.name,
        description: newTool.description,
        integration_id: newTool.integration_id,
        credential_id: newTool.credential_id,
        configuration: newTool.configuration
      });
      
      // Reset form
      setNewTool({
        name: '',
        description: '',
        integration_id: '',
        credential_id: '',
        configuration: {}
      });
      setEditingTool(null);
    } catch (error) {
      console.error('Error updating tool:', error);
    }
  };

  const handleDeleteTool = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this tool?')) {
      try {
        await removeTool(id);
      } catch (error) {
        console.error('Error deleting tool:', error);
      }
    }
  };

  const handleEditTool = (tool: Tool) => {
    setEditingTool(tool);
    setNewTool({
      name: tool.name,
      description: tool.description,
      integration_id: tool.integration_id,
      credential_id: tool.credential_id,
      configuration: tool.configuration
    });
    setIsAddingTool(true);
  };

  // Get integration name by ID
  const getIntegrationName = (id: string) => {
    const integration = integrations.find(i => i.id === id);
    return integration ? integration.name : 'Unknown Integration';
  };

  // Get credential name by ID
  const getCredentialName = (id: string) => {
    const credential = credentials.find(c => c.id === id);
    return credential ? credential.name : 'Unknown Credential';
  };

  // Filter credentials by selected integration
  const filteredCredentials = credentials.filter(
    cred => !newTool.integration_id || cred.integration_id === newTool.integration_id
  );

  return (
    <div className="min-h-screen bg-dark-900 pt-16">
      <header className="bg-dark-800 shadow-md">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white glow-text">Tools</h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <div className="bg-dark-800 shadow-md overflow-hidden sm:rounded-lg border border-dark-600">
              <div className="px-4 py-5 sm:px-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-white">
                      Your Tools
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-400">
                      Create and manage tools to use in your toolkits.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddingTool(true);
                      setEditingTool(null);
                      setNewTool({
                        name: '',
                        description: '',
                        integration_id: '',
                        credential_id: '',
                        configuration: {}
                      });
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-glow-purple hover:bg-glow-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Tool
                  </button>
                </div>
              </div>
              
              {/* Tool Form */}
              {isAddingTool && (
                <div className="border-t border-dark-600 px-4 py-5 sm:px-6">
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-white">
                      {editingTool ? 'Edit Tool' : 'Create New Tool'}
                    </h4>
                    <div>
                      <label htmlFor="tool-name" className="block text-sm font-medium text-gray-300">
                        Name
                      </label>
                      <input
                        type="text"
                        id="tool-name"
                        className="mt-1 focus:ring-glow-purple focus:border-glow-purple block w-full sm:text-sm border-dark-500 rounded-md bg-dark-700 text-white"
                        value={newTool.name}
                        onChange={(e) => setNewTool(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label htmlFor="tool-description" className="block text-sm font-medium text-gray-300">
                        Description
                      </label>
                      <textarea
                        id="tool-description"
                        rows={3}
                        className="mt-1 focus:ring-glow-purple focus:border-glow-purple block w-full sm:text-sm border-dark-500 rounded-md bg-dark-700 text-white"
                        value={newTool.description}
                        onChange={(e) => setNewTool(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label htmlFor="tool-integration" className="block text-sm font-medium text-gray-300">
                        Integration
                      </label>
                      <select
                        id="tool-integration"
                        className="mt-1 focus:ring-glow-purple focus:border-glow-purple block w-full sm:text-sm border-dark-500 rounded-md bg-dark-700 text-white"
                        value={newTool.integration_id}
                        onChange={(e) => setNewTool(prev => ({ 
                          ...prev, 
                          integration_id: e.target.value,
                          credential_id: '' // Reset credential when integration changes
                        }))}
                      >
                        <option value="">Select an integration</option>
                        {integrations.map(integration => (
                          <option key={integration.id} value={integration.id}>
                            {integration.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="tool-credential" className="block text-sm font-medium text-gray-300">
                        Credential
                      </label>
                      <select
                        id="tool-credential"
                        className="mt-1 focus:ring-glow-purple focus:border-glow-purple block w-full sm:text-sm border-dark-500 rounded-md bg-dark-700 text-white"
                        value={newTool.credential_id}
                        onChange={(e) => setNewTool(prev => ({ ...prev, credential_id: e.target.value }))}
                        disabled={!newTool.integration_id}
                      >
                        <option value="">Select a credential</option>
                        {filteredCredentials.map(credential => (
                          <option key={credential.id} value={credential.id}>
                            {credential.name}
                          </option>
                        ))}
                      </select>
                      {newTool.integration_id && filteredCredentials.length === 0 && (
                        <p className="mt-1 text-sm text-yellow-500">
                          No credentials found for this integration. Please create a credential first.
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="tool-config" className="block text-sm font-medium text-gray-300">
                        Configuration (JSON)
                      </label>
                      <textarea
                        id="tool-config"
                        rows={5}
                        className="mt-1 focus:ring-glow-purple focus:border-glow-purple block w-full sm:text-sm border-dark-500 rounded-md bg-dark-700 text-white font-mono"
                        value={JSON.stringify(newTool.configuration, null, 2)}
                        onChange={(e) => {
                          try {
                            const config = JSON.parse(e.target.value);
                            setNewTool(prev => ({ ...prev, configuration: config }));
                          } catch {
                            // Allow invalid JSON during editing, but don't update the state
                            console.log('Invalid JSON, not updating state');
                          }
                        }}
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Enter configuration as valid JSON. This will be passed to the tool when used.
                      </p>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setIsAddingTool(false);
                          setEditingTool(null);
                          setNewTool({
                            name: '',
                            description: '',
                            integration_id: '',
                            credential_id: '',
                            configuration: {}
                          });
                        }}
                        className="inline-flex items-center px-4 py-2 border border-dark-500 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-dark-700 hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={editingTool ? handleUpdateTool : handleAddTool}
                        disabled={!newTool.name || !newTool.integration_id || !newTool.credential_id}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-glow-purple hover:bg-glow-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {editingTool ? 'Update Tool' : 'Create Tool'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tools List */}
              <div className="border-t border-dark-600">
                {loading ? (
                  <div className="px-4 py-5 sm:px-6 text-center text-gray-400">
                    Loading tools...
                  </div>
                ) : tools.length > 0 ? (
                  <ul className="divide-y divide-dark-600">
                    {tools.map(tool => (
                      <li key={tool.id} className="px-4 py-4 sm:px-6 hover:bg-dark-700 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <Settings className="h-6 w-6 text-glow-purple" />
                            </div>
                            <div className="ml-4">
                              <h4 className="text-md font-medium text-white">{tool.name}</h4>
                              <p className="text-sm text-gray-400">{tool.description}</p>
                              <div className="mt-1 flex flex-col sm:flex-row sm:space-x-4 text-xs text-gray-500">
                                <span>Integration: {getIntegrationName(tool.integration_id)}</span>
                                <span>Credential: {getCredentialName(tool.credential_id)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditTool(tool)}
                              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTool(tool.id)}
                              className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-5 sm:px-6 text-center text-gray-400">
                    <p>No tools found. Create your first tool to get started.</p>
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

export default Tools; 