import fs from 'fs';

let content = fs.readFileSync('src/components/CompilationBoard.tsx', 'utf8');

content = content.replace("return \\`## \\${title}\\\\n\\\\n\\${note.content}\\\\n\\`;", "return `## ${title}\\n\\n${note.content}\\n`;");
content = content.replace("join('\\\\n\\\\n');", "join('\\n\\n');");

content = content.replace(/\\`flex-1 overflow-y-auto p-4 space-y-3 \\\${snapshot.isDraggingOver \? 'bg-white\/5' : ''}\\`/g, "`flex-1 overflow-y-auto p-4 space-y-3 ${snapshot.isDraggingOver ? 'bg-white/5' : ''}`");

content = content.replace(/\\`p-4 rounded-xl border \\\${snapshot.isDragging \? 'bg-\\[#151518\\] border-indigo-500\/50 shadow-xl shadow-indigo-500\/20' : 'bg-white\/5 border-white\/5 hover:bg-white\/10'} transition-all\\`/g, "`p-4 rounded-xl border ${snapshot.isDragging ? 'bg-[#151518] border-indigo-500/50 shadow-xl shadow-indigo-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10'} transition-all`");

content = content.replace(/\\`flex-1 overflow-y-auto p-4 space-y-3 \\\${snapshot.isDraggingOver \? 'bg-indigo-500\/5' : ''}\\`/g, "`flex-1 overflow-y-auto p-4 space-y-3 ${snapshot.isDraggingOver ? 'bg-indigo-500/5' : ''}`");

content = content.replace(/\\`p-4 rounded-xl border \\\${snapshot.isDragging \? 'bg-\\[#1a1a24\\] border-indigo-400 shadow-xl shadow-indigo-500\/30' : 'bg-\\[#151518\\] border-indigo-500\/20 hover:border-indigo-500\/40'} transition-all\\`/g, "`p-4 rounded-xl border ${snapshot.isDragging ? 'bg-[#1a1a24] border-indigo-400 shadow-xl shadow-indigo-500/30' : 'bg-[#151518] border-indigo-500/20 hover:border-indigo-500/40'} transition-all`");

content = content.replace(/\\\\\\[\\(.*?\\)\\\\\\]/g, "\\\[(.*?)\\\]");

fs.writeFileSync('src/components/CompilationBoard.tsx', content);
