import React, { useState, useEffect } from 'react';
import { Play, Square, SkipForward, ArrowDown, ArrowRight, ArrowUp, RotateCcw, Bug, Circle, Settings } from 'lucide-react';

interface Breakpoint {
  id: string;
  file: string;
  line: number;
  enabled: boolean;
  condition?: string;
}

interface Variable {
  name: string;
  value: string;
  type: string;
  expandable?: boolean;
  children?: Variable[];
}

interface StackFrame {
  id: string;
  name: string;
  file: string;
  line: number;
  column: number;
}

interface DebugPanelProps {
  activeFile?: string;
  onBreakpointToggle?: (file: string, line: number) => void;
  onDebugStart?: () => void;
  onDebugStop?: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  activeFile,
  onBreakpointToggle,
  onDebugStart,
  onDebugStop
}) => {
  const [isDebugging, setIsDebugging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([
    { id: '1', file: 'main.py', line: 15, enabled: true },
    { id: '2', file: 'app.js', line: 23, enabled: false, condition: 'x > 10' }
  ]);
  const [variables, setVariables] = useState<Variable[]>([
    { name: 'x', value: '42', type: 'number' },
    { name: 'user', value: '{...}', type: 'object', expandable: true, children: [
      { name: 'name', value: '"John Doe"', type: 'string' },
      { name: 'age', value: '30', type: 'number' },
      { name: 'active', value: 'true', type: 'boolean' }
    ]},
    { name: 'items', value: '[...]', type: 'array', expandable: true, children: [
      { name: '[0]', value: '"item1"', type: 'string' },
      { name: '[1]', value: '"item2"', type: 'string' },
      { name: '[2]', value: '"item3"', type: 'string' }
    ]}
  ]);
  const [callStack, setCallStack] = useState<StackFrame[]>([
    { id: '1', name: 'main()', file: 'main.py', line: 15, column: 4 },
    { id: '2', name: 'process_data()', file: 'utils.py', line: 42, column: 8 },
    { id: '3', name: 'validate_input()', file: 'validators.py', line: 18, column: 12 }
  ]);
  const [watchExpressions, setWatchExpressions] = useState<string[]>(['x + y', 'user.name', 'items.length']);
  const [newWatch, setNewWatch] = useState('');
  const [debugOutput, setDebugOutput] = useState<string[]>([
    'Debugger attached to process 1234',
    'Breakpoint hit at main.py:15',
    'Variables loaded successfully'
  ]);

  const handleStartDebugging = () => {
    setIsDebugging(true);
    setIsPaused(false);
    setDebugOutput(prev => [...prev, `Started debugging ${activeFile || 'application'}`]);
    onDebugStart?.();
  };

  const handleStopDebugging = () => {
    setIsDebugging(false);
    setIsPaused(false);
    setDebugOutput(prev => [...prev, 'Debugging stopped']);
    onDebugStop?.();
  };

  const handlePause = () => {
    setIsPaused(true);
    setDebugOutput(prev => [...prev, 'Execution paused']);
  };

  const handleContinue = () => {
    setIsPaused(false);
    setDebugOutput(prev => [...prev, 'Execution continued']);
  };

  const handleStepOver = () => {
    setDebugOutput(prev => [...prev, 'Step over executed']);
  };

  const handleStepInto = () => {
    setDebugOutput(prev => [...prev, 'Step into executed']);
  };

  const handleStepOut = () => {
    setDebugOutput(prev => [...prev, 'Step out executed']);
  };

  const handleRestart = () => {
    setDebugOutput(prev => [...prev, 'Debugging restarted']);
  };

  const toggleBreakpoint = (id: string) => {
    setBreakpoints(prev => prev.map(bp => 
      bp.id === id ? { ...bp, enabled: !bp.enabled } : bp
    ));
  };

  const removeBreakpoint = (id: string) => {
    setBreakpoints(prev => prev.filter(bp => bp.id !== id));
  };

  const addWatchExpression = () => {
    if (newWatch.trim()) {
      setWatchExpressions(prev => [...prev, newWatch.trim()]);
      setNewWatch('');
    }
  };

  const removeWatchExpression = (index: number) => {
    setWatchExpressions(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full bg-cosmic-800 text-gray-300">
      <div className="p-3 uppercase text-xs font-bold text-gray-500 tracking-wider flex justify-between items-center">
        <span>Run and Debug</span>
        <Settings className="w-3 h-3 cursor-pointer hover:text-white" />
      </div>

      {/* Debug Controls */}
      <div className="px-3 pb-3 border-b border-cosmic-700">
        <div className="flex items-center gap-2 mb-3">
          {!isDebugging ? (
            <button
              onClick={handleStartDebugging}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-sm font-medium"
            >
              <Play className="w-4 h-4" />
              Start Debugging
            </button>
          ) : (
            <div className="flex items-center gap-1">
              {isPaused ? (
                <button
                  onClick={handleContinue}
                  className="p-1.5 bg-green-600 hover:bg-green-500 text-white rounded"
                  title="Continue"
                >
                  <Play className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="p-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded"
                  title="Pause"
                >
                  <Square className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleStopDebugging}
                className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded"
                title="Stop"
              >
                <Square className="w-4 h-4" />
              </button>
              <button
                onClick={handleRestart}
                className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-cosmic-600 mx-1" />
              <button
                onClick={handleStepOver}
                className="p-1.5 bg-cosmic-600 hover:bg-cosmic-500 text-white rounded"
                title="Step Over"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                onClick={handleStepInto}
                className="p-1.5 bg-cosmic-600 hover:bg-cosmic-500 text-white rounded"
                title="Step Into"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                onClick={handleStepOut}
                className="p-1.5 bg-cosmic-600 hover:bg-cosmic-500 text-white rounded"
                title="Step Out"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {isDebugging && (
          <div className="text-xs text-green-400 flex items-center gap-2">
            <Circle className="w-2 h-2 fill-current" />
            {isPaused ? 'Paused on breakpoint' : 'Running...'}
          </div>
        )}
      </div>

      {/* Debug Sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Variables */}
        <div className="border-b border-cosmic-700">
          <div className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300">
            Variables
          </div>
          <div className="px-3 pb-3">
            {variables.map((variable, index) => (
              <VariableItem key={index} variable={variable} level={0} />
            ))}
          </div>
        </div>

        {/* Watch */}
        <div className="border-b border-cosmic-700">
          <div className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
            Watch
          </div>
          <div className="px-3 pb-3">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newWatch}
                onChange={(e) => setNewWatch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addWatchExpression()}
                placeholder="Add expression to watch..."
                className="flex-1 bg-black/20 border border-cosmic-600 text-sm text-white p-1 rounded outline-none focus:border-cosmic-accent"
              />
              <button
                onClick={addWatchExpression}
                className="px-2 py-1 bg-cosmic-600 hover:bg-cosmic-500 text-white rounded text-xs"
              >
                +
              </button>
            </div>
            {watchExpressions.map((expr, index) => (
              <div key={index} className="flex items-center justify-between text-sm py-1 hover:bg-cosmic-700 rounded px-1">
                <span className="font-mono text-gray-300">{expr}</span>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 text-xs">42</span>
                  <button
                    onClick={() => removeWatchExpression(index)}
                    className="text-gray-500 hover:text-red-400 text-xs"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call Stack */}
        <div className="border-b border-cosmic-700">
          <div className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
            Call Stack
          </div>
          <div className="px-3 pb-3">
            {callStack.map((frame, index) => (
              <div key={frame.id} className="text-sm py-1 hover:bg-cosmic-700 rounded px-1 cursor-pointer">
                <div className="font-mono text-gray-300">{frame.name}</div>
                <div className="text-xs text-gray-500">{frame.file}:{frame.line}:{frame.column}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Breakpoints */}
        <div className="border-b border-cosmic-700">
          <div className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
            Breakpoints
          </div>
          <div className="px-3 pb-3">
            {breakpoints.map((breakpoint) => (
              <div key={breakpoint.id} className="flex items-center justify-between text-sm py-1 hover:bg-cosmic-700 rounded px-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleBreakpoint(breakpoint.id)}
                    className={`w-3 h-3 rounded-full border-2 ${
                      breakpoint.enabled 
                        ? 'bg-red-500 border-red-500' 
                        : 'border-gray-500'
                    }`}
                  />
                  <div>
                    <div className="font-mono text-gray-300">{breakpoint.file}:{breakpoint.line}</div>
                    {breakpoint.condition && (
                      <div className="text-xs text-yellow-400">Condition: {breakpoint.condition}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeBreakpoint(breakpoint.id)}
                  className="text-gray-500 hover:text-red-400 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Debug Console Output */}
        <div>
          <div className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
            Debug Console
          </div>
          <div className="px-3 pb-3">
            <div className="bg-black/20 rounded p-2 font-mono text-xs max-h-32 overflow-y-auto">
              {debugOutput.map((line, index) => (
                <div key={index} className="text-gray-300 mb-1">{line}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Variable Item Component with Expandable Support
const VariableItem: React.FC<{ variable: Variable; level: number }> = ({ variable, level }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ marginLeft: `${level * 12}px` }}>
      <div className="flex items-center justify-between text-sm py-1 hover:bg-cosmic-700 rounded px-1">
        <div className="flex items-center gap-2">
          {variable.expandable && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500 hover:text-white text-xs"
            >
              {expanded ? '▼' : '▶'}
            </button>
          )}
          <span className="font-mono text-blue-400">{variable.name}</span>
          <span className="text-gray-500">:</span>
          <span className="text-green-400">{variable.value}</span>
        </div>
        <span className="text-xs text-gray-500">{variable.type}</span>
      </div>
      {expanded && variable.children && (
        <div>
          {variable.children.map((child, index) => (
            <VariableItem key={index} variable={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};