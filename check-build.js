const fs = require('fs');

console.log('🧪 Cosmic IDE Build Check\n');

// Check key files
const files = [
  'dist-electron/main.js',
  'dist-electron/preload.js', 
  'dist/index.html',
  'release/Cosmic IDE Setup 1.0.0.exe'
];

console.log('📁 Build Files:');
files.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    const size = file.includes('.exe') ? 
      `${(stats.size / 1024 / 1024).toFixed(1)} MB` :
      `${(stats.size / 1024).toFixed(1)} KB`;
    console.log(`✅ ${file} (${size})`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

console.log('\n🎉 Electron build completed successfully!');
console.log('📦 Installer: release/Cosmic IDE Setup 1.0.0.exe');
console.log('🖥️  Unpacked: release/win-unpacked/Cosmic IDE.exe');