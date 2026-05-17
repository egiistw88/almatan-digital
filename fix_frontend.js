import fs from 'fs';

let app = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
app = app.replace(
  "import { MainSidebar } from './components/MainSidebar';",
  "import { BottomNav } from './components/BottomNav';"
);

// Add scroll state
app = app.replace(
  "const [activeFeature, setActiveFeature] = useState<'beranda' | 'maktabah' | 'mudawamah' | 'zettelkasten' | 'compilation'>('beranda');",
  "const [activeFeature, setActiveFeature] = useState<'beranda' | 'maktabah' | 'mudawamah' | 'zettelkasten' | 'compilation'>('beranda');\n  const [isNavVisible, setIsNavVisible] = useState(true);\n  const lastScrollY = useRef(0);"
);

app = app.replace(
  "const [isSidebarOpen, setIsSidebarOpen] = useState(false);",
  "// No longer using sidebar state"
);

app = app.replace(
  "import React, { useState, useEffect, Suspense, lazy } from 'react';",
  "import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';"
);

// We define handleScroll inside App component, before return
const handleScrollStr = `
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
      setIsNavVisible(false);
    } else if (currentScrollY < lastScrollY.current) {
      setIsNavVisible(true);
    }
    lastScrollY.current = currentScrollY;
  };
`;

app = app.replace(
  "return (",
  handleScrollStr + "\n  return ("
);

// Attach it to main
app = app.replace(
  "<main className={`flex-1 overflow-y-auto",
  "<main onScroll={handleScroll} className={`flex-1 overflow-y-auto"
);

// Remove MainSidebar
const sidebarStr = '<MainSidebar \n          isOpen={isSidebarOpen} \n          onClose={() => setIsSidebarOpen(false)} \n          activeFeature={activeFeature}\n          setActiveFeature={setActiveFeature}\n        />';
app = app.replace(sidebarStr, "");

const sidebarStr2 = `<MainSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          activeFeature={activeFeature}
          setActiveFeature={setActiveFeature}
        />`;
app = app.replace(sidebarStr2, "");

// Look inside the file using regex to remove <MainSidebar ... /> if multiline
app = app.replace(/<MainSidebar[\s\S]*?\/>/, '');

// Remove desktop sidebar placeholder
app = app.replace(/<div className="hidden lg:block w-64 flex-none border-r border-white\/10 relative z-20"><\/div>/, "");

// Add BottomNav
app = app.replace(
  "    </div>\n  );\n}",
  "      <BottomNav activeFeature={activeFeature} setActiveFeature={setActiveFeature} onOpenLensa={() => setShowUploadModal(true)} isVisible={isNavVisible} />\n    </div>\n  );\n}"
);

// Fix Lensa Taqyid directly opening
app = app.replace(
  "onOpenCamera={() => setShowLensaTaqyidDirectly(true)}",
  "onOpenCamera={() => setShowUploadModal(true)}"
);

// Remove "onOpenSidebar: ..." from Dashboard
app = app.replace(/onOpenSidebar=\{\(\) => setIsSidebarOpen\(true\)\}/, "");

fs.writeFileSync('src/App.tsx', app);
