import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),

  // Dialog controls
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),

  // File system operations
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath: string, content: string) => 
    ipcRenderer.invoke('fs:writeFile', filePath, content),
  readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),
  readDirRecursive: (dirPath: string, depth?: number) => 
    ipcRenderer.invoke('fs:readDirRecursive', dirPath, depth),

  // Terminal operations - shell execution only

  // Shell execution
  shellExec: (command: string, cwd?: string) => ipcRenderer.invoke('shell:exec', command, cwd),
  shellPwd: (cwd?: string) => ipcRenderer.invoke('shell:pwd', cwd),
  shellOpenExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),

  // Git operations
  gitStatus: (cwd: string) => ipcRenderer.invoke('git:status', cwd),
  gitCommit: (cwd: string, message: string) => ipcRenderer.invoke('git:commit', cwd, message),

  // Project detection
  projectDetect: (dirPath: string) => ipcRenderer.invoke('project:detect', dirPath),

  // Menu events
  onNewFile: (callback: () => void) => ipcRenderer.on('menu:new-file', callback),
  onSave: (callback: () => void) => ipcRenderer.on('menu:save', callback),
  onFileOpened: (callback: (data: any) => void) => 
    ipcRenderer.on('file:opened', (_, data) => callback(data)),
  onFolderOpened: (callback: (path: string) => void) => 
    ipcRenderer.on('folder:opened', (_, path) => callback(path)),
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      // Window controls
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      
      // Dialog controls
      openFileDialog: () => Promise<void>;
      openFolderDialog: () => Promise<void>;
      
      // File system
      readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
      writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
      readDir: (dirPath: string) => Promise<{ success: boolean; files?: any[]; error?: string }>;
      readDirRecursive: (dirPath: string, depth?: number) => Promise<{ success: boolean; files?: any[]; error?: string }>;
      
      // Terminal - shell execution only
      
      // Shell
      shellExec: (command: string, cwd?: string) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string; cwd?: string }>;
      shellPwd: (cwd?: string) => Promise<{ success: boolean; cwd?: string; error?: string }>;
      shellOpenExternal: (url: string) => void;
      
      // Git
      gitStatus: (cwd: string) => Promise<{ success: boolean; files?: any[]; error?: string }>;
      gitCommit: (cwd: string, message: string) => Promise<{ success: boolean; output?: string; error?: string }>;
      
      // Project
      projectDetect: (dirPath: string) => Promise<{ success: boolean; projectType?: string; packageManager?: string; framework?: string; error?: string }>;
      
      // Menu events
      onNewFile: (callback: () => void) => void;
      onSave: (callback: () => void) => void;
      onFileOpened: (callback: (data: any) => void) => void;
      onFolderOpened: (callback: (path: string) => void) => void;
    };
  }
}
