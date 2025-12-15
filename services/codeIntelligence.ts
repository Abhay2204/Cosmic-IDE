// Code Intelligence Service - IntelliSense, Diagnostics, Go to Definition
import { FileNode } from '../types';
import { extensionManager } from './extensionSystem';

export interface CompletionItem {
  label: string;
  kind: 'function' | 'variable' | 'class' | 'method' | 'property' | 'keyword' | 'snippet';
  detail?: string;
  documentation?: string;
  insertText?: string;
  sortText?: string;
}

export interface Diagnostic {
  id: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  line: number;
  column: number;
  source: string;
  fileName: string;
}

export interface SymbolInformation {
  name: string;
  kind: 'function' | 'class' | 'variable' | 'method' | 'property';
  location: {
    file: string;
    line: number;
    column: number;
  };
  detail?: string;
}

export class CodeIntelligenceService {
  private diagnostics: Map<string, Diagnostic[]> = new Map();
  private symbols: Map<string, SymbolInformation[]> = new Map();

  // Get completions for current cursor position
  async getCompletions(
    fileContent: string,
    cursorPosition: { line: number; column: number },
    language: string,
    allFiles: FileNode[]
  ): Promise<CompletionItem[]> {
    const completions: CompletionItem[] = [];
    
    // Get current line and word
    const lines = fileContent.split('\n');
    const currentLine = lines[cursorPosition.line] || '';
    const beforeCursor = currentLine.substring(0, cursorPosition.column);
    const wordMatch = beforeCursor.match(/(\w+)$/);
    const currentWord = wordMatch ? wordMatch[1] : '';

    // Add snippets from extensions
    const snippets = extensionManager.getSnippets(language);
    snippets.forEach(snippet => {
      if (snippet.prefix.toLowerCase().includes(currentWord.toLowerCase())) {
        completions.push({
          label: snippet.prefix,
          kind: 'snippet',
          detail: snippet.description,
          insertText: snippet.body.join('\n'),
          sortText: '0' + snippet.prefix // Prioritize snippets
        });
      }
    });

    // Language-specific completions
    switch (language) {
      case 'javascript':
      case 'typescript':
        completions.push(...this.getJavaScriptCompletions(currentWord, beforeCursor, allFiles));
        break;
      case 'javascriptreact':
      case 'typescriptreact':
        completions.push(...this.getJavaScriptCompletions(currentWord, beforeCursor, allFiles));
        completions.push(...this.getReactCompletions(currentWord, beforeCursor));
        break;
      case 'python':
        completions.push(...this.getPythonCompletions(currentWord, beforeCursor, allFiles));
        break;
      case 'html':
        completions.push(...this.getHTMLCompletions(currentWord, beforeCursor));
        break;
      case 'css':
        completions.push(...this.getCSSCompletions(currentWord, beforeCursor));
        break;
      default:
        completions.push(...this.getGenericCompletions(currentWord));
    }

    // Filter and sort completions
    return completions
      .filter(item => item.label.toLowerCase().includes(currentWord.toLowerCase()))
      .sort((a, b) => {
        // Prioritize exact matches
        if (a.label.toLowerCase().startsWith(currentWord.toLowerCase()) && 
            !b.label.toLowerCase().startsWith(currentWord.toLowerCase())) {
          return -1;
        }
        if (!a.label.toLowerCase().startsWith(currentWord.toLowerCase()) && 
            b.label.toLowerCase().startsWith(currentWord.toLowerCase())) {
          return 1;
        }
        return a.label.localeCompare(b.label);
      })
      .slice(0, 20); // Limit to 20 suggestions
  }

  // JavaScript/TypeScript completions
  private getJavaScriptCompletions(currentWord: string, beforeCursor: string, allFiles: FileNode[]): CompletionItem[] {
    const completions: CompletionItem[] = [];

    // Built-in JavaScript objects and methods
    const jsBuiltins = [
      { label: 'console.log', kind: 'method' as const, insertText: 'console.log($1)', detail: 'Log to console' },
      { label: 'document.getElementById', kind: 'method' as const, insertText: 'document.getElementById($1)', detail: 'Get element by ID' },
      { label: 'addEventListener', kind: 'method' as const, insertText: 'addEventListener($1, $2)', detail: 'Add event listener' },
      { label: 'setTimeout', kind: 'function' as const, insertText: 'setTimeout($1, $2)', detail: 'Set timeout' },
      { label: 'setInterval', kind: 'function' as const, insertText: 'setInterval($1, $2)', detail: 'Set interval' },
      { label: 'fetch', kind: 'function' as const, insertText: 'fetch($1)', detail: 'Fetch API' },
      { label: 'async', kind: 'keyword' as const, insertText: 'async ', detail: 'Async function' },
      { label: 'await', kind: 'keyword' as const, insertText: 'await ', detail: 'Await expression' },
      { label: 'const', kind: 'keyword' as const, insertText: 'const $1 = $2;', detail: 'Const declaration' },
      { label: 'let', kind: 'keyword' as const, insertText: 'let $1 = $2;', detail: 'Let declaration' },
      { label: 'function', kind: 'keyword' as const, insertText: 'function $1($2) {\n  $3\n}', detail: 'Function declaration' },
      { label: 'if', kind: 'keyword' as const, insertText: 'if ($1) {\n  $2\n}', detail: 'If statement' },
      { label: 'for', kind: 'keyword' as const, insertText: 'for ($1; $2; $3) {\n  $4\n}', detail: 'For loop' },
      { label: 'while', kind: 'keyword' as const, insertText: 'while ($1) {\n  $2\n}', detail: 'While loop' },
      { label: 'try', kind: 'keyword' as const, insertText: 'try {\n  $1\n} catch (error) {\n  $2\n}', detail: 'Try-catch block' }
    ];

    completions.push(...jsBuiltins);

    // Extract symbols from current file and other JS/TS files
    allFiles.forEach(file => {
      if (file.type === 'javascript' || file.type === 'typescript') {
        const symbols = this.extractJavaScriptSymbols(file.content);
        completions.push(...symbols.map(symbol => ({
          label: symbol.name,
          kind: symbol.kind,
          detail: `From ${file.name}`,
          documentation: symbol.detail
        })));
      }
    });

    return completions;
  }

  // React completions
  private getReactCompletions(currentWord: string, beforeCursor: string): CompletionItem[] {
    const completions: CompletionItem[] = [];

    // React hooks
    const reactHooks = [
      { label: 'useState', kind: 'function' as const, insertText: 'useState($1)', detail: 'React useState hook' },
      { label: 'useEffect', kind: 'function' as const, insertText: 'useEffect(() => {\n  $1\n}, [$2])', detail: 'React useEffect hook' },
      { label: 'useContext', kind: 'function' as const, insertText: 'useContext($1)', detail: 'React useContext hook' },
      { label: 'useReducer', kind: 'function' as const, insertText: 'useReducer($1, $2)', detail: 'React useReducer hook' },
      { label: 'useMemo', kind: 'function' as const, insertText: 'useMemo(() => $1, [$2])', detail: 'React useMemo hook' },
      { label: 'useCallback', kind: 'function' as const, insertText: 'useCallback(($1) => {\n  $2\n}, [$3])', detail: 'React useCallback hook' },
      { label: 'useRef', kind: 'function' as const, insertText: 'useRef($1)', detail: 'React useRef hook' },
    ];

    // React imports
    const reactImports = [
      { label: 'import React', kind: 'snippet' as const, insertText: 'import React from "react";', detail: 'Import React' },
      { label: 'import { useState }', kind: 'snippet' as const, insertText: 'import { useState } from "react";', detail: 'Import useState' },
      { label: 'import { useEffect }', kind: 'snippet' as const, insertText: 'import { useEffect } from "react";', detail: 'Import useEffect' },
    ];

    completions.push(...reactHooks, ...reactImports);
    return completions;
  }

  // Python completions
  private getPythonCompletions(currentWord: string, beforeCursor: string, allFiles: FileNode[]): CompletionItem[] {
    const completions: CompletionItem[] = [];

    // Built-in Python functions and keywords
    const pythonBuiltins = [
      { label: 'print', kind: 'function' as const, insertText: 'print($1)', detail: 'Print to console' },
      { label: 'len', kind: 'function' as const, insertText: 'len($1)', detail: 'Get length' },
      { label: 'range', kind: 'function' as const, insertText: 'range($1)', detail: 'Generate range' },
      { label: 'input', kind: 'function' as const, insertText: 'input($1)', detail: 'Get user input' },
      { label: 'str', kind: 'function' as const, insertText: 'str($1)', detail: 'Convert to string' },
      { label: 'int', kind: 'function' as const, insertText: 'int($1)', detail: 'Convert to integer' },
      { label: 'float', kind: 'function' as const, insertText: 'float($1)', detail: 'Convert to float' },
      { label: 'def', kind: 'keyword' as const, insertText: 'def $1($2):\n    $3', detail: 'Function definition' },
      { label: 'class', kind: 'keyword' as const, insertText: 'class $1:\n    def __init__(self$2):\n        $3', detail: 'Class definition' },
      { label: 'if', kind: 'keyword' as const, insertText: 'if $1:\n    $2', detail: 'If statement' },
      { label: 'elif', kind: 'keyword' as const, insertText: 'elif $1:\n    $2', detail: 'Elif statement' },
      { label: 'else', kind: 'keyword' as const, insertText: 'else:\n    $1', detail: 'Else statement' },
      { label: 'for', kind: 'keyword' as const, insertText: 'for $1 in $2:\n    $3', detail: 'For loop' },
      { label: 'while', kind: 'keyword' as const, insertText: 'while $1:\n    $2', detail: 'While loop' },
      { label: 'try', kind: 'keyword' as const, insertText: 'try:\n    $1\nexcept Exception as e:\n    $2', detail: 'Try-except block' },
      { label: 'import', kind: 'keyword' as const, insertText: 'import $1', detail: 'Import module' },
      { label: 'from', kind: 'keyword' as const, insertText: 'from $1 import $2', detail: 'From import' }
    ];

    completions.push(...pythonBuiltins);

    // Extract Python symbols
    allFiles.forEach(file => {
      if (file.type === 'python') {
        const symbols = this.extractPythonSymbols(file.content);
        completions.push(...symbols.map(symbol => ({
          label: symbol.name,
          kind: symbol.kind,
          detail: `From ${file.name}`,
          documentation: symbol.detail
        })));
      }
    });

    return completions;
  }

  // HTML completions
  private getHTMLCompletions(currentWord: string, beforeCursor: string): CompletionItem[] {
    const completions: CompletionItem[] = [];

    // HTML tags
    const htmlTags = [
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
      'form', 'input', 'button', 'textarea', 'select', 'option',
      'header', 'nav', 'main', 'section', 'article', 'aside', 'footer'
    ];

    // Check if we're inside a tag
    if (beforeCursor.includes('<') && !beforeCursor.includes('>')) {
      htmlTags.forEach(tag => {
        completions.push({
          label: tag,
          kind: 'snippet',
          insertText: `${tag}>$1</${tag}>`,
          detail: `HTML ${tag} element`
        });
      });
    }

    return completions;
  }

  // CSS completions
  private getCSSCompletions(currentWord: string, beforeCursor: string): CompletionItem[] {
    const completions: CompletionItem[] = [];

    // CSS properties
    const cssProperties = [
      'color', 'background-color', 'font-size', 'font-family', 'font-weight',
      'margin', 'padding', 'border', 'width', 'height', 'display',
      'position', 'top', 'left', 'right', 'bottom', 'z-index',
      'flex', 'grid', 'justify-content', 'align-items', 'text-align'
    ];

    cssProperties.forEach(prop => {
      completions.push({
        label: prop,
        kind: 'property',
        insertText: `${prop}: $1;`,
        detail: `CSS ${prop} property`
      });
    });

    return completions;
  }

  // Generic completions for unknown languages
  private getGenericCompletions(currentWord: string): CompletionItem[] {
    return [
      { label: 'TODO', kind: 'snippet', insertText: 'TODO: $1', detail: 'TODO comment' },
      { label: 'FIXME', kind: 'snippet', insertText: 'FIXME: $1', detail: 'FIXME comment' },
      { label: 'NOTE', kind: 'snippet', insertText: 'NOTE: $1', detail: 'NOTE comment' }
    ];
  }

  // Extract JavaScript/TypeScript symbols
  private extractJavaScriptSymbols(content: string): SymbolInformation[] {
    const symbols: SymbolInformation[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Function declarations
      const funcMatch = line.match(/(?:function\s+|const\s+|let\s+|var\s+)(\w+)\s*(?:=\s*(?:function|\(.*?\)\s*=>)|\(.*?\))/);
      if (funcMatch) {
        symbols.push({
          name: funcMatch[1],
          kind: 'function',
          location: { file: '', line: index + 1, column: 0 },
          detail: 'Function'
        });
      }

      // Class declarations
      const classMatch = line.match(/class\s+(\w+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: 'class',
          location: { file: '', line: index + 1, column: 0 },
          detail: 'Class'
        });
      }

      // Variable declarations
      const varMatch = line.match(/(?:const|let|var)\s+(\w+)/);
      if (varMatch) {
        symbols.push({
          name: varMatch[1],
          kind: 'variable',
          location: { file: '', line: index + 1, column: 0 },
          detail: 'Variable'
        });
      }
    });

    return symbols;
  }

  // Extract Python symbols
  private extractPythonSymbols(content: string): SymbolInformation[] {
    const symbols: SymbolInformation[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Function definitions
      const funcMatch = line.match(/def\s+(\w+)\s*\(/);
      if (funcMatch) {
        symbols.push({
          name: funcMatch[1],
          kind: 'function',
          location: { file: '', line: index + 1, column: 0 },
          detail: 'Function'
        });
      }

      // Class definitions
      const classMatch = line.match(/class\s+(\w+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: 'class',
          location: { file: '', line: index + 1, column: 0 },
          detail: 'Class'
        });
      }

      // Variable assignments
      const varMatch = line.match(/^(\w+)\s*=/);
      if (varMatch) {
        symbols.push({
          name: varMatch[1],
          kind: 'variable',
          location: { file: '', line: index + 1, column: 0 },
          detail: 'Variable'
        });
      }
    });

    return symbols;
  }

  // Get diagnostics for a file
  async getDiagnostics(fileContent: string, fileName: string, language: string): Promise<Diagnostic[]> {
    const diagnostics: Diagnostic[] = [];
    const lines = fileContent.split('\n');

    // Basic syntax checking
    switch (language) {
      case 'javascript':
      case 'typescript':
        diagnostics.push(...this.checkJavaScriptSyntax(lines, fileName));
        break;
      case 'python':
        diagnostics.push(...this.checkPythonSyntax(lines, fileName));
        break;
      case 'json':
        diagnostics.push(...this.checkJSONSyntax(fileContent, fileName));
        break;
    }

    this.diagnostics.set(fileName, diagnostics);
    return diagnostics;
  }

  // Basic JavaScript syntax checking
  private checkJavaScriptSyntax(lines: string[], fileName: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    lines.forEach((line, index) => {
      // Check for missing semicolons
      if (line.trim() && 
          !line.trim().endsWith(';') && 
          !line.trim().endsWith('{') && 
          !line.trim().endsWith('}') &&
          !line.trim().startsWith('//') &&
          !line.trim().startsWith('/*') &&
          line.includes('=')) {
        diagnostics.push({
          id: `${fileName}-${index}-semicolon`,
          message: 'Missing semicolon',
          severity: 'warning',
          line: index + 1,
          column: line.length,
          source: 'JavaScript',
          fileName
        });
      }

      // Check for undefined variables (basic check)
      const undefinedMatch = line.match(/\b(\w+)\s*\(/);
      if (undefinedMatch && !['console', 'document', 'window', 'setTimeout', 'setInterval'].includes(undefinedMatch[1])) {
        // This is a very basic check - in real implementation, you'd use a proper parser
      }
    });

    return diagnostics;
  }

  // Basic Python syntax checking
  private checkPythonSyntax(lines: string[], fileName: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    lines.forEach((line, index) => {
      // Check for incorrect indentation
      if (line.trim() && line.startsWith(' ') && !line.startsWith('    ')) {
        const spaces = line.match(/^ */)?.[0].length || 0;
        if (spaces % 4 !== 0) {
          diagnostics.push({
            id: `${fileName}-${index}-indent`,
            message: 'Incorrect indentation (use 4 spaces)',
            severity: 'error',
            line: index + 1,
            column: 0,
            source: 'Python',
            fileName
          });
        }
      }

      // Check for missing colons
      if (line.trim().match(/^(if|elif|else|for|while|def|class|try|except|finally|with)\b/) && 
          !line.trim().endsWith(':')) {
        diagnostics.push({
          id: `${fileName}-${index}-colon`,
          message: 'Missing colon',
          severity: 'error',
          line: index + 1,
          column: line.length,
          source: 'Python',
          fileName
        });
      }
    });

    return diagnostics;
  }

  // JSON syntax checking
  private checkJSONSyntax(content: string, fileName: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    try {
      JSON.parse(content);
    } catch (error) {
      diagnostics.push({
        id: `${fileName}-json-error`,
        message: `Invalid JSON: ${error}`,
        severity: 'error',
        line: 1,
        column: 0,
        source: 'JSON',
        fileName
      });
    }

    return diagnostics;
  }

  // Get all diagnostics
  getAllDiagnostics(): Diagnostic[] {
    const allDiagnostics: Diagnostic[] = [];
    this.diagnostics.forEach(fileDiagnostics => {
      allDiagnostics.push(...fileDiagnostics);
    });
    return allDiagnostics;
  }

  // Find symbol definition
  async findDefinition(
    fileContent: string,
    position: { line: number; column: number },
    symbolName: string,
    allFiles: FileNode[]
  ): Promise<SymbolInformation | null> {
    // Search in current file first
    const currentFileSymbols = this.symbols.get('current') || [];
    const localSymbol = currentFileSymbols.find(s => s.name === symbolName);
    if (localSymbol) {
      return localSymbol;
    }

    // Search in other files
    for (const file of allFiles) {
      const fileSymbols = this.extractJavaScriptSymbols(file.content);
      const symbol = fileSymbols.find(s => s.name === symbolName);
      if (symbol) {
        return {
          ...symbol,
          location: { ...symbol.location, file: file.name }
        };
      }
    }

    return null;
  }
}

export const codeIntelligence = new CodeIntelligenceService();