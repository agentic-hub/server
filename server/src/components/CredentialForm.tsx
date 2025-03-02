import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Integration } from '../types';
import OAuthConnectButton from './OAuthConnectButton';

interface CredentialFormProps {
  integration: Integration;
  onSave: (name: string, data: Record<string, string>) => Promise<void>;
  onCancel: () => void;
}

const CredentialForm: React.FC<CredentialFormProps> = ({ integration, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);

  // Define fields based on integration type
  const getFormFields = () => {
    const lowerName = integration.name.toLowerCase();
    
    if (lowerName.includes('google')) {
      return [
        { key: 'client_id', label: 'Client ID', type: 'text', required: true },
        { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
        { key: 'redirect_uri', label: 'Redirect URI', type: 'text', required: true, 
          placeholder: 'https://your-app.com/auth/google/callback' }
      ];
    } else if (lowerName === 'youtube') {
      return [
        { key: 'client_id', label: 'Client ID', type: 'text', required: true },
        { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
        { key: 'redirect_uri', label: 'Redirect URI', type: 'text', required: true, 
          placeholder: 'https://your-app.com/auth/google/callback' },
        { key: 'api_key', label: 'API Key (optional)', type: 'password', required: false }
      ];
    } else if (lowerName === 'google calendar') {
      return [
        { key: 'client_id', label: 'Client ID', type: 'text', required: true },
        { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
        { key: 'redirect_uri', label: 'Redirect URI', type: 'text', required: true, 
          placeholder: 'https://your-app.com/auth/google/callback' }
      ];
    } else if (lowerName === 'google drive') {
      return [
        { key: 'client_id', label: 'Client ID', type: 'text', required: true },
        { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
        { key: 'redirect_uri', label: 'Redirect URI', type: 'text', required: true, 
          placeholder: 'https://your-app.com/auth/google/callback' }
      ];
    } else if (lowerName.includes('tiktok')) {
      return [
        { key: 'client_key', label: 'Client Key', type: 'text', required: true },
        { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
        { key: 'redirect_uri', label: 'Redirect URI', type: 'text', required: true }
      ];
    } else if (lowerName.includes('gmail')) {
      return [
        { key: 'client_id', label: 'Client ID', type: 'text', required: true },
        { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
        { key: 'refresh_token', label: 'Refresh Token', type: 'password', required: false },
        { key: 'redirect_uri', label: 'Redirect URI', type: 'text', required: true }
      ];
    } else if (lowerName.includes('slack')) {
      return [
        { key: 'client_id', label: 'Client ID', type: 'text', required: true },
        { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
        { key: 'signing_secret', label: 'Signing Secret', type: 'password', required: true },
        { key: 'bot_token', label: 'Bot Token', type: 'password', required: false },
        { key: 'redirect_uri', label: 'Redirect URI', type: 'text', required: true }
      ];
    } else {
      // Default fields for other integrations
      return [
        { key: 'api_key', label: 'API Key', type: 'text', required: true },
        { key: 'api_secret', label: 'API Secret', type: 'password', required: false }
      ];
    }
  };

  const fields = getFormFields();

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    const missingFields = fields
      .filter(field => field.required && !formData[field.key])
      .map(field => field.label);
    
    if (missingFields.length > 0) {
      setError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    if (!name.trim()) {
      setError('Please provide a name for this credential');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await onSave(name, formData);
    } catch (err: any) {
      setError(err.message || 'Failed to save credential');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthSuccess = async (oauthData: Record<string, string>) => {
    try {
      setIsSubmitting(true);
      setError('');
      
      // Generate a default name if not provided
      const credentialName = name.trim() || `${integration.name} Connection`;
      
      await onSave(credentialName, oauthData);
    } catch (err: any) {
      setError(err.message || 'Failed to save credential');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-dark-700 p-6 rounded-lg border border-dark-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">
          Add {integration.name} Credential
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-900/30 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-4">
        <label htmlFor="credential-name" className="block text-sm font-medium text-gray-300">
          Credential Name
        </label>
        <input
          type="text"
          id="credential-name"
          className="mt-1 block w-full border border-dark-500 rounded-md shadow-sm py-2 px-3 bg-dark-600 text-white focus:outline-none focus:ring-glow-purple focus:border-glow-purple sm:text-sm"
          placeholder={`My ${integration.name} Connection`}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p className="mt-1 text-xs text-gray-400">
          Give this credential a name to help you identify it later
        </p>
      </div>
      
      <div className="space-y-4">
        {/* OAuth Connect Button */}
        <div className="mb-6">
          <OAuthConnectButton 
            integration={integration} 
            onSuccess={handleOAuthSuccess} 
          />
          
          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-dark-500"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">or connect manually</span>
            <div className="flex-grow border-t border-dark-500"></div>
          </div>
          
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="w-full flex justify-center items-center px-4 py-2 border border-dark-500 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-dark-600 hover:bg-dark-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors"
          >
            {showManualForm ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Hide manual form
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Enter credentials manually
              </>
            )}
          </button>
        </div>
        
        {/* Manual Form */}
        {showManualForm && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-dark-500">
            {fields.map((field) => (
              <div key={field.key}>
                <label htmlFor={field.key} className="block text-sm font-medium text-gray-300">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type={field.type}
                  id={field.key}
                  className="mt-1 block w-full border border-dark-500 rounded-md shadow-sm py-2 px-3 bg-dark-600 text-white focus:outline-none focus:ring-glow-purple focus:border-glow-purple sm:text-sm"
                  placeholder={field.placeholder || `Enter your ${field.label}`}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  required={field.required}
                />
              </div>
            ))}
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-dark-500 shadow-sm text-sm font-medium rounded-md text-gray-300 bg-dark-600 hover:bg-dark-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple transition-colors"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-glow-purple hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple disabled:opacity-50 shadow-glow-sm hover:shadow-glow-md transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Credential'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CredentialForm;