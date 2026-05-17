import fs from 'fs';

// 1. Fix App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Import MainSidebar
app = app.replace(
  "import { BottomNav } from './components/BottomNav';",
  "import { BottomNav } from './components/BottomNav';\nimport { MainSidebar } from './components/MainSidebar';"
);

// Add state
app = app.replace(
  "// No longer using sidebar state",
  "const [isSidebarOpen, setIsSidebarOpen] = useState(false);"
);

// Add MainSidebar rendering
app = app.replace(
  "{/* Main Content Area */}",
  `<MainSidebar \n        isSidebarOpen={isSidebarOpen} \n        setIsSidebarOpen={setIsSidebarOpen} \n        activeFeature={activeFeature}\n        setActiveFeature={setActiveFeature}\n        matanList={matanList}\n        isLoadingMatan={isLoadingMatan}\n        matanId={matanId}\n        setSelectedMatanId={setSelectedMatanId}\n        setActiveVerseId={setActiveVerseId}\n        setShowUploadModal={setShowUploadModal}\n        user={user}\n        signOut={signOut}\n        startTour={startTour}\n      />\n\n      {/* Main Content Area */}`
);

// Fix Menu button
app = app.replace(
  `<button className="lg:hidden text-zinc-400 hover:text-zinc-100 transition-colors">\n                 <Menu size={24} />\n               </button>`,
  `<button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-zinc-400 hover:text-zinc-100 transition-colors">\n                 <Menu size={24} />\n               </button>`
);

fs.writeFileSync('src/App.tsx', app);

// 2. Fix BottomNav.tsx
let nav = fs.readFileSync('src/components/BottomNav.tsx', 'utf8');
nav = nav.replace(
  'className="fixed bottom-0 left-0 right-0 z-40 bg-[#050505]/80 backdrop-blur-3xl border-t border-white/5 pb-safe"',
  'className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#050505]/80 backdrop-blur-3xl border-t border-white/5 pb-safe"'
);
fs.writeFileSync('src/components/BottomNav.tsx', nav);
