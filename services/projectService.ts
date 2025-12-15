/**
 * Project Service - Handles workspace/project management
 * Detects project types (MERN, Java, Python, etc.)
 */

import { FileNode, FileType } from '../types';

export interface ProjectInfo {
  name: string;
  type: ProjectType;
  path: string;
  packageManager?: 'npm' | 'yarn' | 'pnpm';
  framework?: string;
  language: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
}

export type ProjectType = 
  | 'node' 
  | 'react' 
  | 'nextjs' 
  | 'vue' 
  | 'angular'
  | 'express'
  | 'nestjs'
  | 'python'
  | 'django'
  | 'flask'
  | 'fastapi'
  | 'java'
  | 'spring'
  | 'maven'
  | 'gradle'
  | 'rust'
  | 'go'
  | 'unknown';

export interface ProjectFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: ProjectFile[];
  language?: string;
}

class ProjectService {
  private currentProject: ProjectInfo | null = null;
  private projectFiles: Map<string, FileNode> = new Map();

  async detectProjectType(files: string[]): Promise<ProjectType> {
    const fileSet = new Set(files.map(f => f.toLowerCase()));

    // Node.js / JavaScript projects
    if (fileSet.has('package.json')) {
      // Check for specific frameworks
      if (fileSet.has('next.config.js') || fileSet.has('next.config.mjs')) {
        return 'nextjs';
      }
      if (fileSet.has('angular.json')) {
        return 'angular';
      }
      if (fileSet.has('vue.config.js') || fileSet.has('vite.config.ts')) {
        // Could be Vue or React with Vite
        if (files.some(f => f.includes('.vue'))) {
          return 'vue';
        }
      }
      if (fileSet.has('nest-cli.json')) {
        return 'nestjs';
      }
      // Check for React
      if (files.some(f => f.endsWith('.tsx') || f.endsWith('.jsx'))) {
        return 'react';
      }
      // Check for Express
      if (files.some(f => f.includes('express') || f.includes('server.js') || f.includes('app.js'))) {
        return 'express';
      }
      return 'node';
    }

    // Python projects
    if (fileSet.has('requirements.txt') || fileSet.has('setup.py') || fileSet.has('pyproject.toml')) {
      if (fileSet.has('manage.py')) {
        return 'django';
      }
      if (files.some(f => f.includes('flask'))) {
        return 'flask';
      }
      if (files.some(f => f.includes('fastapi'))) {
        return 'fastapi';
      }
      return 'python';
    }

    // Java projects
    if (fileSet.has('pom.xml')) {
      if (files.some(f => f.includes('spring'))) {
        return 'spring';
      }
      return 'maven';
    }
    if (fileSet.has('build.gradle') || fileSet.has('build.gradle.kts')) {
      if (files.some(f => f.includes('spring'))) {
        return 'spring';
      }
      return 'gradle';
    }
    if (files.some(f => f.endsWith('.java'))) {
      return 'java';
    }

    // Rust projects
    if (fileSet.has('cargo.toml')) {
      return 'rust';
    }

    // Go projects
    if (fileSet.has('go.mod')) {
      return 'go';
    }

    return 'unknown';
  }

  async loadProject(path: string): Promise<ProjectInfo> {
    // In Electron, this would read actual files
    // For now, return mock project info
    const projectType = await this.detectProjectType([
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'src/App.tsx',
      'src/index.tsx'
    ]);

    this.currentProject = {
      name: 'cosmic-project',
      type: projectType,
      path,
      packageManager: 'npm',
      framework: 'React',
      language: 'TypeScript',
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
        test: 'vitest',
        lint: 'eslint src --ext .ts,.tsx'
      },
      dependencies: {
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'typescript': '^5.0.0',
        'vite': '^5.0.0'
      }
    };

    return this.currentProject;
  }

  getCurrentProject(): ProjectInfo | null {
    return this.currentProject;
  }

  getProjectCommands(projectType: ProjectType): string[] {
    const commands: Record<ProjectType, string[]> = {
      node: ['npm install', 'npm start', 'npm test', 'npm run build'],
      react: ['npm install', 'npm start', 'npm run build', 'npm test'],
      nextjs: ['npm install', 'npm run dev', 'npm run build', 'npm start'],
      vue: ['npm install', 'npm run dev', 'npm run build', 'npm run serve'],
      angular: ['npm install', 'ng serve', 'ng build', 'ng test'],
      express: ['npm install', 'npm start', 'npm run dev'],
      nestjs: ['npm install', 'npm run start:dev', 'npm run build', 'npm test'],
      python: ['pip install -r requirements.txt', 'python main.py', 'pytest'],
      django: ['pip install -r requirements.txt', 'python manage.py runserver', 'python manage.py migrate'],
      flask: ['pip install -r requirements.txt', 'flask run', 'python app.py'],
      fastapi: ['pip install -r requirements.txt', 'uvicorn main:app --reload'],
      java: ['javac Main.java', 'java Main'],
      spring: ['mvn spring-boot:run', 'mvn clean install', 'mvn test'],
      maven: ['mvn clean install', 'mvn package', 'mvn test'],
      gradle: ['gradle build', 'gradle run', 'gradle test'],
      rust: ['cargo build', 'cargo run', 'cargo test'],
      go: ['go build', 'go run .', 'go test'],
      unknown: []
    };

    return commands[projectType] || [];
  }

  getFileType(filename: string): FileType {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    const typeMap: Record<string, FileType> = {
      'ts': FileType.TypeScript,
      'tsx': FileType.TypeScript,
      'js': FileType.TypeScript,
      'jsx': FileType.TypeScript,
      'py': FileType.Python,
      'rs': FileType.Rust,
      'json': FileType.JSON,
      'md': FileType.Markdown,
      'css': FileType.CSS,
    };

    return typeMap[ext] || FileType.TypeScript;
  }

  getLanguageIcon(projectType: ProjectType): string {
    const icons: Record<ProjectType, string> = {
      node: '🟢',
      react: '⚛️',
      nextjs: '▲',
      vue: '💚',
      angular: '🅰️',
      express: '🚂',
      nestjs: '🐱',
      python: '🐍',
      django: '🎸',
      flask: '🧪',
      fastapi: '⚡',
      java: '☕',
      spring: '🌱',
      maven: '🪶',
      gradle: '🐘',
      rust: '🦀',
      go: '🐹',
      unknown: '📁'
    };

    return icons[projectType] || '📁';
  }

  async createProject(name: string, template: ProjectType): Promise<ProjectInfo> {
    // Templates for different project types
    const templates: Record<string, { files: Record<string, string> }> = {
      react: {
        files: {
          'package.json': JSON.stringify({
            name,
            version: '1.0.0',
            scripts: {
              dev: 'vite',
              build: 'tsc && vite build'
            },
            dependencies: {
              react: '^18.2.0',
              'react-dom': '^18.2.0'
            },
            devDependencies: {
              typescript: '^5.0.0',
              vite: '^5.0.0',
              '@vitejs/plugin-react': '^4.0.0'
            }
          }, null, 2),
          'src/App.tsx': `import React from 'react';

export default function App() {
  return (
    <div>
      <h1>Hello ${name}!</h1>
    </div>
  );
}`,
          'src/index.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
          'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${name}</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/index.tsx"></script>
</body>
</html>`,
          'tsconfig.json': JSON.stringify({
            compilerOptions: {
              target: 'ES2020',
              module: 'ESNext',
              jsx: 'react-jsx',
              strict: true
            }
          }, null, 2)
        }
      },
      express: {
        files: {
          'package.json': JSON.stringify({
            name,
            version: '1.0.0',
            scripts: {
              start: 'node server.js',
              dev: 'nodemon server.js'
            },
            dependencies: {
              express: '^4.18.0',
              cors: '^2.8.5'
            }
          }, null, 2),
          'server.js': `const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello from ${name}!' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`
        }
      },
      python: {
        files: {
          'requirements.txt': 'flask==2.3.0\npython-dotenv==1.0.0',
          'app.py': `from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def hello():
    return jsonify(message='Hello from ${name}!')

if __name__ == '__main__':
    app.run(debug=True)`,
          'README.md': `# ${name}\n\nPython Flask project\n\n## Setup\n\`\`\`bash\npip install -r requirements.txt\npython app.py\n\`\`\``
        }
      }
    };

    const template_data = templates[template] || templates.react;
    
    return {
      name,
      type: template,
      path: `/${name}`,
      language: template === 'python' ? 'Python' : 'TypeScript',
      packageManager: template === 'python' ? undefined : 'npm'
    };
  }
}

export const projectService = new ProjectService();
export default projectService;
