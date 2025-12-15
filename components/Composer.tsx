import React, { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight, Layers, Search, FileCode, Terminal as TerminalIcon, Settings as SettingsIcon, Zap, Eye, Code, Package } from 'lucide-react';
import { formatterService } from '../services/formatterService';
import { extensionManager } from '../services/extensionSystem';

interface ComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onNewFile?: () => void;
  onToggleTerminal?: () => void;
  onToggleSearch?: () => void;
  onOpenSettings?: () => void;
  onToggleSidebar?: () => void;
  onTogglePreview?: () => void;
  activeFile?: { id: string; content: string; type: string } | null;
  onFormatDocument?: (formattedContent: string) => void;
}

interface CommandItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

export const Composer: React.FC<ComposerProps> = ({ 
  isOpen, 
  onClose, 
  onNewFile,
  onToggleTerminal,
  onToggleSearch,
  onOpenSettings,
  onToggleSidebar,
  onTogglePreview,
  activeFile,
  onFormatDocument
}) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'command' | 'composer'>('command');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    {
      id: 'new-file',
      title: 'New File',
      description: 'Create a new file (Ctrl+N)',
      icon: <FileCode className="w-4 h-4" />,
      action: () => { onNewFile?.(); onClose(); },
      category: 'File'
    },
    {
      id: 'search',
      title: 'Search Files',
      description: 'Search across all files',
      icon: <Search className="w-4 h-4" />,
      action: () => { onToggleSearch?.(); onClose(); },
      category: 'Search'
    },
    {
      id: 'terminal',
      title: 'Toggle Terminal',
      description: 'Show/hide terminal panel (Ctrl+`)',
      icon: <TerminalIcon className="w-4 h-4" />,
      action: () => { onToggleTerminal?.(); onClose(); },
      category: 'View'
    },
    {
      id: 'sidebar',
      title: 'Toggle Sidebar',
      description: 'Show/hide sidebar (Ctrl+B)',
      icon: <Layers className="w-4 h-4" />,
      action: () => { onToggleSidebar?.(); onClose(); },
      category: 'View'
    },
    {
      id: 'settings',
      title: 'Open Settings',
      description: 'Configure Cosmic IDE',
      icon: <SettingsIcon className="w-4 h-4" />,
      action: () => { onOpenSettings?.(); onClose(); },
      category: 'Settings'
    },
    {
      id: 'preview',
      title: 'Toggle Live Preview',
      description: 'Show/hide live preview panel (Ctrl+Shift+P)',
      icon: <Eye className="w-4 h-4" />,
      action: () => { onTogglePreview?.(); onClose(); },
      category: 'View'
    },
    {
      id: 'composer',
      title: 'Open Composer',
      description: 'Multi-file AI generation',
      icon: <Sparkles className="w-4 h-4" />,
      action: () => { setMode('composer'); setQuery(''); },
      category: 'AI'
    },
    // Extension commands
    {
      id: 'format-document',
      title: 'Format Document',
      description: 'Format the current file (Ctrl+Shift+F)',
      icon: <Code className="w-4 h-4" />,
      action: () => {
        if (activeFile && onFormatDocument) {
          const formatted = formatterService.formatCode(activeFile.content, activeFile.type);
          if (formatted !== activeFile.content) {
            onFormatDocument(formatted);
          }
        }
        onClose();
      },
      category: 'Editor'
    },
    {
      id: 'install-python-extension',
      title: 'Install Python Extension',
      description: 'Add Python language support and snippets',
      icon: <Package className="w-4 h-4" />,
      action: () => {
        extensionManager.install('lang-python');
        onClose();
      },
      category: 'Extensions'
    },
    {
      id: 'install-react-snippets',
      title: 'Install React Snippets',
      description: 'Add React/JSX code snippets',
      icon: <Package className="w-4 h-4" />,
      action: () => {
        extensionManager.install('snippets-react');
        onClose();
      },
      category: 'Extensions'
    },
    {
      id: 'install-prettier',
      title: 'Install Prettier',
      description: 'Add code formatting for JS/TS/CSS/HTML',
      icon: <Package className="w-4 h-4" />,
      action: () => {
        extensionManager.install('prettier');
        onClose();
      },
      category: 'Extensions'
    },
    {
      id: 'reload',
      title: 'Reload Window',
      description: 'Reload the IDE',
      icon: <Zap className="w-4 h-4" />,
      action: () => { window.location.reload(); },
      category: 'Developer'
    },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Early return after all hooks
  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-cosmic-800 w-[600px] border border-cosmic-500 rounded-xl shadow-2xl shadow-purple-900/20 overflow-hidden flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        
        {mode === 'command' ? (
          <>
            {/* Command Palette Mode */}
            <div className="p-3 border-b border-cosmic-600 bg-cosmic-900">
              <div className="flex items-center gap-2 text-cosmic-accent mb-2">
                <Search className="w-4 h-4" />
                <span className="font-semibold text-sm">Command Palette</span>
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search..."
                className="w-full bg-cosmic-900 border border-cosmic-600 rounded-lg p-2 text-sm text-white focus:border-cosmic-accent focus:outline-none"
                autoFocus
              />
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {filteredCommands.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  No commands found for "{query}"
                </div>
              ) : (
                <div className="p-2">
                  {filteredCommands.map((cmd, index) => (
                    <div
                      key={cmd.id}
                      onClick={cmd.action}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer group transition-colors ${
                        index === selectedIndex 
                          ? 'bg-cosmic-accent text-white' 
                          : 'hover:bg-cosmic-700'
                      }`}
                    >
                      <div className={`${
                        index === selectedIndex 
                          ? 'text-white' 
                          : 'text-cosmic-accent group-hover:text-white'
                      }`}>
                        {cmd.icon}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${
                          index === selectedIndex ? 'text-white' : 'text-white'
                        }`}>{cmd.title}</div>
                        <div className={`text-xs ${
                          index === selectedIndex ? 'text-gray-200' : 'text-gray-500'
                        }`}>{cmd.description}</div>
                      </div>
                      <div className="text-xs text-gray-600 bg-cosmic-900 px-2 py-0.5 rounded">
                        {cmd.category}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-cosmic-900 border-t border-cosmic-600 flex justify-between items-center text-xs text-gray-500">
              <span>Press ESC to close</span>
              <span>↑↓ to navigate, Enter to select</span>
            </div>
          </>
        ) : (
          <>
            {/* Composer Mode */}
            <div className="p-3 border-b border-cosmic-600 flex justify-between items-center bg-cosmic-900">
              <div className="flex items-center gap-2 text-cosmic-accent">
                <Layers className="w-4 h-4" />
                <span className="font-semibold text-sm">Composer (Beta)</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setMode('command')} 
                  className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-cosmic-700 rounded"
                >
                  Back
                </button>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg text-white font-medium mb-2">Multi-file Edit Generation</h3>
              <p className="text-gray-400 text-sm mb-6">Describe a feature that spans multiple files, and Composer will implement it across the codebase.</p>
              
              <textarea 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-32 bg-cosmic-900 border border-cosmic-600 rounded-lg p-3 text-sm text-white focus:border-cosmic-accent focus:outline-none resize-none"
                placeholder="Example: Create a new user profile component and add a route for it in App.tsx..."
                autoFocus
              ></textarea>
            </div>

            <div className="p-4 bg-cosmic-900 border-t border-cosmic-600 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-300 hover:text-white">Cancel</button>
              <button 
                onClick={() => {
                  // TODO: Implement composer generation
                  alert('Composer feature coming soon!');
                  onClose();
                }}
                disabled={!query.trim()}
                className="px-4 py-2 bg-cosmic-accent hover:bg-indigo-400 text-white rounded-lg text-sm flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3 h-3" />
                Generate Plan
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};