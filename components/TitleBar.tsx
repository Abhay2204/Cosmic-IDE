
import React, { useState } from 'react';
import { 
  ArrowLeft, ArrowRight, Search, Sidebar, PanelBottom, 
  LayoutTemplate, Minus, Square, X, SplitSquareHorizontal, 
  Menu
} from 'lucide-react';

interface TitleBarProps {
  onToggleSidebar: () => void;
  onTogglePanel: () => void;
  isSidebarOpen: boolean;
  isPanelOpen: boolean;
  onOpenCommandPalette: () => void;
  onNewFile?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ 
  onToggleSidebar, 
  onTogglePanel, 
  isSidebarOpen, 
  isPanelOpen,
  onOpenCommandPalette,
  onNewFile,
  onSave,
  onUndo,
  onRedo
}) => {
  const isElectron = typeof window !== 'undefined' && window.electronAPI;
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<number[]>([0]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const handleMinimize = async () => {
    try {
      if (isElectron && window.electronAPI?.minimizeWindow) {
        await window.electronAPI.minimizeWindow();
      }
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  };

  const handleMaximize = async () => {
    try {
      if (isElectron && window.electronAPI?.maximizeWindow) {
        await window.electronAPI.maximizeWindow();
      }
    } catch (error) {
      console.error('Failed to maximize window:', error);
    }
  };

  const handleClose = async () => {
    try {
      if (isElectron && window.electronAPI?.closeWindow) {
        await window.electronAPI.closeWindow();
      } else {
        // Fallback for web version
        window.close();
      }
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleForward = () => {
    if (historyIndex < navigationHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const toggleMenu = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const closeMenu = () => setActiveMenu(null);

  const handleMenuAction = (action: (() => void) | undefined) => {
    try {
      if (action && typeof action === 'function') {
        action();
      }
    } catch (error) {
      console.error('Menu action failed:', error);
    } finally {
      closeMenu();
    }
  };

  return (
    <div className="h-9 bg-cosmic-900 flex items-center justify-between px-2 select-none border-b border-black/20 text-[13px] text-gray-400" style={{ WebkitAppRegion: 'drag' } as any}>
      {/* Left Section: Menus & Navigation */}
      <div className="flex items-center gap-1 min-w-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="flex items-center mr-2">
            <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-sm flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
        </div>
        
        {/* Menus */}
        <div className="flex items-center gap-3 px-1 hidden md:flex relative">
            {/* File Menu */}
            <div className="relative">
                <span 
                    onClick={() => toggleMenu('file')}
                    className={`hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors ${activeMenu === 'file' ? 'bg-white/10' : ''}`}
                >
                    File
                </span>
                {activeMenu === 'file' && (
                    <div className="absolute top-full left-0 mt-1 bg-cosmic-800 border border-cosmic-600 rounded-lg shadow-2xl w-56 py-1 z-50">
                        <MenuItem onClick={() => handleMenuAction(onNewFile)} shortcut="Ctrl+N">New File</MenuItem>
                        <MenuItem onClick={() => handleMenuAction(async () => {
                          if (window.electronAPI?.openFileDialog) {
                            console.log('Opening file dialog...');
                            await window.electronAPI.openFileDialog();
                          }
                        })} shortcut="Ctrl+O">Open File...</MenuItem>
                        <MenuItem onClick={() => handleMenuAction(async () => {
                          if (window.electronAPI?.openFolderDialog) {
                            console.log('Opening folder dialog...');
                            await window.electronAPI.openFolderDialog();
                          }
                        })} shortcut="Ctrl+Shift+O">Open Folder...</MenuItem>
                        <MenuDivider />
                        <MenuItem onClick={() => handleMenuAction(onSave)} shortcut="Ctrl+S">Save</MenuItem>
                        <MenuItem onClick={() => handleMenuAction(() => {
                          // Trigger save as dialog
                          window.dispatchEvent(new CustomEvent('saveAs'));
                        })} shortcut="Ctrl+Shift+S">Save As...</MenuItem>
                        <MenuItem onClick={() => handleMenuAction(() => {
                          // Save all modified files
                          window.dispatchEvent(new CustomEvent('saveAll'));
                        })}>Save All</MenuItem>
                        <MenuDivider />
                        <MenuItem onClick={() => handleMenuAction(() => {
                          // Close current editor tab
                          window.dispatchEvent(new CustomEvent('closeEditor'));
                        })}>Close Editor</MenuItem>
                        <MenuItem onClick={() => handleMenuAction(() => {
                          // Close current folder/workspace
                          window.dispatchEvent(new CustomEvent('closeFolder'));
                        })}>Close Folder</MenuItem>
                        <MenuDivider />
                        <MenuItem onClick={() => handleMenuAction(handleClose)}>Exit</MenuItem>
                    </div>
                )}
            </div>

            {/* Edit Menu */}
            <div className="relative">
                <span 
                    onClick={() => toggleMenu('edit')}
                    className={`hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors ${activeMenu === 'edit' ? 'bg-white/10' : ''}`}
                >
                    Edit
                </span>
                {activeMenu === 'edit' && (
                    <div className="absolute top-full left-0 mt-1 bg-cosmic-800 border border-cosmic-600 rounded-lg shadow-2xl w-56 py-1 z-50">
                        <MenuItem onClick={() => handleMenuAction(onUndo)} shortcut="Ctrl+Z">Undo</MenuItem>
                        <MenuItem onClick={() => handleMenuAction(onRedo)} shortcut="Ctrl+Y">Redo</MenuItem>
                        <MenuDivider />
                        <MenuItem onClick={() => handleMenuAction(() => {
                          try {
                            navigator.clipboard?.writeText('');
                          } catch (e) {
                            console.log('Cut operation not available');
                          }
                        })} shortcut="Ctrl+X">Cut</MenuItem>
                        <MenuItem onClick={() => handleMenuAction(() => {
                          try {
                            navigator.clipboard?.writeText('');
                          } catch (e) {
                            console.log('Copy operation not available');
                          }
                        })} shortcut="Ctrl+C">Copy</MenuItem>
                        <MenuItem onClick={() => handleMenuAction(() => {
                          try {
                            navigator.clipboard?.readText();
                          } catch (e) {
                            console.log('Paste operation not available');
                          }
                        })} shortcut="Ctrl+V">Paste</MenuItem>
                        <MenuDivider />
                        <MenuItem onClick={() => handleMenuAction(() => {
                          // Open find dialog
                          window.dispatchEvent(new CustomEvent('openFind'));
                        })} shortcut="Ctrl+F">Find</MenuItem>
                        <MenuItem onClick={() => handleMenuAction(() => {
                          // Open find and replace dialog
                          window.dispatchEvent(new CustomEvent('openReplace'));
                        })} shortcut="Ctrl+H">Replace</MenuItem>
                    </div>
                )}
            </div>

            {/* View Menu */}
            <div className="relative">
                <span 
                    onClick={() => toggleMenu('view')}
                    className={`hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors ${activeMenu === 'view' ? 'bg-white/10' : ''}`}
                >
                    View
                </span>
                {activeMenu === 'view' && (
                    <div className="absolute top-full left-0 mt-1 bg-cosmic-800 border border-cosmic-600 rounded-lg shadow-2xl w-56 py-1 z-50">
                        <MenuItem onClick={() => handleMenuAction(onOpenCommandPalette)} shortcut="Ctrl+Shift+P">Command Palette</MenuItem>
                        <MenuDivider />
                        <MenuItem onClick={() => handleMenuAction(onToggleSidebar)} shortcut="Ctrl+B">Toggle Sidebar</MenuItem>
                        <MenuItem onClick={() => handleMenuAction(onTogglePanel)} shortcut="Ctrl+J">Toggle Panel</MenuItem>
                        <MenuDivider />
                        <MenuItem onClick={() => handleMenuAction(() => {
                          // Zoom in
                          window.dispatchEvent(new CustomEvent('zoomIn'));
                        })}>Zoom In</MenuItem>
                        <MenuItem onClick={() => handleMenuAction(() => {
                          // Zoom out
                          window.dispatchEvent(new CustomEvent('zoomOut'));
                        })}>Zoom Out</MenuItem>
                        <MenuItem onClick={() => handleMenuAction(() => {
                          // Reset zoom
                          window.dispatchEvent(new CustomEvent('resetZoom'));
                        })}>Reset Zoom</MenuItem>
                        <MenuDivider />
                        <MenuItem onClick={() => handleMenuAction(() => {
                          try {
                            if (document.fullscreenElement) {
                              document.exitFullscreen();
                            } else {
                              document.documentElement.requestFullscreen();
                            }
                          } catch (e) {
                            console.log('Fullscreen not supported');
                          }
                        })}>Toggle Fullscreen</MenuItem>
                    </div>
                )}
            </div>

            {/* Terminal Menu */}
            <div className="relative">
                <span 
                    onClick={() => toggleMenu('terminal')}
                    className={`hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors ${activeMenu === 'terminal' ? 'bg-white/10' : ''}`}
                >
                    Terminal
                </span>
                {activeMenu === 'terminal' && (
                    <div className="absolute top-full left-0 mt-1 bg-cosmic-800 border border-cosmic-600 rounded-lg shadow-2xl w-56 py-1 z-50">
                        <MenuItem onClick={() => handleMenuAction(onTogglePanel)} shortcut="Ctrl+`">New Terminal</MenuItem>
                        <MenuItem onClick={() => handleMenuAction(() => {
                          // Split terminal
                          window.dispatchEvent(new CustomEvent('splitTerminal'));
                        })}>Split Terminal</MenuItem>
                        <MenuDivider />
                        <MenuItem onClick={() => handleMenuAction(() => {
                          // Clear terminal
                          window.dispatchEvent(new CustomEvent('clearTerminal'));
                        })}>Clear Terminal</MenuItem>
                    </div>
                )}
            </div>

            {/* Help Menu */}
            <div className="relative">
                <span 
                    onClick={() => toggleMenu('help')}
                    className={`hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors ${activeMenu === 'help' ? 'bg-white/10' : ''}`}
                >
                    Help
                </span>
                {activeMenu === 'help' && (
                    <div className="absolute top-full left-0 mt-1 bg-cosmic-800 border border-cosmic-600 rounded-lg shadow-2xl w-56 py-1 z-50">
                        <MenuItem onClick={() => handleMenuAction(() => {
                          try {
                            window.open('https://github.com', '_blank');
                          } catch (e) {
                            console.log('Cannot open external link');
                          }
                        })}>Documentation</MenuItem>
                        <MenuItem onClick={() => handleMenuAction(() => console.log('Keyboard Shortcuts - Not implemented'))}>Keyboard Shortcuts</MenuItem>
                        <MenuDivider />
                        <MenuItem onClick={() => handleMenuAction(() => alert('Cosmic IDE v1.0.0\nA modern code editor built with Electron and React'))}>About Cosmic IDE</MenuItem>
                    </div>
                )}
            </div>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-1 ml-2 text-gray-500">
            <button 
                onClick={handleBack}
                disabled={historyIndex === 0}
                className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Go Back"
            >
                <ArrowLeft className="w-4 h-4" />
            </button>
            <button 
                onClick={handleForward}
                disabled={historyIndex === navigationHistory.length - 1}
                className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Go Forward"
            >
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Center Section: Command Bar */}
      <div className="flex-1 max-w-xl mx-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button 
            onClick={onOpenCommandPalette}
            className="w-full bg-white/5 border border-white/10 rounded-md flex items-center justify-center gap-2 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-gray-300 transition-colors group"
        >
            <Search className="w-3.5 h-3.5 group-hover:text-white" />
            <span>Cosmic IDE</span>
        </button>
      </div>

      {/* Right Section: Layout & Window Controls */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {/* Layout Toggles */}
        <div className="flex items-center gap-1 pr-3 border-r border-white/10">
            <button 
                onClick={onToggleSidebar}
                className={`p-1 rounded hover:bg-white/10 ${isSidebarOpen ? 'text-gray-200' : 'text-gray-600'}`}
                title="Toggle Primary Side Bar"
            >
                <Sidebar className="w-4 h-4" />
            </button>
            <button 
                onClick={onTogglePanel}
                className={`p-1 rounded hover:bg-white/10 ${isPanelOpen ? 'text-gray-200' : 'text-gray-600'}`}
                title="Toggle Panel"
            >
                <PanelBottom className="w-4 h-4" />
            </button>
             <button className="p-1 rounded hover:bg-white/10 text-gray-600">
                <LayoutTemplate className="w-4 h-4" />
            </button>
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-2 pl-1">
            <button onClick={handleMinimize} className="p-1 hover:bg-white/10 rounded"><Minus className="w-4 h-4" /></button>
            <button onClick={handleMaximize} className="p-1 hover:bg-white/10 rounded"><Square className="w-3.5 h-3.5" /></button>
            <button onClick={handleClose} className="p-1 hover:bg-red-500 hover:text-white rounded transition-colors"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Click outside to close menu */}
      {activeMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={closeMenu}
        />
      )}
    </div>
  );
};

// Helper Components
const MenuItem: React.FC<{ onClick: () => void; shortcut?: string; children: React.ReactNode }> = ({ onClick, shortcut, children }) => (
  <div 
    onClick={onClick}
    className="px-3 py-1.5 hover:bg-cosmic-700 cursor-pointer flex justify-between items-center text-sm text-gray-300 hover:text-white"
  >
    <span>{children}</span>
    {shortcut && <span className="text-xs text-gray-500 ml-4">{shortcut}</span>}
  </div>
);

const MenuDivider = () => (
  <div className="h-px bg-cosmic-600 my-1" />
);
