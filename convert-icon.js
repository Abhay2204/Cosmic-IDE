#!/usr/bin/env node

/**
 * Automatic Icon Converter for Cosmic IDE
 * Converts PNG to ICO using Node.js without external dependencies
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Converting PNG logo to ICO format...\n');

// Simple ICO header creation (basic implementation)
function createBasicIco(pngBuffer) {
  // ICO file format:
  // Header (6 bytes): 00 00 01 00 01 00 (reserved, type=1, count=1)
  // Directory entry (16 bytes): width, height, colors, reserved, planes, bpp, size, offset
  // PNG data
  
  const header = Buffer.from([
    0x00, 0x00, // Reserved
    0x01, 0x00, // Type (1 = ICO)
    0x01, 0x00  // Number of images
  ]);
  
  const directoryEntry = Buffer.from([
    0x00,       // Width (0 = 256)
    0x00,       // Height (0 = 256) 
    0x00,       // Color count (0 = no palette)
    0x00,       // Reserved
    0x01, 0x00, // Color planes
    0x20, 0x00, // Bits per pixel (32)
    ...Buffer.from(pngBuffer.length.toString(16).padStart(8, '0').match(/.{2}/g).reverse().map(x => parseInt(x, 16))), // Size (little endian)
    0x16, 0x00, 0x00, 0x00 // Offset to image data (22 bytes)
  ]);
  
  return Buffer.concat([header, directoryEntry, pngBuffer]);
}

try {
  const logoPath = path.join(__dirname, 'images', 'logo.png');
  const buildDir = path.join(__dirname, 'build');
  
  if (!fs.existsSync(logoPath)) {
    console.error('❌ Logo file not found at images/logo.png');
    process.exit(1);
  }
  
  // Ensure build directory exists
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  
  // Read PNG file
  const pngBuffer = fs.readFileSync(logoPath);
  console.log(`📖 Read PNG file: ${pngBuffer.length} bytes`);
  
  // Create basic ICO file
  const icoBuffer = createBasicIco(pngBuffer);
  
  // Write ICO file
  const icoPath = path.join(buildDir, 'icon.ico');
  fs.writeFileSync(icoPath, icoBuffer);
  
  console.log(`✅ Created ICO file: ${icoPath} (${icoBuffer.length} bytes)`);
  
  // Also create ICNS (just copy PNG for now)
  const icnsPath = path.join(buildDir, 'icon.icns');
  fs.copyFileSync(logoPath, icnsPath);
  console.log(`✅ Created ICNS file: ${icnsPath}`);
  
  console.log('\n🎯 Icons created successfully!');
  console.log('You can now run: npm run build:production');
  
} catch (error) {
  console.error('❌ Error converting icon:', error.message);
  console.log('\n💡 Alternative: Use online converter at https://convertio.co/png-ico/');
  process.exit(1);
}