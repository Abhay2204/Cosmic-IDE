#!/usr/bin/env node

/**
 * Web-only startup script - guaranteed to work
 */

const { spawn } = require('child_process');

console.log('🌐 Starting Cosmic IDE Web Version...\n');

console.log('Starting Vite development server...');
const viteProcess = spawn('npx', ['vite', '--port', '3000', '--host', '0.0.0.0'], {
  stdio: 'inherit',
  shell: true
});

viteProcess.on('error', (error) => {
  console.error('❌ Failed to start Vite:', error.message);
  process.exit(1);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down web server...');
  viteProcess.kill();
  process.exit(0);
});

console.log('\n🎉 Web version starting...');
console.log('📱 Open http://localhost:3000 in your browser');
console.log('🔧 Press Ctrl+C to stop');