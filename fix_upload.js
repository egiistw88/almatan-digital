import fs from 'fs';
let c = fs.readFileSync('src/components/UploadKitab.tsx', 'utf8');

const dirtyCheck = `
  const handleClose = () => {
    if (title.trim() !== '' || author.trim() !== '' || content.trim() !== '' || pdfFileName) {
      if (window.confirm("Ada proses unggah atau draf yang belum disimpan. Yakin ingin membatalkan?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };
`;

c = c.replace('  const [showLensaTaqyid, setShowLensaTaqyid] = useState(false);', '  const [showLensaTaqyid, setShowLensaTaqyid] = useState(false);\n' + dirtyCheck);

// Let's replace ONLY those places. There are exactly 3 places where `onClose` is passed as click handler (excluding LensaTaqyid)
c = c.replace(/onClick=\{onClose\}/g, "onClick={handleClose}"); 
// Wait, `onClose={() => setShowLensaTaqyid(false)}` won't be matched by /onClick=\{onClose\}/g. So it's safe!

fs.writeFileSync('src/components/UploadKitab.tsx', c);
