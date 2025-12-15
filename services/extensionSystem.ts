// Cosmic IDE Extension System
export interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  icon: string;
  category: ExtensionCategory;
  enabled: boolean;
  installed: boolean;
  downloads: number;
  rating: number;
  // Extension capabilities
  onActivate?: () => void;
  onDeactivate?: () => void;
  commands?: ExtensionCommand[];
  keybindings?: Keybinding[];
  themes?: Theme[];
  snippets?: Snippet[];
  formatters?: Formatter[];
  linters?: Linter[];
  languages?: LanguageSupport[];
}

export type ExtensionCategory = 
  | 'themes' 
  | 'languages' 
  | 'snippets' 
  | 'formatters' 
  | 'linters'
  | 'productivity'
  | 'ai'
  | 'git'
  | 'debugging'
  | 'other';

export interface ExtensionCommand {
  id: string;
  title: string;
  handler: () => void;
}

export interface Keybinding {
  key: string;
  command: string;
}

export interface Theme {
  id: string;
  name: string;
  type: 'dark' | 'light';
  colors: Record<string, string>;
  tokenColors?: any[];
}

export interface Snippet {
  prefix: string;
  body: string[];
  description: string;
  language: string;
}

export interface Formatter {
  language: string;
  format: (code: string) => string;
}

export interface Linter {
  language: string;
  lint: (code: string) => LintResult[];
}

export interface LintResult {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface LanguageSupport {
  id: string;
  extensions: string[];
  aliases: string[];
}

// Extension Manager
class ExtensionManager {
  private extensions: Map<string, Extension> = new Map();
  private activeExtensions: Set<string> = new Set();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadBuiltInExtensions();
    this.loadInstalledState();
  }

  private loadInstalledState() {
    try {
      const saved = localStorage.getItem('cosmic-extensions');
      if (saved) {
        const installed = JSON.parse(saved) as string[];
        installed.forEach(id => {
          const ext = this.extensions.get(id);
          if (ext) {
            ext.installed = true;
            ext.enabled = true;
            this.activeExtensions.add(id);
          }
        });
      }
    } catch (e) {
      console.error('Failed to load extension state:', e);
    }
  }

  private saveInstalledState() {
    const installed = Array.from(this.extensions.values())
      .filter(e => e.installed)
      .map(e => e.id);
    localStorage.setItem('cosmic-extensions', JSON.stringify(installed));
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  register(extension: Extension) {
    this.extensions.set(extension.id, extension);
  }

  install(id: string): boolean {
    const ext = this.extensions.get(id);
    if (ext) {
      ext.installed = true;
      ext.enabled = true;
      ext.downloads++;
      this.activeExtensions.add(id);
      ext.onActivate?.();
      this.saveInstalledState();
      this.notify();
      return true;
    }
    return false;
  }

  uninstall(id: string): boolean {
    const ext = this.extensions.get(id);
    if (ext) {
      ext.onDeactivate?.();
      ext.installed = false;
      ext.enabled = false;
      this.activeExtensions.delete(id);
      this.saveInstalledState();
      this.notify();
      return true;
    }
    return false;
  }

  toggle(id: string): boolean {
    const ext = this.extensions.get(id);
    if (ext && ext.installed) {
      ext.enabled = !ext.enabled;
      if (ext.enabled) {
        this.activeExtensions.add(id);
        ext.onActivate?.();
      } else {
        this.activeExtensions.delete(id);
        ext.onDeactivate?.();
      }
      this.notify();
      return true;
    }
    return false;
  }

  getAll(): Extension[] {
    return Array.from(this.extensions.values());
  }

  getInstalled(): Extension[] {
    return this.getAll().filter(e => e.installed);
  }

  getByCategory(category: ExtensionCategory): Extension[] {
    return this.getAll().filter(e => e.category === category);
  }

  get(id: string): Extension | undefined {
    return this.extensions.get(id);
  }

  isActive(id: string): boolean {
    return this.activeExtensions.has(id);
  }

  // Get all snippets from active extensions
  getSnippets(language: string): Snippet[] {
    const snippets: Snippet[] = [];
    this.activeExtensions.forEach(id => {
      const ext = this.extensions.get(id);
      ext?.snippets?.filter(s => s.language === language || s.language === '*')
        .forEach(s => snippets.push(s));
    });
    return snippets;
  }

  // Get formatter for language
  getFormatter(language: string): Formatter | undefined {
    for (const id of this.activeExtensions) {
      const ext = this.extensions.get(id);
      const formatter = ext?.formatters?.find(f => f.language === language);
      if (formatter) return formatter;
    }
    return undefined;
  }

  // Get active theme
  getActiveTheme(): Theme | undefined {
    for (const id of this.activeExtensions) {
      const ext = this.extensions.get(id);
      if (ext?.themes?.length) return ext.themes[0];
    }
    return undefined;
  }


  private loadBuiltInExtensions() {
    // Theme Extensions
    this.register({
      id: 'theme-dracula',
      name: 'Dracula Theme',
      description: 'A dark theme with vibrant colors inspired by Dracula',
      version: '1.0.0',
      author: 'Cosmic Team',
      icon: '🧛',
      category: 'themes',
      enabled: false,
      installed: false,
      downloads: 15420,
      rating: 4.8,
      themes: [{
        id: 'dracula',
        name: 'Dracula',
        type: 'dark',
        colors: {
          background: '#282a36',
          foreground: '#f8f8f2',
          accent: '#bd93f9',
          selection: '#44475a',
        }
      }]
    });

    this.register({
      id: 'theme-monokai',
      name: 'Monokai Pro',
      description: 'Professional Monokai color scheme',
      version: '1.2.0',
      author: 'Cosmic Team',
      icon: '🎨',
      category: 'themes',
      enabled: false,
      installed: false,
      downloads: 12300,
      rating: 4.7,
      themes: [{
        id: 'monokai',
        name: 'Monokai Pro',
        type: 'dark',
        colors: {
          background: '#2d2a2e',
          foreground: '#fcfcfa',
          accent: '#ffd866',
          selection: '#423f43',
        }
      }]
    });

    this.register({
      id: 'theme-nord',
      name: 'Nord Theme',
      description: 'Arctic, north-bluish color palette',
      version: '1.0.0',
      author: 'Cosmic Team',
      icon: '❄️',
      category: 'themes',
      enabled: false,
      installed: false,
      downloads: 9800,
      rating: 4.6,
      themes: [{
        id: 'nord',
        name: 'Nord',
        type: 'dark',
        colors: {
          background: '#2e3440',
          foreground: '#eceff4',
          accent: '#88c0d0',
          selection: '#434c5e',
        }
      }]
    });

    this.register({
      id: 'theme-github-light',
      name: 'GitHub Light',
      description: 'Clean light theme inspired by GitHub',
      version: '1.0.0',
      author: 'Cosmic Team',
      icon: '☀️',
      category: 'themes',
      enabled: false,
      installed: false,
      downloads: 7500,
      rating: 4.5,
      themes: [{
        id: 'github-light',
        name: 'GitHub Light',
        type: 'light',
        colors: {
          background: '#ffffff',
          foreground: '#24292e',
          accent: '#0366d6',
          selection: '#c8c8fa',
        }
      }]
    });

    // Language Extensions
    this.register({
      id: 'lang-python',
      name: 'Python',
      description: 'Python language support with snippets and linting',
      version: '2.0.0',
      author: 'Cosmic Team',
      icon: '🐍',
      category: 'languages',
      enabled: false,
      installed: false,
      downloads: 25000,
      rating: 4.9,
      languages: [{ id: 'python', extensions: ['.py', '.pyw'], aliases: ['Python', 'py'] }],
      snippets: [
        { prefix: 'def', body: ['def ${1:name}(${2:params}):', '\t${3:pass}'], description: 'Function definition', language: 'python' },
        { prefix: 'class', body: ['class ${1:Name}:', '\tdef __init__(self):', '\t\t${2:pass}'], description: 'Class definition', language: 'python' },
        { prefix: 'if', body: ['if ${1:condition}:', '\t${2:pass}'], description: 'If statement', language: 'python' },
        { prefix: 'for', body: ['for ${1:item} in ${2:items}:', '\t${3:pass}'], description: 'For loop', language: 'python' },
        { prefix: 'try', body: ['try:', '\t${1:pass}', 'except ${2:Exception} as e:', '\t${3:pass}'], description: 'Try/except block', language: 'python' },
        { prefix: 'main', body: ['if __name__ == "__main__":', '\t${1:main()}'], description: 'Main entry point', language: 'python' },
      ]
    });

    this.register({
      id: 'lang-rust',
      name: 'Rust',
      description: 'Rust language support with snippets',
      version: '1.5.0',
      author: 'Cosmic Team',
      icon: '🦀',
      category: 'languages',
      enabled: false,
      installed: false,
      downloads: 18000,
      rating: 4.8,
      languages: [{ id: 'rust', extensions: ['.rs'], aliases: ['Rust'] }],
      snippets: [
        { prefix: 'fn', body: ['fn ${1:name}(${2:params}) -> ${3:ReturnType} {', '\t${4:todo!()}', '}'], description: 'Function', language: 'rust' },
        { prefix: 'struct', body: ['struct ${1:Name} {', '\t${2:field}: ${3:Type},', '}'], description: 'Struct', language: 'rust' },
        { prefix: 'impl', body: ['impl ${1:Type} {', '\t${2}', '}'], description: 'Implementation', language: 'rust' },
        { prefix: 'match', body: ['match ${1:expr} {', '\t${2:pattern} => ${3:result},', '}'], description: 'Match expression', language: 'rust' },
        { prefix: 'test', body: ['#[test]', 'fn ${1:test_name}() {', '\t${2:assert!(true);}', '}'], description: 'Test function', language: 'rust' },
      ]
    });

    this.register({
      id: 'lang-go',
      name: 'Go',
      description: 'Go language support with snippets',
      version: '1.3.0',
      author: 'Cosmic Team',
      icon: '🐹',
      category: 'languages',
      enabled: false,
      installed: false,
      downloads: 14000,
      rating: 4.7,
      languages: [{ id: 'go', extensions: ['.go'], aliases: ['Go', 'golang'] }],
      snippets: [
        { prefix: 'func', body: ['func ${1:name}(${2:params}) ${3:returnType} {', '\t${4}', '}'], description: 'Function', language: 'go' },
        { prefix: 'struct', body: ['type ${1:Name} struct {', '\t${2:Field} ${3:Type}', '}'], description: 'Struct', language: 'go' },
        { prefix: 'iferr', body: ['if err != nil {', '\treturn ${1:err}', '}'], description: 'Error handling', language: 'go' },
        { prefix: 'main', body: ['func main() {', '\t${1}', '}'], description: 'Main function', language: 'go' },
      ]
    });


    // Snippet Extensions
    this.register({
      id: 'snippets-react',
      name: 'React Snippets',
      description: 'Essential React/JSX code snippets',
      version: '2.1.0',
      author: 'Cosmic Team',
      icon: '⚛️',
      category: 'snippets',
      enabled: false,
      installed: false,
      downloads: 32000,
      rating: 4.9,
      snippets: [
        { prefix: 'rfc', body: ['import React from "react";', '', 'const ${1:Component} = () => {', '\treturn (', '\t\t<div>', '\t\t\t${2}', '\t\t</div>', '\t);', '};', '', 'export default ${1:Component};'], description: 'React Functional Component', language: 'typescriptreact' },
        { prefix: 'rfc', body: ['import React from "react";', '', 'const ${1:Component} = () => {', '\treturn (', '\t\t<div>', '\t\t\t${2}', '\t\t</div>', '\t);', '};', '', 'export default ${1:Component};'], description: 'React Functional Component', language: 'javascriptreact' },
        { prefix: 'useState', body: ['const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:initialValue});'], description: 'useState Hook', language: 'typescriptreact' },
        { prefix: 'useEffect', body: ['useEffect(() => {', '\t${1}', '', '\treturn () => {', '\t\t${2}', '\t};', '}, [${3}]);'], description: 'useEffect Hook', language: 'typescriptreact' },
        { prefix: 'useMemo', body: ['const ${1:memoized} = useMemo(() => ${2:computation}, [${3:deps}]);'], description: 'useMemo Hook', language: 'typescriptreact' },
        { prefix: 'useCallback', body: ['const ${1:callback} = useCallback((${2:params}) => {', '\t${3}', '}, [${4:deps}]);'], description: 'useCallback Hook', language: 'typescriptreact' },
      ]
    });

    this.register({
      id: 'snippets-console',
      name: 'Console Log Snippets',
      description: 'Quick console.log snippets for debugging',
      version: '1.0.0',
      author: 'Cosmic Team',
      icon: '📝',
      category: 'snippets',
      enabled: false,
      installed: false,
      downloads: 28000,
      rating: 4.6,
      snippets: [
        { prefix: 'cl', body: ['console.log(${1});'], description: 'Console log', language: '*' },
        { prefix: 'clo', body: ['console.log("${1:label}:", ${1});'], description: 'Console log with label', language: '*' },
        { prefix: 'clj', body: ['console.log(JSON.stringify(${1}, null, 2));'], description: 'Console log JSON', language: '*' },
        { prefix: 'ce', body: ['console.error(${1});'], description: 'Console error', language: '*' },
        { prefix: 'cw', body: ['console.warn(${1});'], description: 'Console warn', language: '*' },
        { prefix: 'ct', body: ['console.table(${1});'], description: 'Console table', language: '*' },
        { prefix: 'ctime', body: ['console.time("${1:timer}");', '${2}', 'console.timeEnd("${1:timer}");'], description: 'Console timer', language: '*' },
      ]
    });

    // Productivity Extensions
    this.register({
      id: 'bracket-colorizer',
      name: 'Bracket Colorizer',
      description: 'Colorize matching brackets for better readability',
      version: '1.2.0',
      author: 'Cosmic Team',
      icon: '🌈',
      category: 'productivity',
      enabled: false,
      installed: false,
      downloads: 45000,
      rating: 4.8,
      onActivate: () => console.log('Bracket colorizer activated'),
    });

    this.register({
      id: 'auto-rename-tag',
      name: 'Auto Rename Tag',
      description: 'Automatically rename paired HTML/XML tags',
      version: '1.0.0',
      author: 'Cosmic Team',
      icon: '🏷️',
      category: 'productivity',
      enabled: false,
      installed: false,
      downloads: 38000,
      rating: 4.7,
    });

    this.register({
      id: 'path-intellisense',
      name: 'Path Intellisense',
      description: 'Autocomplete filenames in import statements',
      version: '1.1.0',
      author: 'Cosmic Team',
      icon: '📁',
      category: 'productivity',
      enabled: false,
      installed: false,
      downloads: 35000,
      rating: 4.6,
    });

    this.register({
      id: 'todo-highlighter',
      name: 'TODO Highlighter',
      description: 'Highlight TODO, FIXME, and other annotations',
      version: '1.0.0',
      author: 'Cosmic Team',
      icon: '✅',
      category: 'productivity',
      enabled: false,
      installed: false,
      downloads: 29000,
      rating: 4.5,
    });

    // Formatter Extensions
    this.register({
      id: 'prettier',
      name: 'Prettier',
      description: 'Code formatter for JS, TS, CSS, HTML, and more',
      version: '3.0.0',
      author: 'Cosmic Team',
      icon: '✨',
      category: 'formatters',
      enabled: false,
      installed: false,
      downloads: 52000,
      rating: 4.9,
      formatters: [
        { language: 'javascript', format: (code) => code }, // Placeholder
        { language: 'typescript', format: (code) => code },
        { language: 'css', format: (code) => code },
        { language: 'html', format: (code) => code },
      ]
    });

    // AI Extensions
    this.register({
      id: 'ai-autocomplete',
      name: 'AI Autocomplete',
      description: 'AI-powered code completion suggestions',
      version: '1.0.0',
      author: 'Cosmic Team',
      icon: '🤖',
      category: 'ai',
      enabled: false,
      installed: false,
      downloads: 22000,
      rating: 4.7,
    });

    this.register({
      id: 'ai-code-explain',
      name: 'AI Code Explainer',
      description: 'Get AI explanations for selected code',
      version: '1.0.0',
      author: 'Cosmic Team',
      icon: '💡',
      category: 'ai',
      enabled: false,
      installed: false,
      downloads: 18000,
      rating: 4.6,
    });

    // Git Extensions
    this.register({
      id: 'git-lens',
      name: 'Git Lens',
      description: 'Enhanced Git integration with blame annotations',
      version: '2.0.0',
      author: 'Cosmic Team',
      icon: '🔍',
      category: 'git',
      enabled: false,
      installed: false,
      downloads: 41000,
      rating: 4.8,
    });

    this.register({
      id: 'git-graph',
      name: 'Git Graph',
      description: 'View Git commit history as a graph',
      version: '1.5.0',
      author: 'Cosmic Team',
      icon: '📊',
      category: 'git',
      enabled: false,
      installed: false,
      downloads: 33000,
      rating: 4.7,
    });

    // Linter Extensions
    this.register({
      id: 'eslint',
      name: 'ESLint',
      description: 'JavaScript/TypeScript linting',
      version: '2.4.0',
      author: 'Cosmic Team',
      icon: '🔧',
      category: 'linters',
      enabled: false,
      installed: false,
      downloads: 48000,
      rating: 4.8,
    });

    // Other useful extensions
    this.register({
      id: 'live-server',
      name: 'Live Server',
      description: 'Launch a local development server with live reload for HTML files. Includes preview panel and auto-refresh.',
      version: '2.0.0',
      author: 'Cosmic Team',
      icon: '🌐',
      category: 'other',
      enabled: true,
      installed: true,
      downloads: 45000,
      rating: 4.8,
      features: [
        'Live reload for HTML/CSS/JS files',
        'Built-in preview panel',
        'Auto-detect main HTML files',
        'External browser support',
        'CORS enabled for API calls'
      ]
    });

    this.register({
      id: 'color-picker',
      name: 'Color Picker',
      description: 'Pick and insert colors with a visual picker',
      version: '1.0.0',
      author: 'Cosmic Team',
      icon: '🎨',
      category: 'other',
      enabled: false,
      installed: false,
      downloads: 27000,
      rating: 4.5,
    });

    this.register({
      id: 'markdown-preview',
      name: 'Markdown Preview',
      description: 'Live preview for Markdown files',
      version: '1.2.0',
      author: 'Cosmic Team',
      icon: '📄',
      category: 'other',
      enabled: false,
      installed: false,
      downloads: 31000,
      rating: 4.6,
    });
  }
}

// Singleton instance
export const extensionManager = new ExtensionManager();
