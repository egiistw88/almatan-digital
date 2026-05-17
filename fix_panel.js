import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldAside = `          className="fixed inset-x-0 bottom-0 z-50 h-[50vh] sm:h-[40vh] bg-[#0a0a0c]/95 backdrop-blur-2xl border-t border-white/10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] rounded-t-3xl overflow-hidden"`;

const newAside = `          className="fixed inset-x-0 bottom-0 z-50 h-[55vh] sm:h-[45vh] bg-[#0a0a0c]/95 backdrop-blur-2xl border-t border-white/10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] rounded-t-3xl overflow-hidden lg:!static lg:!transform-none lg:!translate-y-0 lg:!w-[420px] xl:!w-[480px] lg:!h-auto lg:!rounded-none lg:!border-t-0 lg:!border-l lg:!bg-[#050505] lg:!shadow-none lg:!opacity-100"`;

content = content.replace(oldAside, newAside);

// Also remove `BottomNav` on desktop to avoid confusion since `MainSidebar` is present
let nav = fs.readFileSync('src/components/BottomNav.tsx', 'utf8');
nav = nav.replace(
  'className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#050505]/80 backdrop-blur-3xl border-t border-white/5 pb-safe"',
  'className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#050505]/80 backdrop-blur-3xl border-t border-white/5 pb-safe"' 
  // Wait, I already added lg:hidden earlier! Just to be sure.
);
fs.writeFileSync('src/components/BottomNav.tsx', nav);

fs.writeFileSync('src/App.tsx', content);
