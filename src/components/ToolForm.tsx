import React, { useState, useEffect } from 'react';
import { Tool, Integration, Credential } from '../types/index';
import { useIntegrationStore } from '../store/integrationStore';

interface ToolFormProps {
  initialData?: Partial<Tool>;
  onSubmit: (data: Partial<Tool>) => void;
  onCancel: () => void;
}

const ToolForm: React.FC<ToolFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const { integrations, credentials, fetchIntegrations, fetchCredentials } = useIntegrationStore();
  const [formData, setFormData] = useState<Partial<Tool>>({
    name: '',
    description: '',
    integration_id: '',
    credential_id: '',
    configuration: {},
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [configFields, setConfigFields] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchIntegrations();
    fetchCredentials();
  }, [fetchIntegrations, fetchCredentials]);

  useEffect(() => {
    // Initialize config fields from existing configuration
    if (initialData?.configuration) {
      const fields: Record<string, string> = {};
      Object.entries(initialData.configuration).forEach(([key, value]) => {
        fields[key] = typeof value === 'string' ? value : JSON.stringify(value);
      });
      setConfigFields(fields);
    }
  }, [initialData]);

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

  const handleConfigChange = (key: string, value: string) => {
    setConfigFields((prev) => ({ ...prev, [key]: value }));
    
    // Update the configuration object in formData
    const updatedConfig = { ...formData.configuration };
    
    try {
      // Try to parse as JSON if it looks like an object or array
      if ((value.startsWith('{') && value.endsWith('}')) || 
          (value.startsWith('[') && value.endsWith(']'))) {
        updatedConfig[key] = JSON.parse(value);
      } else {
        updatedConfig[key] = value;
      }
    } catch {
      // If parsing fails, store as string
      updatedConfig[key] = value;
    }
    
    setFormData((prev) => ({
      ...prev,
      configuration: updatedConfig,
    }));
  };

  const handleAddConfigField = () => {
    const newKey = `field_${Object.keys(configFields).length + 1}`;
    setConfigFields((prev) => ({ ...prev, [newKey]: '' }));
    
    // Add to configuration
    setFormData((prev) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        [newKey]: '',
      },
    }));
  };

  const handleRemoveConfigField = (key: string) => {
    const updatedFields = { ...configFields };
    delete updatedFields[key];
    setConfigFields(updatedFields);
    
    // Remove from configuration
    const updatedConfig = { ...formData.configuration };
    delete updatedConfig[key];
    setFormData((prev) => ({
      ...prev,
      configuration: updatedConfig,
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
    
    if (!formData.integration_id) {
      newErrors.integration_id = 'Integration is required';
    }
    
    if (!formData.credential_id) {
      newErrors.credential_id = 'Credential is required';
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

  // Filter credentials based on selected integration
  const filteredCredentials = credentials.filter(
    (credential) => credential.integration_id === formData.integration_id
  );

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
        <label htmlFor="integration_id" className="block text-sm font-medium text-white">
          Integration
        </label>
        <select
          id="integration_id"
          name="integration_id"
          value={formData.integration_id || ''}
          onChange={handleChange}
          className={`mt-1 focus:ring-glow-purple focus:border-glow-purple block w-full sm:text-sm border-dark-500 rounded-md bg-dark-700 text-white ${errors.integration_id ? 'border-red-500' : ''}`}
        >
          <option value="">Select an integration</option>
          {integrations.map((integration: Integration) => (
            <option key={integration.id} value={integration.id}>
              {integration.name}
            </option>
          ))}
        </select>
        {errors.integration_id && (
          <p className="mt-1 text-sm text-red-500">{errors.integration_id}</p>
        )}
      </div>

      <div>
        <label htmlFor="credential_id" className="block text-sm font-medium text-white">
          Credential
        </label>
        <select
          id="credential_id"
          name="credential_id"
          value={formData.credential_id || ''}
          onChange={handleChange}
          disabled={!formData.integration_id}
          className={`mt-1 focus:ring-glow-purple focus:border-glow-purple block w-full sm:text-sm border-dark-500 rounded-md bg-dark-700 text-white ${errors.credential_id ? 'border-red-500' : ''}`}
        >
          <option value="">Select a credential</option>
          {filteredCredentials.map((credential: Credential) => (
            <option key={credential.id} value={credential.id}>
              {credential.name}
            </option>
          ))}
        </select>
        {errors.credential_id && (
          <p className="mt-1 text-sm text-red-500">{errors.credential_id}</p>
        )}
        {formData.integration_id && filteredCredentials.length === 0 && (
          <p className="mt-1 text-sm text-yellow-500">
            No credentials available for this integration. Please create a credential first.
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-white">
            Configuration
          </label>
          <button
            type="button"
            onClick={handleAddConfigField}
            className="inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-dark-600 hover:bg-dark-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors"
          >
            Add Field
          </button>
        </div>
        
        <div className="space-y-3 bg-dark-800 p-3 rounded-md border border-dark-600">
          {Object.keys(configFields).length > 0 ? (
            Object.entries(configFields).map(([key, value]) => (
              <div key={key} className="flex space-x-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => {
                      const newKey = e.target.value;
                      const updatedFields = { ...configFields };
                      delete updatedFields[key];
                      updatedFields[newKey] = value;
                      setConfigFields(updatedFields);
                      
                      // Update in configuration
                      const updatedConfig = { ...formData.configuration };
                      delete updatedConfig[key];
                      updatedConfig[newKey] = value;
                      setFormData((prev) => ({
                        ...prev,
                        configuration: updatedConfig,
                      }));
                    }}
                    placeholder="Key"
                    className="w-full px-2 py-1 text-sm border-dark-500 rounded-md bg-dark-700 text-white"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleConfigChange(key, e.target.value)}
                    placeholder="Value"
                    className="w-full px-2 py-1 text-sm border-dark-500 rounded-md bg-dark-700 text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveConfigField(key)}
                  className="px-2 py-1 text-gray-400 hover:text-red-500 hover:bg-dark-600 rounded-md"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-4">
              <p>No configuration fields. Click "Add Field" to add configuration.</p>
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
          {initialData?.id ? 'Update Tool' : 'Create Tool'}
        </button>
      </div>
    </form>
  );
};

export default ToolForm; 