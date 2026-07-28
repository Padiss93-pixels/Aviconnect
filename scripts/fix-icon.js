// Supprime la transparence de icon.png en la remplaçant par #1E7A45
// Usage : node scripts/fix-icon.js
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function fix() {
  const iconPath = path.join(__dirname, '../assets/icon.png');
  const img = await loadImage(iconPath);
  const canvas = createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');

  // Fond vert AviConnect
  ctx.fillStyle = '#1E7A45';
  ctx.fillRect(0, 0, 1024, 1024);

  // Logo par-dessus
  ctx.drawImage(img, 0, 0, 1024, 1024);

  const out = canvas.toBuffer('image/png');
  fs.writeFileSync(iconPath, out);
  console.log('icon.png corrigé — transparence remplacée par #1E7A45');
}

fix().catch(console.error);
