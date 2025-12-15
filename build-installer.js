#!/usr/bin/env node

/**
 * Production Installer Builder for Cosmic IDE
 * Creates optimized .exe installer with proper configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Cosmic IDE Production Installer...\n');

// Ensure we're in the right directory
process.chdir(__dirname);

// Step 1: Clean previous builds
console.log('📁 Cleaning previous builds...');
try {
  if (fs.existsSync('dist')) {
    execSync('rmdir /s /q dist', { stdio: 'inherit' });
  }
  if (fs.existsSync('dist-electron')) {
    execSync('rmdir /s /q dist-electron', { stdio: 'inherit' });
  }
  if (fs.existsSync('release')) {
    execSync('rmdir /s /q release', { stdio: 'inherit' });
  }
} catch (error) {
  console.log('Clean completed (some directories may not have existed)');
}

// Step 2: Install dependencies if needed
console.log('\n📦 Checking dependencies...');
if (!fs.existsSync('node_modules')) {
  console.log('Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
}

// Step 3: Build the application
console.log('\n🔨 Building application...');
try {
  // Build Electron main process
  console.log('Building Electron main process...');
  execSync('npm run build:electron', { stdio: 'inherit' });
  
  // Build React frontend
  console.log('Building React frontend...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 4: Create installer
console.log('\n📦 Creating installer...');
try {
  execSync('npx electron-builder --win --publish=never', { stdio: 'inherit' });
  console.log('✅ Installer created successfully!');
} catch (error) {
  console.error('❌ Installer creation failed:', error.message);
  process.exit(1);
}

// Step 5: Show results
console.log('\n🎉 Production build completed!');
console.log('\nGenerated files:');
if (fs.existsSync('release')) {
  const files = fs.readdirSync('release');
  files.forEach(file => {
    const filePath = path.join('release', file);
    const stats = fs.statSync(filePath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`  📄 ${file} (${sizeInMB} MB)`);
  });
}

console.log('\n✨ Your Cosmic IDE installer is ready in the "release" folder!');