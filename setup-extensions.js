#!/usr/bin/env node

/**
 * Setup script for VS Code extension support
 * Installs required dependencies and sets up extension environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up VS Code Extension Support...\n');

// Skip npm install to avoid infinite loop
console.log('📦 Dependencies should already be installed via npm install\n');

// 2. Create extensions directory
const extensionsDir = path.join(process.cwd(), 'extensions');
if (!fs.existsSync(extensionsDir)) {
  fs.mkdirSync(extensionsDir, { recursive: true });
  console.log('📁 Created extensions directory');
}

// 3. Create language servers directory
const lspDir = path.join(process.cwd(), 'language-servers');
if (!fs.existsSync(lspDir)) {
  fs.mkdirSync(lspDir, { recursive: true });
  console.log('📁 Created language-servers directory');
}

// 4. Install common language servers (optional)
console.log('\n🔧 Installing Language Servers (optional)...');

const languageServers = [
  {
    name: 'TypeScript Language Server',
    command: 'npm install -g typescript-language-server typescript',
    check: 'typescript-language-server --version'
  },
  {
    name: 'Python LSP Server',
    command: 'pip install python-lsp-server[all]',
    check: 'pylsp --version'
  }
];

for (const server of languageServers) {
  try {
    console.log(`Installing ${server.name}...`);
    execSync(server.command, { stdio: 'pipe' });
    
    // Verify installation
    execSync(server.check, { stdio: 'pipe' });
    console.log(`✅ ${server.name} installed`);
  } catch (error) {
    console.log(`⚠️  ${server.name} installation failed (optional)`);
  }
}

// 5. Create extension configuration
const configPath = path.join(process.cwd(), 'extension-config.json');
const config = {
  extensionsPath: extensionsDir,
  languageServersPath: lspDir,
  enabledExtensions: [],
  marketplaceUrl: 'https://marketplace.visualstudio.com/_apis/public/gallery',
  autoInstallRecommended: true,
  enableLSP: true
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('⚙️  Created extension configuration');

// 6. Update .gitignore
const gitignorePath = path.join(process.cwd(), '.gitignore');
let gitignoreContent = '';

if (fs.existsSync(gitignorePath)) {
  gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
}

const extensionIgnores = [
  '# VS Code Extensions',
  'extensions/',
  'language-servers/',
  'extension-config.json',
  '*.vsix'
];

let needsUpdate = false;
for (const ignore of extensionIgnores) {
  if (!gitignoreContent.includes(ignore)) {
    gitignoreContent += '\n' + ignore;
    needsUpdate = true;
  }
}

if (needsUpdate) {
  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log('📝 Updated .gitignore');
}

console.log('\n🎉 VS Code Extension Support Setup Complete!\n');

console.log('Next steps:');
console.log('1. Run: npm run electron:dev');
console.log('2. Open Extensions panel in the IDE');
console.log('3. Search and install extensions from VS Code marketplace');
console.log('4. Extensions will provide real IntelliSense, debugging, and more!\n');

console.log('Available Language Servers:');
console.log('- TypeScript/JavaScript (if installed)');
console.log('- Python (if installed)');
console.log('- Rust (rust-analyzer - install separately)');
console.log('- Java (Eclipse JDT - install separately)');
console.log('- Go (gopls - install separately)\n');

console.log('🌟 Your IDE now supports real VS Code extensions!');