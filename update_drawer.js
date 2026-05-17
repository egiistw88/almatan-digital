import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const asideOld = `<aside className={\`fixed inset-x-0 bottom-0 z-30 transform transition-transform duration-500 ease-in-out lg:static lg:transform-none lg:w-[420px] xl:w-[480px] bg-[#050505] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col shadow-2xl lg:shadow-none\n        \${activeVerseId ? 'translate-y-0 h-[60vh] lg:h-auto' : 'translate-y-full lg:translate-y-0 lg:h-auto'}\n      \`}>`;

const asideNew = `<AnimatePresence>\n        {activeVerseId && (\n        <motion.aside \n          initial={{ y: "100%" }}\n          animate={{ y: 0 }}\n          exit={{ y: "100%" }}\n          transition={{ type: "spring", damping: 25, stiffness: 200 }}\n          drag="y"\n          dragConstraints={{ top: 0 }}\n          dragElastic={0.2}\n          onDragEnd={(e, info) => {\n            if (info.offset.y > 100) {\n              setActiveVerseId(null);\n            }\n          }}\n          className="fixed inset-x-0 bottom-0 z-50 h-[50vh] sm:h-[40vh] bg-[#0a0a0c]/95 backdrop-blur-2xl border-t border-white/10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] rounded-t-3xl overflow-hidden"\n        >`;

content = content.replace(asideOld, asideNew);

const asideEndOld = `        )}\n      </aside>\n    )}\n      \n      <SyntopicalDrawer `;

const asideEndNew = `        )}\n        </motion.aside>\n        )}\n      </AnimatePresence>\n    )}\n      \n      <SyntopicalDrawer `;

content = content.replace(asideEndOld, asideEndNew);

fs.writeFileSync('src/App.tsx', content);
