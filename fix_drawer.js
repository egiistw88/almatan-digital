import fs from 'fs';
let content = fs.readFileSync('src/components/SyntopicalDrawer.tsx', 'utf8');

content = content.replace("bg-black/40 backdrop-blur-sm", "bg-black/70 backdrop-blur-md");
content = content.replace(
  "className=\"fixed bottom-0 inset-x-0 sm:inset-x-auto sm:right-6 sm:w-[480px] z-[70] bg-[black] border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] sm:bottom-6 shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh]\"",
  "className=\"fixed bottom-0 inset-x-0 sm:inset-x-auto sm:right-0 sm:w-[420px] lg:w-[480px] z-[70] bg-[#050505]/95 backdrop-blur-3xl border-t sm:border-t-0 sm:border-l border-white/10 rounded-t-[2rem] sm:rounded-none sm:top-0 sm:bottom-0 sm:h-full shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh] sm:max-h-full\""
);

fs.writeFileSync('src/components/SyntopicalDrawer.tsx', content);
