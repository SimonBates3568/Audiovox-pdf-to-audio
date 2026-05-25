const https = require('https');
const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
const version = pkg.dependencies && pkg.dependencies['pdfjs-dist'] ? pkg.dependencies['pdfjs-dist'].replace('^','') : 'latest';
// Try unpkg and jsdelivr which serve files from npm packages reliably.
const candidates = [
  `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.js`,
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.js`,
];

let chosenUrl = candidates[0];

const outDir = path.join(__dirname, '..', 'public');
const outPath = path.join(outDir, 'pdf.worker.min.js');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

console.log(`Attempting to fetch pdf.worker -> ${outPath}`);

function tryFetch(urls, i = 0) {
  if (i >= urls.length) {
    console.error('Failed to fetch worker from all candidates.');
    process.exit(1);
    return;
  }
  const u = urls[i];
  console.log(`Trying ${u}`);
  https.get(u, (res) => {
    if (res.statusCode !== 200) {
      console.warn(`Failed (${res.statusCode}) for ${u}`);
      tryFetch(urls, i + 1);
      return;
    }

    const file = fs.createWriteStream(outPath);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Worker downloaded.');
    });
  }).on('error', (err) => {
    console.warn(`Error fetching ${u}:`, err.message || err);
    tryFetch(urls, i + 1);
  });
}

tryFetch(candidates);
