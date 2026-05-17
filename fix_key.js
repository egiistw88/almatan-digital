import fs from 'fs';
let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace('<VaultNotes verseId={activeVerseId} mufradatId={selectedWord?.id} selectedWord={selectedWord} />', '<VaultNotes key={activeVerseId || "vault"} verseId={activeVerseId} mufradatId={selectedWord?.id} selectedWord={selectedWord} />');

fs.writeFileSync('src/App.tsx', c);
