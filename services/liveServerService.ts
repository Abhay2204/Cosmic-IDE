// Live Server Service for Cosmic IDE
export interface LiveServerConfig {
  port: number;
  host: string;
  root: string;
  open: boolean;
  cors: boolean;
}

export class LiveServerService {
  private isRunning = false;
  private currentPort = 3001;
  private serverProcess: any = null;

  constructor() {
    // Default configuration
  }

  async startServer(config: Partial<LiveServerConfig> = {}): Promise<{ success: boolean; url?: string; error?: string }> {
    const electronAPI = (window as any).electronAPI;
    
    if (!electronAPI?.shellExec) {
      return {
        success: false,
        error: 'Live Server requires Electron mode for file system access'
      };
    }

    if (this.isRunning) {
      return {
        success: false,
        error: 'Server is already running'
      };
    }

    const port = config.port || this.currentPort;
    const host = config.host || 'localhost';
    const root = config.root || '.';

    try {
      // Try to start a simple HTTP server using Python (most systems have it)
      const command = `python -m http.server ${port}`;
      
      console.log(`🌐 Starting Live Server on port ${port}...`);
      
      // Execute the command
      const result = await electronAPI.shellExec(command, root);
      
      if (result.success) {
        this.isRunning = true;
        this.currentPort = port;
        const url = `http://${host}:${port}`;
        
        console.log(`✅ Live Server running at ${url}`);
        
        return {
          success: true,
          url: url
        };
      } else {
        // Fallback: try Node.js http-server if available
        try {
          const nodeCommand = `npx http-server -p ${port} -c-1 --cors`;
          const nodeResult = await electronAPI.shellExec(nodeCommand, root);
          
          if (nodeResult.success) {
            this.isRunning = true;
            this.currentPort = port;
            const url = `http://${host}:${port}`;
            
            console.log(`✅ Live Server (Node) running at ${url}`);
            
            return {
              success: true,
              url: url
            };
          }
        } catch (nodeError) {
          console.error('Node.js fallback failed:', nodeError);
        }
        
        return {
          success: false,
          error: `Failed to start server: ${result.error || 'Unknown error'}`
        };
      }
    } catch (error) {
      console.error('Live Server error:', error);
      return {
        success: false,
        error: `Server startup failed: ${error}`
      };
    }
  }

  async stopServer(): Promise<{ success: boolean; error?: string }> {
    if (!this.isRunning) {
      return {
        success: false,
        error: 'No server is currently running'
      };
    }

    try {
      // Kill the server process (platform-specific)
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.shellExec) {
        const isWindows = navigator.userAgent.includes('Windows');
        const killCommand = isWindows 
          ? `taskkill /F /IM python.exe` 
          : `pkill -f "python -m http.server ${this.currentPort}"`;
        
        await electronAPI.shellExec(killCommand);
      }

      this.isRunning = false;
      this.serverProcess = null;
      
      console.log('🛑 Live Server stopped');
      
      return { success: true };
    } catch (error) {
      console.error('Error stopping server:', error);
      return {
        success: false,
        error: `Failed to stop server: ${error}`
      };
    }
  }

  getStatus(): { isRunning: boolean; port?: number; url?: string } {
    return {
      isRunning: this.isRunning,
      port: this.isRunning ? this.currentPort : undefined,
      url: this.isRunning ? `http://localhost:${this.currentPort}` : undefined
    };
  }

  async openInBrowser(filePath?: string): Promise<void> {
    const electronAPI = (window as any).electronAPI;
    
    if (!this.isRunning) {
      console.warn('Server is not running');
      return;
    }

    const baseUrl = `http://localhost:${this.currentPort}`;
    const url = filePath ? `${baseUrl}/${filePath}` : baseUrl;

    if (electronAPI?.shellOpenExternal) {
      try {
        await electronAPI.shellOpenExternal(url);
        console.log(`🌐 Opened ${url} in browser`);
      } catch (error) {
        console.error('Failed to open browser:', error);
      }
    } else {
      // Fallback: copy URL to clipboard or show it
      console.log(`🌐 Open this URL in your browser: ${url}`);
    }
  }

  // Auto-detect the best file to serve (index.html, main.html, etc.)
  detectMainFile(files: Array<{ name: string; type: string }>): string | null {
    const htmlFiles = files.filter(f => f.type === 'html' || f.name.endsWith('.html'));
    
    // Priority order for main files
    const priorities = ['index.html', 'main.html', 'home.html', 'app.html'];
    
    for (const priority of priorities) {
      const found = htmlFiles.find(f => f.name.toLowerCase() === priority);
      if (found) return found.name;
    }
    
    // Return first HTML file if no priority match
    return htmlFiles.length > 0 ? htmlFiles[0].name : null;
  }
}

// Singleton instance
export const liveServerService = new LiveServerService();