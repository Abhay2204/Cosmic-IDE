// AI Agent Executor - Makes Cosmic IDE work like Kiro IDE
import { FileNode, Message, TerminalLine } from '../types';
import { FileProtectionService } from './fileProtectionService';

export interface AgentAction {
  type: 'create_file' | 'create_folder' | 'modify_file' | 'delete_file' | 'run_command' | 'analyze_project';
  path?: string;
  content?: string;
  command?: string;
  description: string;
}

export interface AgentExecutorCallbacks {
  onCreateFile: (filename: string, content: string, language: string) => Promise<void>;
  onCreateFolder: (folderName: string) => Promise<void>;
  onRunCommand: (command: string) => Promise<void>;
  onUpdateTerminal: (line: TerminalLine) => void;
  onUpdateFiles: (updater: (files: FileNode[]) => FileNode[]) => void;
}

export class AIAgentExecutor {
  private callbacks: AgentExecutorCallbacks;

  constructor(callbacks: AgentExecutorCallbacks) {
    this.callbacks = callbacks;
  }

  // Parse AI response and extract actionable commands
  parseAIResponse(aiResponse: string, userPrompt: string): AgentAction[] {
    const actions: AgentAction[] = [];
    
    console.log('🤖 AI Agent parsing response...', { responseLength: aiResponse.length, userPrompt });
    
    // 1. Always check for code blocks first (most important)
    const codeBlocks = this.extractCodeBlocks(aiResponse);
    console.log(`🔍 Found ${codeBlocks.length} code blocks`);
    
    codeBlocks.forEach((block, index) => {
      let filename: string;
      
      if (block.filename) {
        // Use filename from code block hint
        filename = block.filename;
      } else {
        // Determine filename using smart detection
        filename = this.determineFilename(block.language, userPrompt, index, block.code);
      }
      
      console.log(`📄 Code block ${index + 1}: ${filename} (${block.language}, ${block.code.length} chars)`);
      
      // Validate file path for safety
      const validation = FileProtectionService.validateFilePath(filename, userPrompt);
      const safePath = validation.safePath;
      
      if (validation.warning) {
        console.warn(`⚠️ ${validation.warning}`);
      }
      
      actions.push({
        type: 'create_file',
        path: safePath,
        content: block.code,
        description: `Create ${safePath} with ${block.language} code`
      });
    });
    
    // 2. Detect explicit file creation requests with specific filenames
    const fileCreationPatterns = [
      /create\s+(?:a\s+)?(?:new\s+)?file\s+(?:called\s+|named\s+)?["`']?([a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+)["`']?/gi,
      /(?:make|generate|build)\s+(?:a\s+)?(?:new\s+)?file\s+["`']?([a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+)["`']?/gi,
      /save\s+(?:this\s+)?(?:as\s+)?["`']?([a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+)["`']?/gi,
      /write\s+(?:to\s+)?["`']?([a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+)["`']?/gi
    ];

    fileCreationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(userPrompt)) !== null) {
        // Only add if we don't already have a file with this name from code blocks
        const existingAction = actions.find(a => a.path === match[1]);
        if (!existingAction) {
          actions.push({
            type: 'create_file',
            path: match[1],
            description: `Create file: ${match[1]}`
          });
        }
      }
    });

    // 2. Detect folder creation requests
    const folderPatterns = [
      /create\s+(?:a\s+)?(?:new\s+)?(?:folder|directory)\s+(?:called\s+|named\s+)?["`']?([^"`'\s]+)["`']?/gi,
      /(?:make|generate)\s+(?:a\s+)?(?:folder|directory)\s+["`']?([^"`'\s]+)["`']?/gi,
      /mkdir\s+["`']?([^"`'\s]+)["`']?/gi
    ];

    folderPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(userPrompt)) !== null) {
        actions.push({
          type: 'create_folder',
          path: match[1],
          description: `Create folder: ${match[1]}`
        });
      }
    });

    // 3. Detect command execution requests
    const commandPatterns = [
      /run\s+["`']?([^"`'\n]+)["`']?/gi,
      /execute\s+["`']?([^"`'\n]+)["`']?/gi,
      /npm\s+([^"\n]+)/gi,
      /yarn\s+([^"\n]+)/gi,
      /git\s+([^"\n]+)/gi
    ];

    commandPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(userPrompt)) !== null) {
        const command = pattern.source.includes('npm') ? `npm ${match[1]}` :
                      pattern.source.includes('yarn') ? `yarn ${match[1]}` :
                      pattern.source.includes('git') ? `git ${match[1]}` :
                      match[1];
        
        actions.push({
          type: 'run_command',
          command: command.trim(),
          description: `Run command: ${command}`
        });
      }
    });

    // Note: Code blocks are already processed above, no need to process again

    // 5. Detect project generation requests
    if (this.isProjectGenerationRequest(userPrompt)) {
      const projectActions = this.generateProjectActions(userPrompt, aiResponse);
      actions.push(...projectActions);
    }

    console.log(`🎯 Found ${actions.length} actions to execute`);
    return actions;
  }

  // Extract code blocks from AI response
  private extractCodeBlocks(aiResponse: string): Array<{language: string, code: string, filename?: string}> {
    const blocks: Array<{language: string, code: string, filename?: string}> = [];
    
    if (!aiResponse || typeof aiResponse !== 'string') {
      console.log('⚠️ No valid AI response to parse');
      return blocks;
    }
    
    console.log('🔍 Extracting code blocks from response...', aiResponse.length, 'chars');
    
    // Simple and reliable regex for code blocks
    const codeBlockRegex = /```(\w+)?\s*\n([\s\S]*?)```/g;
    
    let match;
    while ((match = codeBlockRegex.exec(aiResponse)) !== null) {
      const language = match[1] || 'txt';
      const rawCode = match[2];
      
      // Safe trim with null check
      const code = rawCode ? rawCode.trim() : '';
      
      if (code && code.length > 5) {
        // Check for filename in first line comment
        let filename: string | undefined;
        const firstLineMatch = code.match(/^(?:\/\/|#|<!--)\s*([^\n]+\.[a-zA-Z0-9]+)/);
        if (firstLineMatch) {
          filename = firstLineMatch[1].trim();
        }
        
        // Check if we already have this code block
        const isDuplicate = blocks.some(b => b.code === code);
        if (!isDuplicate) {
          console.log(`📝 Found code block: ${language}, ${code.length} chars, filename: ${filename || 'auto'}`);
          blocks.push({ language, code, filename });
        }
      }
    }
    
    console.log(`✅ Extracted ${blocks.length} unique code blocks`);
    return blocks;
  }

  // Smart filename detection
  private determineFilename(language: string, userPrompt: string, index: number, codeContent: string): string {
    const prompt = userPrompt.toLowerCase();
    
    console.log(`🎯 Determining filename for ${language} code (index ${index})`);
    
    // CRITICAL: Prevent overwriting IDE core files
    const coreProtectedFiles = [
      'index.html',     // Main IDE HTML
      'index.tsx',      // Main IDE React entry
      'App.tsx',        // Main IDE component
      'main.ts',        // Electron main process
      'package.json',   // IDE dependencies
      'vite.config.ts', // Build configuration
      'tsconfig.json'   // TypeScript config
    ];
    
    // 1. Look for explicit filename in user prompt
    const explicitFileMatch = userPrompt.match(/(?:create|make|save|file|called|named)\s+["`']?([a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+)["`']?/i);
    if (explicitFileMatch) {
      const requestedName = explicitFileMatch[1];
      
      // Check if it's a protected file
      if (coreProtectedFiles.includes(requestedName)) {
        console.log(`⚠️ Protected file detected: ${requestedName}, using safe alternative`);
        const safeName = this.getSafeAlternativeName(requestedName, language);
        console.log(`📝 Using safe filename: ${safeName}`);
        return safeName;
      }
      
      console.log(`📝 Found explicit filename in prompt: ${requestedName}`);
      return requestedName;
    }

    // 2. Look for filename in code content comments
    const commentPatterns = [
      /^\/\/\s*([^\n]+\.(tsx?|jsx?|html|css|js|ts|py|java|rs|go|cpp|c|rb|php|swift|kt))/m,
      /^#\s*([^\n]+\.(py|rb|sh|yml|yaml))/m,
      /^<!--\s*([^\n]+\.html?)\s*-->/m,
      /^\/\*\s*([^\n]+\.(css|js|ts))\s*\*\//m
    ];

    for (const pattern of commentPatterns) {
      const match = codeContent.match(pattern);
      if (match) {
        const filename = match[1].replace(/^src\//, '').replace(/^\.\//, '');
        console.log(`📝 Found filename in code comment: ${filename}`);
        return filename;
      }
    }

    // 3. Look for meaningful names in code content (class names, function names, etc.)
    const codePatterns = [
      // Python class names
      /class\s+([A-Z][a-zA-Z0-9_]*)/,
      // JavaScript/TypeScript function/class names
      /(?:function|class|const|let|var)\s+([a-zA-Z][a-zA-Z0-9_]*)/,
      // HTML title tags
      /<title>([^<]+)<\/title>/i,
      // CSS class names (first one)
      /\.([a-zA-Z][a-zA-Z0-9_-]*)\s*\{/,
      // React component names
      /(?:export\s+default\s+function|function)\s+([A-Z][a-zA-Z0-9_]*)/,
      // Python main function
      /def\s+([a-zA-Z][a-zA-Z0-9_]*)/
    ];

    for (const pattern of codePatterns) {
      const match = codeContent.match(pattern);
      if (match) {
        const name = match[1].toLowerCase().replace(/[^a-z0-9]/g, '_');
        const ext = this.getExtensionForLanguage(language);
        const filename = `${name}.${ext}`;
        console.log(`📝 Generated filename from code pattern: ${filename}`);
        return filename;
      }
    }

    // 4. Project-specific naming based on user prompt
    if (prompt.includes('hotel') || prompt.includes('gulmohar')) {
      if (language === 'html') return 'gulmohar-hotel.html';
      if (language === 'css') return 'gulmohar-styles.css';
      if (language === 'javascript') return 'gulmohar-script.js';
      if (language === 'tsx' || language === 'jsx') return `Hotel${index > 0 ? index : ''}.tsx`;
    }

    if (prompt.includes('snake') && prompt.includes('game')) {
      if (language === 'python') return 'snake_game.py';
      if (language === 'javascript') return 'snake_game.js';
      if (language === 'html') return 'snake_game.html';
      if (language === 'css') return 'snake_game.css';
    }

    if (prompt.includes('todo') || prompt.includes('task')) {
      if (language === 'html') return 'todo.html';
      if (language === 'css') return 'todo.css';
      if (language === 'javascript') return 'todo.js';
      if (language === 'python') return 'todo.py';
      if (language === 'tsx' || language === 'jsx') return 'TodoApp.tsx';
    }

    if (prompt.includes('calculator')) {
      if (language === 'python') return 'calculator.py';
      if (language === 'javascript') return 'calculator.js';
      if (language === 'html') return 'calculator.html';
    }

    if (prompt.includes('weather')) {
      if (language === 'python') return 'weather_app.py';
      if (language === 'javascript') return 'weather.js';
      if (language === 'html') return 'weather.html';
    }

    // 5. Generic naming based on language and content type (SAFE NAMES)
    const genericNames: Record<string, string> = {
      python: 'main.py',
      javascript: 'script.js',
      typescript: 'component.ts',
      html: 'website.html',        // Changed from index.html to prevent IDE override
      css: 'styles.css',
      java: 'Main.java',
      rust: 'main.rs',
      go: 'main.go',
      cpp: 'main.cpp',
      c: 'main.c',
      ruby: 'main.rb',
      php: 'website.php',          // Changed from index.php
      swift: 'main.swift',
      kotlin: 'Main.kt',
      tsx: 'Component.tsx',        // Changed from App.tsx
      jsx: 'Component.jsx',        // Changed from App.jsx
      json: 'config.json',
      yaml: 'config.yml',
      sql: 'schema.sql',
      shell: 'script.sh'
    };

    const safeName = genericNames[language] || `file.${this.getExtensionForLanguage(language)}`;
    
    // Double-check for protected files
    const finalProtectedFiles = ['index.html', 'index.tsx', 'App.tsx', 'main.ts', 'package.json', 'vite.config.ts', 'tsconfig.json'];
    if (finalProtectedFiles.includes(safeName)) {
      return this.getSafeAlternativeName(safeName, language);
    }
    
    return safeName;
  }

  // Generate safe alternative names for protected files
  private getSafeAlternativeName(originalName: string, language: string): string {
    const alternatives: Record<string, string> = {
      'index.html': 'website.html',
      'index.tsx': 'Component.tsx',
      'App.tsx': 'MyComponent.tsx',
      'main.ts': 'script.ts',
      'package.json': 'project.json',
      'vite.config.ts': 'build.config.ts',
      'tsconfig.json': 'typescript.json'
    };
    
    return alternatives[originalName] || `user_${originalName}`;
  }

  // Helper method to get file extension for language
  private getExtensionForLanguage(language: string): string {
    const extensions: Record<string, string> = {
      typescript: 'ts', javascript: 'js', python: 'py', java: 'java',
      rust: 'rs', go: 'go', cpp: 'cpp', c: 'c', html: 'html', css: 'css',
      json: 'json', yaml: 'yml', sql: 'sql', shell: 'sh', php: 'php',
      ruby: 'rb', swift: 'swift', kotlin: 'kt', tsx: 'tsx', jsx: 'jsx',
      markdown: 'md', xml: 'xml', toml: 'toml'
    };
    return extensions[language] || language;
  }

  // Check if this is a project generation request
  private isProjectGenerationRequest(prompt: string): boolean {
    const projectKeywords = [
      'create a project', 'build a website', 'make an app', 'generate a',
      'full stack', 'frontend', 'backend', 'portfolio', 'landing page'
    ];
    
    return projectKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
  }

  // Generate actions for project creation
  private generateProjectActions(userPrompt: string, aiResponse: string): AgentAction[] {
    const actions: AgentAction[] = [];
    const prompt = userPrompt.toLowerCase();

    // Hotel/Restaurant website
    if (prompt.includes('hotel') || prompt.includes('restaurant')) {
      actions.push(
        { type: 'create_folder', path: 'assets', description: 'Create assets folder' },
        { type: 'create_folder', path: 'css', description: 'Create CSS folder' },
        { type: 'create_folder', path: 'js', description: 'Create JavaScript folder' },
        { type: 'create_folder', path: 'images', description: 'Create images folder' }
      );
    }

    // React/Node project
    if (prompt.includes('react') || prompt.includes('node')) {
      actions.push(
        { type: 'create_folder', path: 'src', description: 'Create src folder' },
        { type: 'create_folder', path: 'public', description: 'Create public folder' },
        { type: 'create_folder', path: 'components', description: 'Create components folder' },
        { type: 'run_command', command: 'npm init -y', description: 'Initialize npm project' }
      );
    }

    return actions;
  }

  // Execute all parsed actions
  async executeActions(actions: AgentAction[]): Promise<void> {
    this.callbacks.onUpdateTerminal({
      id: Date.now().toString(),
      content: `🚀 AI Agent executing ${actions.length} actions...`,
      type: 'info'
    });

    for (const action of actions) {
      try {
        await this.executeAction(action);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between actions
      } catch (error) {
        this.callbacks.onUpdateTerminal({
          id: Date.now().toString(),
          content: `❌ Error executing ${action.description}: ${error}`,
          type: 'error'
        });
      }
    }

    this.callbacks.onUpdateTerminal({
      id: Date.now().toString(),
      content: `✅ AI Agent completed all actions!`,
      type: 'success'
    });
  }

  // Execute a single action
  private async executeAction(action: AgentAction): Promise<void> {
    this.callbacks.onUpdateTerminal({
      id: Date.now().toString(),
      content: `🔧 ${action.description}`,
      type: 'info'
    });

    switch (action.type) {
      case 'create_file':
        if (action.path && action.content !== undefined) {
          const ext = action.path.split('.').pop() || 'txt';
          await this.callbacks.onCreateFile(action.path, action.content, ext);
        }
        break;

      case 'create_folder':
        if (action.path) {
          await this.callbacks.onCreateFolder(action.path);
        }
        break;

      case 'run_command':
        if (action.command) {
          await this.callbacks.onRunCommand(action.command);
        }
        break;

      case 'modify_file':
        // TODO: Implement file modification
        break;

      case 'analyze_project':
        // TODO: Implement project analysis
        break;
    }
  }

  // Enhanced prompt processing for better AI understanding
  enhancePrompt(userPrompt: string): string {
    const enhancements = [
      "You are an AI agent in Cosmic IDE with the ability to create files, folders, and execute commands.",
      "When the user asks you to create something, provide the complete code in markdown code blocks.",
      "Use proper language tags in code blocks (html, css, javascript, python, etc.).",
      "For multi-file projects, create all necessary files with clear filenames.",
      "Include comments in your code indicating the filename (e.g., // filename.js)."
    ];

    return `${enhancements.join(' ')}\n\nUser Request: ${userPrompt}`;
  }
}

// Utility functions for common operations
export const AgentUtils = {
  // Check if a prompt is asking for file creation
  isFileCreationRequest: (prompt: string): boolean => {
    const keywords = ['create', 'make', 'generate', 'build', 'write', 'save'];
    const fileKeywords = ['file', 'component', 'page', 'script', 'style'];
    
    return keywords.some(k => prompt.toLowerCase().includes(k)) &&
           fileKeywords.some(k => prompt.toLowerCase().includes(k));
  },

  // Extract project type from prompt
  getProjectType: (prompt: string): string => {
    const types = {
      'react': ['react', 'jsx', 'tsx', 'component'],
      'vue': ['vue', 'vuejs'],
      'angular': ['angular', 'ng'],
      'node': ['node', 'express', 'server', 'api'],
      'python': ['python', 'flask', 'django', 'py'],
      'html': ['html', 'website', 'webpage', 'frontend'],
      'game': ['game', 'snake', 'tetris', 'pong']
    };

    for (const [type, keywords] of Object.entries(types)) {
      if (keywords.some(keyword => prompt.toLowerCase().includes(keyword))) {
        return type;
      }
    }

    return 'general';
  },

  // Generate appropriate folder structure
  generateFolderStructure: (projectType: string): string[] => {
    const structures: Record<string, string[]> = {
      'react': ['src', 'public', 'src/components', 'src/pages', 'src/styles'],
      'vue': ['src', 'public', 'src/components', 'src/views', 'src/assets'],
      'node': ['src', 'routes', 'models', 'controllers', 'middleware'],
      'python': ['src', 'tests', 'docs', 'requirements'],
      'html': ['css', 'js', 'images', 'assets'],
      'game': ['src', 'assets', 'sounds', 'images']
    };

    return structures[projectType] || ['src', 'assets'];
  }
};