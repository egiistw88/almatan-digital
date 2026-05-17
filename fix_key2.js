import fs from 'fs';
let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace('<VaultNotes key={activeVerseId || "vault"} verseId={activeVerseId} mufradatId={selectedWord?.id} selectedWord={selectedWord} />', '<VaultNotes key={`vault-${activeVerseId || "none"}-${selectedWord?.id || "none"}`} verseId={activeVerseId} mufradatId={selectedWord?.id} selectedWord={selectedWord} />');

fs.writeFileSync('src/App.tsx', c);
