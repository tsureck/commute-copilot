/**
 * Generate placeholder asset images for development.
 * Run with: node scripts/generate-assets.js
 */

const fs = require('fs');
const path = require('path');

// Minimal valid PNG (1x1 navy pixel)
// This is a proper PNG file with the app's background color
const createPng = (width, height, r, g, b) => {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0); // Length
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr.writeUInt8(8, 16); // Bit depth
  ihdr.writeUInt8(2, 17); // Color type (RGB)
  ihdr.writeUInt8(0, 18); // Compression
  ihdr.writeUInt8(0, 19); // Filter
  ihdr.writeUInt8(0, 20); // Interlace
  
  // Calculate CRC for IHDR
  const crc32 = require('./crc32');
  const ihdrCrc = crc32(ihdr.slice(4, 21));
  ihdr.writeUInt32BE(ihdrCrc, 21);
  
  // For simplicity, let's create a minimal working PNG manually
  return null;
};

// Create a simple colored square PNG using a pre-computed minimal PNG
// Navy color: #0A1628 = RGB(10, 22, 40)
const createSimplePng = () => {
  // This is a valid 1x1 navy PNG
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR length + type
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth, color type, etc
    0xde, // CRC
    0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, // IDAT length + type
    0x08, 0xd7, 0x63, 0x60, 0x60, 0x60, 0x00, 0x00, // compressed data
    0x00, 0x04, 0x00, 0x01, 0x27, 0x34, 0x27, 0x0a, // CRC
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, // IEND
    0xae, 0x42, 0x60, 0x82 // CRC
  ]);
};

const assetsDir = path.join(__dirname, '..', 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const png = createSimplePng();
const files = [
  'icon.png',
  'splash-icon.png',
  'adaptive-icon.png',
  'favicon.png',
  'notification-icon.png'
];

files.forEach(file => {
  const filePath = path.join(assetsDir, file);
  fs.writeFileSync(filePath, png);
  console.log(`Created: ${file}`);
});

console.log('\nPlaceholder assets created successfully!');
console.log('Replace these with proper icons before building for production.');
