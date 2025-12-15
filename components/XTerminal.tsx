import React, { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

interface XTerminalProps {
  onCommand?: (cmd: string) => void;
  fontSize?: number;
  cwd?: string;
}

export const XTerminal: React.FC<XTerminalProps> = ({ onCommand, fontSize = 14, cwd }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const isInitializedRef = useRef(false);
  const currentDirRef = useRef<string>(cwd || 'C:\\Users\\abhay\\Documents\\project 3\\cosmic-ide');

  const initTerminal = useCallback(async () => {
    if (!terminalRef.current || isInitializedRef.current) return;
    isInitializedRef.current = true;

    const term = new Terminal({
      theme: {
        background: '#05050A',
        foreground: '#E4E4E7',
        cursor: '#6366F1',
        cursorAccent: '#05050A',
        selectionBackground: '#44475A',
        black: '#21222C',
        red: '#FF5555',
        green: '#50FA7B',
        yellow: '#F1FA8C',
        blue: '#BD93F9',
        magenta: '#FF79C6',
        cyan: '#8BE9FD',
        white: '#F8F8F2',
        brightBlack: '#6272A4',
        brightRed: '#FF6E6E',
        brightGreen: '#69FF94',
        brightYellow: '#FFFFA5',
        brightBlue: '#D6ACFF',
        brightMagenta: '#FF92DF',
        brightCyan: '#A4FFFF',
        brightWhite: '#FFFFFF',
      },
      fontSize,
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      cursorBlink: true,
      cursorStyle: 'bar',
      allowTransparency: true,
      scrollback: 10000,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(terminalRef.current);
    
    setTimeout(() => fitAddon.fit(), 50);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Initialize clean terminal
    initCleanTerminal(term);

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [cwd, fontSize, onCommand]);

  // Clean terminal implementation
  const initCleanTerminal = (term: Terminal) => {
    const electronAPI = (window as any).electronAPI;
    
    // Show banner
    term.writeln('\x1b[1;36m╔══════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[1;36m║\x1b[0m   \x1b[1;32mCosmic IDE Terminal v3.0\x1b[0m          \x1b[1;36m║\x1b[0m');
    term.writeln('\x1b[1;36m║\x1b[0m   \x1b[36mClean Shell Implementation\x1b[0m        \x1b[1;36m║\x1b[0m');
    term.writeln('\x1b[1;36m╚══════════════════════════════════════╝\x1b[0m');
    term.writeln('');
    term.writeln('\x1b[90mType "help" to see all available commands\x1b[0m');
    term.writeln('\x1b[36mTry: ls, python app.py, git status, npm install\x1b[0m');
    term.writeln('');
    
    // Focus the terminal immediately
    setTimeout(() => {
      term.focus();
    }, 100);
    
    writePrompt(term, false);

    let currentInput = '';
    const commandHistory: string[] = [];
    let historyIndex = -1;

    // Use onData instead of onKey for more reliable input handling
    term.onData((data) => {
      console.log('Terminal received data:', data, 'Code:', data.charCodeAt(0));
      
      // Handle different key codes
      if (data === '\r' || data === '\n') {
        // Enter key
        term.writeln('');
        if (currentInput.trim()) {
          console.log('Executing command:', currentInput.trim());
          executeCommand(term, currentInput.trim(), commandHistory);
          commandHistory.push(currentInput.trim());
          historyIndex = -1;
        } else {
          writePrompt(term, true);
        }
        currentInput = '';
      } else if (data === '\u007F' || data === '\b') {
        // Backspace
        if (currentInput.length > 0) {
          currentInput = currentInput.slice(0, -1);
          term.write('\b \b');
        }
      } else if (data === '\u001b[A') {
        // Arrow Up
        if (commandHistory.length > 0) {
          const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
          historyIndex = newIndex;
          const cmd = commandHistory[commandHistory.length - 1 - newIndex];
          term.write('\r\x1b[K');
          writePrompt(term, false);
          term.write(cmd);
          currentInput = cmd;
        }
      } else if (data === '\u001b[B') {
        // Arrow Down
        if (historyIndex > 0) {
          historyIndex--;
          const cmd = commandHistory[commandHistory.length - 1 - historyIndex];
          term.write('\r\x1b[K');
          writePrompt(term, false);
          term.write(cmd);
          currentInput = cmd;
        } else if (historyIndex === 0) {
          historyIndex = -1;
          term.write('\r\x1b[K');
          writePrompt(term, false);
          currentInput = '';
        }
      } else if (data === '\u0003') {
        // Ctrl+C
        term.writeln('^C');
        currentInput = '';
        writePrompt(term, true);
      } else if (data === '\u000C') {
        // Ctrl+L
        term.clear();
        writePrompt(term, true);
      } else if (data.length === 1 && data >= ' ' && data <= '~') {
        // Printable characters
        currentInput += data;
        term.write(data);
        console.log('Added character:', data, 'Current input:', currentInput);
      }
    });
  };

  const writePrompt = (term: Terminal, newLine = true) => {
    if (newLine) term.write('\r\n');
    const shortDir = currentDirRef.current.length > 50 ? '...' + currentDirRef.current.slice(-47) : currentDirRef.current;
    term.write(`\x1b[1;32mcosmic\x1b[0m:\x1b[1;34m${shortDir}\x1b[0m$ `);
  };

  const executeCommand = async (term: Terminal, cmd: string, history: string[]) => {
    const args = cmd.split(' ');
    const command = args[0].toLowerCase();
    const params = args.slice(1);

    if (onCommand) onCommand(cmd);

    const electronAPI = (window as any).electronAPI;

    switch (command) {
      case 'help':
        showHelp(term);
        break;

      case 'clear':
        term.clear();
        writePrompt(term, true);
        break;

      case 'echo':
        term.writeln(params.join(' '));
        writePrompt(term, true);
        break;

      case 'history':
        history.forEach((c, i) => term.writeln(`  ${i + 1}  ${c}`));
        writePrompt(term, true);
        break;

      case 'date':
        term.writeln(new Date().toString());
        writePrompt(term, true);
        break;

      case 'pwd':
        term.writeln(currentDirRef.current);
        writePrompt(term, true);
        break;

      case 'whoami':
        term.writeln('cosmic-user');
        writePrompt(term, true);
        break;



      case 'cd':
        await handleCd(term, params, electronAPI);
        return;

      case 'ls':
      case 'dir':
        await handleLs(term, params, electronAPI);
        return;

      case 'mkdir':
        await handleMkdir(term, params, electronAPI);
        return;

      case 'touch':
        await handleTouch(term, params, electronAPI);
        return;

      case 'cat':
      case 'type':
        await handleCat(term, params, electronAPI);
        return;

      case 'create-react':
        await handleCreateReact(term, params, electronAPI);
        return;

      case 'dev':
        await handleDev(term, electronAPI);
        return;

      case 'build':
        await handleBuild(term, electronAPI);
        return;

      case 'test':
        await handleTest(term, electronAPI);
        return;

      case 'install':
        await handleInstall(term, params, electronAPI);
        return;

      case 'serve':
        await handleServe(term, electronAPI);
        return;

      default:
        await handleGenericCommand(term, cmd, electronAPI);
        return;
    }
  };

  // Command handlers
  const showHelp = (term: Terminal) => {
    term.writeln('\x1b[1;36m╔══════════════════════════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[1;36m║\x1b[0m                \x1b[1;32mCosmic IDE Terminal Commands\x1b[0m                \x1b[1;36m║\x1b[0m');
    term.writeln('\x1b[1;36m╚══════════════════════════════════════════════════════════╝\x1b[0m');
    term.writeln('');
    term.writeln('\x1b[1;33m📁 File & Directory Commands:\x1b[0m');
    term.writeln('  \x1b[33mls / dir [flags]\x1b[0m   - List directory contents');
    term.writeln('  \x1b[33mcd <dir>\x1b[0m          - Change directory');
    term.writeln('  \x1b[33mpwd\x1b[0m               - Show current directory');
    term.writeln('  \x1b[33mmkdir <name>\x1b[0m      - Create directory');
    term.writeln('  \x1b[33mtouch <file>\x1b[0m      - Create file');
    term.writeln('  \x1b[33mcat <file>\x1b[0m        - Display file contents');
    term.writeln('');
    term.writeln('\x1b[1;33m🐍 Python Development:\x1b[0m');
    term.writeln('  \x1b[32mpython <file>\x1b[0m     - Run Python scripts');
    term.writeln('  \x1b[32mpip install <pkg>\x1b[0m - Install Python packages');
    term.writeln('  \x1b[32mpython -m venv <name>\x1b[0m - Create virtual environment');
    term.writeln('  \x1b[32mpytest\x1b[0m            - Run Python tests');
    term.writeln('');
    term.writeln('\x1b[1;33m⚛️ React & Node.js:\x1b[0m');
    term.writeln('  \x1b[32mnpx create-react-app <name>\x1b[0m - Create React app');
    term.writeln('  \x1b[32mnpm start\x1b[0m         - Start development server');
    term.writeln('  \x1b[32mnpm run build\x1b[0m     - Build for production');
    term.writeln('  \x1b[32mnpm install <pkg>\x1b[0m - Install packages');
    term.writeln('  \x1b[32mnode <file>\x1b[0m       - Run Node.js scripts');
    term.writeln('');
    term.writeln('\x1b[1;33m🔧 Git & Development:\x1b[0m');
    term.writeln('  \x1b[32mgit status\x1b[0m        - Check git status');
    term.writeln('  \x1b[32mgit add .\x1b[0m         - Stage all changes');
    term.writeln('  \x1b[32mgit commit -m "msg"\x1b[0m - Commit changes');
    term.writeln('  \x1b[32mcode .\x1b[0m            - Open in VS Code');
    term.writeln('');
    term.writeln('\x1b[1;33m💻 System Commands:\x1b[0m');
    term.writeln('  \x1b[33mclear\x1b[0m             - Clear terminal');
    term.writeln('  \x1b[33mecho <text>\x1b[0m       - Print text');
    term.writeln('  \x1b[33mhistory\x1b[0m           - Command history');
    term.writeln('  \x1b[33mdate\x1b[0m              - Current date/time');
    term.writeln('  \x1b[33mwhoami\x1b[0m            - Current user');
    term.writeln('');
    term.writeln('\x1b[90m� All system cmommands are supported through shell execution\x1b[0m');
    writePrompt(term, true);
  };



  // Shell command handlers
  const handleCd = async (term: Terminal, params: string[], electronAPI: any) => {
    if (params.length === 0) {
      term.writeln(currentDirRef.current);
    } else {
      const newDir = params[0];
      if (electronAPI?.shellExec) {
        const cdCommand = `cd /d "${newDir}" && cd`;
        try {
          const result = await electronAPI.shellExec(cdCommand, currentDirRef.current);
          if (result.success && result.stdout) {
            currentDirRef.current = result.stdout.trim();
            term.writeln(`\x1b[32m${currentDirRef.current}\x1b[0m`);
          } else {
            term.writeln(`\x1b[31mcd: ${newDir}: No such file or directory\x1b[0m`);
          }
        } catch (error) {
          term.writeln(`\x1b[31mError: ${error}\x1b[0m`);
        }
      }
    }
    writePrompt(term, true);
  };

  const handleLs = async (term: Terminal, params: string[], electronAPI: any) => {
    if (electronAPI?.shellExec) {
      const flags = params.join(' ');
      // Detect platform from user agent as fallback
      const isWindows = navigator.userAgent.includes('Windows');
      const listCommand = isWindows 
        ? `dir ${flags}` 
        : `ls --color=always -la ${flags}`;
      try {
        const result = await electronAPI.shellExec(listCommand, currentDirRef.current);
        if (result.success && result.stdout) {
          term.write(result.stdout);
        } else {
          term.writeln(`\x1b[31mError listing directory\x1b[0m`);
        }
      } catch (error) {
        term.writeln(`\x1b[31mError: ${error}\x1b[0m`);
      }
    }
    writePrompt(term, true);
  };

  const handleMkdir = async (term: Terminal, params: string[], electronAPI: any) => {
    if (params.length === 0) {
      term.writeln('\x1b[31mUsage: mkdir <directory>\x1b[0m');
    } else if (electronAPI?.shellExec) {
      const dirName = params[0];
      try {
        const result = await electronAPI.shellExec(`mkdir "${dirName}"`, currentDirRef.current);
        if (result.success) {
          term.writeln(`\x1b[32mDirectory '${dirName}' created\x1b[0m`);
        } else {
          term.writeln(`\x1b[31mError creating directory: ${result.error}\x1b[0m`);
        }
      } catch (error) {
        term.writeln(`\x1b[31mError: ${error}\x1b[0m`);
      }
    }
    writePrompt(term, true);
  };

  const handleTouch = async (term: Terminal, params: string[], electronAPI: any) => {
    if (params.length === 0) {
      term.writeln('\x1b[31mUsage: touch <filename>\x1b[0m');
    } else if (electronAPI?.shellExec) {
      const fileName = params[0];
      const isWindows = navigator.userAgent.includes('Windows');
      const touchCommand = isWindows 
        ? `type nul > "${fileName}"` 
        : `touch "${fileName}"`;
      try {
        const result = await electronAPI.shellExec(touchCommand, currentDirRef.current);
        if (result.success) {
          term.writeln(`\x1b[32mFile '${fileName}' created\x1b[0m`);
        } else {
          term.writeln(`\x1b[31mError creating file: ${result.error}\x1b[0m`);
        }
      } catch (error) {
        term.writeln(`\x1b[31mError: ${error}\x1b[0m`);
      }
    }
    writePrompt(term, true);
  };

  const handleCat = async (term: Terminal, params: string[], electronAPI: any) => {
    if (params.length === 0) {
      term.writeln('\x1b[31mUsage: cat <filename>\x1b[0m');
    } else if (electronAPI?.shellExec) {
      const fileName = params[0];
      const isWindows = navigator.userAgent.includes('Windows');
      const catCommand = isWindows 
        ? `type "${fileName}"` 
        : `cat "${fileName}"`;
      try {
        const result = await electronAPI.shellExec(catCommand, currentDirRef.current);
        if (result.success && result.stdout) {
          term.write(result.stdout);
        } else {
          term.writeln(`\x1b[31mError reading file: ${result.error}\x1b[0m`);
        }
      } catch (error) {
        term.writeln(`\x1b[31mError: ${error}\x1b[0m`);
      }
    }
    writePrompt(term, true);
  };

  const handleCreateReact = async (term: Terminal, params: string[], electronAPI: any) => {
    const appName = params[0] || 'my-cosmic-app';
    term.writeln(`\x1b[36m⚛️  Creating React app: ${appName}\x1b[0m`);
    if (electronAPI?.shellExec) {
      term.writeln('\x1b[33mThis may take a few minutes...\x1b[0m');
      try {
        const result = await electronAPI.shellExec(`npx create-react-app ${appName}`, currentDirRef.current);
        if (result.success) {
          term.writeln(`\x1b[32m✅ React app '${appName}' created successfully!\x1b[0m`);
          term.writeln(`\x1b[36mNext steps:\x1b[0m`);
          term.writeln(`  cd ${appName}`);
          term.writeln(`  npm start`);
        } else {
          term.writeln(`\x1b[31mError creating React app: ${result.error}\x1b[0m`);
        }
      } catch (error) {
        term.writeln(`\x1b[31mError: ${error}\x1b[0m`);
      }
    }
    writePrompt(term, true);
  };

  const handleDev = async (term: Terminal, electronAPI: any) => {
    term.writeln('\x1b[36m🚀 Starting development server...\x1b[0m');
    if (electronAPI?.shellExec) {
      try {
        const result = await electronAPI.shellExec('npm start', currentDirRef.current);
        if (result.success) {
          term.writeln('\x1b[32m✅ Development server started!\x1b[0m');
        } else {
          term.writeln('\x1b[33mTrying alternative dev commands...\x1b[0m');
          const result2 = await electronAPI.shellExec('npm run dev', currentDirRef.current);
          if (result2.success) {
            term.writeln('\x1b[32m✅ Development server started!\x1b[0m');
          } else {
            term.writeln('\x1b[31mNo development server found. Try: npm start, npm run dev, or yarn dev\x1b[0m');
          }
        }
      } catch (error) {
        term.writeln(`\x1b[31mError: ${error}\x1b[0m`);
      }
    }
    writePrompt(term, true);
  };

  const handleBuild = async (term: Terminal, electronAPI: any) => {
    term.writeln('\x1b[36m🔨 Building project for production...\x1b[0m');
    if (electronAPI?.shellExec) {
      try {
        const result = await electronAPI.shellExec('npm run build', currentDirRef.current);
        if (result.success) {
          term.writeln('\x1b[32m✅ Build completed successfully!\x1b[0m');
          if (result.stdout) {
            term.write(result.stdout);
          }
        } else {
          term.writeln(`\x1b[31mBuild failed: ${result.error}\x1b[0m`);
        }
      } catch (error) {
        term.writeln(`\x1b[31mError: ${error}\x1b[0m`);
      }
    }
    writePrompt(term, true);
  };

  const handleTest = async (term: Terminal, electronAPI: any) => {
    term.writeln('\x1b[36m🧪 Running tests...\x1b[0m');
    if (electronAPI?.shellExec) {
      try {
        const result = await electronAPI.shellExec('npm test', currentDirRef.current);
        if (result.success) {
          term.writeln('\x1b[32m✅ Tests completed!\x1b[0m');
          if (result.stdout) {
            term.write(result.stdout);
          }
        } else {
          term.writeln(`\x1b[31mTests failed: ${result.error}\x1b[0m`);
        }
      } catch (error) {
        term.writeln(`\x1b[31mError: ${error}\x1b[0m`);
      }
    }
    writePrompt(term, true);
  };

  const handleInstall = async (term: Terminal, params: string[], electronAPI: any) => {
    const packageName = params[0];
    if (!packageName) {
      term.writeln('\x1b[31mUsage: install <package-name>\x1b[0m');
      writePrompt(term, true);
      return;
    }
    term.writeln(`\x1b[36m📦 Installing ${packageName}...\x1b[0m`);
    if (electronAPI?.shellExec) {
      try {
        const result = await electronAPI.shellExec(`npm install ${packageName}`, currentDirRef.current);
        if (result.success) {
          term.writeln(`\x1b[32m✅ ${packageName} installed successfully!\x1b[0m`);
        } else {
          term.writeln(`\x1b[31mInstallation failed: ${result.error}\x1b[0m`);
        }
      } catch (error) {
        term.writeln(`\x1b[31mError: ${error}\x1b[0m`);
      }
    }
    writePrompt(term, true);
  };

  const handleServe = async (term: Terminal, electronAPI: any) => {
    term.writeln('\x1b[36m🌐 Starting local server...\x1b[0m');
    if (electronAPI?.shellExec) {
      try {
        const result = await electronAPI.shellExec('python -m http.server 8000', currentDirRef.current);
        if (result.success) {
          term.writeln('\x1b[32m✅ Server running at http://localhost:8000\x1b[0m');
        } else {
          const result2 = await electronAPI.shellExec('npx serve .', currentDirRef.current);
          if (result2.success) {
            term.writeln('\x1b[32m✅ Server started with npx serve\x1b[0m');
          } else {
            term.writeln('\x1b[31mCould not start server. Install: npm install -g serve\x1b[0m');
          }
        }
      } catch (error) {
        term.writeln(`\x1b[31mError: ${error}\x1b[0m`);
      }
    }
    writePrompt(term, true);
  };

  const handleGenericCommand = async (term: Terminal, cmd: string, electronAPI: any) => {
    const command = cmd.split(' ')[0].toLowerCase();
    
    // Smart suggestions for common typos
    const suggestions: { [key: string]: string } = {
      'pyhton': 'python',
      'nmp': 'npm',
      'gti': 'git',
      'claer': 'clear',
      'sl': 'ls',
      'cd..': 'cd ..',
      'mkdri': 'mkdir',
      'toch': 'touch'
    };

    if (suggestions[command]) {
      term.writeln(`\x1b[33mDid you mean: \x1b[32m${suggestions[command]}\x1b[0m?`);
      writePrompt(term, true);
      return;
    }

    if (electronAPI?.shellExec) {
      try {
        const result = await electronAPI.shellExec(cmd, currentDirRef.current);
        if (result.success) {
          if (result.stdout && result.stdout.trim()) {
            term.write(result.stdout);
            if (!result.stdout.endsWith('\n')) {
              term.writeln('');
            }
          }
          if (result.stderr && result.stderr.trim()) {
            term.write(`\x1b[33m${result.stderr}\x1b[0m`);
          }
        } else {
          term.writeln(`\x1b[31m${result.error || 'Command failed'}\x1b[0m`);
          term.writeln(`\x1b[90mTip: Type 'help' to see available commands\x1b[0m`);
        }
      } catch (error) {
        term.writeln(`\x1b[31mError: ${error}\x1b[0m`);
      }
    } else {
      term.writeln(`\x1b[31mCommand not available: ${command}\x1b[0m`);
      term.writeln(`\x1b[90mTip: Run in Electron mode for full command support\x1b[0m`);
    }
    writePrompt(term, true);
  };

  useEffect(() => {
    initTerminal();
  }, [initTerminal]);

  // Handle resize when container size changes
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div 
      ref={terminalRef} 
      className="h-full w-full bg-cosmic-900"
      style={{ padding: '8px' }}
      onClick={() => {
        // Ensure terminal gets focus when clicked
        if (xtermRef.current) {
          xtermRef.current.focus();
        }
      }}
    />
  );
};

export default XTerminal;