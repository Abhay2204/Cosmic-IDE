#!/usr/bin/env node

/**
 * Icon Creator for Cosmic IDE
 * Converts the existing logo.png to proper icon formats
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Creating icons for Cosmic IDE installer...\n');

// Check if we have the source logo
const logoPath = path.join(__dirname, 'images', 'logo.png');
if (!fs.existsSync(logoPath)) {
  console.error('❌ Logo file not found at images/logo.png');
  console.log('Please ensure you have a logo.png file in the images directory.');
  process.exit(1);
}

// Create build directory if it doesn't exist
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

console.log('📁 Build directory created/verified');

// Instructions for manual icon creation
console.log('\n🔧 Manual Icon Creation Required:');
console.log('');
console.log('To create proper icons for your installer, please follow these steps:');
console.log('');
console.log('1. Windows Icon (.ico):');
console.log('   - Use an online converter like https://convertio.co/png-ico/');
console.log('   - Upload your images/logo.png');
console.log('   - Download the .ico file');
console.log('   - Save it as build/icon.ico');
console.log('');
console.log('2. macOS Icon (.icns):');
console.log('   - Use an online converter like https://convertio.co/png-icns/');
console.log('   - Upload your images/logo.png');
console.log('   - Download the .icns file');
console.log('   - Save it as build/icon.icns');
console.log('');
console.log('3. Linux Icon (.png):');
console.log('   - Copy your images/logo.png to build/icon.png');
console.log('   - Ensure it\'s at least 512x512 pixels');
console.log('');

// Copy logo.png as Linux icon
const linuxIconPath = path.join(buildDir, 'icon.png');
try {
  fs.copyFileSync(logoPath, linuxIconPath);
  console.log('✅ Linux icon (icon.png) created successfully');
} catch (error) {
  console.error('❌ Failed to create Linux icon:', error.message);
}

// Create placeholder files with instructions
const windowsIconPath = path.join(buildDir, 'icon.ico');
const macIconPath = path.join(buildDir, 'icon.icns');

if (!fs.existsSync(windowsIconPath)) {
  fs.writeFileSync(windowsIconPath, 
    '# Windows Icon Placeholder\n' +
    '# Replace this file with a proper .ico file converted from images/logo.png\n' +
    '# Use https://convertio.co/png-ico/ to convert your logo\n'
  );
  console.log('📝 Windows icon placeholder created (build/icon.ico)');
}

if (!fs.existsSync(macIconPath)) {
  fs.writeFileSync(macIconPath, 
    '# macOS Icon Placeholder\n' +
    '# Replace this file with a proper .icns file converted from images/logo.png\n' +
    '# Use https://convertio.co/png-icns/ to convert your logo\n'
  );
  console.log('📝 macOS icon placeholder created (build/icon.icns)');
}

console.log('\n🎯 Next Steps:');
console.log('1. Convert your logo to proper icon formats using the links above');
console.log('2. Replace the placeholder files in the build/ directory');
console.log('3. Run "npm run build:production" to create your installer');
console.log('\n✨ Icon setup completed!');