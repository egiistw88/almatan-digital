
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

const zettelkastenBlock = `) : activeFeature === 'zettelkasten' ? (
           <Suspense fallback={<div className="flex-1 flex items-center justify-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
             <ZettelkastenGraph />
           </Suspense>
        ) : (`;

const replaceWithBlock = `) : activeFeature === 'zettelkasten' ? (
           <Suspense fallback={<div className="flex-1 flex items-center justify-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
             <ZettelkastenGraph />
           </Suspense>
        ) : activeFeature === 'compilation' ? (
           <Suspense fallback={<div className="flex-1 flex items-center justify-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
             <CompilationBoard />
           </Suspense>
        ) : (`;

app = app.replace(zettelkastenBlock, replaceWithBlock);
fs.writeFileSync('src/App.tsx', app);
