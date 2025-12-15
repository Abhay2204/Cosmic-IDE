#!/usr/bin/env node

/**
 * Quick fix for installation issues
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Fixing Cosmic IDE installation...\n');

// 1. Kill any running processes (skip on Windows to avoid issues)
try {
  if (process.platform !== 'win32') {
    execSync('pkill -f "npm install"', { stdio: 'ignore' });
  }
  console.log('✅ Cleaned running processes');
} catch (e) {
  // Ignore errors - processes may not be running
}

// 2. Clean up
console.log('🧹 Cleaning up...');
try {
  if (fs.existsSync('node_modules')) {
    fs.rmSync('node_modules', { recursive: true, force: true });
  }
  if (fs.existsSync('package-lock.json')) {
    fs.unlinkSync('package-lock.json');
  }
  console.log('✅ Cleaned up old files');
} catch (error) {
  console.log('⚠️  Could not clean all files (may be in use)');
}

// 3. Install dependencies in stages
console.log('📦 Installing core dependencies...');
try {
  // First install core dependencies
  execSync('npm install react react-dom lucide-react @google/genai', { stdio: 'inherit' });
  console.log('✅ Core dependencies installed');
  
  // Then install dev dependencies
  execSync('npm install --save-dev @types/node @types/react @types/react-dom @vitejs/plugin-react typescript vite', { stdio: 'inherit' });
  console.log('✅ Dev dependencies installed');
  
  // Finally install Electron
  execSync('npm install --save-dev electron electron-builder concurrently wait-on', { stdio: 'inherit' });
  console.log('✅ Electron dependencies installed');
  
} catch (error) {
  console.error('❌ Installation failed:', error.message);
  console.log('\n🌐 Trying basic web-only installation...');
  
  try {
    execSync('npm install --no-optional', { stdio: 'inherit' });
    console.log('✅ Basic web installation complete!');
  } catch (basicError) {
    console.error('❌ Even basic installation failed:', basicError.message);
    process.exit(1);
  }
}

console.log('\n🎉 Installation fixed!');
console.log('\nNext steps:');
console.log('1. Run: npm run dev (for web version)');
console.log('2. Run: npm run desktop (for desktop app)');
console.log('\nFor advanced features, run: npm run install:full');