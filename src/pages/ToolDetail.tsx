import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIntegrationStore } from '../store/integrationStore';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import ToolDetail from '../components/ToolDetail';
import ToolForm from '../components/ToolForm';
import { Tool, Integration, Credential } from '../types/index';

const ToolDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    tools, 
    integrations, 
    credentials, 
    fetchTools, 
    fetchIntegrations, 
    fetchCredentials, 
    updateTool, 
    removeTool 
  } = useIntegrationStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tool, setTool] = useState<Tool | null>(null);
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [credential, setCredential] = useState<Credential | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchTools(),
        fetchIntegrations(),
        fetchCredentials()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, [fetchTools, fetchIntegrations, fetchCredentials]);

  useEffect(() => {
    if (!loading && id) {
      const foundTool = tools.find(t => t.id === id);
      setTool(foundTool || null);
      
      if (foundTool) {
        const foundIntegration = integrations.find(i => i.id === foundTool.integration_id);
        const foundCredential = credentials.find(c => c.id === foundTool.credential_id);
        
        setIntegration(foundIntegration || null);
        setCredential(foundCredential || null);
      }
    }
  }, [id, tools, integrations, credentials, loading]);

  const handleUpdateTool = async (data: Partial<Tool>) => {
    if (!id) return;
    
    try {
      await updateTool(id, data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating tool:', error);
    }
  };

  const handleDeleteTool = async () => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this tool?')) {
      try {
        await removeTool(id);
        navigate('/tools');
      } catch (error) {
        console.error('Error deleting tool:', error);
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

  if (!tool) {
    return (
      <div className="min-h-screen bg-dark-900 pt-16">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Tool not found</h2>
            <p className="mt-2 text-gray-400">The tool you're looking for doesn't exist or has been deleted.</p>
            <button
              onClick={() => navigate('/tools')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-glow-purple hover:bg-glow-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tools
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
                onClick={() => navigate('/tools')}
                className="mr-4 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-3xl font-bold text-white glow-text">Tool Details</h1>
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
                onClick={handleDeleteTool}
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
                <h2 className="text-xl font-bold text-white mb-4">Edit Tool</h2>
                <ToolForm
                  initialData={tool}
                  onSubmit={handleUpdateTool}
                  onCancel={() => setIsEditing(false)}
                />
              </div>
            ) : (
              <ToolDetail
                tool={tool}
                integration={integration || undefined}
                credential={credential || undefined}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ToolDetailPage; 