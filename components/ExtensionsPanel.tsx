/**
 * Extensions Panel - Cosmic IDE Marketplace
 */

import React, { useState, useEffect } from 'react';
import { Search, Download, Trash2, Star, Check, Package, Grid, List } from 'lucide-react';
import { extensionManager, Extension, ExtensionCategory } from '../services/extensionSystem';

interface ExtensionsPanelProps {
  onExtensionChange?: (extensions: Extension[]) => void;
}

const categories: { id: ExtensionCategory | 'all' | 'installed'; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '📦' },
  { id: 'installed', label: 'Installed', icon: '✅' },
  { id: 'themes', label: 'Themes', icon: '🎨' },
  { id: 'languages', label: 'Languages', icon: '💻' },
  { id: 'snippets', label: 'Snippets', icon: '📝' },
  { id: 'formatters', label: 'Formatters', icon: '✨' },
  { id: 'productivity', label: 'Productivity', icon: '⚡' },
  { id: 'ai', label: 'AI', icon: '🤖' },
  { id: 'git', label: 'Git', icon: '🔄' },
  { id: 'linters', label: 'Linters', icon: '🔧' },
  { id: 'other', label: 'Other', icon: '📁' },
];

export const ExtensionsPanel: React.FC<ExtensionsPanelProps> = ({ onExtensionChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    const updateExtensions = () => {
      setExtensions(extensionManager.getAll());
      onExtensionChange?.(extensionManager.getInstalled());
    };
    
    updateExtensions();
    const unsubscribe = extensionManager.subscribe(updateExtensions);
    return () => { unsubscribe(); };
  }, [onExtensionChange]);

  const filteredExtensions = extensions.filter(ext => {
    const matchesSearch = searchQuery === '' ||
      ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' ||
      (selectedCategory === 'installed' && ext.installed) ||
      ext.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleInstall = (id: string) => {
    extensionManager.install(id);
  };

  const handleUninstall = (id: string) => {
    extensionManager.uninstall(id);
  };

  const formatDownloads = (num: number): string => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <div className="h-full flex flex-col bg-cosmic-800">
      {/* Header */}
      <div className="p-4 border-b border-cosmic-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-cosmic-accent" />
            Marketplace
          </h2>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-cosmic-accent text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-cosmic-accent text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search extensions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-cosmic-900 border border-cosmic-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cosmic-accent"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="p-2 border-b border-cosmic-700 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-cosmic-accent text-white'
                  : 'bg-cosmic-700 text-gray-300 hover:bg-cosmic-600'
              }`}
            >
              {cat.icon} {cat.label}
              {cat.id === 'installed' && (
                <span className="ml-1 px-1.5 py-0.5 bg-cosmic-900 rounded-full text-xs">
                  {extensions.filter(e => e.installed).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>


      {/* Extensions List */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredExtensions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No extensions found</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            {filteredExtensions.map(ext => (
              <ExtensionCard
                key={ext.id}
                extension={ext}
                onInstall={handleInstall}
                onUninstall={handleUninstall}
                formatDownloads={formatDownloads}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredExtensions.map(ext => (
              <ExtensionGridCard
                key={ext.id}
                extension={ext}
                onInstall={handleInstall}
                onUninstall={handleUninstall}
                formatDownloads={formatDownloads}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="p-3 border-t border-cosmic-700 bg-cosmic-900">
        <div className="flex justify-between text-xs text-gray-400">
          <span>{extensions.length} extensions available</span>
          <span>{extensions.filter(e => e.installed).length} installed</span>
        </div>
      </div>
    </div>
  );
};

// List view card
const ExtensionCard: React.FC<{
  extension: Extension;
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
  formatDownloads: (n: number) => string;
}> = ({ extension, onInstall, onUninstall, formatDownloads }) => {
  return (
    <div className="bg-cosmic-900 rounded-lg p-3 border border-cosmic-600 hover:border-cosmic-500 transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{extension.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-white font-medium truncate">{extension.name}</h4>
            {extension.installed && (
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{extension.description}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400" />
              {extension.rating}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {formatDownloads(extension.downloads)}
            </span>
            <span>v{extension.version}</span>
          </div>
        </div>
        <div className="flex-shrink-0">
          {extension.installed ? (
            <button
              onClick={() => onUninstall(extension.id)}
              className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
              title="Uninstall"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onInstall(extension.id)}
              className="px-3 py-1.5 bg-cosmic-accent hover:bg-cosmic-accent/80 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Grid view card
const ExtensionGridCard: React.FC<{
  extension: Extension;
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
  formatDownloads: (n: number) => string;
}> = ({ extension, onInstall, onUninstall, formatDownloads }) => {
  return (
    <div className="bg-cosmic-900 rounded-lg p-3 border border-cosmic-600 hover:border-cosmic-500 transition-colors">
      <div className="text-center">
        <span className="text-3xl">{extension.icon}</span>
        <h4 className="text-white font-medium text-sm mt-2 truncate">{extension.name}</h4>
        <div className="flex items-center justify-center gap-2 mt-1 text-xs text-gray-500">
          <span className="flex items-center gap-0.5">
            <Star className="w-3 h-3 text-yellow-400" />
            {extension.rating}
          </span>
          <span>{formatDownloads(extension.downloads)}</span>
        </div>
        <div className="mt-3">
          {extension.installed ? (
            <button
              onClick={() => onUninstall(extension.id)}
              className="w-full py-1.5 text-red-400 border border-red-400/30 hover:bg-red-900/30 text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Remove
            </button>
          ) : (
            <button
              onClick={() => onInstall(extension.id)}
              className="w-full py-1.5 bg-cosmic-accent hover:bg-cosmic-accent/80 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtensionsPanel;
