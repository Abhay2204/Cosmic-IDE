#!/usr/bin/env node

/**
 * Electron startup script with proper error handling
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Cosmic IDE Desktop...\n');

// 1. Check if TypeScript is available
try {
  execSync('npx tsc --version', { stdio: 'pipe' });
  console.log('✅ TypeScript found');
} catch (error) {
  console.log('❌ TypeScript not found, installing...');
  try {
    execSync('npm install typescript --save-dev', { stdio: 'inherit' });
    console.log('✅ TypeScript installed');
  } catch (installError) {
    console.error('❌ Failed to install TypeScript:', installError.message);
    console.log('\n🌐 Falling back to web version...');
    console.log('Run: npm run dev');
    process.exit(1);
  }
}

// 2. Check if Electron is installed
try {
  require.resolve('electron');
  console.log('✅ Electron found');
} catch (error) {
  console.log('❌ Electron not found, installing...');
  try {
    execSync('npm install electron --save-dev', { stdio: 'inherit' });
    console.log('✅ Electron installed');
  } catch (installError) {
    console.error('❌ Failed to install Electron:', installError.message);
    console.log('\n🌐 Falling back to web version...');
    console.log('Run: npm run dev');
    process.exit(1);
  }
}

// 3. Create dist-electron directory if it doesn't exist
const distElectronDir = path.join(__dirname, 'dist-electron');
if (!fs.existsSync(distElectronDir)) {
  fs.mkdirSync(distElectronDir, { recursive: true });
  console.log('✅ Created dist-electron directory');
}

// 4. Build Electron main process
console.log('🔨 Building Electron main process...');
try {
  execSync('npx tsc -p tsconfig.electron.json', { stdio: 'inherit' });
  console.log('✅ Electron main process built');
} catch (buildError) {
  console.error('❌ Failed to build Electron main process:', buildError.message);
  console.log('Error details:', buildError.toString());
  console.log('\n🌐 Falling back to web version...');
  console.log('Run: npm run dev');
  process.exit(1);
}

// 5. Check if main file exists
const mainFile = path.join(__dirname, 'dist-electron', 'main.js');
if (!fs.existsSync(mainFile)) {
  console.error('❌ Main Electron file not found:', mainFile);
  console.log('\n🌐 Falling back to web version...');
  console.log('Run: npm run dev');
  process.exit(1);
}

console.log('✅ Main file exists:', mainFile);

// 6. Start Vite dev server
console.log('🌐 Starting Vite dev server...');
const viteProcess = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '3000'], {
  stdio: 'pipe',
  shell: true
});

let viteReady = false;

viteProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  if (output.includes('Local:') || output.includes('ready')) {
    viteReady = true;
  }
});

viteProcess.stderr.on('data', (data) => {
  console.error('Vite error:', data.toString());
});

// 7. Wait for dev server to be ready, then start Electron
let electronStarted = false;
let serverCheckAttempts = 0;
const maxAttempts = 30; // 30 seconds max wait

const waitForServer = () => {
  const checkServer = () => {
    if (electronStarted) return; // Prevent multiple starts
    
    serverCheckAttempts++;
    if (serverCheckAttempts > maxAttempts) {
      console.log('❌ Timeout waiting for Vite server');
      console.log('🌐 Try running: npm run dev');
      process.exit(1);
    }
    
    const http = require('http');
    const req = http.request('http://localhost:3000', { method: 'HEAD', timeout: 1000 }, (res) => {
      if (!electronStarted) {
        console.log('✅ Vite server is ready');
        startElectron();
      }
    });
    
    req.on('error', () => {
      if (!electronStarted && serverCheckAttempts <= 3) {
        console.log('⏳ Waiting for Vite server...');
      }
      setTimeout(checkServer, 1000);
    });
    
    req.on('timeout', () => {
      req.destroy();
      setTimeout(checkServer, 1000);
    });
    
    req.end();
  };
  
  setTimeout(checkServer, 2000); // Initial delay
};

const startElectron = () => {
  if (electronStarted) return; // Prevent multiple starts
  electronStarted = true;
  
  console.log('🖥️  Starting Electron...');
  const electronProcess = spawn('npx', ['electron', '.'], {
    stdio: 'inherit',
    shell: true,
    env: { 
      ...process.env, 
      NODE_ENV: 'development',
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true' // Reduce cache warnings
    }
  });

  electronProcess.on('close', (code) => {
    console.log(`\n🔚 Electron exited with code ${code}`);
    viteProcess.kill();
    process.exit(code);
  });

  electronProcess.on('error', (error) => {
    console.error('❌ Electron error:', error.message);
    viteProcess.kill();
    process.exit(1);
  });
};

waitForServer();

viteProcess.on('error', (error) => {
  console.error('❌ Vite error:', error.message);
  process.exit(1);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  viteProcess.kill();
  process.exit(0);
});