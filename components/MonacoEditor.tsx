import React, { useRef, useState } from 'react';
import { FileNode, FileType } from '../types';
import { FallbackEditor } from './FallbackEditor';

// Try to import Monaco Editor, fallback if not available
let Editor: any = null;
let lspClient: any = null;
let extensionManager: any = null;

try {
  const MonacoModule = require('@monaco-editor/react');
  Editor = MonacoModule.default;
  
  lspClient = require('../services/lspClient').lspClient;
  extensionManager = require('../services/extensionManager').extensionManager;
} catch (error) {
  console.log('Monaco Editor not available, using fallback editor');
}

interface MonacoEditorProps {
  file: FileNode | undefined;
  onContentChange: (id: string, content: string) => void;
  fontSize: number;
  vimMode?: boolean;
}

const getLanguage = (type: FileType, fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  const langMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'py': 'python',
    'rs': 'rust',
    'java': 'java',
    'json': 'json',
    'md': 'markdown',
    'css': 'css',
    'scss': 'scss',
    'html': 'html',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'sql': 'sql',
    'sh': 'shell',
    'bash': 'shell',
    'go': 'go',
    'rb': 'ruby',
    'php': 'php',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    'swift': 'swift',
    'kt': 'kotlin',
    'toml': 'toml',
    'dockerfile': 'dockerfile',
  };

  return langMap[ext] || 'plaintext';
};

export const MonacoEditorComponent: React.FC<MonacoEditorProps> = ({
  file,
  onContentChange,
  fontSize,
  vimMode
}) => {
  const editorRef = useRef<any>(null);
  const [monacoAvailable, setMonacoAvailable] = useState(!!Editor);

  // If Monaco is not available, use fallback editor
  if (!monacoAvailable || !Editor) {
    return (
      <FallbackEditor
        file={file}
        onContentChange={onContentChange}
        fontSize={fontSize}
        vimMode={vimMode}
      />
    );
  }

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Define cosmic theme
    monaco.editor.defineTheme('cosmic', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'FF79C6' },
        { token: 'string', foreground: 'F1FA8C' },
        { token: 'number', foreground: 'BD93F9' },
        { token: 'type', foreground: '8BE9FD' },
        { token: 'function', foreground: '50FA7B' },
        { token: 'variable', foreground: 'F8F8F2' },
        { token: 'constant', foreground: 'FFB86C' },
      ],
      colors: {
        'editor.background': '#05050A',
        'editor.foreground': '#F8F8F2',
        'editor.lineHighlightBackground': '#1C1C2E',
        'editor.selectionBackground': '#44475A',
        'editorCursor.foreground': '#6366F1',
        'editorLineNumber.foreground': '#4B5563',
        'editorLineNumber.activeForeground': '#F8F8F2',
        'editor.inactiveSelectionBackground': '#2A2A40',
        'editorIndentGuide.background': '#2A2A40',
        'editorIndentGuide.activeBackground': '#6366F1',
      }
    });
    monaco.editor.setTheme('cosmic');

    // Configure TypeScript/JavaScript
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types'],
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // Register LSP-based completion provider
    monaco.languages.registerCompletionItemProvider('typescript', {
      provideCompletionItems: async (model: any, position: any) => {
        try {
          const uri = model.uri.toString();
          const completions = await lspClient.getCompletions(uri, position.lineNumber - 1, position.column - 1);
          
          return {
            suggestions: completions.map((item: any) => ({
              label: item.label,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: item.insertText || item.label,
              detail: item.detail,
              documentation: item.documentation,
              range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
            }))
          };
        } catch (error) {
          console.error('Completion error:', error);
          return { suggestions: [] };
        }
      }
    });

    // Register hover provider
    monaco.languages.registerHoverProvider('typescript', {
      provideHover: async (model: any, position: any) => {
        const uri = model.uri.toString();
        const hover = await lspClient.getHover(uri, position.lineNumber - 1, position.column - 1);
        
        if (hover) {
          return {
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            contents: [{ value: hover.contents }]
          };
        }
        return null;
      }
    });

    // Register definition provider
    monaco.languages.registerDefinitionProvider('typescript', {
      provideDefinition: async (model: any, position: any) => {
        const uri = model.uri.toString();
        const definition = await lspClient.getDefinition(uri, position.lineNumber - 1, position.column - 1);
        
        if (definition) {
          return [{
            uri: monaco.Uri.parse(definition.uri),
            range: new monaco.Range(
              definition.range.start.line + 1,
              definition.range.start.character + 1,
              definition.range.end.line + 1,
              definition.range.end.character + 1
            )
          }];
        }
        return [];
      }
    });

    // Listen for extension contributions
    extensionManager.on('registerLanguages', (languages: any[]) => {
      languages.forEach(lang => {
        monaco.languages.register({
          id: lang.id,
          extensions: lang.extensions,
          aliases: lang.aliases
        });
      });
    });

    // Open document in LSP
    if (file) {
      const uri = `file://${file.path}`;
      const languageId = getLanguage(file.type, file.name);
      lspClient.openDocument(uri, languageId, file.content);
    }
  };

  const handleChange = (value: string | undefined) => {
    if (file && value !== undefined) {
      onContentChange(file.id, value);
      
      // Update LSP document
      const uri = `file://${file.path}`;
      lspClient.updateDocument(uri, value);
    }
  };

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 bg-cosmic-900">
        <div className="text-center">
          <h3 className="text-xl mb-2">Cosmic IDE</h3>
          <p className="text-sm">Select a file to start coding</p>
          <p className="text-xs mt-4 text-cosmic-accent">Ctrl+K to open palette</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-cosmic-900">
      {/* Tab Header */}
      <div className="flex bg-cosmic-800 border-b border-cosmic-700 overflow-x-auto">
        <div className="px-4 py-2 bg-cosmic-900 border-t-2 border-cosmic-accent text-white flex items-center gap-2 text-sm min-w-[150px]">
          <span>{file.name}</span>
          {file.isModified && <span className="w-2 h-2 rounded-full bg-white/50"></span>}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={getLanguage(file.type, file.name)}
          value={file.content}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          theme="cosmic"
          options={{
            fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            fontLigatures: true,
            minimap: { enabled: true, scale: 1 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showClasses: true,
              showFunctions: true,
              showVariables: true,
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: true,
            },
            parameterHints: { enabled: true },
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>
    </div>
  );
};

export default MonacoEditorComponent;
