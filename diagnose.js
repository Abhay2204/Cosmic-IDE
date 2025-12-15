#!/usr/bin/env node

/**
 * Diagnostic script for Cosmic IDE
 */

const fs = require('fs');
const { execSync } = require('child_process');
const http = require('http');

console.log('🔍 Cosmic IDE Diagnostic Tool\n');

// Check Node.js version
console.log('📋 System Information:');
try {
  const nodeVersion = process.version;
  console.log(`✅ Node.js: ${nodeVersion}`);
  
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`✅ npm: ${npmVersion}`);
} catch (error) {
  console.log('❌ Node.js/npm check failed');
}

// Check if required files exist
console.log('\n📁 File Structure:');
const requiredFiles = [
  'package.json',
  'index.html',
  'index.tsx',
  'App.tsx',
  'electron/main.ts',
  'electron/preload.ts'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Check dependencies
console.log('\n📦 Dependencies:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const coreDeps = ['react', 'react-dom', 'lucide-react'];
  const devDeps = ['typescript', 'vite', '@vitejs/plugin-react'];
  const optionalDeps = ['@monaco-editor/react', 'electron'];
  
  console.log('Core dependencies:');
  coreDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
    }
  });
  
  console.log('Dev dependencies:');
  devDeps.forEach(dep => {
    if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
    }
  });
  
  console.log('Optional dependencies:');
  optionalDeps.forEach(dep => {
    if ((packageJson.dependencies && packageJson.dependencies[dep]) ||
        (packageJson.devDependencies && packageJson.devDependencies[dep]) ||
        (packageJson.optionalDependencies && packageJson.optionalDependencies[dep])) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`⚠️  ${dep} - OPTIONAL (advanced features)`);
    }
  });
  
} catch (error) {
  console.log('❌ Could not read package.json');
}

// Check if node_modules exists
console.log('\n🗂️  Installation:');
if (fs.existsSync('node_modules')) {
  console.log('✅ node_modules directory exists');
  
  // Check if key modules are installed
  const keyModules = ['react', 'vite', 'typescript'];
  keyModules.forEach(mod => {
    if (fs.existsSync(`node_modules/${mod}`)) {
      console.log(`✅ ${mod} installed`);
    } else {
      console.log(`❌ ${mod} not installed`);
    }
  });
} else {
  console.log('❌ node_modules directory missing - run npm install');
}

// Check if TypeScript compilation works
console.log('\n🔨 Build Check:');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.log('❌ TypeScript compilation failed');
  console.log('   Run: npm run fix');
}

// Check if Vite can start
console.log('\n🌐 Server Check:');
console.log('Testing if port 3000 is available...');

const server = http.createServer();
server.listen(3000, () => {
  console.log('✅ Port 3000 is available');
  server.close();
  
  console.log('\n🎯 Recommendations:');
  console.log('1. If you see any ❌ above, run: npm run fix');
  console.log('2. For web version: npm run dev');
  console.log('3. For desktop version: npm run desktop');
  console.log('4. If issues persist, try: npm run install:basic');
  
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('⚠️  Port 3000 is in use (this is OK if server is running)');
  } else {
    console.log('❌ Port 3000 check failed:', err.message);
  }
  
  console.log('\n🎯 Recommendations:');
  console.log('1. If you see any ❌ above, run: npm run fix');
  console.log('2. For web version: npm run dev');
  console.log('3. For desktop version: npm run desktop');
  console.log('4. If issues persist, try: npm run install:basic');
});