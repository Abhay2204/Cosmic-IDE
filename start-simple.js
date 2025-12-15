#!/usr/bin/env node

/**
 * Simple Electron startup script - no loops, no multiple instances
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Cosmic IDE Desktop (Simple Mode)...\n');

// Build Electron main process
console.log('🔨 Building Electron main process...');
try {
  execSync('npx tsc -p tsconfig.electron.json', { stdio: 'inherit' });
  console.log('✅ Electron main process built');
} catch (buildError) {
  console.error('❌ Build failed:', buildError.message);
  process.exit(1);
}

// Start Vite in background
console.log('🌐 Starting Vite dev server...');
const viteProcess = spawn('npx', ['vite', '--port', '3000'], {
  stdio: 'pipe',
  shell: true
});

viteProcess.stdout.on('data', (data) => {
  console.log(data.toString());
});

// Wait 3 seconds then start Electron
setTimeout(() => {
  console.log('🖥️  Starting Electron...');
  
  const electronProcess = spawn('npx', ['electron', '.'], {
    stdio: 'inherit',
    shell: true,
    env: { 
      ...process.env, 
      NODE_ENV: 'development',
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true'
    }
  });

  // Handle Electron exit
  electronProcess.on('close', (code) => {
    console.log(`\n🔚 Electron closed (code: ${code})`);
    viteProcess.kill();
    process.exit(0);
  });

  electronProcess.on('error', (error) => {
    console.error('❌ Electron error:', error.message);
    viteProcess.kill();
    process.exit(1);
  });

}, 3000);

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  viteProcess.kill();
  process.exit(0);
});

viteProcess.on('error', (error) => {
  console.error('❌ Vite error:', error.message);
  process.exit(1);
});