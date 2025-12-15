import React, { useState, useRef, useEffect } from 'react';
import { TerminalService } from '../services/terminalService';

interface SimpleTerminalProps {
  onCommand?: (cmd: string) => void;
  fontSize?: number;
  cwd?: string;
}

interface TerminalLine {
  id: string;
  content: string;
  type: 'input' | 'output' | 'error' | 'success';
}

export const SimpleTerminal: React.FC<SimpleTerminalProps> = ({ onCommand, fontSize = 14, cwd }) => {
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: '1', content: 'Cosmic IDE Terminal v3.0 - Ready', type: 'success' },
    { id: '2', content: 'Windows Commands: dir, cd, python, npm, git, etc.', type: 'output' },
    { id: '3', content: '', type: 'output' },
  ]);
  
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDir, setCurrentDir] = useState(cwd || 'C:\\Users\\abhay\\Documents\\project 3\\cosmic-ide');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-focus input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  // Update current directory when cwd prop changes
  useEffect(() => {
    if (cwd && cwd !== currentDir) {
      setCurrentDir(cwd);
    }
  }, [cwd]);

  const addLine = (content: string, type: TerminalLine['type'] = 'output') => {
    const newLine: TerminalLine = {
      id: Date.now().toString() + Math.random(),
      content,
      type
    };
    setLines(prev => [...prev, newLine]);
  };

  const getPrompt = () => {
    const shortDir = currentDir.length > 50 ? '...' + currentDir.slice(-47) : currentDir;
    return `cosmic:${shortDir}$`;
  };

  // Windows command aliases
  const getWindowsCommand = (cmd: string, args: string[]) => {
    const command = cmd.toLowerCase();
    const params = args.join(' ');
    
    switch (command) {
      case 'ls':
        return params ? `dir ${params}` : 'dir';
      case 'cat':
        return params ? `type ${params}` : 'type';
      case 'rm':
        return params ? `del ${params}` : 'del';
      case 'mv':
        return params ? `move ${params}` : 'move';
      case 'cp':
        return params ? `copy ${params}` : 'copy';
      case 'touch':
        return params ? `type nul > ${params}` : 'type nul > newfile.txt';
      case 'which':
        return params ? `where ${params}` : 'where';
      default:
        return params ? `${cmd} ${params}` : cmd;
    }
  };

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;

    // Add command to history
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    // Add command line to display
    addLine(`${getPrompt()} ${cmd}`, 'input');

    if (onCommand) onCommand(cmd);

    const command = cmd.split(' ')[0].toLowerCase();

    try {
      // Handle built-in commands
      if (command === 'clear' || command === 'cls') {
        setLines([]);
        return;
      } else if (command === 'help') {
        showHelp();
        return;
      }

      // Use TerminalService for all other commands
      const result = await TerminalService.executeCommand(cmd, currentDir);
      
      if (result.success) {
        if (result.output.trim()) {
          // Split output into lines and add each one
          const outputLines = result.output.split('\n');
          outputLines.forEach((line, index) => {
            if (line.trim() || index < outputLines.length - 1) {
              addLine(line, 'output');
            }
          });
        }
        
        // Update current directory if it changed
        if (result.cwd && result.cwd !== currentDir) {
          setCurrentDir(result.cwd);
        }
      } else {
        addLine(result.error || 'Command failed', 'error');
        if (result.output.trim()) {
          addLine(result.output, 'error');
        }
      }
    } catch (error) {
      addLine(`Error: ${error}`, 'error');
    }
  };

  const showHelp = () => {
    const helpLines = TerminalService.getCommandHelp();
    helpLines.forEach(line => {
      addLine(line, 'output');
    });
    addLine('  help              - Show this help', 'output');
    addLine('', 'output');
    addLine('Note: Unix commands (ls, cat, etc.) are automatically converted to Windows equivalents.', 'output');
  };

  const executeShellCommand = async (cmd: string, electronAPI: any) => {
    if (!electronAPI?.shellExec) {
      addLine('Shell execution not available - run in Electron mode', 'error');
      return;
    }

    try {
      console.log(`Executing command: "${cmd}" in directory: "${currentDir}"`);
      const result = await electronAPI.shellExec(cmd, currentDir);
      console.log('Shell execution result:', result);
      
      if (result.success) {
        // Handle stdout
        if (result.stdout && result.stdout.trim()) {
          const lines = result.stdout.split('\n');
          lines.forEach((line: string) => {
            if (line.trim()) {
              addLine(line, 'output');
            }
          });
        }
        
        // Handle stderr (warnings/info, not necessarily errors for successful commands)
        if (result.stderr && result.stderr.trim()) {
          const lines = result.stderr.split('\n');
          lines.forEach((line: string) => {
            if (line.trim()) {
              // Show stderr as output for successful commands, error for failed ones
              addLine(line, result.success ? 'output' : 'error');
            }
          });
        }
        
        // If no output at all, show success for certain commands
        if (!result.stdout?.trim() && !result.stderr?.trim()) {
          const silentCommands = ['mkdir', 'del', 'copy', 'move', 'md', 'rd'];
          const cmdName = cmd.split(' ')[0].toLowerCase();
          if (silentCommands.includes(cmdName)) {
            addLine('Command executed successfully', 'success');
          }
        }

        // Update current directory after any command that might change it
        await updateCurrentDirectory(electronAPI);
      } else {
        // Command failed
        addLine(`Command failed: ${result.error || 'Unknown error'}`, 'error');
        if (result.stderr) {
          addLine(result.stderr, 'error');
        }
      }
    } catch (error) {
      addLine(`Execution error: ${error}`, 'error');
    }
  };

  const updateCurrentDirectory = async (electronAPI: any) => {
    try {
      // Get current working directory after command execution
      if (electronAPI?.shellPwd) {
        const result = await electronAPI.shellPwd(currentDir);
        if (result.success && result.cwd && result.cwd !== currentDir) {
          setCurrentDir(result.cwd);
          console.log(`Directory updated to: ${result.cwd}`);
        }
      }
    } catch (error) {
      // Silently fail - not critical
      console.log('Failed to update current directory:', error);
    }
  };

  const handleCd = async (params: string[], electronAPI: any) => {
    if (params.length === 0) {
      addLine(currentDir, 'output');
      return;
    }

    const newDir = params[0];
    if (electronAPI?.shellExec) {
      try {
        // Use Windows cd command with /d flag to change drives too
        const cdCommand = `cd /d "${newDir}" && cd`;
        
        const result = await electronAPI.shellExec(cdCommand, currentDir);
        if (result.success && result.stdout) {
          const newPath = result.stdout.trim();
          setCurrentDir(newPath);
          addLine(`Changed directory to: ${newPath}`, 'success');
        } else {
          addLine(`cd: ${newDir}: The system cannot find the path specified.`, 'error');
        }
      } catch (error) {
        addLine(`Error: ${error}`, 'error');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(currentInput);
      setCurrentInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Basic tab completion could be added here
    }
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return 'text-blue-400';
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div 
      className="h-full w-full bg-cosmic-900 text-gray-300 font-mono overflow-hidden flex flex-col"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Terminal Output */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
        style={{ fontSize: `${fontSize}px` }}
      >
        {lines.map((line) => (
          <div key={line.id} className={`whitespace-pre-wrap ${getLineColor(line.type)}`}>
            {line.content}
          </div>
        ))}
        
        {/* Current Input Line */}
        <div className="flex items-center text-gray-300">
          <span className="text-green-400 mr-2">{getPrompt()}</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-gray-300 font-mono"
            style={{ fontSize: `${fontSize}px` }}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};

export default SimpleTerminal;