import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'const [activeVerseId, setActiveVerseId] = useState<string | null>(null);',
  'const [activeVerseId, setActiveVerseId] = useState<string | null>(null);\n  const [panelHeight, setPanelHeight] = useState(55); // in vh'
);

// We need to find the aside component and its container
const oldAsideStartRegex = /<motion\.aside[\s\S]*?className="fixed inset-x-0 bottom-0 z-50 h-\[55vh\] sm:h-\[45vh\] bg-\[#0a0a0c\]\/95 backdrop-blur-2xl border-t border-white\/10 flex flex-col shadow-\[0_-10px_40px_rgba\(0,0,0,0\.5\)\] rounded-t-3xl overflow-hidden lg:!static lg:!transform-none lg:!translate-y-0 lg:!w-\[420px\] xl:!w-\[480px\] lg:!h-auto lg:!rounded-none lg:!border-t-0 lg:!border-l lg:!bg-\[#050505\] lg:!shadow-none lg:!opacity-100"\s*>/;

const newAsideStart = `<motion.aside 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          style={{ height: typeof window !== "undefined" && window.innerWidth >= 1024 ? '100%' : \`\${panelHeight}vh\` }}
          className="fixed inset-x-0 bottom-0 z-50 bg-[#0a0a0c]/95 backdrop-blur-2xl border-t border-white/10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] rounded-t-3xl overflow-hidden lg:!static lg:!transform-none lg:!translate-y-0 lg:!w-[420px] xl:!w-[480px] lg:!h-auto lg:!rounded-none lg:!border-t-0 lg:!border-l lg:!bg-[#050505] lg:!shadow-none lg:!opacity-100"
        >`;

content = content.replace(oldAsideStartRegex, newAsideStart);

const oldDragHandleRegex = /<div[\s\S]*?className="w-full flex justify-center py-4 lg:hidden relative cursor-pointer"[\s\S]*?onClick=\{\(\) => setActiveVerseId\(null\)\}[\s\S]*?>[\s\S]*?<div className="w-12 h-1\.5 bg-white\/10 rounded-full mb-1"><\/div>[\s\S]*?<button className="absolute right-4 top-2 text-zinc-500 hover:text-white p-2">[\s\S]*?<X size=\{20\} \/>[\s\S]*?<\/button>[\s\S]*?<\/div>/;

const newDragHandle = `<div className="relative w-full lg:hidden">
            <motion.div 
              className="w-full flex justify-center py-4 cursor-ns-resize touch-none"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0}
              onDrag={(e, info) => {
                const viewportHeight = window.innerHeight;
                const yMovement = info.delta.y; 
                const deltaVh = (yMovement / viewportHeight) * 100;
                setPanelHeight(prev => Math.max(20, Math.min(prev - deltaVh, 90)));
              }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100) setActiveVerseId(null);
              }}
            >
                <div className="w-12 h-1.5 bg-white/20 rounded-full mb-1"></div>
            </motion.div>
            <button 
              onClick={() => setActiveVerseId(null)}
              className="absolute right-4 top-2 text-zinc-500 hover:text-white p-2 z-10"
            >
              <X size={20} />
            </button>
        </div>`;

content = content.replace(oldDragHandleRegex, newDragHandle);

fs.writeFileSync('src/App.tsx', content);
