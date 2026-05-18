const fs = require('fs');
const path = require('path');

const dompurifySrcDir = path.join(__dirname, '..', 'node_modules', 'dompurify', 'src');
const files = ['utils.ts', 'tags.ts', 'attrs.ts', 'regexp.ts', 'purify.ts'];
const placeholder = '// Placeholder file to satisfy DOMPurify source-map references.\n';

fs.mkdirSync(dompurifySrcDir, { recursive: true });

for (const file of files) {
  const filePath = path.join(dompurifySrcDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, placeholder, 'utf8');
  }
}

console.log('DOMPurify sourcemap placeholders verified.');
