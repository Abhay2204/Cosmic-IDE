#!/usr/bin/env node

/**
 * Advanced Installer Configuration for Cosmic IDE
 * Handles code signing, auto-updater, and advanced build options
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration options
const config = {
  // Code signing (set these environment variables if you have a certificate)
  codeSign: {
    enabled: process.env.CSC_LINK && process.env.CSC_KEY_PASSWORD,
    certificatePath: process.env.CSC_LINK,
    certificatePassword: process.env.CSC_KEY_PASSWORD
  },
  
  // Auto-updater configuration
  autoUpdater: {
    enabled: false, // Set to true when you have a update server
    provider: 'github', // or 'generic', 's3', etc.
    owner: 'your-github-username',
    repo: 'cosmic-ide'
  },
  
  // Build optimization
  optimization: {
    compression: 'maximum',
    removeSourceMaps: true,
    minifyCode: true,
    excludeDevDependencies: true
  }
};

console.log('⚙️  Advanced Installer Configuration\n');

// Check code signing setup
if (config.codeSign.enabled) {
  console.log('🔐 Code signing: ENABLED');
  console.log(`   Certificate: ${config.codeSign.certificatePath}`);
} else {
  console.log('⚠️  Code signing: DISABLED');
  console.log('   To enable code signing:');
  console.log('   1. Obtain a code signing certificate');
  console.log('   2. Set CSC_LINK environment variable to certificate path');
  console.log('   3. Set CSC_KEY_PASSWORD environment variable');
}

// Auto-updater setup
if (config.autoUpdater.enabled) {
  console.log('\n🔄 Auto-updater: ENABLED');
  console.log(`   Provider: ${config.autoUpdater.provider}`);
} else {
  console.log('\n⚠️  Auto-updater: DISABLED');
  console.log('   To enable auto-updates, configure the autoUpdater section');
}

// Generate advanced electron-builder config
const advancedConfig = {
  appId: "com.cosmic.ide",
  productName: "Cosmic IDE",
  copyright: "Copyright © 2024 Cosmic IDE Team",
  
  directories: {
    output: "release",
    buildResources: "build"
  },
  
  files: [
    "dist/**/*",
    "dist-electron/**/*",
    "!**/*.ts",
    "!**/*.map",
    "!src/**/*",
    "!electron/**/*",
    "!node_modules/**/*"
  ],
  
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64", "ia32"]
      },
      {
        target: "portable",
        arch: ["x64"]
      }
    ],
    icon: "build/icon.ico",
    publisherName: "Cosmic IDE Team",
    verifyUpdateCodeSignature: false,
    artifactName: "${productName}-${version}-${arch}.${ext}",
    requestedExecutionLevel: "asInvoker",
    
    // Code signing configuration
    ...(config.codeSign.enabled && {
      certificateFile: config.codeSign.certificatePath,
      certificatePassword: config.codeSign.certificatePassword,
      signingHashAlgorithms: ["sha256"],
      signAndEditExecutable: true,
      signDlls: true
    })
  },
  
  nsis: {
    oneClick: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    installerIcon: "build/icon.ico",
    uninstallerIcon: "build/icon.ico",
    installerHeaderIcon: "build/icon.ico",
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "Cosmic IDE",
    include: "build/installer.nsh",
    artifactName: "${productName}-Setup-${version}.${ext}",
    deleteAppDataOnUninstall: false,
    
    // Advanced NSIS options
    warningsAsErrors: false,
    unicode: true,
    guid: "cosmic-ide-guid-12345",
    displayLanguageSelector: false,
    installerLanguages: ["en_US"],
    language: "1033"
  },
  
  // Auto-updater configuration
  ...(config.autoUpdater.enabled && {
    publish: {
      provider: config.autoUpdater.provider,
      owner: config.autoUpdater.owner,
      repo: config.autoUpdater.repo
    }
  }),
  
  compression: config.optimization.compression,
  removePackageScripts: config.optimization.excludeDevDependencies,
  nodeGypRebuild: false,
  buildDependenciesFromSource: false,
  
  // Security settings
  electronVersion: "28.3.3",
  electronDownload: {
    cache: path.join(__dirname, ".electron-cache")
  }
};

// Write advanced configuration
const configPath = path.join(__dirname, 'electron-builder-advanced.json');
fs.writeFileSync(configPath, JSON.stringify(advancedConfig, null, 2));

console.log('\n📝 Advanced configuration written to electron-builder-advanced.json');
console.log('\n🚀 To use advanced configuration:');
console.log('   npx electron-builder --config electron-builder-advanced.json --win');

// Performance recommendations
console.log('\n⚡ Performance Recommendations:');
console.log('1. Enable code signing for better Windows SmartScreen reputation');
console.log('2. Set up auto-updater for seamless user experience');
console.log('3. Use maximum compression to reduce installer size');
console.log('4. Test installer on clean Windows machines');
console.log('5. Monitor installer size (target: under 150MB)');

console.log('\n✨ Advanced installer configuration completed!');