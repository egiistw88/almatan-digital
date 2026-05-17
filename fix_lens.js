import fs from 'fs';
let c = fs.readFileSync('src/components/LensaTaqyid.tsx', 'utf8');

const dirtyCheck = `
  const handleClose = () => {
    if (capturedImage && !uploadMutation.isPending) {
      if (window.confirm("Gambar belum diunggah. Yakin ingin menutup Lensa Taqyid?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };
`;

c = c.replace('  const isProcessing = uploadMutation.isPending;', '  const isProcessing = uploadMutation.isPending;\n' + dirtyCheck);

// Replace exactly the relevant onClose
c = c.replace(/onClick=\{onClose\}/g, "onClick={handleClose}"); 

fs.writeFileSync('src/components/LensaTaqyid.tsx', c);
