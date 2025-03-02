import React, { useState } from 'react';
import { Toolkit, Tool } from '../types/index';
import { useIntegrationStore } from '../store/integrationStore';
import { Plus, X } from 'lucide-react';

interface ToolkitFormProps {
  initialData?: Partial<Toolkit>;
  onSubmit: (data: Partial<Toolkit>) => void;
  onCancel: () => void;
}

const ToolkitForm: React.FC<ToolkitFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const { tools } = useIntegrationStore();
  const [formData, setFormData] = useState<Partial<Toolkit>>({
    name: '',
    description: '',
    tools: [],
    ...initialData,
  });
  const [selectedToolId, setSelectedToolId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter out tools that are already in the toolkit
  const availableTools = tools.filter(
    (tool: Tool) => !formData.tools?.some((t) => t.id === tool.id)
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddTool = () => {
    if (!selectedToolId) return;
    
    const toolToAdd = tools.find((tool: Tool) => tool.id === selectedToolId);
    if (toolToAdd) {
      setFormData((prev) => ({
        ...prev,
        tools: [...(prev.tools || []), toolToAdd],
      }));
      setSelectedToolId('');
    }
  };

  const handleRemoveTool = (toolId: string) => {
    setFormData((prev) => ({
      ...prev,
      tools: prev.tools?.filter((tool) => tool.id !== toolId) || [],
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.tools?.length) {
      newErrors.tools = 'At least one tool is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name || ''}
          onChange={handleChange}
          className={`mt-1 focus:ring-glow-purple focus:border-glow-purple block w-full sm:text-sm border-dark-500 rounded-md bg-dark-700 text-white ${errors.name ? 'border-red-500' : ''}`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-white">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows={3}
          className={`mt-1 focus:ring-glow-purple focus:border-glow-purple block w-full sm:text-sm border-dark-500 rounded-md bg-dark-700 text-white ${errors.description ? 'border-red-500' : ''}`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-500">{errors.description}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Tools
        </label>
        
        <div className="flex space-x-2 mb-4">
          <select
            id="toolSelect"
            value={selectedToolId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedToolId(e.target.value)}
            className="mt-1 focus:ring-glow-purple focus:border-glow-purple block w-full sm:text-sm border-dark-500 rounded-md bg-dark-700 text-white"
          >
            <option value="">Select a tool to add</option>
            {availableTools.map((tool: Tool) => (
              <option key={tool.id} value={tool.id}>
                {tool.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddTool}
            disabled={!selectedToolId}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-glow-purple hover:bg-glow-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </button>
        </div>
        
        {errors.tools && (
          <p className="mt-1 text-sm text-red-500 mb-2">{errors.tools}</p>
        )}
        
        <div className="space-y-2">
          {formData.tools && formData.tools.length > 0 ? (
            formData.tools.map((tool: Tool) => (
              <div
                key={tool.id}
                className="flex items-center justify-between bg-dark-700 p-2 rounded-md"
              >
                <span className="text-sm text-white">{tool.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTool(tool.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-4 border border-dashed border-dark-600 rounded-md">
              <p>No tools added yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-dark-500 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-dark-700 hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-glow-purple hover:bg-glow-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors"
        >
          {initialData?.id ? 'Update Toolkit' : 'Create Toolkit'}
        </button>
      </div>
    </form>
  );
};

export default ToolkitForm; 