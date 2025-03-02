import React from 'react';
import { Tool, Integration, Credential } from '../types/index';
import { Settings } from 'lucide-react';

interface ToolDetailProps {
  tool: Tool;
  integration?: Integration;
  credential?: Credential;
}

const ToolDetail: React.FC<ToolDetailProps> = ({ 
  tool,
  integration,
  credential
}) => {
  return (
    <div className="bg-dark-800 shadow-md overflow-hidden sm:rounded-lg border border-dark-600">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Settings className="h-6 w-6 text-glow-purple" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg leading-6 font-medium text-white">
              {tool.name}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-400">
              {tool.description}
            </p>
          </div>
        </div>
      </div>
      
      <div className="border-t border-dark-600">
        <dl>
          <div className="bg-dark-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-300">Integration</dt>
            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
              {integration ? integration.name : 'Unknown Integration'}
            </dd>
          </div>
          <div className="bg-dark-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-300">Credential</dt>
            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
              {credential ? credential.name : 'Unknown Credential'}
            </dd>
          </div>
          <div className="bg-dark-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-300">Created</dt>
            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
              {new Date(tool.created_at).toLocaleString()}
            </dd>
          </div>
          <div className="bg-dark-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-300">Last Updated</dt>
            <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
              {new Date(tool.updated_at).toLocaleString()}
            </dd>
          </div>
          <div className="bg-dark-700 px-4 py-5 sm:px-6">
            <dt className="text-sm font-medium text-gray-300 mb-3">Configuration</dt>
            <dd className="mt-1 text-sm text-white">
              <pre className="bg-dark-800 p-3 rounded-md overflow-x-auto border border-dark-600">
                {JSON.stringify(tool.configuration, null, 2)}
              </pre>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default ToolDetail; 