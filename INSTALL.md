# 🚀 Cosmic IDE - Installation Guide

## Quick Start (Recommended)

**Step 1: Fix any installation issues**
```bash
npm run fix
```

**Step 2: Start the IDE**
```bash
# Web version (always works)
npm run web

# Desktop version (simple, no loops)
npm run desktop:simple

# Desktop version (advanced, with server checking)
npm run desktop
```

## Alternative: Manual Basic Installation

If the fix script doesn't work:

```bash
# 1. Stop any running npm install (Ctrl+C)
rm -rf node_modules package-lock.json

# 2. Install core dependencies only
npm install react react-dom lucide-react @google/genai
npm install --save-dev @types/node @types/react @types/react-dom typescript vite

# 3. Run the IDE
npm run dev
```

## Full Installation (With Extensions)

Once the basic version works, upgrade to full features:

```bash
# 1. Install additional dependencies
npm install @monaco-editor/react monaco-editor
npm install @xterm/xterm @xterm/addon-fit @xterm/addon-web-links
npm install vscode-languageserver-protocol vscode-languageserver-types

# 2. Run setup
npm run setup-extensions

# 3. Run desktop version
npm run electron:dev
```

## Troubleshooting

### ❌ npm install infinite loop
**Solution**: 
```bash
npm run fix
```

### ❌ "Unable to find electron app"
**Solution**: 
```bash
npm run fix
npm run desktop
```

### ❌ Monaco Editor not loading
**Solution**: The IDE automatically uses a fallback editor. No action needed.

### ❌ TypeScript compilation errors
**Solution**: 
```bash
npm run fix
```

### ❌ Missing dependencies
**Solution**: 
```bash
npm run install:full
```

### ❌ Electron won't start or multiple instances
**Solution**: 
```bash
# Try simple desktop version
npm run desktop:simple

# Or web version
npm run web
```

### ❌ Cache permission errors
**Solution**: These are warnings and don't affect functionality. The app will still work.

## Features by Installation Level

### Basic Installation
- ✅ File explorer
- ✅ Basic text editor with syntax highlighting
- ✅ AI chat (with API key)
- ✅ Terminal simulation
- ✅ Git panel (UI only)

### Full Installation  
- ✅ Monaco Editor (VS Code editor)
- ✅ Real terminal (XTerm.js)
- ✅ VS Code extensions support
- ✅ Language servers (LSP)
- ✅ Real IntelliSense
- ✅ Extension marketplace

## Environment Variables

Create `.env.local`:
```
GEMINI_API_KEY=your_api_key_here
```

Get your API key from: https://aistudio.google.com/app/apikey

## Platform-Specific Notes

### Windows
- Use PowerShell or Command Prompt
- May need to install Visual Studio Build Tools for native modules

### macOS  
- Xcode Command Line Tools required: `xcode-select --install`

### Linux
- Build essentials required: `sudo apt install build-essential`

## Success Indicators

✅ **Basic working**: File explorer loads, can edit files  
✅ **Monaco working**: Syntax highlighting, autocomplete  
✅ **Extensions working**: Can install from marketplace  
✅ **LSP working**: Real-time error checking  
✅ **Desktop working**: Native window, file system access  

## Getting Help

1. Check browser console for errors
2. Try basic installation first
3. Ensure all prerequisites are installed
4. Check that ports 3000 is available

**The IDE is designed to work even with missing dependencies - start basic and upgrade gradually!**