import React, { useState, useRef, useEffect } from 'react';
import { Message, AIModel } from '../types';
import { Send, Bot, User, Loader2, Sparkles, Paperclip, Globe, FileCode, Zap, ChevronDown, Book } from 'lucide-react';
import { getAllModels } from '../services/aiService';

interface ChatPaneProps {
  messages: Message[];
  onSendMessage: (text: string, modelId: string) => void;
  isProcessing: boolean;
  selectedModel: string;
  onModelChange: (id: string) => void;
  customProviders?: any[];
}

export const ChatPane: React.FC<ChatPaneProps> = ({ 
  messages, 
  onSendMessage, 
  isProcessing,
  selectedModel,
  onModelChange,
  customProviders = []
}) => {
  const [input, setInput] = useState('');
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [showContextPicker, setShowContextPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendMessage(input, selectedModel);
    setInput('');
    setShowContextPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as any);
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setInput(val);
      // Simple logic to show context picker if the last char is @
      if (val.endsWith('@')) {
          setShowContextPicker(true);
      } else if (val.endsWith(' ')) {
          setShowContextPicker(false);
      }
  };

  const insertContext = (context: string) => {
      setInput(prev => prev + context + ' ');
      setShowContextPicker(false);
      textareaRef.current?.focus();
  };

  return (
    <div className="h-full flex flex-col bg-cosmic-800 border-l border-cosmic-600 w-80 md:w-96 transition-all duration-300">
      {/* Header / Model Selector */}
      <div className="p-3 border-b border-cosmic-600 flex flex-col gap-2 bg-cosmic-900/50 backdrop-blur">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cosmic-accent font-semibold">
                {isAgentMode ? <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" /> : <Sparkles className="w-4 h-4" />}
                <span>{isAgentMode ? 'Cosmic Agent' : 'Cosmic Chat'}</span>
            </div>
            <div className="flex items-center gap-2">
                 <button 
                    onClick={() => setIsAgentMode(!isAgentMode)}
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border transition-colors ${isAgentMode ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-cosmic-700 border-gray-600 text-gray-400'}`}
                >
                    {isAgentMode ? 'Agent On' : 'Agent Off'}
                </button>
            </div>
        </div>
        
        <select 
            value={selectedModel} 
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full bg-cosmic-700 text-xs text-white border-none rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-cosmic-accent appearance-none cursor-pointer hover:bg-cosmic-600 transition"
        >
            {getAllModels(customProviders).map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.contextWindow ? `(${(m.contextWindow / 1000).toFixed(0)}K)` : ''}
                </option>
            ))}
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
             <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
                {msg.role === 'user' ? (
                    <>You <User className="w-3 h-3" /></>
                ) : (
                    <><Bot className="w-3 h-3 text-cosmic-accent" /> {msg.role === 'system' ? 'System' : 'Cosmic'}</>
                )}
             </div>
             <div 
                className={`
                    max-w-[90%] rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap shadow-lg
                    ${msg.role === 'user' 
                        ? 'bg-cosmic-600 text-white rounded-br-none border border-cosmic-500' 
                        : 'bg-cosmic-700/50 text-gray-200 rounded-bl-none border border-cosmic-600'}
                `}
             >
                {msg.content}
             </div>
          </div>
        ))}
        {isProcessing && (
            <div className="flex items-start gap-2 animate-pulse">
                <Bot className="w-3 h-3 text-cosmic-accent mt-1" />
                <div className="bg-cosmic-700/30 rounded-lg p-3 rounded-bl-none flex items-center gap-2 text-sm text-cosmic-accent">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isAgentMode ? 'Agent is thinking & planning...' : 'Thinking...'}
                </div>
            </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-cosmic-600 bg-cosmic-800 relative">
         {/* Context Menu Popup */}
         {showContextPicker && (
             <div className="absolute bottom-full left-4 mb-2 bg-cosmic-900 border border-cosmic-600 rounded-lg shadow-2xl w-64 overflow-hidden z-20">
                 <div className="px-3 py-2 text-xs font-bold text-gray-500 border-b border-cosmic-700">SUGGESTED CONTEXT</div>
                 <div className="p-1">
                     <button onClick={() => insertContext('Files')} className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-cosmic-700 hover:text-white rounded text-left"><FileCode className="w-3 h-3 text-blue-400"/> Files</button>
                     <button onClick={() => insertContext('Web')} className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-cosmic-700 hover:text-white rounded text-left"><Globe className="w-3 h-3 text-green-400"/> Web</button>
                     <button onClick={() => insertContext('Codebase')} className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-cosmic-700 hover:text-white rounded text-left"><Sparkles className="w-3 h-3 text-purple-400"/> Codebase</button>
                     <button onClick={() => insertContext('Docs')} className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-cosmic-700 hover:text-white rounded text-left"><Book className="w-3 h-3 text-yellow-400"/> Docs</button>
                 </div>
             </div>
         )}

         {/* Context Helpers */}
         <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
            <button onClick={() => insertContext('@Files')} className="flex items-center gap-1 text-[10px] bg-cosmic-700 hover:bg-cosmic-600 px-2 py-1 rounded text-gray-300 transition border border-transparent hover:border-cosmic-500">
                <FileCode className="w-3 h-3 text-blue-400" /> @Files
            </button>
            <button onClick={() => insertContext('@Web')} className="flex items-center gap-1 text-[10px] bg-cosmic-700 hover:bg-cosmic-600 px-2 py-1 rounded text-gray-300 transition border border-transparent hover:border-cosmic-500">
                <Globe className="w-3 h-3 text-green-400" /> @Web
            </button>
            <button onClick={() => insertContext('@Docs')} className="flex items-center gap-1 text-[10px] bg-cosmic-700 hover:bg-cosmic-600 px-2 py-1 rounded text-gray-300 transition border border-transparent hover:border-cosmic-500">
                <Book className="w-3 h-3 text-yellow-400" /> @Docs
            </button>
         </div>

         <form className="relative group" onSubmit={handleSubmit}>
            <textarea 
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={isAgentMode ? "Describe a task for the Agent..." : "Ask a question (Type @ for context)..."}
                className={`w-full bg-cosmic-900 border rounded-lg pl-3 pr-10 py-3 text-sm focus:outline-none focus:ring-1 text-white resize-none h-24 scrollbar-hide transition-colors
                    ${isAgentMode ? 'border-yellow-900/50 focus:border-yellow-500/50 focus:ring-yellow-500/20' : 'border-cosmic-600 focus:border-cosmic-accent focus:ring-cosmic-accent'}
                `}
            />
            <button 
                type="submit"
                disabled={isProcessing || !input.trim()}
                className={`absolute bottom-2 right-2 p-1.5 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all
                    ${isAgentMode ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-cosmic-accent hover:bg-indigo-400'}
                `}
            >
                <Send className="w-4 h-4" />
            </button>
         </form>
         <div className="flex justify-between items-center mt-2 px-1">
             <div className="text-[10px] text-gray-500">
                {isAgentMode ? 'Agent Mode: ON' : 'Standard Chat'}
             </div>
             <div className="text-[10px] text-gray-600">
                Cmd+K to toggle
             </div>
         </div>
      </div>
    </div>
  );
};