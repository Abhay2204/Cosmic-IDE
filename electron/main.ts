import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

let mainWindow: BrowserWindow | null = null;
// Terminal will use shell execution only - no PTY needed

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Frameless for custom title bar
    backgroundColor: '#05050A',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // Allow local file access
    },
  });

  // Load app
  const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === 'true';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load from dist folder
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading production app from:', indexPath);
    
    // Check if file exists
    const fs = require('fs');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      console.error('Index file not found at:', indexPath);
      // Fallback: try different paths
      const altPath = path.join(process.resourcesPath, 'dist/index.html');
      console.log('Trying alternative path:', altPath);
      if (fs.existsSync(altPath)) {
        mainWindow.loadFile(altPath);
      } else {
        console.error('Could not find index.html in any expected location');
        // Show error dialog
        const { dialog } = require('electron');
        dialog.showErrorBox('Startup Error', 'Could not load application files. Please reinstall Cosmic IDE.');
      }
    }
  }

  // Add error handling for web contents
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
    
    // Show error message
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript(`
      document.body.innerHTML = \`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #05050A; color: #e4e4e7; font-family: Inter, sans-serif; text-align: center; padding: 2rem;">
          <h1 style="color: #ef4444; margin-bottom: 1rem;">⚠️ Loading Error</h1>
          <p style="margin-bottom: 1rem;">Failed to load Cosmic IDE</p>
          <p style="color: #9ca3af; font-size: 0.9rem;">Error: \${errorCode} - \${errorDescription}</p>
          <p style="color: #9ca3af; font-size: 0.9rem;">URL: \${validatedURL}</p>
          <button onclick="location.reload()" style="margin-top: 2rem; padding: 0.5rem 1rem; background: #6366f1; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">Retry</button>
        </div>
      \`;
      `);
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Application loaded successfully');
    
    // Enable console logging from renderer process
    if (mainWindow) {
      mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`[RENDERER] ${message}`);
      });
    }
  });

  // Create custom menu
  createMenu();
};

const createMenu = () => {
  const template: any = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu:new-file'),
        },
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click: () => handleOpenFile(),
        },
        {
          label: 'Open Folder',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => handleOpenFolder(),
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:save'),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// IPC Handlers
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window:close', () => mainWindow?.close());

// File dialog handlers
ipcMain.handle('dialog:openFile', () => handleOpenFile());
ipcMain.handle('dialog:openFolder', () => handleOpenFolder());

ipcMain.handle('fs:readFile', async (_, filePath: string) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
  try {
    // Resolve relative paths to current working directory
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    
    // Ensure directory exists
    const dir = path.dirname(resolvedPath);
    await fs.mkdir(dir, { recursive: true }).catch(() => {});
    
    await fs.writeFile(resolvedPath, content, 'utf-8');
    console.log(`File written: ${resolvedPath}`);
    return { success: true, path: resolvedPath };
  } catch (error: any) {
    console.error(`Failed to write file: ${error.message}`);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:readDir', async (_, dirPath: string) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      path: path.join(dirPath, entry.name),
    }));
    return { success: true, files };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Recursive directory reading
ipcMain.handle('fs:readDirRecursive', async (_, dirPath: string, depth: number = 3) => {
  const readDirRecursive = async (dir: string, currentDepth: number): Promise<any[]> => {
    if (currentDepth <= 0) return [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const result = [];
      
      for (const entry of entries) {
        // Skip node_modules, .git, etc.
        if (['node_modules', '.git', 'dist', 'build', '__pycache__', '.venv'].includes(entry.name)) {
          continue;
        }
        
        const fullPath = path.join(dir, entry.name);
        const item: any = {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
        };
        
        if (entry.isDirectory()) {
          item.children = await readDirRecursive(fullPath, currentDepth - 1);
        }
        
        result.push(item);
      }
      
      return result.sort((a, b) => {
        // Directories first
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      return [];
    }
  };
  
  try {
    const files = await readDirRecursive(dirPath, depth);
    return { success: true, files };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Terminal uses shell execution only - no PTY handlers needed

// Shell command execution with enhanced support and real-time directory tracking
ipcMain.handle('shell:exec', async (_, command: string, cwd?: string) => {
  const { exec } = require('child_process');
  const path = require('path');
  
  return new Promise((resolve) => {
    const workingDir = cwd || process.cwd();
    
    console.log(`[Shell] Executing: "${command}" in "${workingDir}"`);
    
    // Map common Unix commands to Windows equivalents
    let actualCommand = command;
    if (process.platform === 'win32') {
      // Command mappings for Windows
      const commandMappings: Record<string, string> = {
        'ls': 'dir',
        'ls -la': 'dir',
        'ls -l': 'dir',
        'pwd': 'cd',
        'cat': 'type',
        'rm': 'del',
        'cp': 'copy',
        'mv': 'move',
        'mkdir -p': 'mkdir',
        'which': 'where'
      };
      
      // Replace command if mapping exists
      for (const [unixCmd, winCmd] of Object.entries(commandMappings)) {
        if (actualCommand.startsWith(unixCmd)) {
          actualCommand = actualCommand.replace(unixCmd, winCmd);
          break;
        }
      }
    }
    
    console.log(`[Shell] Mapped command: "${actualCommand}"`);
    
    // Enhanced environment with proper PATH
    const env = {
      ...process.env,
      PATH: process.env.PATH,
      PYTHONPATH: process.env.PYTHONPATH || '',
      NODE_PATH: process.env.NODE_PATH || '',
    };
    
    // For Windows, use proper shell path
    let shell: string;
    if (process.platform === 'win32') {
      // Try different Windows shell locations
      shell = process.env.COMSPEC || 'C:\\Windows\\System32\\cmd.exe';
    } else {
      shell = process.env.SHELL || '/bin/bash';
    }
    
    // Execute command with proper shell
    exec(actualCommand, { 
      cwd: workingDir,
      env: env,
      shell: shell,
      timeout: 30000, // 30 second timeout
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      encoding: 'utf8'
    }, (error: any, stdout: string, stderr: string) => {
      console.log(`[Shell] Command completed:`, {
        command,
        error: error?.message,
        exitCode: error?.code,
        stdoutLength: stdout?.length || 0,
        stderrLength: stderr?.length || 0
      });
      
      if (error) {
        // For commands like ls, dir, python scripts - be more lenient with exit codes
        if (error.code === 0 || (error.code && error.code <= 1)) {
          resolve({ 
            success: true, 
            stdout: stdout || '', 
            stderr: stderr || '',
            exitCode: error.code || 0,
            cwd: workingDir
          });
        } else {
          resolve({ 
            success: false, 
            error: error.message, 
            stderr: stderr || error.message,
            stdout: stdout || '',
            exitCode: error.code || 1,
            cwd: workingDir
          });
        }
      } else {
        resolve({ 
          success: true, 
          stdout: stdout || '', 
          stderr: stderr || '',
          exitCode: 0,
          cwd: workingDir
        });
      }
    });
  });
});

// Add a dedicated handler for getting current working directory
ipcMain.handle('shell:pwd', async (_, cwd?: string) => {
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    const workingDir = cwd || process.cwd();
    const pwdCommand = process.platform === 'win32' ? 'cd' : 'pwd';
    
    exec(pwdCommand, { 
      cwd: workingDir,
      timeout: 5000
    }, (error: any, stdout: string) => {
      if (error) {
        resolve({ success: false, error: error.message, cwd: workingDir });
      } else {
        const currentPath = stdout.trim();
        resolve({ success: true, cwd: currentPath || workingDir });
      }
    });
  });
});

// Git operations
ipcMain.handle('git:status', async (_, cwd: string) => {
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    exec('git status --porcelain', { cwd }, (error: any, stdout: string) => {
      if (error) {
        resolve({ success: false, error: error.message });
      } else {
        const files = stdout.split('\n').filter(Boolean).map(line => ({
          status: line.substring(0, 2).trim(),
          file: line.substring(3)
        }));
        resolve({ success: true, files });
      }
    });
  });
});

ipcMain.handle('git:commit', async (_, cwd: string, message: string) => {
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    exec(`git add . && git commit -m "${message}"`, { cwd }, (error: any, stdout: string) => {
      if (error) {
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true, output: stdout });
      }
    });
  });
});

// Open external links
ipcMain.handle('shell:openExternal', (_, url: string) => {
  shell.openExternal(url);
});

// Project detection
ipcMain.handle('project:detect', async (_, dirPath: string) => {
  try {
    const files = await fs.readdir(dirPath);
    
    let projectType = 'unknown';
    let packageManager = null;
    let framework = null;
    
    if (files.includes('package.json')) {
      projectType = 'node';
      packageManager = files.includes('yarn.lock') ? 'yarn' : 
                       files.includes('pnpm-lock.yaml') ? 'pnpm' : 'npm';
      
      // Read package.json to detect framework
      try {
        const pkgJson = JSON.parse(await fs.readFile(path.join(dirPath, 'package.json'), 'utf-8'));
        const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
        
        if (deps['next']) framework = 'nextjs';
        else if (deps['react']) framework = 'react';
        else if (deps['vue']) framework = 'vue';
        else if (deps['@angular/core']) framework = 'angular';
        else if (deps['express']) framework = 'express';
        else if (deps['@nestjs/core']) framework = 'nestjs';
      } catch (e) {}
    } else if (files.includes('requirements.txt') || files.includes('setup.py')) {
      projectType = 'python';
      if (files.includes('manage.py')) framework = 'django';
    } else if (files.includes('pom.xml')) {
      projectType = 'maven';
    } else if (files.includes('build.gradle') || files.includes('build.gradle.kts')) {
      projectType = 'gradle';
    } else if (files.includes('Cargo.toml')) {
      projectType = 'rust';
    } else if (files.includes('go.mod')) {
      projectType = 'go';
    }
    
    return { success: true, projectType, packageManager, framework };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

const handleOpenFile = async () => {
  console.log('handleOpenFile called');
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'TypeScript', extensions: ['ts', 'tsx'] },
        { name: 'JavaScript', extensions: ['js', 'jsx'] },
        { name: 'Rust', extensions: ['rs'] },
        { name: 'Python', extensions: ['py'] },
      ],
    });

    console.log('File dialog result:', result);

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      console.log('Reading file:', filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      console.log('Sending file:opened event');
      mainWindow?.webContents.send('file:opened', { path: filePath, content });
    }
  } catch (error) {
    console.error('Error in handleOpenFile:', error);
  }
};

const handleOpenFolder = async () => {
  console.log('handleOpenFolder called');
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
    });

    console.log('Dialog result:', result);

    if (!result.canceled && result.filePaths.length > 0) {
      const folderPath = result.filePaths[0];
      console.log('Sending folder:opened event with path:', folderPath);
      mainWindow?.webContents.send('folder:opened', folderPath);
    }
  } catch (error) {
    console.error('Error in handleOpenFolder:', error);
  }
};

// App configuration
app.commandLine.appendSwitch('--disable-web-security');
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('--no-sandbox');
app.commandLine.appendSwitch('--disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('--disable-gpu-program-cache');

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
