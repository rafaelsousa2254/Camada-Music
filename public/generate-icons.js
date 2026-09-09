const fs = require('fs');
const path = require('path');

function createSVG(size) {
    const padding = size * 0.15;
    const iconSize = size - padding * 2;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = iconSize / 2;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d7cff"/>
      <stop offset="100%" stop-color="#05255d"/>
    </linearGradient>
    <linearGradient id="play" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#d6e0f8"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)"/>
  <path d="M${centerX - radius * 0.25} ${centerY - radius * 0.45} L${centerX + radius * 0.35} ${centerY} L${centerX - radius * 0.25} ${centerY + radius * 0.45}Z" fill="url(#play)"/>
  <circle cx="${centerX - radius * 0.45}" cy="${centerY - radius * 0.15}" r="${radius * 0.08}" fill="#18f3ff" opacity="0.8"/>
  <circle cx="${centerX - radius * 0.45}" cy="${centerY + radius * 0.15}" r="${radius * 0.06}" fill="#168dff" opacity="0.6"/>
</svg>`;
}

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

[192, 512].forEach(size => {
    const svg = createSVG(size);
    const svgPath = path.join(assetsDir, `icon-${size}.svg`);
    fs.writeFileSync(svgPath, svg);
    console.log(`Criado: ${svgPath}`);
});

console.log('\nSVGs criados. Converta para PNG usando:');
console.log('  - https://convertio.co/svg-png/');
console.log('  - Ou instale: npm install -g svg2png-cli');
console.log('  - Ou use o Inkscape: inkscape icon-192.svg -w 192 -h 192 -o icon-192.png');
