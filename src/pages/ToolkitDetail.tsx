import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIntegrationStore } from '../store/integrationStore';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import ToolkitDetail from '../components/ToolkitDetail';
import ToolkitForm from '../components/ToolkitForm';
import { Toolkit } from '../types/index';

const ToolkitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toolkits, fetchToolkits, updateToolkit, removeToolkit, removeTool } = useIntegrationStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toolkit, setToolkit] = useState<Toolkit | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchToolkits();
      setLoading(false);
    };
    
    loadData();
  }, [fetchToolkits]);

  useEffect(() => {
    if (!loading && id) {
      const foundToolkit = toolkits.find(tk => tk.id === id);
      setToolkit(foundToolkit || null);
    }
  }, [id, toolkits, loading]);

  const handleUpdateToolkit = async (data: Partial<Toolkit>) => {
    if (!id) return;
    
    try {
      await updateToolkit(id, data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating toolkit:', error);
    }
  };

  const handleDeleteToolkit = async () => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this toolkit?')) {
      try {
        await removeToolkit(id);
        navigate('/toolkits');
      } catch (error) {
        console.error('Error deleting toolkit:', error);
      }
    }
  };

  const handleRemoveTool = async (toolId: string) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to remove this tool from the toolkit?')) {
      try {
        // Get the current toolkit
        const currentToolkit = toolkits.find(tk => tk.id === id);
        if (!currentToolkit) return;
        
        // Filter out the tool to remove
        const updatedTools = currentToolkit.tools.filter(tool => tool.id !== toolId);
        
        // Update the toolkit with the new tools array
        await updateToolkit(id, { tools: updatedTools });
      } catch (error) {
        console.error('Error removing tool from toolkit:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 pt-16">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-dark-700 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-dark-700 rounded"></div>
                <div className="h-4 bg-dark-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!toolkit) {
    return (
      <div className="min-h-screen bg-dark-900 pt-16">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Toolkit not found</h2>
            <p className="mt-2 text-gray-400">The toolkit you're looking for doesn't exist or has been deleted.</p>
            <button
              onClick={() => navigate('/toolkits')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-glow-purple hover:bg-glow-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Toolkits
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 pt-16">
      <header className="bg-dark-800 shadow-md">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/toolkits')}
                className="mr-4 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-3xl font-bold text-white glow-text">Toolkit Details</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-dark-700 hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDeleteToolkit}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            {isEditing ? (
              <div className="bg-dark-800 shadow-md overflow-hidden sm:rounded-lg border border-dark-600 p-6">
                <h2 className="text-xl font-bold text-white mb-4">Edit Toolkit</h2>
                <ToolkitForm
                  initialData={toolkit}
                  onSubmit={handleUpdateToolkit}
                  onCancel={() => setIsEditing(false)}
                />
              </div>
            ) : (
              <ToolkitDetail
                toolkit={toolkit}
                onRemoveTool={handleRemoveTool}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ToolkitDetailPage; 