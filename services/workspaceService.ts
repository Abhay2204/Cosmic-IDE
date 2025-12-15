// Workspace Service - Manages default workspace and prevents IDE file conflicts
import { FileNode } from '../types';

export interface WorkspaceInfo {
  name: string;
  path: string;
  isDefault: boolean;
  created: number;
}

export class WorkspaceService {
  private static readonly DEFAULT_WORKSPACE = 'cosmic-workspace';
  private static readonly WORKSPACE_KEY = 'cosmic-current-workspace';
  
  /**
   * Initialize default workspace on IDE startup
   */
  static async initializeWorkspace(): Promise<WorkspaceInfo> {
    // Check if we have a current workspace
    const savedWorkspace = localStorage.getItem(this.WORKSPACE_KEY);
    if (savedWorkspace) {
      try {
        const workspace = JSON.parse(savedWorkspace) as WorkspaceInfo;
        return workspace;
      } catch (error) {
        // Continue to create default workspace
      }
    }
    
    // Create default workspace
    const defaultWorkspace: WorkspaceInfo = {
      name: this.DEFAULT_WORKSPACE,
      path: this.DEFAULT_WORKSPACE,
      isDefault: true,
      created: Date.now()
    };
    
    // Try to create the workspace folder if in Electron mode (non-blocking)
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.shellExec) {
      // Don't await this - let it run in background
      this.createWorkspaceFolderAsync(electronAPI);
    }
    
    // Save workspace info immediately
    localStorage.setItem(this.WORKSPACE_KEY, JSON.stringify(defaultWorkspace));
    
    return defaultWorkspace;
  }
  
  /**
   * Create workspace folder asynchronously (non-blocking)
   */
  private static async createWorkspaceFolderAsync(electronAPI: any): Promise<void> {
    try {
      const isWindows = navigator.userAgent.includes('Windows');
      const createCmd = isWindows 
        ? `mkdir "${this.DEFAULT_WORKSPACE}" 2>nul || echo Directory exists`
        : `mkdir -p "${this.DEFAULT_WORKSPACE}"`;
      
      await electronAPI.shellExec(createCmd);
    } catch (error) {
      // Silently fail - workspace will work without the folder
    }
  }
  
  /**
   * Set a new workspace folder
   */
  static setWorkspace(folderPath: string): WorkspaceInfo {
    // Normalize path for cross-platform compatibility
    const normalizedPath = folderPath.replace(/\\/g, '/');
    const pathParts = normalizedPath.split('/');
    const folderName = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2] || 'workspace';
    
    const workspace: WorkspaceInfo = {
      name: folderName,
      path: folderPath, // Keep original path for file operations
      isDefault: false,
      created: Date.now()
    };
    
    localStorage.setItem(this.WORKSPACE_KEY, JSON.stringify(workspace));
    console.log('📁 Switched to workspace:', workspace.name, 'at', folderPath);
    
    return workspace;
  }
  
  /**
   * Get current workspace
   */
  static getCurrentWorkspace(): WorkspaceInfo | null {
    const saved = localStorage.getItem(this.WORKSPACE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as WorkspaceInfo;
      } catch (error) {
        console.warn('⚠️ Failed to parse workspace info');
      }
    }
    return null;
  }
  
  /**
   * Create a safe file path within the current workspace
   */
  static createSafeFilePath(fileName: string, projectName?: string): string {
    const workspace = this.getCurrentWorkspace();
    const basePath = workspace?.path || this.DEFAULT_WORKSPACE;
    
    // Normalize path separators for the current platform
    // In browser/Electron, always use forward slashes for consistency
    const separator = '/';
    const normalizedBasePath = basePath.replace(/[/\\]/g, separator);
    
    // If it's a project file, organize it properly
    if (projectName) {
      return `${normalizedBasePath}${separator}projects${separator}${projectName}${separator}${fileName}`;
    }
    
    // Regular file in workspace
    return `${normalizedBasePath}${separator}${fileName}`;
  }
  
  /**
   * Check if a file path is within the current workspace
   */
  static isInWorkspace(filePath: string): boolean {
    const workspace = this.getCurrentWorkspace();
    if (!workspace) return false;
    
    const normalizedPath = filePath.replace(/\\/g, '/');
    const workspacePath = workspace.path.replace(/\\/g, '/');
    
    return normalizedPath.startsWith(workspacePath + '/') || 
           normalizedPath.startsWith('./' + workspacePath + '/');
  }
  
  /**
   * Create initial workspace files
   */
  static getInitialWorkspaceFiles(): FileNode[] {
    return [
      {
        id: 'welcome-1',
        name: 'README.md',
        type: 'markdown',
        content: `# Welcome to Cosmic IDE! 🚀

## Your Workspace

This is your default workspace folder where all your projects will be created.

### Getting Started

1. **Ask the AI** to create files or projects
2. **Use the Explorer** to navigate your files  
3. **Preview websites** with the Live Preview panel
4. **Organize projects** in the \`projects/\` folder

### Safe Development

- Your IDE files are protected from accidental overwrites
- AI-generated websites are organized in project folders
- All your work stays in this workspace

### Need Help?

- Press \`Ctrl+K\` for the Command Palette
- Check the documentation files
- Ask the AI for assistance

Happy coding! ✨
`,
        isOpen: true,
        isModified: false,
        path: this.createSafeFilePath('README.md'),
        relativePath: 'README.md'
      }
    ];
  }
  
  /**
   * Reset to default workspace
   */
  static resetToDefault(): WorkspaceInfo {
    const defaultWorkspace: WorkspaceInfo = {
      name: this.DEFAULT_WORKSPACE,
      path: this.DEFAULT_WORKSPACE,
      isDefault: true,
      created: Date.now()
    };
    
    localStorage.setItem(this.WORKSPACE_KEY, JSON.stringify(defaultWorkspace));
    console.log('🔄 Reset to default workspace');
    
    return defaultWorkspace;
  }
  
  /**
   * Get workspace statistics
   */
  static getWorkspaceStats(): {
    name: string;
    isDefault: boolean;
    fileCount: number;
    projectCount: number;
  } {
    const workspace = this.getCurrentWorkspace();
    
    return {
      name: workspace?.name || 'Unknown',
      isDefault: workspace?.isDefault || false,
      fileCount: 0, // Would be calculated from actual files
      projectCount: 0 // Would be calculated from projects folder
    };
  }
}

// Export singleton instance
export const workspaceService = new WorkspaceService();