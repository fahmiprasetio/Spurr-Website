const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sequencesDir = path.join(process.cwd(), 'public', 'car-image(sequences)');

async function convertJpgToWebp() {
  try {
    const folders = fs.readdirSync(sequencesDir);
    let totalConverted = 0;
    let totalSavings = 0;

    console.log(`Found ${folders.length} sequence folders\n`);

    for (const folder of folders) {
      const folderPath = path.join(sequencesDir, folder);
      const stat = fs.statSync(folderPath);
      
      if (!stat.isDirectory()) continue;

      const files = fs.readdirSync(folderPath);
      const jpgFiles = files.filter(file => 
        file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')
      );

      if (jpgFiles.length === 0) continue;

      console.log(`\nProcessing folder: ${folder} (${jpgFiles.length} files)`);
      let folderSavings = 0;

      for (const file of jpgFiles) {
        const inputPath = path.join(folderPath, file);
        const outputFile = file.replace(/\.(jpg|jpeg)$/i, '.webp');
        const outputPath = path.join(folderPath, outputFile);

        try {
          const inputStats = fs.statSync(inputPath);
          const inputSizeMb = (inputStats.size / (1024 * 1024)).toFixed(3);

          await sharp(inputPath)
            .webp({ quality: 75 })
            .toFile(outputPath);

          const outputStats = fs.statSync(outputPath);
          const outputSizeMb = (outputStats.size / (1024 * 1024)).toFixed(3);
          const savings = inputStats.size - outputStats.size;
          folderSavings += savings;
          totalSavings += savings;
          totalConverted++;

          const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(0);
          console.log(`  ✓ ${file} → ${outputFile} (${inputSizeMb}MB → ${outputSizeMb}MB, -${reduction}%)`);
        } catch (err) {
          console.error(`  ✗ Failed to convert ${file}: ${err.message}`);
        }
      }

      if (folderSavings > 0) {
        console.log(`  Folder savings: ${(folderSavings / (1024 * 1024)).toFixed(2)} MB`);
      }
    }

    console.log(`\n✅ Conversion complete!`);
    console.log(`Total converted: ${totalConverted} files`);
    console.log(`Total savings: ${(totalSavings / (1024 * 1024)).toFixed(2)} MB`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

convertJpgToWebp();
