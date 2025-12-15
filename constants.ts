import { FileNode, FileType, AIModel, Settings } from './types';

export const INITIAL_FILES: FileNode[] = [
  // Initial files are now loaded from WorkspaceService
  // This array is kept for backward compatibility
];

export const AVAILABLE_MODELS: AIModel[] = [
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', apiKeyRequired: true },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', apiKeyRequired: true },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', apiKeyRequired: true },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', apiKeyRequired: true },
  { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', provider: 'Groq', apiKeyRequired: true },
];

export const DEFAULT_SETTINGS: Settings = {
  defaultModel: 'kwaipilot/kat-coder-pro:free',
  vimMode: false,
  privacyMode: true,
  ghostText: true,
  terminalFontSize: 14,
  editorFontSize: 14,
  aiProviders: {
    GEMINI_API_KEY: '',
    OPENAI_API_KEY: '',
    ANTHROPIC_API_KEY: '',
    OPENROUTER_API_KEY: '',
    GROQ_API_KEY: '',
    NETMIND_API_KEY: '',
    COHERE_API_KEY: '',
    MISTRAL_API_KEY: ''
  },
  customProviders: []
};

export const INITIAL_WELCOME_MSG = "Welcome to Cosmic IDE! 🚀 I'm your AI Agent. I can create complete projects, websites, and applications safely in your workspace. All your files are organized and protected. What would you like to build today?";