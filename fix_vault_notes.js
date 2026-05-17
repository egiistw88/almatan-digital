import fs from 'fs';
let c = fs.readFileSync('src/components/VaultNotes.tsx', 'utf8');
c = c.replace(/onClick=\{\(\) => deleteNoteMutation\.mutate\(note\.id\)\}/g, "onClick={() => { if (window.confirm('Apakah Anda yakin ingin menghapus catatan ini?')) { deleteNoteMutation.mutate(note.id); } }}");
fs.writeFileSync('src/components/VaultNotes.tsx', c);
