import React from 'react';
import { Folder, Zap, MessageSquare, Code, CreditCard, Share2, Instagram, Facebook, Linkedin, Twitter } from 'lucide-react';

interface CategoryBadgeProps {
  categoryName: string;
  size?: 'sm' | 'md' | 'lg';
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ categoryName, size = 'md' }) => {
  // Get icon based on category name
  const getIcon = () => {
    const lowerName = categoryName.toLowerCase();
    
    if (lowerName.includes('google')) {
      return <Zap className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />;
    } else if (lowerName.includes('social')) {
      return <Share2 className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />;
    } else if (lowerName.includes('communication')) {
      return <MessageSquare className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />;
    } else if (lowerName.includes('developer')) {
      return <Code className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />;
    } else if (lowerName.includes('payment')) {
      return <CreditCard className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />;
    } else {
      return <Folder className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />;
    }
  };
  
  // Get color based on category name
  const getColor = () => {
    const lowerName = categoryName.toLowerCase();
    
    if (lowerName.includes('google')) {
      return 'bg-glow-purple/20 text-glow-purple border-glow-purple/30';
    } else if (lowerName.includes('social')) {
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    } else if (lowerName.includes('communication')) {
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    } else if (lowerName.includes('developer')) {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    } else if (lowerName.includes('payment')) {
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    } else {
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };
  
  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5';
      case 'lg':
        return 'text-sm px-3 py-1.5';
      default:
        return 'text-xs px-2.5 py-1';
    }
  };
  
  return (
    <span className={`inline-flex items-center rounded-full border ${getColor()} ${getSizeClasses()}`}>
      {getIcon()}
      <span className="ml-1.5 font-medium">{categoryName}</span>
    </span>
  );
};

export default CategoryBadge;