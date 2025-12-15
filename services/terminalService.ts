// Terminal Service - Handles cross-platform terminal commands
export class TerminalService {
  private static currentWorkingDirectory: string = '.';

  /**
   * Execute a command with proper cross-platform handling
   */
  static async executeCommand(command: string, workingDir?: string): Promise<{
    success: boolean;
    output: string;
    error?: string;
    cwd: string;
  }> {
    const electronAPI = (window as any).electronAPI;
    
    if (!electronAPI?.shellExec) {
      return {
        success: false,
        output: '',
        error: 'Terminal not available in web mode',
        cwd: this.currentWorkingDirectory
      };
    }

    // Update working directory if provided
    if (workingDir) {
      this.currentWorkingDirectory = workingDir;
    }

    try {
      // Map common commands to platform-specific equivalents
      const mappedCommand = this.mapCommand(command);
      
      console.log(`🖥️ Executing: ${mappedCommand} in ${this.currentWorkingDirectory}`);
      
      const result = await electronAPI.shellExec(mappedCommand, this.currentWorkingDirectory);
      
      if (result.success) {
        // Update working directory if command was cd
        if (command.startsWith('cd ')) {
          const newDir = command.substring(3).trim();
          if (newDir && newDir !== '.') {
            // Handle relative and absolute paths
            if (newDir.startsWith('/') || newDir.match(/^[A-Za-z]:/)) {
              this.currentWorkingDirectory = newDir;
            } else {
              // Relative path - let the system handle it
              if (result.cwd) {
                this.currentWorkingDirectory = result.cwd;
              }
            }
          }
        }
        
        return {
          success: true,
          output: result.stdout || '',
          cwd: this.currentWorkingDirectory
        };
      } else {
        return {
          success: false,
          output: result.stderr || '',
          error: result.error || 'Command failed',
          cwd: this.currentWorkingDirectory
        };
      }
    } catch (error) {
      console.error('Terminal command error:', error);
      return {
        success: false,
        output: '',
        error: `Terminal error: ${error}`,
        cwd: this.currentWorkingDirectory
      };
    }
  }

  /**
   * Map Unix-style commands to Windows equivalents
   */
  private static mapCommand(command: string): string {
    // Don't map if not on Windows
    const isWindows = navigator.userAgent.includes('Windows');
    if (!isWindows) {
      return command;
    }

    const cmd = command.trim().toLowerCase();
    
    // Direct command mappings
    const mappings: Record<string, string> = {
      'ls': 'dir',
      'ls -l': 'dir',
      'ls -la': 'dir',
      'ls -al': 'dir',
      'pwd': 'cd',
      'clear': 'cls',
      'cat': 'type',
      'rm': 'del',
      'cp': 'copy',
      'mv': 'move',
      'which': 'where',
      'grep': 'findstr',
      'head': 'more',
      'tail': 'more',
      'touch': 'echo. >'
    };

    // Check for exact matches first
    if (mappings[cmd]) {
      return mappings[cmd];
    }

    // Handle commands with arguments
    for (const [unixCmd, winCmd] of Object.entries(mappings)) {
      if (cmd.startsWith(unixCmd + ' ')) {
        const args = command.substring(unixCmd.length).trim();
        return `${winCmd} ${args}`;
      }
    }

    // Special cases
    if (cmd.startsWith('mkdir -p ')) {
      const path = command.substring(9).trim();
      return `mkdir "${path}"`;
    }

    if (cmd.startsWith('rm -rf ')) {
      const path = command.substring(7).trim();
      return `rmdir /s /q "${path}"`;
    }

    if (cmd.startsWith('find ')) {
      // Basic find to dir mapping
      return command.replace('find', 'dir /s');
    }

    // Return original command if no mapping found
    return command;
  }

  /**
   * Get current working directory
   */
  static getCurrentDirectory(): string {
    return this.currentWorkingDirectory;
  }

  /**
   * Set working directory
   */
  static setCurrentDirectory(dir: string): void {
    this.currentWorkingDirectory = dir;
  }

  /**
   * Get common commands help
   */
  static getCommandHelp(): string[] {
    const isWindows = navigator.userAgent.includes('Windows');
    
    if (isWindows) {
      return [
        'Common Windows Commands:',
        '  dir          - List files and directories',
        '  cd <path>    - Change directory',
        '  type <file>  - Display file contents',
        '  mkdir <dir>  - Create directory',
        '  del <file>   - Delete file',
        '  copy <src> <dest> - Copy file',
        '  cls          - Clear screen',
        '',
        'Unix-style commands are automatically mapped:',
        '  ls → dir',
        '  pwd → cd',
        '  cat → type',
        '  clear → cls'
      ];
    } else {
      return [
        'Common Unix Commands:',
        '  ls           - List files and directories',
        '  pwd          - Show current directory',
        '  cd <path>    - Change directory',
        '  cat <file>   - Display file contents',
        '  mkdir <dir>  - Create directory',
        '  rm <file>    - Delete file',
        '  cp <src> <dest> - Copy file',
        '  clear        - Clear screen'
      ];
    }
  }

  /**
   * Initialize terminal with workspace directory
   */
  static initializeWithWorkspace(workspacePath: string): void {
    this.currentWorkingDirectory = workspacePath;
    console.log(`🖥️ Terminal initialized in workspace: ${workspacePath}`);
  }
}

// Export singleton
export const terminalService = new TerminalService();