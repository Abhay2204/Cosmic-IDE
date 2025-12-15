
import React, { useEffect, useRef, useState } from 'react';
import { TerminalLine, BottomTab, Diagnostic } from '../types';
import { Terminal as TerminalIcon, XCircle, AlertTriangle, Bug, Info, ChevronRight, Eraser } from 'lucide-react';
import SimpleTerminal from './SimpleTerminal';

interface TerminalPanelProps {
  lines: TerminalLine[];
  onCommand: (cmd: string) => void;
  activeTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
  diagnostics: Diagnostic[];
  outputChannels: Map<string, string[]>;
}

interface Terminal {
  id: string;
  name: string;
  lines: TerminalLine[];
  input: string;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({ 
    lines, 
    onCommand, 
    activeTab, 
    onTabChange,
    diagnostics,
    outputChannels
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [terminals, setTerminals] = useState<Terminal[]>([
    { id: '1', name: 'Terminal 1', lines: lines, input: '' }
  ]);
  const [activeTerminalId, setActiveTerminalId] = useState('1');
  const [selectedChannel, setSelectedChannel] = useState<string>('Extension Host');

  const activeTerminal = terminals.find(t => t.id === activeTerminalId) || terminals[0];

  // Auto-scroll terminal
  useEffect(() => {
    if (activeTab === BottomTab.Terminal) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTerminal.lines, activeTab]);

  // Update terminal lines when props change
  useEffect(() => {
    setTerminals(prev => prev.map(t => 
      t.id === '1' ? { ...t, lines } : t
    ));
  }, [lines]);

  const handleSplitTerminal = () => {
    const newId = `terminal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newTerminal: Terminal = {
      id: newId,
      name: `Terminal ${terminals.length + 1}`,
      lines: [{ id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, content: 'New terminal session started...', type: 'info' }],
      input: ''
    };
    setTerminals(prev => [...prev, newTerminal]);
    setActiveTerminalId(newId);
  };

  const handleCloseTerminal = (terminalId: string) => {
    if (terminals.length > 1) {
      setTerminals(prev => prev.filter(t => t.id !== terminalId));
      if (activeTerminalId === terminalId) {
        setActiveTerminalId(terminals.find(t => t.id !== terminalId)?.id || terminals[0].id);
      }
    }
  };

  // Listen for split terminal events
  useEffect(() => {
    const handleSplitEvent = () => handleSplitTerminal();
    window.addEventListener('splitTerminal', handleSplitEvent);
    return () => window.removeEventListener('splitTerminal', handleSplitEvent);
  }, [terminals.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTerminal.input.trim()) return;
    onCommand(activeTerminal.input);
    setTerminals(prev => prev.map(t => 
      t.id === activeTerminalId ? { ...t, input: '' } : t
    ));
  };

  const updateTerminalInput = (value: string) => {
    setTerminals(prev => prev.map(t => 
      t.id === activeTerminalId ? { ...t, input: value } : t
    ));
  };

  const getProblemCount = () => diagnostics.length;

  return (
    <div className="h-full flex flex-col bg-cosmic-800 border-t border-cosmic-600">
      {/* Tabs Header */}
      <div className="flex items-center gap-6 px-4 py-2 border-b border-cosmic-700 text-xs font-semibold text-gray-500 uppercase tracking-wide select-none">
        <div 
            onClick={() => onTabChange(BottomTab.Problems)}
            className={`cursor-pointer hover:text-gray-300 flex items-center gap-1.5 pb-2 -mb-2.5 border-b-2 transition-colors ${activeTab === BottomTab.Problems ? 'text-gray-200 border-cosmic-accent' : 'border-transparent'}`}
        >
            <XCircle className="w-3.5 h-3.5" />
            Problems
            {getProblemCount() > 0 && (
                <span className="bg-cosmic-700 text-gray-200 px-1.5 rounded-full text-[10px]">{getProblemCount()}</span>
            )}
        </div>
        <div 
            onClick={() => onTabChange(BottomTab.Output)}
            className={`cursor-pointer hover:text-gray-300 flex items-center gap-1.5 pb-2 -mb-2.5 border-b-2 transition-colors ${activeTab === BottomTab.Output ? 'text-gray-200 border-cosmic-accent' : 'border-transparent'}`}
        >
            <Info className="w-3.5 h-3.5" />
            Output
        </div>
        <div 
            onClick={() => onTabChange(BottomTab.DebugConsole)}
            className={`cursor-pointer hover:text-gray-300 flex items-center gap-1.5 pb-2 -mb-2.5 border-b-2 transition-colors ${activeTab === BottomTab.DebugConsole ? 'text-gray-200 border-cosmic-accent' : 'border-transparent'}`}
        >
            <Bug className="w-3.5 h-3.5" />
            Debug Console
        </div>
        <div 
            onClick={() => onTabChange(BottomTab.Terminal)}
            className={`cursor-pointer hover:text-gray-300 flex items-center gap-1.5 pb-2 -mb-2.5 border-b-2 transition-colors ${activeTab === BottomTab.Terminal ? 'text-gray-200 border-cosmic-accent' : 'border-transparent'}`}
        >
            <TerminalIcon className="w-3.5 h-3.5" />
            Terminal
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative bg-cosmic-900">
        
        {/* --- PROBLEMS TAB --- */}
        {activeTab === BottomTab.Problems && (
            <div className="h-full overflow-y-auto">
                {diagnostics.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs">
                        <span>No problems have been detected in the workspace.</span>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-cosmic-800 text-xs text-gray-500 sticky top-0">
                            <tr>
                                <th className="p-2 font-normal pl-4">Message</th>
                                <th className="p-2 font-normal w-32">Source</th>
                                <th className="p-2 font-normal w-24">File</th>
                                <th className="p-2 font-normal w-16">Ln</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs font-mono">
                            {diagnostics.map((d) => (
                                <tr key={d.id} className="border-b border-cosmic-800 hover:bg-cosmic-700/30 cursor-pointer">
                                    <td className="p-2 pl-4 flex items-center gap-2">
                                        {d.severity === 'error' ? (
                                            <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                        ) : (
                                            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                                        )}
                                        <span className="text-gray-300 truncate">{d.message}</span>
                                    </td>
                                    <td className="p-2 text-gray-500">{d.source}</td>
                                    <td className="p-2 text-gray-400 hover:text-blue-400 hover:underline">{d.fileName}</td>
                                    <td className="p-2 text-gray-500">{d.line}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        )}

        {/* --- OUTPUT TAB --- */}
        {activeTab === BottomTab.Output && (
            <div className="h-full flex flex-col">
                <div className="flex items-center gap-2 p-2 border-b border-cosmic-700 bg-cosmic-800">
                    <span className="text-xs text-gray-400">Channel:</span>
                    <select 
                        value={selectedChannel} 
                        onChange={(e) => setSelectedChannel(e.target.value)}
                        className="bg-cosmic-900 border border-cosmic-600 text-xs text-white rounded px-2 py-1 outline-none focus:ring-1 focus:ring-cosmic-accent"
                    >
                        {Array.from(outputChannels.keys()).map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                    <div className="ml-auto flex gap-2">
                        <Eraser className="w-3.5 h-3.5 text-gray-500 cursor-pointer hover:text-white" />
                    </div>
                </div>
                <div className="flex-1 p-3 font-mono text-xs text-gray-300 overflow-y-auto whitespace-pre-wrap">
                    {outputChannels.get(selectedChannel)?.map((line, i) => (
                        <div key={i}>{line}</div>
                    )) || <div className="text-gray-600 italic">No output for this channel.</div>}
                </div>
            </div>
        )}

        {/* --- DEBUG CONSOLE TAB --- */}
        {activeTab === BottomTab.DebugConsole && (
            <div className="h-full flex flex-col p-2">
                <div className="flex-1 font-mono text-xs text-gray-400 p-2 italic">
                    Debug console ready. Start debugging to see output.
                    <br/>
                    Attaching to process... Done.
                </div>
                <div className="flex items-center gap-2 border-t border-cosmic-700 pt-2 px-1">
                    <ChevronRight className="w-4 h-4 text-blue-500" />
                    <input 
                        type="text" 
                        placeholder="Evaluate expression..." 
                        className="flex-1 bg-transparent text-sm text-white outline-none font-mono placeholder:text-gray-600"
                    />
                </div>
            </div>
        )}

        {/* --- TERMINAL TAB --- */}
        {activeTab === BottomTab.Terminal && (
            <SimpleTerminal onCommand={onCommand} />
        )}
      </div>
    </div>
  );
};
