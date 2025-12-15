import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { ChatPane } from './components/ChatPane';
import { TerminalPanel } from './components/TerminalPanel';
import { Composer } from './components/Composer';
import { SettingsPanel } from './components/SettingsPanel';
import { TitleBar } from './components/TitleBar';
import { SearchPanel, BugBotPanel } from './components/SidePanels';
import { ExtensionsPanel } from './components/ExtensionsPanel';
import { GitPanel as EnhancedGitPanel } from './components/SidePanels';
import { DebugPanel } from './components/DebugPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { INITIAL_FILES, INITIAL_WELCOME_MSG, DEFAULT_SETTINGS } from './constants';
import { WorkspaceService } from './services/workspaceService';
import { TerminalService } from './services/terminalService';
import { FileNode, Message, TerminalLine, PanelView, Settings, BottomTab, Diagnostic } from './types';
import { generateChatResponse, generateCommitMessage } from './services/aiService';
import { AIAgentExecutor, AgentExecutorCallbacks } from './services/aiAgentExecutor';
// Removed VS Code extension imports for stability
import { 
  Files, Search, GitGraph, Settings as SettingsIcon, 
  Play, Bug, Command, Monitor, Blocks, XCircle, AlertTriangle, Eye
} from 'lucide-react';

// Use fallback editor for stability
import { FallbackEditor } from './components/FallbackEditor';
import { SplashScreen } from './components/SplashScreen';
import { WorkspaceInitializer } from './components/WorkspaceInitializer';

export default function App() {
  // Splash screen state
  const [showSplash, setShowSplash] = useState(true);
  
  // Unique ID generator to avoid duplicate keys
  let idCounter = 0;
  const generateUniqueId = () => `${Date.now()}-${++idCounter}`;
  const generateTerminalId = () => `terminal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // State
  const [files, setFiles] = useState<FileNode[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [workspaceFolder, setWorkspaceFolder] = useState<string | null>(null);
  const [isWorkspaceInitialized, setIsWorkspaceInitialized] = useState(false);
  
  // Initialize workspace on startup
  useEffect(() => {
    const initializeWorkspace = async () => {
      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Workspace initialization timeout')), 5000);
        });
        
        const workspace = await Promise.race([
          WorkspaceService.initializeWorkspace(),
          timeoutPromise
        ]);
        
        setWorkspaceFolder(workspace.path);
        
        // Load initial workspace files
        const initialFiles = WorkspaceService.getInitialWorkspaceFiles();
        setFiles(initialFiles);
        setActiveFileId(initialFiles[0]?.id || null);
        
        setTerminalLines(prev => [...prev, {
          id: generateTerminalId(),
          content: `📁 Workspace initialized: ${workspace.name}`,
          type: 'success'
        }]);
        
        setIsWorkspaceInitialized(true);
        
      } catch (error) {
        // Fallback: Initialize with minimal setup
        setWorkspaceFolder('cosmic-workspace');
        setFiles(WorkspaceService.getInitialWorkspaceFiles());
        setActiveFileId('welcome-1');
        
        setTerminalLines(prev => [...prev, {
          id: generateTerminalId(),
          content: `⚠️ Workspace initialized with fallback mode`,
          type: 'error'
        }]);
        
        // Still mark as initialized to prevent infinite loading
        setIsWorkspaceInitialized(true);
      }
    };
    
    // Add a safety timeout to force initialization after 10 seconds
    const safetyTimeout = setTimeout(() => {
      if (!isWorkspaceInitialized) {
        setWorkspaceFolder('cosmic-workspace');
        setFiles(WorkspaceService.getInitialWorkspaceFiles());
        setActiveFileId('welcome-1');
        setIsWorkspaceInitialized(true);
      }
    }, 10000);
    
    initializeWorkspace().finally(() => {
      clearTimeout(safetyTimeout);
    });
    
    return () => {
      clearTimeout(safetyTimeout);
    };
  }, [isWorkspaceInitialized]);

  // Handle folder opening from Electron
  useEffect(() => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.onFolderOpened) {
      electronAPI.onFolderOpened((folderPath: string) => {
        console.log('📂 User opened folder:', folderPath);
        
        // Update workspace
        const workspace = WorkspaceService.setWorkspace(folderPath);
        setWorkspaceFolder(workspace.path);
        
        // Initialize terminal with new workspace
        TerminalService.initializeWithWorkspace(workspace.path);
        
        // Load files from the folder
        if (electronAPI.readDirRecursive) {
          electronAPI.readDirRecursive(folderPath, 3).then((result: any) => {
            if (result.success && result.files) {
              const loadedFiles: FileNode[] = [];
              
              const processFiles = (items: any[], parentPath: string = '') => {
                items.forEach((item: any) => {
                  if (!item.isDirectory) {
                    loadedFiles.push({
                      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                      name: item.name,
                      type: getFileTypeFromExtension(item.name.split('.').pop() || 'txt'),
                      content: '', // Will be loaded on demand
                      isOpen: false,
                      isModified: false,
                      path: item.path,
                      relativePath: parentPath ? `${parentPath}/${item.name}` : item.name
                    });
                  }
                  if (item.children) {
                    processFiles(item.children, parentPath ? `${parentPath}/${item.name}` : item.name);
                  }
                });
              };
              
              processFiles(result.files);
              setFiles(loadedFiles);
              setActiveFileId(loadedFiles[0]?.id || null);
              
              setTerminalLines(prev => [...prev, {
                id: generateTerminalId(),
                content: `📂 Opened workspace: ${folderPath} (${loadedFiles.length} files)`,
                type: 'success'
              }]);
            }
          });
        }
      });
    }
  }, []);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'model', content: INITIAL_WELCOME_MSG, timestamp: Date.now() }
  ]);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { id: '1', content: 'Cosmic IDE v2.0 initialized...', type: 'info' },
    { id: '2', content: (window as any).electronAPI ? '🖥️ Running in Electron mode (full file system access)' : '🌐 Running in Web mode (files in memory only)', type: 'info' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelView | null>(PanelView.Explorer);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
  
  // Bottom Panel State
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>(BottomTab.Terminal);

  // Helpers
  const activeFile = files.find(f => f.id === activeFileId);
  const modifiedFiles = files.filter(f => f.isModified);

  // File type detection
  const getFileTypeFromExtension = (ext: string): any => {
    switch (ext.toLowerCase()) {
      case 'ts': case 'tsx': return 'typescript';
      case 'js': case 'jsx': return 'javascript';
      case 'py': return 'python';
      case 'rs': return 'rust';
      case 'java': return 'java';
      case 'go': return 'go';
      case 'cpp': case 'cc': case 'cxx': case 'c': return 'cpp';
      case 'cs': return 'csharp';
      case 'rb': return 'ruby';
      case 'php': return 'php';
      case 'swift': return 'swift';
      case 'kt': return 'kotlin';
      case 'html': case 'htm': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'md': case 'markdown': return 'markdown';
      case 'yaml': case 'yml': return 'yaml';
      case 'sql': return 'sql';
      case 'sh': case 'bash': return 'shell';
      case 'xml': return 'xml';
      case 'toml': return 'toml';
      default: return 'plain';
    }
  };

  // File and folder creation functions
  const createNewFile = useCallback((fileName?: string) => {
    console.log('🔥 createNewFile called with fileName:', fileName);
    
    let name = fileName;
    if (!name) {
      name = prompt('Enter file name (with extension):');
    }
    
    if (!name?.trim()) {
      console.log('❌ No file name provided, aborting');
      return;
    }
    
    name = name.trim();
    console.log('✅ Creating file with name:', name);
    
    try {
      const newId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ext = name.includes('.') ? name.split('.').pop() || 'txt' : 'txt';
      const fileType = getFileTypeFromExtension(ext);
      const template = getFileTemplate(fileType, name);
      
      // Determine file path
      const filePath = workspaceFolder ? `${workspaceFolder}/${name}` : name;

      const newFile: FileNode = {
        id: newId,
        name: name,
        type: fileType,
        content: template,
        isOpen: true,
        isModified: true, // Mark as modified since it's new
        path: filePath,
        relativePath: name
      };
      
      console.log('📄 Creating new file object:', newFile);
      
      // Update files state
      setFiles(prev => {
        const updated = [...prev, newFile];
        console.log('📁 Updated files array:', updated);
        return updated;
      });
      
      // Set as active file
      setActiveFileId(newId);
      console.log('🎯 Set active file ID:', newId);
      
      // Add terminal message
      setTerminalLines(prev => [...prev, { 
        id: generateTerminalId(), 
        content: `📄 Created: ${name}`, 
        type: 'success' 
      }]);
      
      console.log('✅ File created successfully!');
      return newFile;
    } catch (error) {
      console.error('❌ Error creating file:', error);
      setTerminalLines(prev => [...prev, { 
        id: generateTerminalId(), 
        content: `❌ Error creating file: ${error}`, 
        type: 'error' 
      }]);
      return null;
    }
  }, [workspaceFolder, setFiles, setActiveFileId, setTerminalLines]);

  const createNewFolder = useCallback((folderName: string) => {
    console.log('🔥 createNewFolder called with folderName:', folderName);
    
    if (!folderName?.trim()) {
      console.log('❌ No folder name provided');
      return;
    }
    
    const name = folderName.trim();
    console.log('📁 Creating folder:', name);
    
    setTerminalLines(prev => [...prev, { 
      id: generateTerminalId(), 
      content: `📁 Created folder: ${name}`, 
      type: 'success' 
    }]);
    
    console.log('✅ Folder created successfully!');
    // Note: In a real implementation, this would create actual folders
    // For now, we just show a success message
  }, [setTerminalLines]);

  // File templates
  const getFileTemplate = (fileType: string, fileName: string) => {
    const baseName = fileName.split('.')[0];
    const capitalizedName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    
    switch (fileType) {
      case 'typescript':
        return `// ${fileName}\n\nexport default function ${capitalizedName}() {\n  // TODO: Implement\n  return null;\n}\n`;
      case 'javascript':
        return `// ${fileName}\n\nfunction ${baseName}() {\n  // TODO: Implement\n}\n\nmodule.exports = ${baseName};\n`;
      case 'python':
        return `#!/usr/bin/env python3\n# ${fileName}\n\ndef main():\n    \"\"\"Main function\"\"\"\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()\n`;
      case 'rust':
        return `// ${fileName}\n\nfn main() {\n    println!("Hello, world!");\n}\n`;
      case 'html':
        return `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>${capitalizedName}</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>\n`;
      case 'css':
        return `/* ${fileName} */\n\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n    background-color: #f5f5f5;\n}\n\n.container {\n    max-width: 1200px;\n    margin: 0 auto;\n}\n`;
      case 'json':
        return `{\n  "name": "${baseName}",\n  "version": "1.0.0",\n  "description": "",\n  "main": "index.js"\n}\n`;
      case 'markdown':
        return `# ${capitalizedName}\n\n## Description\n\nTODO: Add description\n\n## Usage\n\nTODO: Add usage instructions\n`;
      default:
        return `// ${fileName}\n\n// TODO: Add content\n`;
    }
  };

  // Keyboard shortcuts and event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K - Command Palette
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setShowComposer(true);
      }
      // Ctrl+N - New File
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        console.log('🎹 Ctrl+N pressed - creating new file');
        createNewFile();
      }
      // Ctrl+B - Toggle Sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setActivePanel(activePanel ? null : PanelView.Explorer);
      }
      // Ctrl+J - Toggle Panel
      if (e.ctrlKey && e.key === 'j') {
        e.preventDefault();
        setIsBottomPanelOpen(!isBottomPanelOpen);
      }
      // Ctrl+` - Toggle Terminal
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setIsBottomPanelOpen(true);
        setActiveBottomTab(BottomTab.Terminal);
      }
      // Ctrl+Shift+P - Toggle Preview Panel
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setActivePanel(activePanel === PanelView.Preview ? null : PanelView.Preview);
      }
    };

    const handleCreateFileWithName = (event: any) => {
      console.log('🎯 Received createFileWithName event:', event.detail);
      try {
        const { name } = event.detail || {};
        if (name) {
          console.log('📄 Creating file from event with name:', name);
          createNewFile(name);
        } else {
          console.log('📄 Creating file from event without name');
          createNewFile();
        }
      } catch (error) {
        console.error('❌ Error handling createFileWithName event:', error);
      }
    };

    const handleCreateFolder = (event: any) => {
      console.log('🎯 Received createFolder event:', event.detail);
      try {
        const { name } = event.detail || {};
        if (name) {
          console.log('📁 Creating folder from event with name:', name);
          createNewFolder(name);
        }
      } catch (error) {
        console.error('❌ Error handling createFolder event:', error);
      }
    };

    console.log('🔧 Setting up event listeners...');
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('createFileWithName', handleCreateFileWithName as EventListener);
    window.addEventListener('createFolder', handleCreateFolder as EventListener);
    console.log('✅ Event listeners attached successfully');

    return () => {
      console.log('🧹 Cleaning up event listeners...');
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('createFileWithName', handleCreateFileWithName as EventListener);
      window.removeEventListener('createFolder', handleCreateFolder as EventListener);
      console.log('✅ Event listeners removed');
    };
  }, [activePanel, isBottomPanelOpen, createNewFile, createNewFolder]);

  // Extract project name from user prompt
  const extractProjectName = (prompt: string): string | null => {
    const lowerPrompt = prompt.toLowerCase();
    
    // Look for specific project names
    const projectPatterns = [
      /(?:create|build|make).*?(?:website|site|page).*?(?:for|called|named)\s+([a-zA-Z0-9\s-]+)/i,
      /([a-zA-Z0-9\s-]+)\s+(?:website|site|hotel|restaurant|portfolio|blog)/i,
      /(?:hotel|restaurant|portfolio|blog|company)\s+([a-zA-Z0-9\s-]+)/i
    ];
    
    for (const pattern of projectPatterns) {
      const match = prompt.match(pattern);
      if (match && match[1]) {
        return match[1].trim().toLowerCase().replace(/\s+/g, '-');
      }
    }
    
    // Fallback project names based on content
    if (lowerPrompt.includes('hotel')) return 'hotel-website';
    if (lowerPrompt.includes('restaurant')) return 'restaurant-website';
    if (lowerPrompt.includes('portfolio')) return 'portfolio-website';
    if (lowerPrompt.includes('blog')) return 'blog-website';
    if (lowerPrompt.includes('company')) return 'company-website';
    
    return null;
  };

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Show workspace initializer
  if (!isWorkspaceInitialized) {
    return (
      <WorkspaceInitializer 
        isInitializing={true} 
        workspaceName={workspaceFolder || 'cosmic-workspace'} 
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-cosmic-900 text-gray-300 font-sans">
      
      {/* Title Bar */}
      <TitleBar 
        onToggleSidebar={() => setActivePanel(activePanel ? null : PanelView.Explorer)}
        onTogglePanel={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
        isSidebarOpen={!!activePanel}
        isPanelOpen={isBottomPanelOpen}
        onOpenCommandPalette={() => setShowComposer(true)}
        onNewFile={() => createNewFile()}
        onSave={() => {}}
        onUndo={() => {}}
        onRedo={() => {}}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Activity Bar */}
        <div className="w-12 bg-cosmic-800 border-r border-cosmic-700 flex flex-col items-center py-4 gap-6 shrink-0 z-20">
            <div 
                className={`cursor-pointer transition p-1 rounded ${activePanel === PanelView.Explorer ? 'text-white bg-cosmic-600' : 'text-gray-500 hover:text-gray-300'}`} 
                onClick={() => setActivePanel(activePanel === PanelView.Explorer ? null : PanelView.Explorer)}
                title="Explorer"
            >
                <Files className="w-6 h-6" />
            </div>
            <div 
                className={`cursor-pointer transition p-1 rounded ${activePanel === PanelView.Search ? 'text-white bg-cosmic-600' : 'text-gray-500 hover:text-gray-300'}`}
                onClick={() => setActivePanel(activePanel === PanelView.Search ? null : PanelView.Search)} 
                title="Search"
            >
                <Search className="w-6 h-6" />
            </div>
            <div 
                className={`cursor-pointer transition p-1 rounded ${activePanel === PanelView.SourceControl ? 'text-white bg-cosmic-600' : 'text-gray-500 hover:text-gray-300'}`}
                onClick={() => setActivePanel(activePanel === PanelView.SourceControl ? null : PanelView.SourceControl)}
                title="Source Control"
            >
                <GitGraph className="w-6 h-6" />
            </div>
            <div 
                className={`cursor-pointer transition p-1 rounded ${activePanel === PanelView.Debug ? 'text-white bg-cosmic-600' : 'text-gray-500 hover:text-gray-300'}`}
                onClick={() => setActivePanel(activePanel === PanelView.Debug ? null : PanelView.Debug)} 
                title="Run and Debug" 
            >
                <Play className="w-6 h-6" />
            </div>
            <div 
                className={`cursor-pointer transition p-1 rounded ${activePanel === PanelView.BugBot ? 'text-white bg-cosmic-600' : 'text-gray-500 hover:text-gray-300'}`}
                onClick={() => setActivePanel(activePanel === PanelView.BugBot ? null : PanelView.BugBot)} 
                title="BugBot AI" 
            >
                <Bug className="w-6 h-6" />
            </div>
            <div 
                className={`cursor-pointer transition p-1 rounded ${activePanel === PanelView.Extensions ? 'text-white bg-cosmic-600' : 'text-gray-500 hover:text-gray-300'}`}
                onClick={() => setActivePanel(activePanel === PanelView.Extensions ? null : PanelView.Extensions)} 
                title="Extensions" 
            >
                <Blocks className="w-6 h-6" />
            </div>
            <div 
                className={`cursor-pointer transition p-1 rounded ${activePanel === PanelView.Preview ? 'text-white bg-cosmic-600' : 'text-gray-500 hover:text-gray-300'}`}
                onClick={() => setActivePanel(activePanel === PanelView.Preview ? null : PanelView.Preview)} 
                title="Live Preview" 
            >
                <Eye className="w-6 h-6" />
            </div>
            <div className="mt-auto flex flex-col gap-6">
                <div 
                    className={`cursor-pointer transition p-1 rounded ${activePanel === PanelView.Settings ? 'text-white bg-cosmic-600' : 'text-gray-500 hover:text-gray-300'}`}
                    onClick={() => setActivePanel(activePanel === PanelView.Settings ? null : PanelView.Settings)}
                    title="Settings"
                >
                    <SettingsIcon className="w-6 h-6" />
                </div>
            </div>
        </div>

        {/* Sidebar Container */}
        <div className="flex-shrink-0 flex flex-col border-r border-cosmic-600 bg-cosmic-800 transition-all duration-300 overflow-hidden" style={{ width: activePanel ? '20rem' : '0' }}>
            {activePanel === PanelView.Explorer && (
                <Sidebar 
                    files={files} 
                    activeFileId={activeFileId} 
                    onFileSelect={(id) => setActiveFileId(id)} 
                    onNewFile={() => createNewFile()}
                    workspaceFolder={workspaceFolder}
                    onDeleteFile={() => {}}
                    onRenameFile={() => {}}
                />
            )}
            {activePanel === PanelView.Search && (
                <SearchPanel files={files} onFileSelect={setActiveFileId} />
            )}
            {activePanel === PanelView.SourceControl && (
                <EnhancedGitPanel modifiedFiles={modifiedFiles} onCommit={() => {}} />
            )}
            {activePanel === PanelView.Debug && (
                <DebugPanel activeFile={activeFile?.name} />
            )}
            {activePanel === PanelView.Extensions && (
                <ExtensionsPanel />
            )}
            {activePanel === PanelView.BugBot && (
                <BugBotPanel activeFile={activeFile} settings={settings} />
            )}
            {activePanel === PanelView.Settings && (
                <SettingsPanel settings={settings} onUpdate={setSettings} />
            )}
            {activePanel === PanelView.Preview && (
                <PreviewPanel 
                    files={files} 
                    activeFile={activeFile} 
                    workspaceFolder={workspaceFolder}
                />
            )}
        </div>

        {/* Editor & Terminals */}
        <div className="flex-1 flex flex-col min-w-0 bg-cosmic-900">
             {/* Editor Area */}
             <div className="flex-1 flex relative overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0 border-r border-cosmic-700">
                    <FallbackEditor 
                        file={activeFile} 
                        onContentChange={(id, content) => {
                          setFiles(prev => prev.map(f => f.id === id ? { ...f, content, isModified: true } : f));
                        }}
                        fontSize={Math.round(settings.editorFontSize * (zoomLevel / 100))}
                        vimMode={settings.vimMode}
                        allFiles={files}
                    />
                </div>
                {/* Chat Panel */}
                <ChatPane 
                    messages={messages} 
                    onSendMessage={async (text, modelId) => {
                      const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
                      setMessages(prev => [...prev, newUserMsg]);
                      setIsProcessing(true);
                      
                      try {
                        // Enhanced prompt for AI agent capabilities
                        const enhancedPrompt = `You are an AI assistant in Cosmic IDE with the ability to create files automatically. When users ask you to create files, provide complete code in markdown code blocks with proper language tags. Include filename hints in comments at the top of code blocks (e.g., // filename.js). For multi-file projects, create all necessary files.

User Request: ${text}`;
                        
                        const responseText = await generateChatResponse(
                          messages.concat(newUserMsg), 
                          enhancedPrompt, 
                          files, 
                          modelId, 
                          settings.aiProviders, 
                          settings.customProviders
                        );
                        
                        const newBotMsg: Message = { 
                          id: (Date.now() + 1).toString(), 
                          role: 'model', 
                          content: responseText, 
                          timestamp: Date.now() 
                        };
                        setMessages(prev => [...prev, newBotMsg]);
                        
                        // AI Agent: Parse response and create files automatically
                        console.log('🤖 AI Agent analyzing response for file creation...');
                        
                        // Create AI Agent Executor with callbacks
                        const agentCallbacks: AgentExecutorCallbacks = {
                          onCreateFile: async (filename: string, content: string, language: string) => {
                            console.log(`🤖 AI Agent creating file: ${filename} with content length: ${content.length}`);
                            
                            // Create file with content directly
                            const newId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                            const ext = filename.includes('.') ? filename.split('.').pop() || 'txt' : 'txt';
                            const fileType = getFileTypeFromExtension(ext);
                            
                            // Use workspace service for safe file creation
                            const { WorkspaceService } = await import('./services/workspaceService');
                            
                            let filePath: string;
                            let relativePath: string;
                            
                            // Check if this is a website project (HTML + CSS + JS)
                            const isWebProject = filename.endsWith('.html') || 
                                                (filename.endsWith('.css') && text.toLowerCase().includes('website')) ||
                                                (filename.endsWith('.js') && text.toLowerCase().includes('website'));
                            
                            if (isWebProject) {
                              // Create organized project structure for websites
                              const projectName = extractProjectName(text) || 'website-project';
                              filePath = WorkspaceService.createSafeFilePath(filename, projectName);
                              relativePath = `projects/${projectName}/${filename}`;
                            } else {
                              // Regular file creation in workspace
                              filePath = WorkspaceService.createSafeFilePath(filename);
                              relativePath = filename;
                            }
                            
                            const newFile: FileNode = {
                              id: newId,
                              name: filename,
                              type: fileType,
                              content: content, // Use AI-provided content
                              isOpen: true,
                              isModified: false, // Will be saved to disk
                              path: filePath,
                              relativePath: relativePath
                            };
                            
                            // Save to disk if we have Electron API
                            const electronAPI = (window as any).electronAPI;
                            if (electronAPI?.writeFile) {
                              try {
                                // If no workspace folder, save to current working directory
                                const savePath = workspaceFolder 
                                  ? filePath 
                                  : filename; // Save to cwd if no workspace
                                
                                const result = await electronAPI.writeFile(savePath, content);
                                if (result.success) {
                                  console.log(`✅ File saved to disk: ${savePath}`);
                                  newFile.path = savePath;
                                  setTerminalLines(prev => [...prev, { 
                                    id: generateTerminalId(), 
                                    content: `💾 Saved to disk: ${savePath}`, 
                                    type: 'success' 
                                  }]);
                                } else {
                                  console.error(`❌ Failed to save file: ${result.error}`);
                                  newFile.isModified = true; // Mark as unsaved
                                  setTerminalLines(prev => [...prev, { 
                                    id: generateTerminalId(), 
                                    content: `⚠️ Could not save to disk: ${result.error}`, 
                                    type: 'error' 
                                  }]);
                                }
                              } catch (err) {
                                console.error('Error saving file:', err);
                                newFile.isModified = true;
                                setTerminalLines(prev => [...prev, { 
                                  id: generateTerminalId(), 
                                  content: `⚠️ Error saving file: ${err}`, 
                                  type: 'error' 
                                }]);
                              }
                            } else {
                              // No Electron API - file only in memory (web mode)
                              newFile.isModified = true;
                              console.log('📝 File created in memory (web mode - no file system access)');
                              setTerminalLines(prev => [...prev, { 
                                id: generateTerminalId(), 
                                content: `⚠️ Running in web mode - file not saved to disk. Use Electron mode for file system access.`, 
                                type: 'info' 
                              }]);
                            }
                            
                            setFiles(prev => [...prev, newFile]);
                            setActiveFileId(newId);
                            
                            setTerminalLines(prev => [...prev, { 
                              id: generateTerminalId(), 
                              content: `🤖 AI created: ${filename} (${content.length} chars)`, 
                              type: 'success' 
                            }]);
                            
                            // Auto-open Preview panel for HTML files
                            if (filename.endsWith('.html')) {
                              setActivePanel(PanelView.Preview);
                              setTerminalLines(prev => [...prev, { 
                                id: generateTerminalId(), 
                                content: `👁️ Opened Preview panel for ${filename}`, 
                                type: 'info' 
                              }]);
                            }
                          },
                          onCreateFolder: async (folderName: string) => {
                            console.log(`🤖 AI Agent creating folder: ${folderName}`);
                            
                            // Create folder on disk if we have Electron API and workspace
                            const electronAPI = (window as any).electronAPI;
                            if (electronAPI?.shellExec && workspaceFolder) {
                              const folderPath = `${workspaceFolder}/${folderName}`;
                              try {
                                // Use mkdir command to create folder (Windows compatible)
                                const isWindows = navigator.userAgent.includes('Windows');
                                const cmd = isWindows 
                                  ? `mkdir "${folderPath}"` 
                                  : `mkdir -p "${folderPath}"`;
                                const result = await electronAPI.shellExec(cmd);
                                if (result.success) {
                                  console.log(`✅ Folder created: ${folderPath}`);
                                  setTerminalLines(prev => [...prev, { 
                                    id: generateTerminalId(), 
                                    content: `📁 Created folder: ${folderPath}`, 
                                    type: 'success' 
                                  }]);
                                }
                              } catch (err) {
                                console.error('Error creating folder:', err);
                              }
                            }
                            
                            createNewFolder(folderName);
                          },
                          onRunCommand: async (command: string) => {
                            console.log(`🤖 AI Agent running command: ${command}`);
                            setTerminalLines(prev => [...prev, { 
                              id: generateTerminalId(), 
                              content: `$ ${command}`, 
                              type: 'command' 
                            }]);
                          },
                          onUpdateTerminal: (line: TerminalLine) => {
                            setTerminalLines(prev => [...prev, line]);
                          },
                          onUpdateFiles: (updater) => {
                            setFiles(updater);
                          }
                        };
                        
                        const aiAgent = new AIAgentExecutor(agentCallbacks);
                        const actions = aiAgent.parseAIResponse(responseText, text);
                        
                        if (actions.length > 0) {
                          console.log(`🚀 AI Agent found ${actions.length} actions to execute`);
                          await aiAgent.executeActions(actions);
                        } else {
                          console.log('🤖 AI Agent: No file creation actions detected');
                        }
                        
                      } catch (error) {
                        console.error('AI Error:', error);
                        setTerminalLines(prev => [...prev, { 
                          id: generateTerminalId(), 
                          content: `❌ AI Error: ${error}`, 
                          type: 'error' 
                        }]);
                      }
                      
                      setIsProcessing(false);
                    }}
                    isProcessing={isProcessing}
                    selectedModel={settings.defaultModel}
                    onModelChange={(id) => setSettings(s => ({...s, defaultModel: id}))}
                    customProviders={settings.customProviders}
                />
             </div>
             
             {/* Bottom Panel / Terminal */}
             {isBottomPanelOpen && (
                 <div className="h-48 flex-shrink-0 border-t border-cosmic-600">
                    <TerminalPanel 
                        lines={terminalLines} 
                        onCommand={async (cmd) => {
                          // Add command to terminal display
                          setTerminalLines(prev => [...prev, { 
                            id: generateTerminalId(), 
                            content: `$ ${cmd}`, 
                            type: 'command' 
                          }]);
                          
                          // Execute command using TerminalService
                          try {
                            const result = await TerminalService.executeCommand(cmd, workspaceFolder || undefined);
                            
                            if (result.success && result.output.trim()) {
                              setTerminalLines(prev => [...prev, { 
                                id: generateTerminalId(), 
                                content: result.output, 
                                type: 'success' 
                              }]);
                            } else if (!result.success) {
                              setTerminalLines(prev => [...prev, { 
                                id: generateTerminalId(), 
                                content: result.error || 'Command failed', 
                                type: 'error' 
                              }]);
                            }
                          } catch (error) {
                            setTerminalLines(prev => [...prev, { 
                              id: generateTerminalId(), 
                              content: `Error: ${error}`, 
                              type: 'error' 
                            }]);
                          }
                        }} 
                        activeTab={activeBottomTab}
                        onTabChange={setActiveBottomTab}
                        diagnostics={[]}
                        outputChannels={new Map()}
                    />
                 </div>
             )}
        </div>

      </div>

      {/* Footer / Status Bar */}
      <div className="h-6 bg-cosmic-800 border-t border-cosmic-700 flex items-center justify-between px-3 text-[10px] text-cosmic-accent select-none shrink-0 z-10">
         <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 bg-cosmic-700 px-2 py-0.5 rounded text-white"><Monitor className="w-3 h-3" /> Remote: Anyrun</span>
            <span className="text-gray-400">{activeFile?.name ? `${activeFile.path}` : 'No file'}</span>
         </div>
         <div className="flex items-center gap-3">
            {/* Problem Counter - Simplified */}
             <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-400" /> 0
                <AlertTriangle className="w-3 h-3 text-yellow-400 ml-1" /> 0
             </div>
             
             {files.some(f => f.isModified) && <span className="text-yellow-400">* Unsaved Changes</span>}
             <span>Ln 12, Col 42</span>
             <span>UTF-8</span>
             <span>TypeScript React</span>
             <span className="hover:text-white cursor-pointer font-bold text-indigo-400">Prettier</span>
         </div>
      </div>

      <Composer 
        isOpen={showComposer} 
        onClose={() => setShowComposer(false)}
        onNewFile={() => createNewFile()}
        onToggleTerminal={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
        onToggleSearch={() => setActivePanel(activePanel === PanelView.Search ? null : PanelView.Search)}
        onOpenSettings={() => setActivePanel(PanelView.Settings)}
        onToggleSidebar={() => setActivePanel(activePanel ? null : PanelView.Explorer)}
        onTogglePreview={() => setActivePanel(activePanel === PanelView.Preview ? null : PanelView.Preview)}
        activeFile={activeFile ? { id: activeFile.id, content: activeFile.content, type: activeFile.type } : null}
        onFormatDocument={(formattedContent) => {
          if (activeFile) {
            setFiles(prev => prev.map(f => 
              f.id === activeFile.id ? { ...f, content: formattedContent, isModified: true } : f
            ));
          }
        }}
      />
    </div>
  );
}