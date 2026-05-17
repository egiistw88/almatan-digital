import fs from 'fs';
let content = fs.readFileSync('src/components/MainSidebar.tsx', 'utf8');

content = content.replace(
  /onClick=\{\(\) => setActiveFeature\('beranda'\)\}/g,
  "onClick={() => { setActiveFeature('beranda'); setIsSidebarOpen(false); }}"
);
content = content.replace(
  /onClick=\{\(\) => setActiveFeature\('maktabah'\)\}/g,
  "onClick={() => { setActiveFeature('maktabah'); setIsSidebarOpen(false); }}"
);
content = content.replace(
  /onClick=\{\(\) => setActiveFeature\('mudawamah'\)\}/g,
  "onClick={() => { setActiveFeature('mudawamah'); setIsSidebarOpen(false); }}"
);
content = content.replace(
  /onClick=\{\(\) => setActiveFeature\('zettelkasten'\)\}/g,
  "onClick={() => { setActiveFeature('zettelkasten'); setIsSidebarOpen(false); }}"
);
content = content.replace(
  /onClick=\{\(\) => setActiveFeature\('compilation'\)\}/g,
  "onClick={() => { setActiveFeature('compilation'); setIsSidebarOpen(false); }}"
);

fs.writeFileSync('src/components/MainSidebar.tsx', content);

