import { Message, FileNode, AIModel, AIProvider } from '../types';

// Built-in AI Providers Configuration
export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'google',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyName: 'GEMINI_API_KEY',
    authType: 'api-key',
    setupUrl: 'https://aistudio.google.com/app/apikey',
    description: 'Google\'s powerful multimodal AI models',
    models: [
      {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash (Experimental)',
        provider: 'Google',
        apiKeyRequired: true,
        contextWindow: 1000000,
        description: 'Latest experimental Gemini model with enhanced capabilities',
        pricing: 'Free tier available'
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'Google',
        apiKeyRequired: true,
        contextWindow: 2000000,
        description: 'Most capable Gemini model for complex tasks',
        pricing: 'Pay per use'
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        provider: 'Google',
        apiKeyRequired: true,
        contextWindow: 1000000,
        description: 'Fast and efficient for most tasks',
        pricing: 'Free tier available'
      }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyName: 'OPENAI_API_KEY',
    authType: 'bearer',
    setupUrl: 'https://platform.openai.com/api-keys',
    description: 'OpenAI\'s GPT models for advanced reasoning',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        apiKeyRequired: true,
        contextWindow: 128000,
        description: 'Most advanced GPT model with multimodal capabilities',
        pricing: '$5/1M input tokens'
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        apiKeyRequired: true,
        contextWindow: 128000,
        description: 'Faster and more affordable GPT-4 class model',
        pricing: '$0.15/1M input tokens'
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'OpenAI',
        apiKeyRequired: true,
        contextWindow: 16385,
        description: 'Fast and cost-effective for most tasks',
        pricing: '$0.50/1M input tokens'
      }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKeyName: 'ANTHROPIC_API_KEY',
    authType: 'api-key',
    setupUrl: 'https://console.anthropic.com/settings/keys',
    description: 'Claude models known for safety and reasoning',
    headers: { 'anthropic-version': '2023-06-01' },
    models: [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        apiKeyRequired: true,
        contextWindow: 200000,
        description: 'Most intelligent Claude model for complex tasks',
        pricing: '$3/1M input tokens'
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        provider: 'Anthropic',
        apiKeyRequired: true,
        contextWindow: 200000,
        description: 'Fastest Claude model for quick responses',
        pricing: '$0.25/1M input tokens'
      }
    ]
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyName: 'OPENROUTER_API_KEY',
    authType: 'bearer',
    setupUrl: 'https://openrouter.ai/keys',
    description: 'Access to multiple AI models through one API',
    models: [
      {
        id: 'meta-llama/llama-3.1-8b-instruct:free',
        name: 'Llama 3.1 8B (Free)',
        provider: 'OpenRouter',
        apiKeyRequired: true,
        contextWindow: 131072,
        description: 'Free Llama 3.1 8B model via OpenRouter',
        pricing: 'Free'
      },
      {
        id: 'openai/gpt-oss-20b:free',
        name: 'GPT OSS 20B (Free)',
        provider: 'OpenRouter',
        apiKeyRequired: true,
        contextWindow: 32768,
        description: 'Free GPT OSS 20B model via OpenRouter',
        pricing: 'Free'
      },
      {
        id: 'kwaipilot/kat-coder-pro:free',
        name: 'Kat Coder Pro (Free)',
        provider: 'OpenRouter',
        apiKeyRequired: true,
        contextWindow: 32768,
        description: 'Free Kat Coder Pro model specialized for coding via OpenRouter',
        pricing: 'Free'
      },
      {
        id: 'qwen/qwen3-coder:free',
        name: 'Qwen3 Coder (Free)',
        provider: 'OpenRouter',
        apiKeyRequired: true,
        contextWindow: 32768,
        description: 'Free Qwen3 Coder model specialized for programming via OpenRouter',
        pricing: 'Free'
      },
      {
        id: 'google/gemini-flash-1.5',
        name: 'Gemini Flash 1.5 (Free)',
        provider: 'OpenRouter',
        apiKeyRequired: true,
        contextWindow: 1000000,
        description: 'Free Google Gemini Flash model via OpenRouter',
        pricing: 'Free'
      },
      {
        id: 'microsoft/phi-3-mini-128k-instruct:free',
        name: 'Phi-3 Mini (Free)',
        provider: 'OpenRouter',
        apiKeyRequired: true,
        contextWindow: 128000,
        description: 'Free Microsoft Phi-3 Mini model via OpenRouter',
        pricing: 'Free'
      },
      {
        id: 'huggingface/zephyr-7b-beta:free',
        name: 'Zephyr 7B (Free)',
        provider: 'OpenRouter',
        apiKeyRequired: true,
        contextWindow: 32768,
        description: 'Free Zephyr 7B model via OpenRouter',
        pricing: 'Free'
      },
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet (OpenRouter)',
        provider: 'OpenRouter',
        apiKeyRequired: true,
        contextWindow: 200000,
        description: 'Claude 3.5 Sonnet via OpenRouter',
        pricing: 'Variable pricing'
      },
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4o (OpenRouter)',
        provider: 'OpenRouter',
        apiKeyRequired: true,
        contextWindow: 128000,
        description: 'GPT-4o via OpenRouter',
        pricing: 'Variable pricing'
      },
      {
        id: 'google/gemini-pro-1.5',
        name: 'Gemini Pro 1.5 (OpenRouter)',
        provider: 'OpenRouter',
        apiKeyRequired: true,
        contextWindow: 2000000,
        description: 'Gemini Pro 1.5 via OpenRouter',
        pricing: 'Variable pricing'
      },
      {
        id: 'meta-llama/llama-3.1-405b-instruct',
        name: 'Llama 3.1 405B',
        provider: 'OpenRouter',
        apiKeyRequired: true,
        contextWindow: 131072,
        description: 'Meta\'s largest open-source model',
        pricing: 'Variable pricing'
      }
    ]
  },
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKeyName: 'GROQ_API_KEY',
    authType: 'bearer',
    setupUrl: 'https://console.groq.com/keys',
    description: 'Ultra-fast inference for open-source models',
    models: [
      {
        id: 'llama-3.1-70b-versatile',
        name: 'Llama 3.1 70B',
        provider: 'Groq',
        apiKeyRequired: true,
        contextWindow: 131072,
        description: 'Fast Llama 3.1 70B inference',
        pricing: 'Free tier available'
      },
      {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B',
        provider: 'Groq',
        apiKeyRequired: true,
        contextWindow: 131072,
        description: 'Ultra-fast Llama 3.1 8B inference',
        pricing: 'Free tier available'
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        provider: 'Groq',
        apiKeyRequired: true,
        contextWindow: 32768,
        description: 'Fast Mixtral inference',
        pricing: 'Free tier available'
      }
    ]
  },
  {
    id: 'netmind',
    name: 'Netmind.AI',
    baseUrl: 'https://api.netmind.ai/v1',
    apiKeyName: 'NETMIND_API_KEY',
    authType: 'bearer',
    setupUrl: 'https://platform.netmind.ai/api-keys',
    description: 'Decentralized AI compute platform',
    models: [
      {
        id: 'llama-3.1-70b-instruct',
        name: 'Llama 3.1 70B (Netmind)',
        provider: 'Netmind',
        apiKeyRequired: true,
        contextWindow: 131072,
        description: 'Llama 3.1 70B on decentralized infrastructure',
        pricing: 'Competitive pricing'
      },
      {
        id: 'mixtral-8x7b-instruct',
        name: 'Mixtral 8x7B (Netmind)',
        provider: 'Netmind',
        apiKeyRequired: true,
        contextWindow: 32768,
        description: 'Mixtral on decentralized infrastructure',
        pricing: 'Competitive pricing'
      }
    ]
  },
  {
    id: 'cohere',
    name: 'Cohere',
    baseUrl: 'https://api.cohere.ai/v1',
    apiKeyName: 'COHERE_API_KEY',
    authType: 'bearer',
    setupUrl: 'https://dashboard.cohere.ai/api-keys',
    description: 'Enterprise-focused language models',
    models: [
      {
        id: 'command-r-plus',
        name: 'Command R+',
        provider: 'Cohere',
        apiKeyRequired: true,
        contextWindow: 128000,
        description: 'Most capable Command model for complex tasks',
        pricing: '$3/1M input tokens'
      },
      {
        id: 'command-r',
        name: 'Command R',
        provider: 'Cohere',
        apiKeyRequired: true,
        contextWindow: 128000,
        description: 'Balanced performance and efficiency',
        pricing: '$0.50/1M input tokens'
      }
    ]
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    apiKeyName: 'MISTRAL_API_KEY',
    authType: 'bearer',
    setupUrl: 'https://console.mistral.ai/api-keys/',
    description: 'European AI company with efficient models',
    models: [
      {
        id: 'mistral-large-latest',
        name: 'Mistral Large',
        provider: 'Mistral',
        apiKeyRequired: true,
        contextWindow: 128000,
        description: 'Most capable Mistral model',
        pricing: '$2/1M input tokens'
      },
      {
        id: 'mistral-small-latest',
        name: 'Mistral Small',
        provider: 'Mistral',
        apiKeyRequired: true,
        contextWindow: 128000,
        description: 'Cost-effective Mistral model',
        pricing: '$0.20/1M input tokens'
      }
    ]
  }
];

// Get all available models from all providers
export const getAllModels = (customProviders: AIProvider[] = []): AIModel[] => {
  const allProviders = [...AI_PROVIDERS, ...customProviders];
  return allProviders.flatMap(provider => provider.models);
};

// Get provider by ID
export const getProvider = (providerId: string, customProviders: AIProvider[] = []): AIProvider | undefined => {
  const allProviders = [...AI_PROVIDERS, ...customProviders];
  return allProviders.find(p => p.id === providerId);
};

// Get model by ID
export const getModel = (modelId: string, customProviders: AIProvider[] = []): { model: AIModel; provider: AIProvider } | undefined => {
  const allProviders = [...AI_PROVIDERS, ...customProviders];
  
  for (const provider of allProviders) {
    const model = provider.models.find(m => m.id === modelId);
    if (model) {
      return { model, provider };
    }
  }
  return undefined;
};

// Helper to construct context from files
const getContextFromFiles = (files: FileNode[]): string => {
  return files.map(f => `File: ${f.name} (${f.path})\nContent:\n${f.content}\n---`).join('\n');
};

// Generic API call function
const makeAPICall = async (
  provider: AIProvider,
  model: AIModel,
  messages: Message[],
  apiKey: string,
  systemPrompt?: string
): Promise<string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...provider.headers
  };

  // Set authentication header based on provider type
  if (provider.authType === 'bearer') {
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (provider.authType === 'api-key') {
    if (provider.id === 'anthropic') {
      headers['x-api-key'] = apiKey;
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  // Prepare request body based on provider
  let requestBody: any;
  
  if (provider.id === 'google') {
    // Google Gemini API format
    const contents = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    requestBody = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192
      }
    };

    if (systemPrompt) {
      requestBody.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const response = await fetch(`${provider.baseUrl}/models/${model.id}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";

  } else if (provider.id === 'anthropic') {
    // Anthropic Claude API format
    const systemMessage = systemPrompt || messages.find(m => m.role === 'system')?.content;
    const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.content
    }));

    requestBody = {
      model: model.id,
      max_tokens: 8192,
      temperature: 0.7,
      messages: userMessages
    };

    if (systemMessage) {
      requestBody.system = systemMessage;
    }

    const response = await fetch(`${provider.baseUrl}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || "No response generated";

  } else {
    // OpenAI-compatible API format (OpenAI, OpenRouter, Groq, etc.)
    const apiMessages = messages.map(m => ({
      role: m.role === 'model' ? 'assistant' : m.role,
      content: m.content
    }));

    if (systemPrompt) {
      apiMessages.unshift({ role: 'system', content: systemPrompt });
    }

    requestBody = {
      model: model.id,
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 8192
    };

    console.log('Making OpenAI-compatible API call to:', provider.baseUrl);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    console.log('Headers:', headers);

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`${provider.name} API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response data:', data);
    return data.choices?.[0]?.message?.content || "No response generated";
  }
};

// Main chat response function
export const generateChatResponse = async (
  history: Message[],
  currentInput: string,
  contextFiles: FileNode[],
  modelId: string,
  apiKeys: Record<string, string>,
  customProviders: AIProvider[] = []
): Promise<string> => {
  try {
    console.log('generateChatResponse called with:', { modelId, apiKeys, customProviders });
    
    const modelInfo = getModel(modelId, customProviders);
    if (!modelInfo) {
      console.error('Model not found:', modelId);
      return `Error: Model "${modelId}" not found. Please select a valid model.`;
    }

    const { model, provider } = modelInfo;
    console.log('Using model:', model.name, 'from provider:', provider.name);
    
    const apiKey = apiKeys[provider.apiKeyName];
    console.log('API key for', provider.apiKeyName, ':', apiKey ? 'Present' : 'Missing');

    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
      console.error('API key missing or placeholder for:', provider.apiKeyName);
      return `Error: API key for ${provider.name} not configured. Please add your ${provider.apiKeyName} in Settings.`;
    }

    const fileContext = getContextFromFiles(contextFiles);
    const systemPrompt = `You are the AI Agent for Cosmic IDE - an advanced coding assistant with full IDE capabilities.
Model: ${model.name} (${provider.name})

🚀 AGENT CAPABILITIES:
- CREATE files and folders automatically
- EXECUTE shell commands and scripts  
- MODIFY existing code files
- ANALYZE entire projects
- GENERATE complete applications
- FIX bugs and errors across multiple files
- INSTALL packages and dependencies

📝 CODE GENERATION RULES:
1. Always provide complete, working code in markdown code blocks
2. Use proper language tags (python, javascript, html, css, typescript, etc.)
3. Include filename comments in code (e.g., // filename.js, # filename.py)
4. For multi-file projects, create ALL necessary files
5. Make code production-ready with proper error handling

🎯 RESPONSE FORMAT:
- For file creation: Use code blocks with clear filenames
- For commands: Mention specific commands to run
- For projects: Create complete folder structures
- For fixes: Provide corrected code with explanations

Current Workspace Context:
${fileContext}

💡 EXAMPLES:
- "Create a Python snake game" → Generate complete snake_game.py with pygame
- "Build a hotel website" → Create HTML, CSS, JS files with full functionality  
- "Fix this React component" → Analyze and provide corrected code
- "Install Express and create API" → Provide package.json and server setup
- "Create a todo app" → Generate complete frontend/backend with database

🔍 CONTEXT COMMANDS:
- @Files = Reference current open files
- @Web = Use web knowledge for latest practices
- @Project = Analyze entire project structure

Remember: You are a powerful AI agent that can actually CREATE and MODIFY files in the IDE!`;

    const messages = [...history, { 
      id: Date.now().toString(), 
      role: 'user' as const, 
      content: currentInput, 
      timestamp: Date.now() 
    }];

    console.log('Making API call to:', provider.name, 'with model:', model.id);
    const response = await makeAPICall(provider, model, messages, apiKey, systemPrompt);
    console.log('API response received:', response.length, 'characters');
    return response;

  } catch (error) {
    console.error("AI API Error:", error);
    return `CosmicError: ${error instanceof Error ? error.message : 'Unknown error occurred'}. Please check your API key and try again.`;
  }
};

// Autocomplete function
export const generateAutocomplete = async (
  fileContent: string,
  cursorOffset: number,
  language: string,
  modelId: string,
  apiKeys: Record<string, string>,
  customProviders: AIProvider[] = []
): Promise<string> => {
  try {
    const modelInfo = getModel(modelId, customProviders);
    if (!modelInfo) return "";

    const { model, provider } = modelInfo;
    const apiKey = apiKeys[provider.apiKeyName];

    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') return "";

    const prefix = fileContent.slice(0, cursorOffset);
    const suffix = fileContent.slice(cursorOffset);

    const messages: Message[] = [{
      id: '1',
      role: 'user',
      content: `Complete the code at the cursor position. Only return the completion text, no markdown or explanations.

Language: ${language}
Code before cursor:
${prefix}

Code after cursor:
${suffix}`,
      timestamp: Date.now()
    }];

    const systemPrompt = "You are a code completion engine. Return only the text that should be inserted at the cursor position.";

    const completion = await makeAPICall(provider, model, messages, apiKey, systemPrompt);
    return completion.trim();

  } catch (error) {
    console.error("Autocomplete error:", error);
    return "";
  }
};

// Commit message generation
export const generateCommitMessage = async (
  diff: string,
  modelId: string,
  apiKeys: Record<string, string>,
  customProviders: AIProvider[] = []
): Promise<string> => {
  try {
    const modelInfo = getModel(modelId, customProviders);
    if (!modelInfo) return "chore: update files";

    const { model, provider } = modelInfo;
    const apiKey = apiKeys[provider.apiKeyName];

    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') return "chore: update files";

    const messages: Message[] = [{
      id: '1',
      role: 'user',
      content: `Generate a conventional commit message (max 1 line, lowercase) for the following changes:\n${diff}`,
      timestamp: Date.now()
    }];

    const systemPrompt = "Generate concise conventional commit messages. Format: type(scope): description. Keep it under 50 characters.";

    const commitMsg = await makeAPICall(provider, model, messages, apiKey, systemPrompt);
    return commitMsg.trim() || "chore: update files";

  } catch (error) {
    console.error("Commit message error:", error);
    return "chore: update files";
  }
};

// Code review function
export const reviewCode = async (
  code: string,
  fileName: string,
  modelId: string,
  apiKeys: Record<string, string>,
  customProviders: AIProvider[] = []
): Promise<string> => {
  try {
    const modelInfo = getModel(modelId, customProviders);
    if (!modelInfo) return "❌ Code review unavailable - model not found.";

    const { model, provider } = modelInfo;
    const apiKey = apiKeys[provider.apiKeyName];

    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
      return "❌ Code review unavailable - API key not configured.";
    }

    const messages: Message[] = [{
      id: '1',
      role: 'user',
      content: `You are BugBot, an expert code reviewer. Analyze this code and provide a structured review.

File: ${fileName}
Code:
\`\`\`
${code}
\`\`\`

Provide your review in this EXACT format (use these exact section headers):

🔍 OVERVIEW
Brief summary of what the code does (1-2 sentences)

🐛 BUGS & ERRORS
- List any bugs or errors found
- If none, write "No bugs detected"

⚠️ SECURITY ISSUES  
- List any security vulnerabilities
- If none, write "No security issues"

⚡ PERFORMANCE
- List any performance improvements
- If none, write "Code is optimized"

💡 SUGGESTIONS
- List code quality improvements
- Best practice recommendations

📊 SCORE: X/10
Overall code quality rating`,
      timestamp: Date.now()
    }];

    const systemPrompt = "You are BugBot, a professional code review AI. Always respond in the exact structured format requested. Be concise but thorough.";

    const review = await makeAPICall(provider, model, messages, apiKey, systemPrompt);
    return review || "✅ No issues found. Code looks good!";

  } catch (error) {
    console.error("Code review error:", error);
    return "❌ Unable to scan code at this time. Please try again.";
  }
};