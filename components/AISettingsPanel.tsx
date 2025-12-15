import React, { useState } from 'react';
import { Settings, AIProvider, AIModel } from '../types';
import { AI_PROVIDERS, getAllModels, getProvider } from '../services/aiService';
import { 
  Key, ExternalLink, Plus, Trash2, Eye, EyeOff, 
  CheckCircle, AlertCircle, Info, Zap, Globe, Shield 
} from 'lucide-react';

interface AISettingsPanelProps {
  settings: Settings;
  onUpdate: (settings: Settings) => void;
}

export const AISettingsPanel: React.FC<AISettingsPanelProps> = ({ settings, onUpdate }) => {
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [newProvider, setNewProvider] = useState<Partial<AIProvider>>({
    id: '',
    name: '',
    baseUrl: '',
    apiKeyName: '',
    authType: 'bearer'
  });
  const [showAddProvider, setShowAddProvider] = useState(false);

  const allModels = getAllModels(settings.customProviders);
  const currentModel = allModels.find(m => m.id === settings.defaultModel);

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys(prev => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const updateApiKey = (apiKeyName: string, value: string) => {
    onUpdate({
      ...settings,
      aiProviders: {
        ...settings.aiProviders,
        [apiKeyName]: value
      }
    });
  };

  const addCustomProvider = () => {
    if (!newProvider.id || !newProvider.name || !newProvider.baseUrl) return;

    const provider: AIProvider = {
      id: newProvider.id,
      name: newProvider.name,
      baseUrl: newProvider.baseUrl,
      apiKeyName: newProvider.apiKeyName || `${newProvider.id.toUpperCase()}_API_KEY`,
      authType: newProvider.authType || 'bearer',
      description: newProvider.description || 'Custom AI provider',
      models: [{
        id: `${newProvider.id}/default`,
        name: `${newProvider.name} Default`,
        provider: newProvider.name as any,
        apiKeyRequired: true,
        description: 'Default model for this provider'
      }]
    };

    onUpdate({
      ...settings,
      customProviders: [...settings.customProviders, provider]
    });

    setNewProvider({
      id: '',
      name: '',
      baseUrl: '',
      apiKeyName: '',
      authType: 'bearer'
    });
    setShowAddProvider(false);
  };

  const removeCustomProvider = (providerId: string) => {
    onUpdate({
      ...settings,
      customProviders: settings.customProviders.filter(p => p.id !== providerId)
    });
  };

  const getProviderStatus = (provider: AIProvider) => {
    const apiKey = settings.aiProviders[provider.apiKeyName];
    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
      return { status: 'missing', icon: AlertCircle, color: 'text-red-400' };
    }
    return { status: 'configured', icon: CheckCircle, color: 'text-green-400' };
  };

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google': return '🤖';
      case 'openai': return '🧠';
      case 'anthropic': return '🎭';
      case 'openrouter': return '🌐';
      case 'groq': return '⚡';
      case 'netmind': return '🔗';
      case 'cohere': return '🏢';
      case 'mistral': return '🇪🇺';
      default: return '🔧';
    }
  };

  return (
    <div className="h-full flex flex-col bg-cosmic-800">
      {/* Header */}
      <div className="p-4 border-b border-cosmic-600">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400" />
          AI Models & Providers
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Configure AI providers and manage API keys
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Current Model */}
        <div className="p-4 border-b border-cosmic-700">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Current Model</h3>
          <div className="bg-cosmic-700 rounded-lg p-3">
            {currentModel ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getProviderIcon(getProvider(currentModel.provider.toLowerCase())?.id || '')}</span>
                    <span className="font-medium text-white">{currentModel.name}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{currentModel.description}</p>
                  {currentModel.contextWindow && (
                    <p className="text-xs text-blue-400 mt-1">
                      Context: {currentModel.contextWindow.toLocaleString()} tokens
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">{currentModel.provider}</div>
                  {currentModel.pricing && (
                    <div className="text-xs text-green-400">{currentModel.pricing}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-sm">No model selected</div>
            )}
          </div>
        </div>

        {/* Model Selection */}
        <div className="p-4 border-b border-cosmic-700">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Select Model</h3>
          <select
            value={settings.defaultModel}
            onChange={(e) => onUpdate({ ...settings, defaultModel: e.target.value })}
            className="w-full bg-cosmic-700 border border-cosmic-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {AI_PROVIDERS.map(provider => (
              <optgroup key={provider.id} label={provider.name}>
                {provider.models.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name} {model.contextWindow ? `(${(model.contextWindow / 1000).toFixed(0)}K)` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
            {settings.customProviders.length > 0 && (
              <optgroup label="Custom Providers">
                {settings.customProviders.flatMap(provider =>
                  provider.models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))
                )}
              </optgroup>
            )}
          </select>
        </div>

        {/* API Keys Configuration */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <Key className="w-4 h-4" />
            API Keys
          </h3>
          
          <div className="space-y-4">
            {AI_PROVIDERS.map(provider => {
              const status = getProviderStatus(provider);
              const StatusIcon = status.icon;
              const isVisible = showApiKeys[provider.id];
              const apiKey = settings.aiProviders[provider.apiKeyName] || '';

              return (
                <div key={provider.id} className="bg-cosmic-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getProviderIcon(provider.id)}</span>
                      <div>
                        <h4 className="font-medium text-white">{provider.name}</h4>
                        <p className="text-xs text-gray-400">{provider.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-4 h-4 ${status.color}`} />
                      {provider.setupUrl && (
                        <button
                          onClick={() => window.open(provider.setupUrl, '_blank')}
                          className="p-1 hover:bg-cosmic-600 rounded text-gray-400 hover:text-white"
                          title="Get API Key"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 block">
                      {provider.apiKeyName}
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type={isVisible ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => updateApiKey(provider.apiKeyName, e.target.value)}
                          placeholder={`Enter your ${provider.name} API key`}
                          className="w-full bg-cosmic-800 border border-cosmic-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 pr-10"
                        />
                        <button
                          onClick={() => toggleApiKeyVisibility(provider.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    {/* Model count and info */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{provider.models.length} models available</span>
                      {status.status === 'missing' && (
                        <span className="text-red-400">API key required</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Custom Providers */}
            {settings.customProviders.map(provider => {
              const status = getProviderStatus(provider);
              const StatusIcon = status.icon;
              const isVisible = showApiKeys[provider.id];
              const apiKey = settings.aiProviders[provider.apiKeyName] || '';

              return (
                <div key={provider.id} className="bg-cosmic-700 rounded-lg p-4 border border-purple-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🔧</span>
                      <div>
                        <h4 className="font-medium text-white flex items-center gap-2">
                          {provider.name}
                          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">Custom</span>
                        </h4>
                        <p className="text-xs text-gray-400">{provider.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-4 h-4 ${status.color}`} />
                      <button
                        onClick={() => removeCustomProvider(provider.id)}
                        className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                        title="Remove Provider"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 block">
                      {provider.apiKeyName}
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type={isVisible ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => updateApiKey(provider.apiKeyName, e.target.value)}
                          placeholder={`Enter your ${provider.name} API key`}
                          className="w-full bg-cosmic-800 border border-cosmic-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 pr-10"
                        />
                        <button
                          onClick={() => toggleApiKeyVisibility(provider.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Custom Provider */}
            <div className="bg-cosmic-700 rounded-lg p-4 border border-dashed border-cosmic-500">
              {!showAddProvider ? (
                <button
                  onClick={() => setShowAddProvider(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-gray-400 hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Custom Provider
                </button>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-medium text-white">Add Custom Provider</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Provider ID</label>
                      <input
                        type="text"
                        value={newProvider.id || ''}
                        onChange={(e) => setNewProvider({ ...newProvider, id: e.target.value })}
                        placeholder="my-provider"
                        className="w-full bg-cosmic-800 border border-cosmic-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Provider Name</label>
                      <input
                        type="text"
                        value={newProvider.name || ''}
                        onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                        placeholder="My AI Provider"
                        className="w-full bg-cosmic-800 border border-cosmic-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Base URL</label>
                    <input
                      type="url"
                      value={newProvider.baseUrl || ''}
                      onChange={(e) => setNewProvider({ ...newProvider, baseUrl: e.target.value })}
                      placeholder="https://api.myprovider.com/v1"
                      className="w-full bg-cosmic-800 border border-cosmic-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">API Key Name</label>
                      <input
                        type="text"
                        value={newProvider.apiKeyName || ''}
                        onChange={(e) => setNewProvider({ ...newProvider, apiKeyName: e.target.value })}
                        placeholder="MY_PROVIDER_API_KEY"
                        className="w-full bg-cosmic-800 border border-cosmic-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Auth Type</label>
                      <select
                        value={newProvider.authType || 'bearer'}
                        onChange={(e) => setNewProvider({ ...newProvider, authType: e.target.value as 'bearer' | 'api-key' })}
                        className="w-full bg-cosmic-800 border border-cosmic-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="bearer">Bearer Token</option>
                        <option value="api-key">API Key</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      value={newProvider.description || ''}
                      onChange={(e) => setNewProvider({ ...newProvider, description: e.target.value })}
                      placeholder="Custom AI provider description"
                      className="w-full bg-cosmic-800 border border-cosmic-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={addCustomProvider}
                      disabled={!newProvider.id || !newProvider.name || !newProvider.baseUrl}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Add Provider
                    </button>
                    <button
                      onClick={() => setShowAddProvider(false)}
                      className="px-3 py-2 border border-cosmic-600 hover:bg-cosmic-600 text-gray-300 rounded text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-4 border-t border-cosmic-700">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-300 font-medium mb-1">Getting Started</p>
                <ul className="text-blue-200/80 space-y-1 text-xs">
                  <li>• Get API keys from provider websites (click the link icons)</li>
                  <li>• Free tiers available for Google Gemini, Groq, and others</li>
                  <li>• OpenRouter provides access to multiple models with one key</li>
                  <li>• Custom providers support any OpenAI-compatible API</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};