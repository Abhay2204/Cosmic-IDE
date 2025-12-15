/**
 * Language Service - Provides IntelliSense, diagnostics, and code actions
 * Simulates LSP (Language Server Protocol) functionality
 */

import { FileNode, FileType, Diagnostic } from '../types';

export interface CompletionItem {
  label: string;
  kind: 'function' | 'variable' | 'class' | 'interface' | 'keyword' | 'snippet' | 'property' | 'method';
  detail?: string;
  documentation?: string;
  insertText?: string;
}

export interface HoverInfo {
  contents: string;
  range?: { start: number; end: number };
}

export interface Definition {
  file: string;
  line: number;
  column: number;
}

export interface CodeAction {
  title: string;
  kind: 'quickfix' | 'refactor' | 'source';
  edit?: { file: string; range: any; newText: string };
}

// Language-specific keywords and built-ins
const TYPESCRIPT_KEYWORDS = [
  'const', 'let', 'var', 'function', 'class', 'interface', 'type', 'enum',
  'import', 'export', 'from', 'default', 'return', 'if', 'else', 'for',
  'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch',
  'finally', 'throw', 'async', 'await', 'new', 'this', 'super', 'extends',
  'implements', 'static', 'public', 'private', 'protected', 'readonly',
  'abstract', 'as', 'is', 'in', 'of', 'typeof', 'instanceof', 'keyof',
  'null', 'undefined', 'true', 'false', 'void', 'never', 'any', 'unknown'
];

const PYTHON_KEYWORDS = [
  'def', 'class', 'import', 'from', 'as', 'return', 'if', 'elif', 'else',
  'for', 'while', 'break', 'continue', 'try', 'except', 'finally', 'raise',
  'with', 'as', 'pass', 'lambda', 'yield', 'global', 'nonlocal', 'assert',
  'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'async', 'await'
];

const JAVA_KEYWORDS = [
  'public', 'private', 'protected', 'static', 'final', 'abstract', 'class',
  'interface', 'extends', 'implements', 'new', 'this', 'super', 'return',
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
  'try', 'catch', 'finally', 'throw', 'throws', 'import', 'package', 'void',
  'int', 'long', 'float', 'double', 'boolean', 'char', 'byte', 'short',
  'null', 'true', 'false', 'instanceof', 'synchronized', 'volatile'
];

const RUST_KEYWORDS = [
  'fn', 'let', 'mut', 'const', 'static', 'struct', 'enum', 'impl', 'trait',
  'pub', 'mod', 'use', 'crate', 'self', 'super', 'return', 'if', 'else',
  'match', 'for', 'while', 'loop', 'break', 'continue', 'async', 'await',
  'move', 'ref', 'where', 'type', 'unsafe', 'extern', 'dyn', 'Box', 'Vec',
  'String', 'Option', 'Result', 'Some', 'None', 'Ok', 'Err', 'true', 'false'
];

// Common React/Node snippets
const REACT_SNIPPETS: CompletionItem[] = [
  { label: 'useState', kind: 'function', detail: 'React Hook', insertText: 'const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:initialValue});' },
  { label: 'useEffect', kind: 'function', detail: 'React Hook', insertText: 'useEffect(() => {\n  ${1:// effect}\n  return () => {\n    ${2:// cleanup}\n  };\n}, [${3:deps}]);' },
  { label: 'useRef', kind: 'function', detail: 'React Hook', insertText: 'const ${1:ref} = useRef<${2:HTMLDivElement}>(null);' },
  { label: 'useCallback', kind: 'function', detail: 'React Hook', insertText: 'const ${1:callback} = useCallback(() => {\n  ${2:// callback}\n}, [${3:deps}]);' },
  { label: 'useMemo', kind: 'function', detail: 'React Hook', insertText: 'const ${1:memoized} = useMemo(() => ${2:computeValue}, [${3:deps}]);' },
  { label: 'rfc', kind: 'snippet', detail: 'React Functional Component', insertText: 'const ${1:Component}: React.FC = () => {\n  return (\n    <div>\n      ${2:content}\n    </div>\n  );\n};\n\nexport default ${1:Component};' },
];

class LanguageService {
  private files: Map<string, FileNode> = new Map();

  updateFile(file: FileNode) {
    this.files.set(file.id, file);
  }

  removeFile(fileId: string) {
    this.files.delete(fileId);
  }

  getCompletions(file: FileNode, position: number): CompletionItem[] {
    const content = file.content;
    const beforeCursor = content.slice(0, position);
    const currentWord = this.getCurrentWord(beforeCursor);
    
    let keywords: string[] = [];
    let snippets: CompletionItem[] = [];

    // Get language-specific completions
    switch (file.type) {
      case FileType.TypeScript:
        keywords = TYPESCRIPT_KEYWORDS;
        snippets = REACT_SNIPPETS;
        break;
      case FileType.Python:
        keywords = PYTHON_KEYWORDS;
        break;
      case FileType.Rust:
        keywords = RUST_KEYWORDS;
        break;
      default:
        keywords = TYPESCRIPT_KEYWORDS;
    }

    const completions: CompletionItem[] = [];

    // Add matching keywords
    keywords
      .filter(k => k.toLowerCase().startsWith(currentWord.toLowerCase()))
      .forEach(k => {
        completions.push({ label: k, kind: 'keyword', detail: 'Keyword' });
      });

    // Add snippets
    snippets
      .filter(s => s.label.toLowerCase().startsWith(currentWord.toLowerCase()))
      .forEach(s => completions.push(s));

    // Add variables from current file
    const variables = this.extractVariables(content);
    variables
      .filter(v => v.toLowerCase().startsWith(currentWord.toLowerCase()) && v !== currentWord)
      .forEach(v => {
        completions.push({ label: v, kind: 'variable', detail: 'Local variable' });
      });

    // Add functions from current file
    const functions = this.extractFunctions(content);
    functions
      .filter(f => f.toLowerCase().startsWith(currentWord.toLowerCase()))
      .forEach(f => {
        completions.push({ label: f, kind: 'function', detail: 'Function' });
      });

    return completions.slice(0, 20); // Limit results
  }

  getDiagnostics(file: FileNode): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const lines = file.content.split('\n');

    lines.forEach((line, index) => {
      // Check for common issues
      
      // console.log warnings
      if (line.includes('console.log')) {
        diagnostics.push({
          id: `${file.id}-${index}-console`,
          fileId: file.id,
          fileName: file.name,
          message: 'Unexpected console statement',
          line: index + 1,
          severity: 'warning',
          source: 'eslint'
        });
      }

      // TODO comments
      if (line.includes('TODO') || line.includes('FIXME')) {
        diagnostics.push({
          id: `${file.id}-${index}-todo`,
          fileId: file.id,
          fileName: file.name,
          message: line.includes('TODO') ? 'TODO comment found' : 'FIXME comment found',
          line: index + 1,
          severity: 'info',
          source: 'todo-highlight'
        });
      }

      // any type usage in TypeScript
      if (file.type === FileType.TypeScript && /:\s*any\b/.test(line)) {
        diagnostics.push({
          id: `${file.id}-${index}-any`,
          fileId: file.id,
          fileName: file.name,
          message: 'Unexpected any. Specify a different type',
          line: index + 1,
          severity: 'warning',
          source: 'typescript'
        });
      }

      // Empty catch blocks
      if (/catch\s*\([^)]*\)\s*{\s*}/.test(line)) {
        diagnostics.push({
          id: `${file.id}-${index}-catch`,
          fileId: file.id,
          fileName: file.name,
          message: 'Empty catch block',
          line: index + 1,
          severity: 'warning',
          source: 'eslint'
        });
      }

      // Python: missing colon
      if (file.type === FileType.Python) {
        if (/^\s*(def|class|if|elif|else|for|while|try|except|with)\s+[^:]*$/.test(line) && !line.trim().endsWith(':')) {
          diagnostics.push({
            id: `${file.id}-${index}-colon`,
            fileId: file.id,
            fileName: file.name,
            message: 'Expected ":"',
            line: index + 1,
            severity: 'error',
            source: 'python'
          });
        }
      }
    });

    return diagnostics;
  }

  getHover(file: FileNode, position: number): HoverInfo | null {
    const word = this.getWordAtPosition(file.content, position);
    if (!word) return null;

    // Check if it's a known keyword/function
    const docs: Record<string, string> = {
      'useState': '```typescript\nfunction useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>]\n```\nReturns a stateful value, and a function to update it.',
      'useEffect': '```typescript\nfunction useEffect(effect: EffectCallback, deps?: DependencyList): void\n```\nAccepts a function that contains imperative, possibly effectful code.',
      'console': 'The console object provides access to the browser\'s debugging console.',
      'async': 'The async function declaration creates a binding of a new async function to a given name.',
      'await': 'The await operator is used to wait for a Promise and get its fulfillment value.',
    };

    if (docs[word]) {
      return { contents: docs[word] };
    }

    return null;
  }

  getDefinition(file: FileNode, position: number): Definition | null {
    const word = this.getWordAtPosition(file.content, position);
    if (!word) return null;

    // Search for definition in current file
    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check for function/variable declaration
      const patterns = [
        new RegExp(`(const|let|var|function)\\s+${word}\\b`),
        new RegExp(`(class|interface|type)\\s+${word}\\b`),
        new RegExp(`def\\s+${word}\\s*\\(`), // Python
        new RegExp(`fn\\s+${word}\\s*[(<]`), // Rust
      ];

      for (const pattern of patterns) {
        if (pattern.test(line)) {
          return { file: file.name, line: i + 1, column: line.indexOf(word) + 1 };
        }
      }
    }

    return null;
  }

  getCodeActions(file: FileNode, diagnostic: Diagnostic): CodeAction[] {
    const actions: CodeAction[] = [];

    if (diagnostic.message.includes('console')) {
      actions.push({
        title: 'Remove console statement',
        kind: 'quickfix'
      });
    }

    if (diagnostic.message.includes('any')) {
      actions.push({
        title: 'Replace with unknown',
        kind: 'quickfix'
      });
    }

    return actions;
  }

  formatDocument(file: FileNode): string {
    // Basic formatting
    let content = file.content;
    
    // Normalize line endings
    content = content.replace(/\r\n/g, '\n');
    
    // Remove trailing whitespace
    content = content.split('\n').map(line => line.trimEnd()).join('\n');
    
    // Ensure single newline at end
    content = content.trimEnd() + '\n';

    return content;
  }

  private getCurrentWord(text: string): string {
    const match = text.match(/[\w$]+$/);
    return match ? match[0] : '';
  }

  private getWordAtPosition(content: string, position: number): string | null {
    const before = content.slice(0, position);
    const after = content.slice(position);
    
    const beforeMatch = before.match(/[\w$]+$/);
    const afterMatch = after.match(/^[\w$]+/);
    
    const word = (beforeMatch ? beforeMatch[0] : '') + (afterMatch ? afterMatch[0] : '');
    return word || null;
  }

  private extractVariables(content: string): string[] {
    const variables: string[] = [];
    const patterns = [
      /(?:const|let|var)\s+(\w+)/g,
      /(\w+)\s*=/g,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1]);
        }
      }
    });

    return variables;
  }

  private extractFunctions(content: string): string[] {
    const functions: string[] = [];
    const patterns = [
      /function\s+(\w+)/g,
      /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/g,
      /(\w+)\s*:\s*(?:async\s*)?\([^)]*\)\s*=>/g,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (!functions.includes(match[1])) {
          functions.push(match[1]);
        }
      }
    });

    return functions;
  }
}

export const languageService = new LanguageService();
export default languageService;
