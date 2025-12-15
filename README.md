<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Cosmic IDE

🚀 **A modern, AI-powered desktop code editor** - Built with Electron, React, Monaco Editor, and Gemini AI.

## ✨ Features

### 🧠 AI Integration
- **Gemini AI Chat** - Ask questions, get code help, debug issues
- **AI Code Generation** - Generate code from natural language
- **AI Commit Messages** - Auto-generate meaningful git commit messages
- **AI Agent Mode** - Autonomous coding assistant that can edit files
- **BugBot** - AI-powered bug detection and fixing

### 📝 Code Editor
- **Monaco Editor** - Same editor that powers VS Code
- **Syntax Highlighting** - 20+ languages supported
- **Auto-completion** - Smart code suggestions
- **Bracket Matching** - Colorized matching brackets
- **Multiple Tabs** - Work on multiple files simultaneously
- **Vim Mode** - Optional Vim keybindings
- **Zoom Controls** - Adjustable editor zoom level
- **Line Numbers** - Configurable line number display

### 🖥️ Integrated Terminal
- **Real PTY Terminal** - Full shell access (cmd/PowerShell/bash)
- **Interactive Programs** - Run Python games, Node REPL, etc.
- **Real-time Output** - Streaming output with colors
- **Keyboard Input** - Full interactive input support

### 📁 File Management
- **File Explorer** - Tree view with expand/collapse
- **Real File System** - Native file operations via Electron
- **Open Folder** - Load entire project directories
- **Create/Delete Files** - Full file management
- **File Icons** - Language-specific icons

### 🔄 Git Integration
- **Git Status** - See modified, staged, untracked files
- **Commit** - Stage and commit changes
- **AI Commit Messages** - Generate commit messages with AI
- **Branch Display** - Current branch indicator

### 🧩 Extension Marketplace
- **20+ Built-in Extensions** - Ready to install
- **Themes** - Dracula, Monokai Pro, Nord, GitHub Light
- **Language Packs** - Python, Rust, Go snippets
- **Snippets** - React, Console Log shortcuts
- **Productivity** - Bracket Colorizer, Auto Rename Tag, TODO Highlighter
- **Formatters** - Prettier integration
- **AI Extensions** - AI Autocomplete, Code Explainer
- **Git Tools** - Git Lens, Git Graph
- **Linters** - ESLint support
- **Utilities** - Live Server, Color Picker, Markdown Preview

### 🎨 Themes & UI
- **Dark Theme** - Beautiful cosmic dark theme
- **Custom Title Bar** - Native-feeling frameless window
- **Resizable Panels** - Adjustable sidebar and terminal
- **Splash Screen** - Animated loading screen
- **Status Bar** - File info, cursor position, language

### ⚙️ Settings
- **Editor Font Size** - Customizable font size
- **Terminal Font Size** - Separate terminal font control
- **Vim Mode Toggle** - Enable/disable Vim keybindings
- **Auto-save** - Automatic file saving
- **AI Model Selection** - Choose Gemini model

### 🐛 Debugging
- **Debug Panel** - Breakpoints, variables, call stack
- **Console Output** - View debug logs
- **Step Controls** - Step over, into, out


## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository>
cd cosmic-ide

# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Or run desktop app directly
npm run desktop

# Or build for production
npm run build
npm run electron
```

### API Key Setup

Create a `.env.local` file in the root directory:

```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## 📦 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start web development server |
| `npm run build` | Build for production |
| `npm run electron:dev` | Run Electron in dev mode |
| `npm run desktop` | Run desktop app (production build) |
| `npm run electron` | Run built Electron app |
| `npm run build:electron` | Build Electron main process |
| `npm run electron:build` | Build distributable packages |

## 🏗️ Architecture

```
cosmic-ide/
├── components/           # React components
│   ├── Editor.tsx       # Monaco editor wrapper
│   ├── XTerminal.tsx    # PTY terminal component
│   ├── FileTree.tsx     # File explorer
│   ├── ChatPane.tsx     # AI chat interface
│   ├── ExtensionsPanel.tsx  # Extension marketplace
│   ├── Sidebar.tsx      # Navigation sidebar
│   └── ...
├── services/            # Business logic
│   ├── aiService.ts     # Gemini AI integration
│   ├── aiAgentExecutor.ts   # AI agent system
│   ├── extensionSystem.ts   # Extension management
│   └── codeIntelligence.ts  # Code analysis
├── electron/            # Electron main process
│   ├── main.ts          # Main process entry
│   └── preload.ts       # Preload scripts
├── styles/              # CSS styles
└── types.ts             # TypeScript types
```

## 🎮 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save file |
| `Ctrl+O` | Open file |
| `Ctrl+Shift+O` | Open folder |
| `Ctrl+N` | New file |
| `Ctrl+\`` | Toggle terminal |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+L` | Clear terminal |
| `Ctrl+C` | Cancel terminal command |

## 🌐 Supported Languages

- TypeScript / JavaScript
- Python
- Rust
- Go
- Java
- C / C++
- C#
- HTML / CSS
- JSON / YAML
- Markdown
- SQL
- Shell / Bash
- And more...

## 📸 Screenshots

### Main Editor
The main workspace with file explorer, code editor, and AI chat panel.

### Extension Marketplace
Browse and install extensions from the built-in marketplace.

### Integrated Terminal
Full PTY terminal with real shell access.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

<div align="center">
  <b>Built with ❤️ using Electron, React, Monaco, and Gemini AI</b>
</div>
