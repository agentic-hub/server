import React, { useEffect, useState } from 'react';
import { useIntegrationStore } from '../store/integrationStore';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Wrench, ChevronRight, Settings } from 'lucide-react';
import { Toolkit } from '../types';

const Toolkits: React.FC = () => {
  const { toolkits, tools, fetchToolkits, fetchTools, removeToolkit, loading } = useIntegrationStore();
  const [isAddingToolkit, setIsAddingToolkit] = useState(false);
  const [editingToolkit, setEditingToolkit] = useState<Toolkit | null>(null);
  const [newToolkit, setNewToolkit] = useState<{ name: string; description: string; selectedTools: string[] }>({
    name: '',
    description: '',
    selectedTools: []
  });

  useEffect(() => {
    fetchToolkits();
    fetchTools();
  }, [fetchToolkits, fetchTools]);

  const handleAddToolkit = async () => {
    try {
      // Map selected tool IDs to actual tool objects
      const selectedToolObjects = tools.filter(tool => newToolkit.selectedTools.includes(tool.id));
      
      await useIntegrationStore.getState().addToolkit({
        name: newToolkit.name,
        description: newToolkit.description,
        tools: selectedToolObjects
      });
      
      // Reset form
      setNewToolkit({
        name: '',
        description: '',
        selectedTools: []
      });
      setIsAddingToolkit(false);
    } catch (error) {
      console.error('Error adding toolkit:', error);
    }
  };

  const handleUpdateToolkit = async () => {
    if (!editingToolkit) return;
    
    try {
      // Map selected tool IDs to actual tool objects
      const selectedToolObjects = tools.filter(tool => newToolkit.selectedTools.includes(tool.id));
      
      await useIntegrationStore.getState().updateToolkit(editingToolkit.id, {
        name: newToolkit.name,
        description: newToolkit.description,
        tools: selectedToolObjects
      });
      
      // Reset form
      setNewToolkit({
        name: '',
        description: '',
        selectedTools: []
      });
      setEditingToolkit(null);
    } catch (error) {
      console.error('Error updating toolkit:', error);
    }
  };

  const handleDeleteToolkit = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this toolkit?')) {
      try {
        await removeToolkit(id);
      } catch (error) {
        console.error('Error deleting toolkit:', error);
      }
    }
  };

  const handleEditToolkit = (toolkit: Toolkit) => {
    setEditingToolkit(toolkit);
    setNewToolkit({
      name: toolkit.name,
      description: toolkit.description,
      selectedTools: toolkit.tools.map(tool => tool.id)
    });
  };

  const handleToolSelection = (toolId: string) => {
    setNewToolkit(prev => {
      const isSelected = prev.selectedTools.includes(toolId);
      
      if (isSelected) {
        // Remove tool if already selected
        return {
          ...prev,
          selectedTools: prev.selectedTools.filter(id => id !== toolId)
        };
      } else {
        // Add tool if not selected
        return {
          ...prev,
          selectedTools: [...prev.selectedTools, toolId]
        };
      }
    });
  };

  return (
    <div className="min-h-screen bg-dark-900 pt-16">
      <header className="bg-dark-800 shadow-md">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white glow-text">Toolkits</h1>
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
                      Your Toolkits
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-400">
                      Create and manage toolkits with multiple tools.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddingToolkit(true);
                      setEditingToolkit(null);
                      setNewToolkit({
                        name: '',
                        description: '',
                        selectedTools: []
                      });
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-glow-purple hover:bg-glow-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Toolkit
                  </button>
                </div>
              </div>
              
              {/* Toolkit Form */}
              {(isAddingToolkit || editingToolkit) && (
                <div className="border-t border-dark-600 px-4 py-5 sm:px-6">
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-white">
                      {editingToolkit ? 'Edit Toolkit' : 'Create New Toolkit'}
                    </h4>
                    <div>
                      <label htmlFor="toolkit-name" className="block text-sm font-medium text-gray-300">
                        Name
                      </label>
                      <input
                        type="text"
                        id="toolkit-name"
                        className="mt-1 focus:ring-glow-purple focus:border-glow-purple block w-full sm:text-sm border-dark-500 rounded-md bg-dark-700 text-white"
                        value={newToolkit.name}
                        onChange={(e) => setNewToolkit(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label htmlFor="toolkit-description" className="block text-sm font-medium text-gray-300">
                        Description
                      </label>
                      <textarea
                        id="toolkit-description"
                        rows={3}
                        className="mt-1 focus:ring-glow-purple focus:border-glow-purple block w-full sm:text-sm border-dark-500 rounded-md bg-dark-700 text-white"
                        value={newToolkit.description}
                        onChange={(e) => setNewToolkit(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Select Tools
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tools.map(tool => (
                          <div 
                            key={tool.id}
                            className={`p-3 rounded-md border cursor-pointer transition-colors ${
                              newToolkit.selectedTools.includes(tool.id)
                                ? 'border-glow-purple bg-dark-700'
                                : 'border-dark-600 bg-dark-800 hover:bg-dark-700'
                            }`}
                            onClick={() => handleToolSelection(tool.id)}
                          >
                            <div className="flex items-center">
                              <div className={`h-4 w-4 rounded-sm mr-2 ${
                                newToolkit.selectedTools.includes(tool.id)
                                  ? 'bg-glow-purple'
                                  : 'bg-dark-600'
                              }`} />
                              <div>
                                <h5 className="text-sm font-medium text-white">{tool.name}</h5>
                                <p className="text-xs text-gray-400 truncate">{tool.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {tools.length === 0 && (
                          <div className="col-span-full p-4 text-center text-gray-400 border border-dashed border-dark-600 rounded-md">
                            <p>No tools available. Create tools first to add them to your toolkit.</p>
                            <Link 
                              to="/tools" 
                              className="inline-flex items-center mt-2 text-glow-purple hover:text-glow-purple-light"
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Create Tools
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setIsAddingToolkit(false);
                          setEditingToolkit(null);
                          setNewToolkit({
                            name: '',
                            description: '',
                            selectedTools: []
                          });
                        }}
                        className="inline-flex items-center px-4 py-2 border border-dark-500 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-dark-700 hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={editingToolkit ? handleUpdateToolkit : handleAddToolkit}
                        disabled={!newToolkit.name || newToolkit.selectedTools.length === 0}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-glow-purple hover:bg-glow-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {editingToolkit ? 'Update Toolkit' : 'Create Toolkit'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Toolkits List */}
              <div className="border-t border-dark-600">
                {loading ? (
                  <div className="px-4 py-5 sm:px-6 text-center text-gray-400">
                    Loading toolkits...
                  </div>
                ) : toolkits.length > 0 ? (
                  <ul className="divide-y divide-dark-600">
                    {toolkits.map((toolkit) => (
                      <li key={toolkit.id} className="px-4 py-4 sm:px-6 hover:bg-dark-700 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <Wrench className="h-6 w-6 text-glow-purple" />
                            </div>
                            <div className="ml-4">
                              <Link 
                                to={`/toolkits/${toolkit.id}`}
                                className="text-lg font-medium text-white hover:text-glow-purple transition-colors"
                              >
                                {toolkit.name}
                              </Link>
                              <p className="text-sm text-gray-400">{toolkit.description}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {toolkit.tools.map((tool) => (
                                  <span 
                                    key={tool.id} 
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-dark-600 text-gray-300"
                                  >
                                    <Settings className="h-3 w-3 mr-1" />
                                    {tool.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditToolkit(toolkit)}
                              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteToolkit(toolkit.id)}
                              className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                            <Link
                              to={`/toolkits/${toolkit.id}`}
                              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <li className="px-4 py-8 sm:px-6 text-center text-gray-400">
                    <p>No toolkits found. Create your first toolkit to get started.</p>
                  </li>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Toolkits; 