const sharp = require('sharp');
const fs = require('fs');

const svgString = fs.readFileSync('./public/ping-og-image.svg', 'utf8');

sharp(Buffer.from(svgString))
  .resize(1200, 630)
  .png()
  .toFile('./public/ping-og-image.png')
  .then(info => { console.log('Conversion done:', info); })
  .catch(err => { console.error('Error:', err); });