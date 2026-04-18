const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imageDir = path.join(process.cwd(), 'public', 'car-image(based)');

async function convertPngToWebp() {
  try {
    const files = fs.readdirSync(imageDir);
    const pngFiles = files.filter(file => file.toLowerCase().endsWith('.png'));

    console.log(`Found ${pngFiles.length} PNG files to convert...\n`);

    for (const file of pngFiles) {
      const inputPath = path.join(imageDir, file);
      const outputFile = file.replace(/\.png$/i, '.webp');
      const outputPath = path.join(imageDir, outputFile);

      try {
        const stats = fs.statSync(inputPath);
        const inputSizeMb = (stats.size / (1024 * 1024)).toFixed(2);

        await sharp(inputPath)
          .webp({ quality: 80 })
          .toFile(outputPath);

        const outputStats = fs.statSync(outputPath);
        const outputSizeMb = (outputStats.size / (1024 * 1024)).toFixed(2);
        const reduction = ((1 - outputStats.size / stats.size) * 100).toFixed(1);

        console.log(`✓ ${file}`);
        console.log(`  ${inputSizeMb}MB → ${outputSizeMb}MB (${reduction}% smaller)\n`);
      } catch (err) {
        console.error(`✗ Failed to convert ${file}: ${err.message}\n`);
      }
    }

    console.log('Conversion complete!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

convertPngToWebp();
