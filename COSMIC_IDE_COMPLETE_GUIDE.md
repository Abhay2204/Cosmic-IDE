# 🚀 Cosmic IDE - Complete System Guide

**The Ultimate AI-Powered Development Environment**

Welcome to Cosmic IDE, a next-generation development environment that combines traditional IDE features with powerful AI capabilities. This guide explains how every component works together to create a seamless coding experience.

---

## 📋 Table of Contents

1. [🏗️ Architecture Overview](#architecture-overview)
2. [📁 File Management System](#file-management-system)
3. [🤖 AI Agent System](#ai-agent-system)
4. [🎨 Editor & Code Intelligence](#editor--code-intelligence)
5. [💬 AI Models & Providers](#ai-models--providers)
6. [🔌 Extension System](#extension-system)
7. [🖥️ Terminal Integration](#terminal-integration)
8. [👁️ Live Preview System](#live-preview-system)
9. [⚙️ Settings & Configuration](#settings--configuration)
10. [🎯 User Interface Components](#user-interface-components)
11. [⌨️ Keyboard Shortcuts](#keyboard-shortcuts)
12. [🔄 Workflow Examples](#workflow-examples)

---

## 🏗️ Architecture Overview

### **Core Components**

```
Cosmic IDE
├── 🎨 Frontend (React + TypeScript)
│   ├── App.tsx (Main application)
│   ├── Components/ (UI components)
│   └── Services/ (Business logic)
├── 🖥️ Electron Backend (Optional)
│   ├── File system access
│   ├── Terminal operations
│   └── Native OS integration
└── 🤖 AI Integration
    ├── Multiple AI providers
    ├── Agent executor
    └── Code intelligence
```

### **Execution Modes**

| Mode | Description | File Access | Terminal | Live Server |
|------|-------------|-------------|----------|-------------|
| **Web Mode** | Browser-based | Memory only | Limited | No |
| **Electron Mode** | Desktop app | Full disk access | Full shell | Yes |

---

## 📁 File Management System

### **File Structure**

Every file in Cosmic IDE is represented as a `FileNode`:

```typescript
interface FileNode {
  id: string;           // Unique identifier
  name: string;         // File name with extension
  type: string;         // Language type (typescript, python, etc.)
  content: string;      // File content
  isOpen: boolean;      // Currently open in editor
  isModified: boolean;  // Has unsaved changes
  path?: string;        // Full file path (Electron mode)
  relativePath?: string; // Relative path in workspace
}
```

### **File Operations**

#### **Creating Files**
- **Manual**: `Ctrl+N` or "New File" button
- **AI Generated**: AI automatically creates files from code blocks
- **Templates**: Smart templates based on file type

#### **File Types Supported**
- **Languages**: TypeScript, JavaScript, Python, Rust, Go, Java, C++, etc.
- **Web**: HTML, CSS, JSON, YAML, XML
- **Documentation**: Markdown, Plain text
- **Configuration**: TOML, Dockerfile, Shell scripts

#### **Auto-Save System**
```typescript
// Auto-save in Electron mode
if (electronAPI?.writeFile) {
  await electronAPI.writeFile(filePath, content);
  // File saved to disk automatically
}
```

### **Workspace Management**

#### **Folder Opening (Electron Mode)**
1. **Open Folder**: File → Open Folder
2. **Recursive Loading**: Automatically loads all files up to 3 levels deep
3. **File Tree**: Displays in Explorer panel
4. **Path Resolution**: Maintains relative and absolute paths

---

## 🤖 AI Agent System

### **AI Agent Executor**

The heart of Cosmic IDE's AI capabilities. It automatically:

1. **Parses AI responses** for actionable commands
2. **Creates files** from code blocks
3. **Manages projects** with proper structure
4. **Executes commands** when requested

### **How It Works**

#### **1. Response Analysis**
```typescript
// AI Agent analyzes responses for:
- Code blocks with language tags
- File creation requests
- Folder structure needs
- Command execution requests
```

#### **2. Automatic File Creation**
When AI provides code:
```markdown
```html
<!DOCTYPE html>
<html>
<head><title>My Website</title></head>
<body><h1>Hello World</h1></body>
</html>
```
```

The agent automatically:
1. **Detects** HTML code block
2. **Creates** `index.html` file
3. **Saves** content to disk (Electron mode)
4. **Opens** file in editor
5. **Activates** Preview panel

#### **3. Smart File Naming**
- **Explicit names**: From comments like `// filename.js`
- **Content analysis**: Detects class names, functions
- **Project context**: Based on user request (hotel → `hotel.html`)
- **Fallback naming**: Generic names by language

#### **4. Project Structure Generation**
For complex projects, creates:
```
my-website/
├── index.html
├── styles.css
├── script.js
├── assets/
└── images/
```

### **AI Agent Callbacks**

```typescript
interface AgentExecutorCallbacks {
  onCreateFile: (filename, content, language) => Promise<void>;
  onCreateFolder: (folderName) => Promise<void>;
  onRunCommand: (command) => Promise<void>;
  onUpdateTerminal: (line) => void;
  onUpdateFiles: (updater) => void;
}
```

---

## 🎨 Editor & Code Intelligence

### **FallbackEditor Features**

#### **Core Editing**
- **Syntax highlighting** for 20+ languages
- **Line numbers** with proper formatting
- **Auto-indentation** with Tab/Shift+Tab
- **Bracket matching** and auto-closing
- **Multi-cursor support** (planned)

#### **IntelliSense System**
```typescript
// Triggers on typing
const completions = await codeIntelligence.getCompletions(
  content, 
  { line, column }, 
  fileType, 
  allFiles
);
```

**Features:**
- **Auto-completion** for functions, variables, classes
- **Context-aware** suggestions
- **Cross-file** references
- **Snippet expansion**
- **Error diagnostics** with squiggly underlines

#### **Code Intelligence Services**
- **Language detection** from file extensions
- **Symbol analysis** for better completions
- **Diagnostic reporting** for syntax errors
- **Hover information** for documentation

---

## 💬 AI Models & Providers

### **Supported Providers**

| Provider | Models | API Key Required |
|----------|--------|------------------|
| **Google** | Gemini 1.5 Pro/Flash | ✅ |
| **OpenAI** | GPT-4o, GPT-4 Turbo | ✅ |
| **Anthropic** | Claude 3.5 Sonnet | ✅ |
| **Groq** | Llama 3.1 70B | ✅ |
| **OpenRouter** | Multiple models | ✅ |
| **Custom** | User-defined | ✅ |

### **AI Service Architecture**

```typescript
// AI Response Generation
const response = await generateChatResponse(
  messages,           // Chat history
  enhancedPrompt,     // System prompt + user request
  files,              // Current workspace files
  modelId,            // Selected AI model
  apiKeys,            // Provider credentials
  customProviders     // User-defined providers
);
```

### **Enhanced Prompting**
The AI receives context about:
- **Current files** in workspace
- **File creation capabilities**
- **IDE environment** and features
- **User's coding preferences**

### **Model Selection**
- **Default model**: Set in Settings
- **Per-conversation**: Change model mid-chat
- **Fallback handling**: Graceful error recovery
- **Rate limiting**: Automatic retry logic

---

## 🔌 Extension System

### **Extension Architecture**

```typescript
interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  icon: string;
  category: ExtensionCategory;
  enabled: boolean;
  installed: boolean;
  // Capabilities
  themes?: Theme[];
  snippets?: Snippet[];
  formatters?: Formatter[];
  linters?: Linter[];
  languages?: LanguageSupport[];
}
```

### **Built-in Extensions**

#### **🎨 Themes**
- **Dracula**: Dark theme with vibrant colors
- **Monokai Pro**: Professional color scheme
- **Nord**: Arctic, north-bluish palette
- **GitHub Light**: Clean light theme

#### **🐍 Languages**
- **Python**: Snippets, linting, IntelliSense
- **Rust**: Function templates, match expressions
- **Go**: Error handling, struct definitions
- **React**: Component snippets, hooks

#### **📝 Snippets**
- **React Snippets**: `rfc`, `useState`, `useEffect`
- **Console Logs**: `cl`, `clo`, `clj`, `ce`
- **Language-specific**: Function definitions, classes

#### **🛠️ Productivity**
- **Bracket Colorizer**: Rainbow bracket matching
- **Auto Rename Tag**: Paired HTML tag editing
- **Path Intellisense**: Import path completion
- **TODO Highlighter**: Annotation highlighting

#### **🌐 Live Server** (Featured)
- **Local development server** with live reload
- **Preview panel** integration
- **Auto-detect** main HTML files
- **External browser** support
- **CORS enabled** for API calls

### **Extension Management**
- **Install/Uninstall**: One-click management
- **Enable/Disable**: Toggle without uninstalling
- **Auto-activation**: Extensions activate on relevant files
- **Persistent state**: Settings saved locally

---

## 🖥️ Terminal Integration

### **Terminal Features**

#### **Built-in Terminal**
- **Command execution** in Electron mode
- **Working directory** awareness
- **Command history** with scrollback
- **Color-coded output** (success, error, info)

#### **Terminal Types**
```typescript
interface TerminalLine {
  id: string;
  content: string;
  type: 'command' | 'success' | 'error' | 'info';
}
```

#### **Command Execution**
```typescript
// Execute shell commands
const result = await electronAPI.shellExec(command, workingDirectory);
if (result.success) {
  // Command succeeded
} else {
  // Handle error
}
```

### **Terminal Integration**
- **AI commands**: AI can suggest and run commands
- **File operations**: Create, move, delete files
- **Git operations**: Status, commit, push
- **Development servers**: npm, python, etc.

### **Bottom Panel Tabs**
- **Terminal**: Command execution
- **Problems**: Error diagnostics
- **Output**: Extension and service logs
- **Debug Console**: Debugging information

---

## 👁️ Live Preview System

### **Preview Panel Features**

#### **HTML Preview Modes**
1. **Static Preview**: Direct HTML rendering without server
2. **Live Server**: Full development server with hot reload
3. **External Browser**: One-click browser opening

#### **Live Server Service**
```typescript
class LiveServerService {
  async startServer(config): Promise<{success, url?, error?}>;
  async stopServer(): Promise<{success, error?}>;
  getStatus(): {isRunning, port?, url?};
  async openInBrowser(filePath?): Promise<void>;
}
```

#### **Auto-Detection**
- **Main files**: `index.html`, `main.html`, `home.html`
- **Project structure**: Multi-file websites
- **File changes**: Auto-refresh on save

#### **Server Technology**
- **Python fallback**: `python -m http.server`
- **Node.js support**: `npx http-server`
- **Port management**: Default 3001, configurable
- **CORS enabled**: For API development

### **Preview Workflow**
1. **Create HTML file** (manually or via AI)
2. **Preview panel opens** automatically
3. **Start Live Server** for full features
4. **Make changes** → See updates instantly
5. **Open in browser** for testing

---

## ⚙️ Settings & Configuration

### **Settings Interface**
```typescript
interface Settings {
  defaultModel: string;           // AI model selection
  vimMode: boolean;              // Vim keybindings
  privacyMode: boolean;          // Data handling
  ghostText: boolean;            // AI suggestions
  terminalFontSize: number;      // Terminal appearance
  editorFontSize: number;        // Editor appearance
  aiProviders: Record<string, string>; // API keys
  customProviders: AIProvider[]; // Custom AI providers
}
```

### **Configuration Categories**

#### **🤖 AI Settings**
- **Default Model**: Primary AI model for chat
- **API Keys**: Provider credentials (encrypted storage)
- **Custom Providers**: Add your own AI services
- **Privacy Mode**: Control data sharing

#### **✏️ Editor Settings**
- **Font Size**: Adjustable editor text size
- **Vim Mode**: Enable Vim keybindings
- **Ghost Text**: AI-powered suggestions
- **Theme**: Color scheme selection

#### **🖥️ Terminal Settings**
- **Font Size**: Terminal text size
- **Shell**: Default shell selection (Electron)
- **Working Directory**: Default path

#### **🔒 Privacy & Security**
- **API Key Storage**: Local encryption
- **Data Sharing**: Control what's sent to AI
- **Telemetry**: Usage analytics (opt-in)

---

## 🎯 User Interface Components

### **Layout Structure**

```
┌─────────────────────────────────────────────────────────┐
│ Title Bar (Electron) / Browser Tab (Web)               │
├─────────────────────────────────────────────────────────┤
│ Menu Bar: File, Edit, View, Terminal, Help             │
├──┬──────────────────────────────────────────────────────┤
│🗂│ Editor Area                    │ AI Chat Panel       │
│📁│ ┌─────────────────────────────┐│ ┌─────────────────┐ │
│🔍│ │ File Tabs                   ││ │ Messages        │ │
│🌿│ │ ┌─────────────────────────┐ ││ │                 │ │
│🐛│ │ │ Code Editor             │ ││ │                 │ │
│🧩│ │ │                         │ ││ │                 │ │
│👁│ │ │                         │ ││ │                 │ │
│⚙│ │ └─────────────────────────┘ ││ │                 │ │
│  │ └─────────────────────────────┘│ └─────────────────┘ │
├──┴──────────────────────────────────────────────────────┤
│ Terminal / Problems / Output / Debug Console            │
├─────────────────────────────────────────────────────────┤
│ Status Bar: File info, Cursor position, Language       │
└─────────────────────────────────────────────────────────┘
```

### **Activity Bar Icons**

| Icon | Panel | Shortcut | Description |
|------|-------|----------|-------------|
| 🗂️ | Explorer | `Ctrl+Shift+E` | File browser |
| 🔍 | Search | `Ctrl+Shift+F` | Find in files |
| 🌿 | Source Control | `Ctrl+Shift+G` | Git integration |
| ▶️ | Debug | `Ctrl+Shift+D` | Run & debug |
| 🐛 | BugBot | - | AI debugging assistant |
| 🧩 | Extensions | `Ctrl+Shift+X` | Extension manager |
| 👁️ | Preview | `Ctrl+Shift+P` | Live preview |
| ⚙️ | Settings | `Ctrl+,` | IDE configuration |

### **Panel Components**

#### **Explorer Panel**
- **File tree** with expand/collapse
- **New file/folder** buttons
- **Context menus** for file operations
- **Workspace folder** display

#### **Search Panel**
- **Global search** across all files
- **Regex support** for advanced patterns
- **Replace functionality**
- **Search results** with file navigation

#### **Source Control Panel**
- **Git status** display
- **Modified files** list
- **Commit interface**
- **Branch information**

#### **Extensions Panel**
- **Available extensions** marketplace
- **Installed extensions** management
- **Categories** and filtering
- **Install/uninstall** controls

#### **Preview Panel**
- **Live HTML preview**
- **Server controls** (start/stop)
- **External browser** button
- **Refresh controls**

---

## ⌨️ Keyboard Shortcuts

### **Global Shortcuts**

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+K` | Command Palette | Open command search |
| `Ctrl+N` | New File | Create new file |
| `Ctrl+S` | Save File | Save current file |
| `Ctrl+O` | Open File | Open file dialog |
| `Ctrl+Shift+P` | Preview Panel | Toggle live preview |
| `Ctrl+B` | Toggle Sidebar | Show/hide sidebar |
| `Ctrl+J` | Toggle Panel | Show/hide bottom panel |
| `Ctrl+`` | Terminal | Focus terminal |

### **Editor Shortcuts**

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Tab` | Indent | Indent selected lines |
| `Shift+Tab` | Unindent | Unindent selected lines |
| `Ctrl+Space` | IntelliSense | Trigger completions |
| `Ctrl+/` | Comment | Toggle line comment |
| `Ctrl+D` | Select Word | Select next occurrence |
| `Ctrl+F` | Find | Find in current file |
| `Ctrl+H` | Replace | Find and replace |

### **AI & Chat Shortcuts**

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Enter` | Send Message | Send chat message |
| `Shift+Enter` | New Line | Add line break in chat |
| `Ctrl+L` | Clear Chat | Clear conversation |
| `↑/↓` | Message History | Navigate previous messages |

---

## 🔄 Workflow Examples

### **1. Creating a Website with AI**

```
1. Open AI Chat → "Create a portfolio website"
2. AI generates HTML, CSS, JS files
3. Files automatically created and opened
4. Preview panel opens automatically
5. Start Live Server for hot reload
6. Make changes → See updates instantly
7. Open in browser for final testing
```

### **2. Python Development**

```
1. Create new Python file (Ctrl+N)
2. Type "snake" → AI suggests snake game
3. AI creates complete game code
4. Run in terminal: python snake_game.py
5. Debug with AI assistance
6. Add features via AI chat
```

### **3. React Component Development**

```
1. Install React snippets extension
2. Type "rfc" → React component template
3. Use AI for component logic
4. Preview with Live Server
5. Add styling with AI assistance
6. Test in browser
```

### **4. Multi-file Project Setup**

```
1. Ask AI: "Create a full-stack todo app"
2. AI creates:
   - Frontend files (HTML, CSS, JS)
   - Backend files (server.js, routes)
   - Configuration (package.json)
3. All files organized in proper structure
4. Ready to run with npm commands
```

### **5. Extension Development**

```
1. Browse Extensions panel
2. Install relevant extensions
3. Configure in Settings
4. Use extension features in editor
5. Customize with extension settings
```

---

## 🚀 Advanced Features

### **AI Agent Capabilities**

#### **Smart Project Detection**
- **Framework recognition**: React, Vue, Angular, etc.
- **Language detection**: Python, Node.js, etc.
- **Build tool awareness**: npm, pip, cargo, etc.

#### **Contextual Understanding**
- **File relationships**: Imports, dependencies
- **Project structure**: MVC, component-based, etc.
- **Coding patterns**: Design patterns, best practices

#### **Automated Workflows**
- **File generation**: Complete project scaffolding
- **Command execution**: Build, test, deploy commands
- **Error resolution**: Debug and fix suggestions

### **Performance Optimizations**

#### **Lazy Loading**
- **File content**: Loaded on demand
- **Extensions**: Activated when needed
- **AI models**: Cached responses

#### **Memory Management**
- **File caching**: Smart content caching
- **Extension lifecycle**: Proper cleanup
- **AI response**: Efficient storage

### **Security Features**

#### **API Key Protection**
- **Local encryption**: Keys never sent to servers
- **Secure storage**: Browser secure storage APIs
- **Access control**: Per-provider permissions

#### **Code Privacy**
- **Local processing**: Code stays on device
- **Opt-in sharing**: Explicit consent for AI
- **Data minimization**: Only necessary data sent

---

## 🎯 Best Practices

### **For Users**

1. **Start with AI**: Let AI create initial project structure
2. **Use Extensions**: Install relevant extensions for your stack
3. **Leverage Preview**: Use Live Server for web development
4. **Organize Files**: Keep projects in dedicated folders
5. **Save Regularly**: Enable auto-save in Electron mode

### **For AI Interaction**

1. **Be Specific**: "Create a React component with TypeScript"
2. **Request Complete Projects**: "Build a full todo app with backend"
3. **Ask for Explanations**: "Explain this code and add comments"
4. **Iterate Gradually**: Build features step by step
5. **Use Context**: Reference existing files in requests

### **For Development**

1. **Use Electron Mode**: For full file system access
2. **Configure AI Models**: Set up multiple providers
3. **Customize Extensions**: Install relevant extensions
4. **Set Up Workspace**: Open project folders properly
5. **Learn Shortcuts**: Master keyboard shortcuts

---

## 🔮 Future Roadmap

### **Planned Features**

- **Multi-cursor editing** in editor
- **Git integration** improvements
- **Debugging tools** with breakpoints
- **Plugin API** for custom extensions
- **Cloud sync** for settings and projects
- **Collaborative editing** with real-time sharing
- **Advanced AI features** like code review
- **Mobile companion** app
- **Docker integration** for containerized development
- **Advanced search** with semantic understanding

---

## 📚 Resources

### **Documentation**
- [Live Preview Guide](./LIVE_PREVIEW_GUIDE.md)
- [AI Agent Guide](./COSMIC_AI_AGENT_GUIDE.md)
- [Installation Guide](./INSTALL.md)
- [Features Overview](./FEATURES.md)

### **Support**
- **GitHub Issues**: Bug reports and feature requests
- **Community Discord**: Real-time help and discussions
- **Documentation Wiki**: Comprehensive guides
- **Video Tutorials**: Step-by-step walkthroughs

---

**🌟 Cosmic IDE - Where AI meets Development Excellence**

*Built with ❤️ for developers who want to focus on creating, not configuring.*