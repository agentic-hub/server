import React from 'react';
import { Trash2, Key, ExternalLink, Youtube, Calendar, Mail, HardDrive, Instagram, Facebook, Linkedin, Twitter, Pin } from 'lucide-react';
import { Credential, Integration } from '../types';

interface CredentialItemProps {
  credential: Credential;
  integration: Integration;
  onRemove: (id: string) => Promise<void>;
}

const CredentialItem: React.FC<CredentialItemProps> = ({ credential, integration, onRemove }) => {
  const handleRemove = async () => {
    if (confirm('Are you sure you want to remove this credential? This action cannot be undone.')) {
      await onRemove(credential.id);
    }
  };

  // Render the icon based on the integration name
  const renderIcon = () => {
    const lowerName = integration.name.toLowerCase();
    
    if (integration.icon) {
      // If there's a custom icon URL in the database, use it
      return (
        <div className="flex-shrink-0 h-10 w-10 bg-dark-700 rounded-full flex items-center justify-center shadow-glow-blue-sm">
          <img 
            src={integration.icon} 
            alt={`${integration.name} icon`} 
            className="h-5 w-5"
            onError={(e) => {
              // Fallback to simple icon replacement if image fails to load
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                // Use simpler approach without ReactDOM
                if (lowerName.includes('youtube')) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-red-500"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>';
                } else if (lowerName.includes('calendar')) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-blue-500"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>';
                } else if (lowerName.includes('gmail') || lowerName.includes('mail')) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-red-400"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>';
                } else if (lowerName.includes('drive')) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-green-500"><path d="M22 12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-9"/><path d="M22 12H2"/><path d="M12 2v10"/><path d="m4.93 10.93 6.36 6.36"/><path d="M19.07 10.93 12.71 17.3"/><path d="M2 12v-2a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v2"/></svg>';
                } else if (lowerName.includes('instagram')) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-pink-500"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>';
                } else if (lowerName.includes('facebook')) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-blue-600"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>';
                } else if (lowerName.includes('linkedin')) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-blue-700"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>';
                } else if (lowerName.includes('twitter')) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-blue-400"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>';
                } else if (lowerName.includes('pinterest')) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-red-600"><line x1="12" x2="12" y1="17" y2="22"/><path d="M7 8v8a5 5 0 0 0 10 0V8"/><circle cx="12" cy="8" r="5"/></svg>';
                } else {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-glow-purple"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>';
                }
              }
            }}
          />
        </div>
      );
    }
    
    // If no icon URL, render based on name
    return (
      <div className="flex-shrink-0 h-10 w-10 bg-dark-700 rounded-full flex items-center justify-center shadow-glow-blue-sm">
        {getIconByName(lowerName)}
      </div>
    );
  };
  
  // Helper function to get icon based on integration name
  const getIconByName = (name: string) => {
    if (name.includes('youtube')) {
      return <Youtube className="h-5 w-5 text-red-500" />;
    } else if (name.includes('calendar')) {
      return <Calendar className="h-5 w-5 text-blue-500" />;
    } else if (name.includes('gmail') || name.includes('mail')) {
      return <Mail className="h-5 w-5 text-red-400" />;
    } else if (name.includes('drive')) {
      return <HardDrive className="h-5 w-5 text-green-500" />;
    } else if (name.includes('instagram')) {
      return <Instagram className="h-5 w-5 text-pink-500" />;
    } else if (name.includes('facebook')) {
      return <Facebook className="h-5 w-5 text-blue-600" />;
    } else if (name.includes('linkedin')) {
      return <Linkedin className="h-5 w-5 text-blue-700" />;
    } else if (name.includes('twitter')) {
      return <Twitter className="h-5 w-5 text-blue-400" />;
    } else if (name.includes('pinterest')) {
      return <Pin className="h-5 w-5 text-red-600" />;
    } else {
      return <Key className="h-5 w-5 text-glow-purple" />;
    }
  };

  return (
    <div className="px-4 py-4 sm:px-6 flex items-center justify-between border-b border-dark-600 last:border-b-0">
      <div className="flex items-center">
        {renderIcon()}
        <div className="ml-4">
          <div className="text-sm font-medium text-glow-purple">
            {credential.name}
          </div>
          <div className="text-xs text-gray-400 flex items-center">
            Added on {new Date(credential.created_at).toLocaleDateString()}
            {credential.data.redirect_uri && (
              <span className="ml-2 flex items-center text-glow-blue hover:text-blue-400 transition-colors">
                <ExternalLink className="h-3 w-3 mr-1" />
                Callback URL
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="ml-2 flex-shrink-0 flex">
        <button
          onClick={handleRemove}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-red-300 bg-red-900/30 hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4 mr-1" />
           <Trash2 className="h-4 w-4 mr-1" />
          Remove
        </button>
      </div>
    </div>
  );
};

export default CredentialItem;