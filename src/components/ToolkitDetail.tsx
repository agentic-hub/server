import React from 'react';
import { Toolkit, Tool } from '../types/index';
import { Settings, Trash2 } from 'lucide-react';

interface ToolkitDetailProps {
  toolkit: Toolkit;
  onRemoveTool?: (toolId: string) => void;
  readOnly?: boolean;
}

const ToolkitDetail: React.FC<ToolkitDetailProps> = ({ 
  toolkit, 
  onRemoveTool,
  readOnly = false
}) => {
  return (
    <div className="bg-dark-800 shadow-md overflow-hidden sm:rounded-lg border border-dark-600">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-white">
          {toolkit.name}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-400">
          {toolkit.description}
        </p>
      </div>
      <div className="border-t border-dark-600">
        <div className="px-4 py-5 sm:px-6">
          <h4 className="text-md font-medium text-white mb-4">Tools</h4>
          {toolkit.tools && toolkit.tools.length > 0 ? (
            <ul className="space-y-3">
              {toolkit.tools.map((tool: Tool) => (
                <li key={tool.id} className="bg-dark-700 rounded-md p-3 border border-dark-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Settings className="h-5 w-5 text-glow-purple" />
                      </div>
                      <div className="ml-3">
                        <h5 className="text-sm font-medium text-white">{tool.name}</h5>
                        <p className="text-xs text-gray-400">{tool.description}</p>
                      </div>
                    </div>
                    {!readOnly && onRemoveTool && (
                      <button
                        onClick={() => onRemoveTool(tool.id)}
                        className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-dark-600">
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Configuration:</span>
                      <pre className="mt-1 bg-dark-800 p-2 rounded-md overflow-x-auto">
                        {JSON.stringify(tool.configuration, null, 2)}
                      </pre>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-gray-400 py-4 border border-dashed border-dark-600 rounded-md">
              <p>No tools in this toolkit.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolkitDetail; 