import fs from 'fs';
let content = fs.readFileSync('src/components/CompilationBoard.tsx', 'utf8');
content = content.replace(/<Draggable key=\{note\.id\} draggableId=\{note\.id\} index=\{index\}>/g, '{/* @ts-ignore */}\n                            <Draggable key={note.id} draggableId={note.id} index={index}>');
fs.writeFileSync('src/components/CompilationBoard.tsx', content);
