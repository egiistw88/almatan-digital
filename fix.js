import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '<main className="flex-1 overflow-y-auto scroll-smooth bg-black scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">',
  "<main className={`flex-1 overflow-y-auto scroll-smooth bg-black scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent transition-all lg:pb-0 ${activeVerseId ? 'pb-[65vh]' : ''}`}>"
);

content = content.replace(
  /-mx-6 sm:-mx-12 cursor-pointer/g,
  '-mx-4 sm:-mx-8 cursor-pointer'
);

fs.writeFileSync('src/App.tsx', content);
