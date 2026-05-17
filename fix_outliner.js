import fs from 'fs';

let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  "const [activeFeature, setActiveFeature] = useState<'beranda' | 'maktabah' | 'mudawamah' | 'zettelkasten'>('beranda');",
  "const [activeFeature, setActiveFeature] = useState<'beranda' | 'maktabah' | 'mudawamah' | 'zettelkasten' | 'compilation'>('beranda');"
);

app = app.replace(
  "const ZettelkastenGraph = lazy(() => import('./components/ZettelkastenGraph').then(module => ({ default: module.ZettelkastenGraph })));",
  "const ZettelkastenGraph = lazy(() => import('./components/ZettelkastenGraph').then(module => ({ default: module.ZettelkastenGraph })));\nconst CompilationBoard = lazy(() => import('./components/CompilationBoard').then(module => ({ default: module.CompilationBoard })));"
);

// We need to add the view.
// In the code:
/*
        ) : activeFeature === 'zettelkasten' ? (
           <Suspense fallback={<div className="flex-1 flex items-center justify-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
             <ZettelkastenGraph />
           </Suspense>
*/
app = app.replace(
  "        ) : activeFeature === 'zettelkasten' ? (",
  "        ) : activeFeature === 'zettelkasten' ? (\n           <Suspense fallback={<div className=\"flex-1 flex items-center justify-center text-zinc-500\"><Loader2 className=\"w-8 h-8 animate-spin\" /></div>}>\n             <ZettelkastenGraph />\n           </Suspense>\n        ) : activeFeature === 'compilation' ? (\n           <Suspense fallback={<div className=\"flex-1 flex items-center justify-center text-zinc-500\"><Loader2 className=\"w-8 h-8 animate-spin\" /></div>}>\n             <CompilationBoard />\n           </Suspense>\n        ) : ("
);

// We need to remove the subsequent chunk from zettelkasten to avoid syntax error!
// Let me use regex carefully.
// Ah wait! I am replacing `        ) : activeFeature === 'zettelkasten' ? (`
// But the original code was:
//         ) : activeFeature === 'zettelkasten' ? (
//            <Suspense fallback={<div className="flex-1 flex items-center justify-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
//              <ZettelkastenGraph />
//            </Suspense>
//         ) : (
// So I will just use regex to match that whole block!

fs.writeFileSync('fix_app_compilation.js', `
import fs from 'fs';
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  "const [activeFeature, setActiveFeature] = useState<'beranda' | 'maktabah' | 'mudawamah' | 'zettelkasten'>('beranda');",
  "const [activeFeature, setActiveFeature] = useState<'beranda' | 'maktabah' | 'mudawamah' | 'zettelkasten' | 'compilation'>('beranda');"
);

app = app.replace(
  "const ZettelkastenGraph = lazy(() => import('./components/ZettelkastenGraph').then(module => ({ default: module.ZettelkastenGraph })));",
  "const ZettelkastenGraph = lazy(() => import('./components/ZettelkastenGraph').then(module => ({ default: module.ZettelkastenGraph })));\\nconst CompilationBoard = lazy(() => import('./components/CompilationBoard').then(module => ({ default: module.CompilationBoard })));"
);

const zettelkastenBlock = \`) : activeFeature === 'zettelkasten' ? (
           <Suspense fallback={<div className="flex-1 flex items-center justify-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
             <ZettelkastenGraph />
           </Suspense>
        ) : (\`;

const replaceWithBlock = \`) : activeFeature === 'zettelkasten' ? (
           <Suspense fallback={<div className="flex-1 flex items-center justify-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
             <ZettelkastenGraph />
           </Suspense>
        ) : activeFeature === 'compilation' ? (
           <Suspense fallback={<div className="flex-1 flex items-center justify-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
             <CompilationBoard />
           </Suspense>
        ) : (\`;

app = app.replace(zettelkastenBlock, replaceWithBlock);
fs.writeFileSync('src/App.tsx', app);
`);
