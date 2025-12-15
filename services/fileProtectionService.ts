// File Protection Service - Prevents AI from overwriting critical IDE files
export class FileProtectionService {
  private static readonly PROTECTED_FILES = [
    // Core IDE files
    'index.html',
    'index.tsx', 
    'App.tsx',
    'main.ts',
    
    // Configuration files
    'package.json',
    'package-lock.json',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.electron.json',
    
    // Build and deployment
    'electron/main.ts',
    'electron/preload.ts',
    
    // IDE components (prevent accidental overwrites)
    'components/App.tsx',
    'components/Editor.tsx',
    'components/ChatPane.tsx',
    'components/Sidebar.tsx',
    'components/TerminalPanel.tsx',
    
    // Services
    'services/aiService.ts',
    'services/aiAgentExecutor.ts',
    'services/extensionSystem.ts',
    
    // Critical constants and types
    'constants.ts',
    'types.ts'
  ];

  private static readonly PROTECTED_DIRECTORIES = [
    'node_modules',
    '.git',
    '.vscode',
    'dist',
    'dist-electron',
    'electron'
  ];

  /**
   * Check if a file path is protected from AI modification
   */
  static isProtectedFile(filePath: string): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
    
    // Check exact matches
    if (this.PROTECTED_FILES.some(protectedFile => 
      normalizedPath === protectedFile.toLowerCase() || 
      normalizedPath.endsWith('/' + protectedFile.toLowerCase())
    )) {
      return true;
    }
    
    // Check protected directories
    if (this.PROTECTED_DIRECTORIES.some(dir => 
      normalizedPath.startsWith(dir.toLowerCase() + '/') ||
      normalizedPath.includes('/' + dir.toLowerCase() + '/')
    )) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate a safe alternative filename for protected files
   */
  static getSafeAlternative(originalPath: string): string {
    const fileName = originalPath.split('/').pop() || originalPath;
    const directory = originalPath.substring(0, originalPath.lastIndexOf('/'));
    
    const alternatives: Record<string, string> = {
      'index.html': 'website.html',
      'index.tsx': 'Component.tsx', 
      'App.tsx': 'MyApp.tsx',
      'main.ts': 'script.ts',
      'package.json': 'project-config.json',
      'constants.ts': 'config.ts',
      'types.ts': 'interfaces.ts'
    };
    
    const safeName = alternatives[fileName] || `user-${fileName}`;
    
    // If we're in a project folder, create a safe subfolder
    if (directory && !directory.includes('user-projects')) {
      return `user-projects/${directory}/${safeName}`;
    }
    
    return directory ? `${directory}/${safeName}` : safeName;
  }

  /**
   * Create a safe project directory for AI-generated websites
   */
  static createProjectPath(projectName: string, fileName: string): string {
    // Sanitize project name
    const safeName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `projects/${safeName}/${fileName}`;
  }

  /**
   * Validate and sanitize file paths from AI
   */
  static validateFilePath(requestedPath: string, userPrompt: string): {
    isValid: boolean;
    safePath: string;
    warning?: string;
  } {
    // Check if protected
    if (this.isProtectedFile(requestedPath)) {
      const safePath = this.getSafeAlternative(requestedPath);
      return {
        isValid: false,
        safePath,
        warning: `Protected file "${requestedPath}" redirected to "${safePath}" for safety`
      };
    }
    
    // Check for website projects and organize them
    if (this.isWebsiteProject(requestedPath, userPrompt)) {
      const projectName = this.extractProjectName(userPrompt) || 'website';
      const safePath = this.createProjectPath(projectName, requestedPath);
      return {
        isValid: true,
        safePath,
        warning: `Website files organized in project folder: ${safePath}`
      };
    }
    
    return {
      isValid: true,
      safePath: requestedPath
    };
  }

  /**
   * Check if this is a website project
   */
  private static isWebsiteProject(fileName: string, userPrompt: string): boolean {
    const isWebFile = fileName.endsWith('.html') || 
                     fileName.endsWith('.css') || 
                     (fileName.endsWith('.js') && !fileName.includes('node'));
    
    const isWebPrompt = userPrompt.toLowerCase().includes('website') ||
                       userPrompt.toLowerCase().includes('web page') ||
                       userPrompt.toLowerCase().includes('html') ||
                       userPrompt.toLowerCase().includes('hotel') ||
                       userPrompt.toLowerCase().includes('restaurant');
    
    return isWebFile && isWebPrompt;
  }

  /**
   * Extract project name from user prompt
   */
  private static extractProjectName(prompt: string): string | null {
    const patterns = [
      /(?:create|build|make).*?(?:website|site).*?(?:for|called|named)\s+([a-zA-Z0-9\s-]+)/i,
      /([a-zA-Z0-9\s-]+)\s+(?:website|site|hotel|restaurant)/i,
      /(?:hotel|restaurant|portfolio|blog)\s+([a-zA-Z0-9\s-]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Fallback names
    if (prompt.toLowerCase().includes('hotel')) return 'hotel';
    if (prompt.toLowerCase().includes('restaurant')) return 'restaurant';
    if (prompt.toLowerCase().includes('portfolio')) return 'portfolio';
    
    return null;
  }

  /**
   * Log protection events for debugging
   */
  static logProtection(originalPath: string, safePath: string, reason: string): void {
    console.warn(`🛡️ File Protection: ${originalPath} → ${safePath} (${reason})`);
  }
}

// Export singleton instance
export const fileProtection = new FileProtectionService();