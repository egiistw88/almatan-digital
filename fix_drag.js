import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'drag="y"',
  'drag={typeof window !== "undefined" && window.innerWidth < 1024 ? "y" : false}'
);

fs.writeFileSync('src/App.tsx', content);
