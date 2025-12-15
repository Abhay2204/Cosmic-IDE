// Core IDE Types
export interface FileNode {
  id: string;
  name: string;
  type: string;
  content: string;
  isOpen: boolean;
  isModified: boolean;
  path?: string;
  relativePath?: string;
}

export enum FileType {
  JavaScript = 'javascript',
  TypeScript = 'typescript',
  Python = 'python',
  Rust = 'rust',
  Java = 'java',
  Go = 'go',
  CPP = 'cpp',
  CSharp = 'csharp',
  Ruby = 'ruby',
  PHP = 'php',
  Swift = 'swift',
  Kotlin = 'kotlin',
  HTML = 'html',
  CSS = 'css',
  JSON = 'json',
  Markdown = 'markdown',
  YAML = 'yaml',
  SQL = 'sql',
  Shell = 'shell',
  XML = 'xml',
  TOML = 'toml',
  Dockerfile = 'dockerfile',
  Plain = 'plain'
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}

export interface TerminalLine {
  id: string;
  content: string;
  type: 'command' | 'success' | 'error' | 'info';
}

export enum PanelView {
  Explorer = 'explorer',
  Search = 'search',
  SourceControl = 'sourceControl',
  Debug = 'debug',
  Extensions = 'extensions',
  BugBot = 'bugbot',
  Settings = 'settings',
  Preview = 'preview'
}

export enum BottomTab {
  Problems = 'problems',
  Output = 'output',
  DebugConsole = 'debugConsole',
  Terminal = 'terminal'
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

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  apiKeyRequired: boolean;
  contextWindow?: number;
  description?: string;
  pricing?: string;
}

export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyName: string;
  authType: 'bearer' | 'api-key';
  setupUrl: string;
  description: string;
  headers?: Record<string, string>;
  models: AIModel[];
}

export interface Settings {
  defaultModel: string;
  vimMode: boolean;
  privacyMode: boolean;
  ghostText: boolean;
  terminalFontSize: number;
  editorFontSize: number;
  aiProviders: Record<string, string>;
  customProviders: AIProvider[];
}

// Legacy types for compatibility
export interface User {
  id: number;
  username: string;
  email: string;
}

export interface HealthResponse {
  status: string;
  message: string;
}

export interface ServerStats {
  uptime: number;
  requests: number;
  version: string;
}