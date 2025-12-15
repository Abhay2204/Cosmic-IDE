import React, { useState, useEffect } from 'react';
import { Settings, AIModel } from '../types';

import { getAllModels } from '../services/aiService';
import { AISettingsPanel } from './AISettingsPanel';
import { themeService } from '../services/themeService';
import { Shield, Smartphone, Terminal, Keyboard, Type, Cpu, Zap, Settings as SettingsIcon, Palette } from 'lucide-react';

interface SettingsPanelProps {
  settings: Settings;
  onUpdate: (newSettings: Settings) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [availableThemes, setAvailableThemes] = useState(themeService.getAvailableThemes());
  const [currentTheme, setCurrentTheme] = useState(themeService.getCurrentTheme());
  
  useEffect(() => {
    const unsubscribe = themeService.subscribe((theme) => {
      setCurrentTheme(theme);
      setAvailableThemes(themeService.getAvailableThemes());
    });
    return () => {
      unsubscribe();
    };
  }, []);
  
  const handleChange = (key: keyof Settings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  const handleThemeChange = (themeId: string) => {
    if (themeId === 'default') {
      themeService.resetToDefault();
    } else {
      const theme = themeService.getThemeById(themeId);
      if (theme) {
        themeService.applyTheme(theme);
      }
    }
  };

  const allModels = getAllModels(settings.customProviders);

  if (activeTab === 'ai') {
    return <AISettingsPanel settings={settings} onUpdate={onUpdate} />;
  }

  return (
    <div className="h-full bg-cosmic-800 text-gray-300 flex flex-col">
      {/* Header with Tabs */}
      <div className="p-4 border-b border-cosmic-600">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-cosmic-accent" />
          Settings
        </h2>
        
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'general' 
                ? 'bg-cosmic-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-cosmic-700'
            }`}
          >
            <Cpu className="w-4 h-4 inline mr-2" />
            General
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'ai' 
                ? 'bg-cosmic-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-cosmic-700'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            AI Models
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">

      <div className="space-y-8">
        
        {/* Model Section */}
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-cosmic-600 pb-2">
            Intelligence
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Default Model</label>
              <select 
                value={settings.defaultModel}
                onChange={(e) => handleChange('defaultModel', e.target.value)}
                className="bg-cosmic-900 border border-cosmic-600 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-cosmic-accent outline-none"
              >
                {allModels.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                The model used for Chat, Composer, and Agent tasks. 
                <button 
                  onClick={() => setActiveTab('ai')}
                  className="text-blue-400 hover:text-blue-300 ml-1 underline"
                >
                  Configure API keys →
                </button>
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-cosmic-900 rounded-lg border border-cosmic-700/50">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="text-sm font-medium text-white">Ghost Text</div>
                  <div className="text-xs text-gray-500">Enable predictive code completion (Tab)</div>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={settings.ghostText}
                onChange={(e) => handleChange('ghostText', e.target.checked)}
                className="accent-cosmic-accent h-4 w-4 rounded"
              />
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-cosmic-600 pb-2">
            Privacy & Security
          </h3>
          <div className="flex items-center justify-between p-3 bg-cosmic-900 rounded-lg border border-cosmic-700/50">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-sm font-medium text-white">Privacy Mode</div>
                <div className="text-xs text-gray-500">Do not train on my code (SOC 2 Compliant)</div>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={settings.privacyMode}
              onChange={(e) => handleChange('privacyMode', e.target.checked)}
              className="accent-green-500 h-4 w-4 rounded"
            />
          </div>
        </section>

        {/* Appearance Section */}
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-cosmic-600 pb-2">
            Appearance
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Theme
              </label>
              <select 
                value={currentTheme?.id || 'default'}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="bg-cosmic-900 border border-cosmic-600 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-cosmic-accent outline-none"
              >
                <option value="default">Default (Cosmic Dark)</option>
                {availableThemes.map(theme => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name} ({theme.type})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                Install theme extensions from the marketplace to get more themes
              </p>
            </div>
          </div>
        </section>

        {/* Editor Section */}
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-cosmic-600 pb-2">
            Editor
          </h3>
          <div className="space-y-4">
             <div className="flex items-center justify-between p-3 bg-cosmic-900 rounded-lg border border-cosmic-700/50">
              <div className="flex items-center gap-3">
                <Keyboard className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-sm font-medium text-white">Vim Mode</div>
                  <div className="text-xs text-gray-500">Enable Vim keybindings</div>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={settings.vimMode}
                onChange={(e) => handleChange('vimMode', e.target.checked)}
                className="accent-cosmic-accent h-4 w-4 rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-400 flex items-center gap-2">
                        <Type className="w-4 h-4" /> Editor Font Size
                    </label>
                    <input 
                        type="number"
                        value={settings.editorFontSize}
                        onChange={(e) => handleChange('editorFontSize', parseInt(e.target.value))}
                        className="bg-cosmic-900 border border-cosmic-600 rounded p-2 text-sm text-white"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-400 flex items-center gap-2">
                        <Terminal className="w-4 h-4" /> Terminal Font Size
                    </label>
                    <input 
                        type="number"
                        value={settings.terminalFontSize}
                        onChange={(e) => handleChange('terminalFontSize', parseInt(e.target.value))}
                        className="bg-cosmic-900 border border-cosmic-600 rounded p-2 text-sm text-white"
                    />
                </div>
            </div>
          </div>
        </section>

      </div>
      </div>
    </div>
  );
};