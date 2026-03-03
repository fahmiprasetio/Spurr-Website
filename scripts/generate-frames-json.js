// Node.js script to generate a centralized frames.json in public folder
// This maps each sequence folder to its frame list
// Usage: node scripts/generate-frames-json.js

const fs = require('fs');
const path = require('path');

// Paths
const sequencesRoot = path.join(__dirname, '../public/car-image(sequences)');
const outputPath = path.join(__dirname, '../public/frames.json');

function isImageFile(filename) {
  return /\.(jpe?g|png|gif|webp)$/i.test(filename);
}

function main() {
  if (!fs.existsSync(sequencesRoot)) {
    console.error('Sequences folder not found:', sequencesRoot);
    process.exit(1);
  }
  
  const framesMap = {};
  const folders = fs.readdirSync(sequencesRoot, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  folders.forEach(folder => {
    const folderPath = path.join(sequencesRoot, folder);
    const files = fs.readdirSync(folderPath)
      .filter(isImageFile)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    framesMap[folder] = files;
    console.log(`Indexed: ${folder} (${files.length} frames)`);
  });
  
  fs.writeFileSync(outputPath, JSON.stringify(framesMap, null, 2));
  console.log(`\nCentralized frames.json generated at: ${outputPath}`);
}

main();
