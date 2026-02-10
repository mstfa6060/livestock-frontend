/**
 * Simple script to generate PWA placeholder icons.
 * Replace these with proper brand icons later.
 *
 * Usage: node scripts/generate-icons.js
 * Requires: none (generates SVG-based PNGs via canvas-less approach)
 */

const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate a simple SVG icon for each size
sizes.forEach(size => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#16a34a"/>
  <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
    font-family="system-ui, sans-serif" font-weight="bold" font-size="${size * 0.35}" fill="white">LT</text>
</svg>`;

  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svg);
  console.log(`Generated icon-${size}x${size}.svg`);
});

console.log('\nNote: SVG icons generated. For production, convert to PNG using:');
console.log('  npx sharp-cli -i public/icons/icon-192x192.svg -o public/icons/icon-192x192.png');
console.log('  npx sharp-cli -i public/icons/icon-512x512.svg -o public/icons/icon-512x512.png');
console.log('\nOr replace with your actual brand icons.');
