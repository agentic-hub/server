import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Plus, Youtube, Calendar, Mail, HardDrive, Instagram, Facebook, Linkedin, Twitter, Pin } from 'lucide-react';
import { Integration } from '../types';
import CategoryBadge from './CategoryBadge';

interface IntegrationCardProps {
  integration: Integration;
  isConnected: boolean;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({ integration, isConnected }) => {
  // Render the icon based on the integration name
  const renderIcon = () => {
    const lowerName = integration.name.toLowerCase();
    
    if (integration.icon) {
      // If there's a custom icon URL in the database, use it
      return (
        <div className="flex-shrink-0 h-12 w-12 bg-dark-700 rounded-full flex items-center justify-center shadow-glow-blue-sm">
          <img 
            src={integration.icon} 
            alt={`${integration.name} icon`} 
            className="h-6 w-6"
            onError={(e) => {
              // Fallback to simple icon replacement if image fails to load
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                // Use simpler approach without ReactDOM
                if (lowerName.includes('youtube')) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-red-500"><path d="M2.5 17a24.12 24.12 0 0 1 0-10a2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>';
                } else if (lowerName.includes('calendar')) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-blue-500"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>';
                } else if (lowerName.includes('gmail') || lowerName.includes('mail')) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-red-400"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>';
                } else if (lowerName.includes('drive')) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-green-500"><path d="M22 12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-9"/><path d="M22 12H2"/><path d="M12 2v10"/><path d="m4.93 10.93 6.36 6.36"/><path d="M19.07 10.93 12.71 17.3"/><path d="M2 12v-2a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v2"/></svg>';
                } else if (lowerName.includes('instagram')) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-pink-500"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>';
                } else if (lowerName.includes('facebook')) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-blue-600"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>';
                } else if (lowerName.includes('linkedin')) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-blue-700"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>';
                } else if (lowerName.includes('twitter')) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-blue-400"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>';
                } else if (lowerName.includes('pinterest')) {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-red-600"><line x1="12" x2="12" y1="17" y2="22"/><path d="M7 8v8a5 5 0 0 0 10 0V8"/><circle cx="12" cy="8" r="5"/></svg>';
                } else {
                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-glow-purple"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>';
                }
              }
            }}
          />
        </div>
      );
    }
    
    // If no icon URL, render based on name
    return (
      <div className="flex-shrink-0 h-12 w-12 bg-dark-700 rounded-full flex items-center justify-center shadow-glow-blue-sm">
        {renderIconByName(lowerName)}
      </div>
    );
  };
  
  // Helper function to get icon based on integration name
  const renderIconByName = (name: string) => {
    if (name.includes('youtube')) {
      return <Youtube className="h-6 w-6 text-red-500" />;
    } else if (name.includes('calendar')) {
      return <Calendar className="h-6 w-6 text-blue-500" />;
    } else if (name.includes('gmail') || name.includes('mail')) {
      return <Mail className="h-6 w-6 text-red-400" />;
    } else if (name.includes('drive')) {
      return <HardDrive className="h-6 w-6 text-green-500" />;
    } else if (name.includes('instagram')) {
      return <Instagram className="h-6 w-6 text-pink-500" />;
    } else if (name.includes('facebook')) {
      return <Facebook className="h-6 w-6 text-blue-600" />;
    } else if (name.includes('linkedin')) {
      return <Linkedin className="h-6 w-6 text-blue-700" />;
    } else if (name.includes('twitter')) {
      return <Twitter className="h-6 w-6 text-blue-400" />;
    } else if (name.includes('pinterest')) {
      return <Pin className="h-6 w-6 text-red-600" />;
    } else {
      return <Zap className="h-6 w-6 text-glow-purple" />;
    }
  };

  return (
    <div className="bg-dark-700 rounded-lg shadow overflow-hidden hover:shadow-glow-sm transition-all">
      <div className="p-6">
        <div className="flex items-center">
          {renderIcon()}
          <div className="ml-4">
            <h3 className="text-lg font-medium text-white">{integration.name}</h3>
            {integration.category && (
              <div className="mt-1">
                <CategoryBadge categoryName={integration.category.name} />
              </div>
            )}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-400">{integration.description}</p>
        </div>
      </div>
      <div className="px-6 py-4 bg-dark-800 border-t border-dark-600 flex justify-end">
        <Link
          to={`/integrations/${integration.id}`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-glow-purple hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple shadow-glow-sm hover:shadow-glow-md transition-all"
        >
          {isConnected ? 'Manage' : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              Connect
            </>
          )}
        </Link>
      </div>
    </div>
  );
};

export default IntegrationCard;