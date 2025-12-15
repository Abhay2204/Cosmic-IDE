#!/usr/bin/env node

/**
 * Build Summary for Cosmic IDE Production Build
 * Shows detailed information about the generated installer files
 */

const fs = require('fs');
const path = require('path');

console.log('🎉 Cosmic IDE Production Build Summary\n');
console.log('=====================================\n');

const releaseDir = path.join(__dirname, 'release');

if (!fs.existsSync(releaseDir)) {
  console.log('❌ No release directory found. Run the build first.');
  process.exit(1);
}

const files = fs.readdirSync(releaseDir).filter(file => file.endsWith('.exe'));

if (files.length === 0) {
  console.log('❌ No installer files found in release directory.');
  process.exit(1);
}

console.log('📦 Generated Installer Files:\n');

files.forEach(file => {
  const filePath = path.join(releaseDir, file);
  const stats = fs.statSync(filePath);
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  const created = stats.birthtime.toLocaleString();
  
  console.log(`📄 ${file}`);
  console.log(`   Size: ${sizeInMB} MB`);
  console.log(`   Created: ${created}`);
  console.log(`   Path: ${filePath}`);
  
  if (file.includes('Setup')) {
    console.log('   Type: Full Installer (NSIS)');
    console.log('   Features: File associations, shortcuts, uninstaller');
  } else if (file.includes('Portable')) {
    console.log('   Type: Portable Application');
    console.log('   Features: No installation required, run anywhere');
  }
  console.log('');
});

// Check for additional files
const additionalFiles = fs.readdirSync(releaseDir).filter(file => 
  file.endsWith('.yml') || file.endsWith('.blockmap')
);

if (additionalFiles.length > 0) {
  console.log('📋 Additional Files:\n');
  additionalFiles.forEach(file => {
    console.log(`   📄 ${file}`);
  });
  console.log('');
}

// Build statistics
const totalSize = files.reduce((total, file) => {
  const filePath = path.join(releaseDir, file);
  const stats = fs.statSync(filePath);
  return total + stats.size;
}, 0);

const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

console.log('📊 Build Statistics:\n');
console.log(`   Total installer size: ${totalSizeMB} MB`);
console.log(`   Number of installers: ${files.length}`);
console.log(`   Build directory: ${releaseDir}`);

// Installation instructions
console.log('\n🚀 Installation Instructions:\n');
console.log('For End Users:');
console.log('1. Download "Cosmic IDE-Setup-1.0.0.exe" for full installation');
console.log('2. Or download "Cosmic IDE-1.0.0-Portable.exe" for portable use');
console.log('3. Run the installer and follow the setup wizard');
console.log('4. Cosmic IDE will be available in Start Menu and Desktop');

console.log('\nFor Developers:');
console.log('1. Test the installer on a clean Windows machine');
console.log('2. Verify all features work correctly');
console.log('3. Check file associations and context menus');
console.log('4. Upload to your distribution platform');

console.log('\n✨ Production build completed successfully!');
console.log('Your Cosmic IDE is ready for distribution! 🎊');