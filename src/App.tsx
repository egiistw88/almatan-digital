import React, { useState, Suspense, lazy, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { BookOpen, Search, Info, Loader2, LogOut, Sparkles, Menu, X, LibraryBig, PenLine, AlertCircle, Cloud, CloudOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matanService } from './services/matanService';
import { aiService } from './services/aiService';
import { Mufradat, Syarah } from './lib/supabase';
import { useAuth } from './lib/AuthContext';
import { useFontScale } from './lib/FontScaleContext';

import { Toaster, toast } from 'sonner';
import { noteService } from './services/noteService';
import { SyntopicalDrawer } from './components/SyntopicalDrawer';
import { BottomNav } from './components/BottomNav';
import { MainSidebar } from './components/MainSidebar';
import { EducationalDrawer } from './components/EducationalDrawer';

const MorphologicalSearch = lazy(() => import('./components/MorphologicalSearch').then(module => ({ default: module.MorphologicalSearch })));
const VaultNotes = lazy(() => import('./components/VaultNotes').then(module => ({ default: module.VaultNotes })));
const ZettelkastenGraph = lazy(() => import('./components/ZettelkastenGraph').then(module => ({ default: module.ZettelkastenGraph })));
const CompilationBoard = lazy(() => import('./components/CompilationBoard').then(module => ({ default: module.CompilationBoard })));
const UploadKitab = lazy(() => import('./components/UploadKitab').then(module => ({ default: module.UploadKitab })));
const UserProfileModal = lazy(() => import('./components/UserProfileModal').then(module => ({ default: module.UserProfileModal })));
const MudawamahTracker = lazy(() => import('./components/MudawamahTracker').then(module => ({ default: module.MudawamahTracker })));
const LensaTaqyid = lazy(() => import('./components/LensaTaqyid').then(module => ({ default: module.LensaTaqyid })));

type SelectedWord = Mufradat | null;

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return isOnline;
};

const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));

export default function App() {
  const { user, signOut } = useAuth();
  const { arabicScale, increaseScale, decreaseScale } = useFontScale();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  const [selectedWord, setSelectedWord] = useState<SelectedWord>(null);
  const [activeTab, setActiveTab] = useState<'syarah' | 'word' | 'notes'>('syarah');
  const [activeFeature, setActiveFeature] = useState<'beranda' | 'maktabah' | 'mudawamah' | 'zettelkasten' | 'compilation'>('beranda');
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
      setIsNavVisible(false);
    } else if (currentScrollY < lastScrollY.current) {
      setIsNavVisible(true);
    }
    lastScrollY.current = currentScrollY;
  };
  const [showSearch, setShowSearch] = useState(false);
  const [initialSearchQuery, setInitialSearchQuery] = useState('');
  
  const [isEducationalDrawerOpen, setIsEducationalDrawerOpen] = useState(false);

  useEffect(() => {
    const isCompleted = localStorage.getItem('almanhaj_edu_drawer_seen');
    if (!isCompleted) {
      const timer = setTimeout(() => {
        setIsEducationalDrawerOpen(true);
        localStorage.setItem('almanhaj_edu_drawer_seen', 'true');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Syntopical Drawer Global State
  const [isSyntopicalDrawerOpen, setIsSyntopicalDrawerOpen] = useState(false);
  const [drawerSelectedText, setDrawerSelectedTextState] = useState('');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleSelection = () => {
      // Allow the click/selection to settle
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        // Prevent triggering if drawer is already open to avoid disruption or nested triggers
        if (isSyntopicalDrawerOpen) return;
        
        let text = '';
        const activeEl = document.activeElement;
        
        // Handle selections inside inputs and textareas
        if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
          const el = activeEl as HTMLTextAreaElement | HTMLInputElement;
          try {
             text = el.value.substring(el.selectionStart || 0, el.selectionEnd || 0).trim();
          } catch (e) {
             // Some input types might throw error on selectionStart
          }
        } else {
          const selection = window.getSelection();
          text = selection ? selection.toString().trim() : '';
        }

        if (text.length > 5) {
          setDrawerSelectedTextState(text);
          setIsSyntopicalDrawerOpen(true);
          
          // Optional: Vibrate on mobile for tactile feedback
          if (typeof navigator.vibrate === 'function') {
             navigator.vibrate(50);
          }
        }
      }, 300);
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Shift' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
         handleSelection();
      }
    });

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
      document.removeEventListener('keyup', handleSelection);
    };
  }, [isSyntopicalDrawerOpen]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  const [selectedMatanId, setSelectedMatanId] = useState<string | null>(null);
  const [activeVerseId, setActiveVerseId] = useState<string | null>(null);
  const [isContextPanelOpen, setIsContextPanelOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState(55); // in vh
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [hasNewNoteBadge, setHasNewNoteBadge] = useState(false);
  const [activeOcrTask, setActiveOcrTask] = useState<{id: string, isSimulated: boolean} | null>(null);
  const [showLensaTaqyidDirectly, setShowLensaTaqyidDirectly] = useState(false);
  const [ocrRevisionText, setOcrRevisionText] = useState<string | null>(null);

  useEffect(() => {
    if (activeOcrTask?.isSimulated) {
      toast.info("Lensa Taqyid: Memulai OCR di latar belakang (Mode Simulasi)...");
      const timer = setTimeout(() => {
        toast.success("Lensa Taqyid: Ekstraksi OCR Selesai ✨");
        
        setOcrRevisionText(`[Ekstrak ${new Date().toLocaleTimeString()}]\n\nقال محمد هو ابن مالك\nأحمد ربي الله خير مالك\nمصليا على النبي المصطفى\nوآله المستكملين الشرفا\n\n(Dibersihkan dari Noise Format Paragraf)\n\nTags: ocr, lembaran`);
        setActiveOcrTask(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeOcrTask]);

  const { data: ocrStatusData } = useQuery({
    queryKey: ['ocr_status', activeOcrTask?.id],
    queryFn: async () => {
      if (!activeOcrTask || activeOcrTask.isSimulated) return null;
      const res = await fetch(`/api/v1/ocr/status/${activeOcrTask.id}`);
      if (!res.ok) throw new Error("Error fetching status");
      return res.json();
    },
    enabled: !!activeOcrTask && !activeOcrTask.isSimulated,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'completed' || data.status === 'failed')) return false;
      return 2000;
    }
  });

  useEffect(() => {
    if (ocrStatusData?.status === 'completed' && ocrStatusData.result) {
      toast.success("Lensa Taqyid: Ekstraksi OCR Selesai ✨");
      
      setOcrRevisionText(`[Ekstrak ${new Date().toLocaleTimeString()}]\n\n${ocrStatusData.result}\n\nTags: ocr`);
      setActiveOcrTask(null);
    } else if (ocrStatusData?.status === 'failed') {
      toast.error("Lensa Taqyid: Ekstraksi OCR gagal: " + ocrStatusData.error);
      setActiveOcrTask(null);
    }
  }, [ocrStatusData]);

  const handleSaveOcrText = () => {
    if (!ocrRevisionText) return;
    noteService.saveNote({
        user_id: user?.id || 'local-guest',
        verse_id: verses?.[0]?.id || '22222222-2222-2222-2222-222222222222',
        mufradat_id: null as any,
        note_type: 'zettelkasten',
        content: ocrRevisionText,
    }).then(() => {
        window.dispatchEvent(new Event('vault_notes_updated'));
        setHasNewNoteBadge(true);
        queryClient.invalidateQueries({ queryKey: ['zettelkasten_notes'] });
        setOcrRevisionText(null);
        toast.success("Catatan hasil ekstrak berhasil disimpan ke Vault.");
    });
  };
  
  const verseRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Data Fetching: Matan
  const { data: matanList, isLoading: isLoadingMatan } = useQuery({
    queryKey: ['matan'],
    queryFn: () => matanService.getMatanList()
  });

  // Dinamis matanId
  const matanId = selectedMatanId || (matanList?.[0]?.id ?? "11111111-1111-1111-1111-111111111111");

  // Data Fetching: Verse
  const { data: verses, isLoading: isLoadingVerses, error } = useQuery({
    queryKey: ['verses', matanId],
    queryFn: () => matanService.getVerses(matanId),
    enabled: !!matanId
  });

  const activeMatan = matanList?.find(m => m.id === matanId) || matanList?.[0];
  const activeVerse = verses?.find(v => v.id === activeVerseId) || verses?.[0];
  const verseId = activeVerse?.id || "22222222-2222-2222-2222-222222222222";

  // Data Fetching: Mufradat
  const { data: mufradat, isLoading: isLoadingMufradat } = useQuery({
    queryKey: ['mufradat', verseId],
    queryFn: () => matanService.getMufradat(verseId),
    enabled: !!verseId
  });

  // Data Fetching: Syarah
  const { data: syarah, isLoading: isLoadingSyarah } = useQuery({
    queryKey: ['syarah', verseId],
    queryFn: () => matanService.getSyarah(verseId),
    enabled: !!verseId
  });

  // AI Mutations
  const generateSyarahMutation = useMutation({
    mutationFn: async () => {
      if (!activeVerse || !activeMatan) throw new Error("No active verse");
      const result = await aiService.generateSyarah(activeVerse.id, activeVerse.text_arabic, activeMatan.title);
      if (result) await matanService.saveSyarah(result);
      else throw new Error("Gagal menyusun syarah");
    },
    onMutate: () => {
      if (!navigator.onLine) {
        toast.info("Koneksi terputus. Analisis kata ini masuk antrean dan akan dieksekusi saat sinyal kembali.");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['syarah', verseId] }),
    onError: (error) => toast.error(error.message || "Gagal menyusun syarah")
  });

  const generateTranslationMutation = useMutation({
    mutationFn: async () => {
      if (!activeVerse || !activeMatan) throw new Error("No active verse");
      const text = await aiService.translateVerse(activeVerse.text_arabic, activeMatan.title);
      if (!text || text.includes("Gagal") || text.includes("Terjadi kesalahan") || text.includes("tidak tersedia")) throw new Error(text);
      await matanService.updateVerseTranslation(activeVerse.id, text);
    },
    onMutate: () => {
      if (!navigator.onLine) {
        toast.info("Koneksi terputus. Analisis kata ini masuk antrean dan akan dieksekusi saat sinyal kembali.");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['verses', matanId] }),
    onError: (error) => toast.error(error.message || "Gagal menerjemahkan")
  });

  const generateMorphologyMutation = useMutation({
    mutationFn: async () => {
      if (!activeVerse) throw new Error("No active verse");
      const result = await aiService.analyzeMorphology(activeVerse.id, activeVerse.text_arabic);
      if (result && result.length > 0) {
        await matanService.saveMufradat(activeVerse.id, result);
      } else {
        throw new Error("Gagal mengekstrak morfologi");
      }
    },
    onMutate: () => {
      if (!navigator.onLine) {
        toast.info("Koneksi terputus. Analisis kata ini masuk antrean dan akan dieksekusi saat sinyal kembali.");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mufradat', verseId] }),
    onError: (error) => toast.error(error.message || "Gagal mengekstrak morfologi")
  });

  const handleWordClick = (verse_id: string, word: Mufradat) => {
    setActiveVerseId(verse_id);
    setSelectedWord(word);
    setActiveTab('word');
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleVerseClick = (verse_id: string) => {
    if (activeVerseId !== verse_id) {
      setActiveVerseId(verse_id);
      setSelectedWord(null);
      setActiveTab('syarah');
    }
    setIsContextPanelOpen(true);
  };

  useEffect(() => {
    if (!verses || verses.length === 0) return;

    if (!activeVerseId && verses[0]) {
      setActiveVerseId(verses[0].id);
    }
  }, [verses, activeVerseId]);

  useEffect(() => {
    const handleOnline = () => {
      toast.success("Koneksi pulih. Menyimkronkan data luring...");
      import('./services/noteService').then(m => m.noteService.syncOfflineData());
    };
    
    const handleOffline = () => {
      toast.warning("Koneksi terputus. Mode Luring aktif.");
    };

    const handleNavigateToBeranda = () => {
      setActiveFeature('beranda');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('navigate_to_beranda', handleNavigateToBeranda);

    // Initial check
    if (navigator.onLine) {
      import('./services/noteService').then(m => m.noteService.syncOfflineData());
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('navigate_to_beranda', handleNavigateToBeranda);
    };
  }, []);

  return (
        <div className="flex h-[100dvh] w-full bg-black text-zinc-100 overflow-hidden font-sans selection:bg-white/20 selection:text-white">
      {/* Educational Drawer */}
      <EducationalDrawer 
        isOpen={isEducationalDrawerOpen} 
        onClose={() => setIsEducationalDrawerOpen(false)} 
        activeFeature={activeFeature} 
      />
      
      <MainSidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        activeFeature={activeFeature}
        setActiveFeature={setActiveFeature}
        matanList={matanList}
        isLoadingMatan={isLoadingMatan}
        matanId={matanId}
        setSelectedMatanId={setSelectedMatanId}
        setActiveVerseId={setActiveVerseId}
        setShowUploadModal={setShowUploadModal}
        setShowProfileModal={setShowProfileModal}
        user={user}
        signOut={signOut}
        startTour={() => setIsEducationalDrawerOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-black">
        {activeFeature !== 'beranda' && (
        <header className="h-[72px] border-b border-white/5 bg-black/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-8 shrink-0 z-20 sticky top-0">
           <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-zinc-400 hover:text-zinc-100 transition-colors">
               <Menu size={24} />
             </button>
             <div className="hidden sm:block">
               {activeFeature === 'mudawamah' && <h2 className="text-lg font-semibold text-zinc-100">Mudawamah</h2>}
               {(activeFeature === 'zettelkasten' || activeFeature === 'compilation') && <h2 className="text-lg font-semibold text-zinc-100">Knowledge Base</h2>}
               {activeFeature === 'maktabah' && activeMatan && (
                 <>
                   <h2 className="text-lg font-semibold text-zinc-100">{activeMatan.title}</h2>
                   <p className="text-xs text-zinc-500">{activeMatan.author}</p>
                 </>
               )}
             </div>
           </div>

           <div className="flex items-center gap-4">
             {isOnline ? (
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400" title="Tersinkronisasi dengan Cloud">
                 <Cloud className="w-4 h-4" />
                 <span className="text-[10px] font-bold tracking-widest uppercase hidden sm:inline">Tersinkronisasi</span>
               </div>
             ) : (
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400" title="Offline (Perubahan disimpan lokal)">
                 <CloudOff className="w-4 h-4" />
                 <span className="text-[10px] font-bold tracking-widest uppercase hidden sm:inline">Luring</span>
               </div>
             )}
             <div className="flex items-center gap-1 bg-white/5 border border-white/5 rounded-full px-2 py-1 mr-2 hidden sm:flex">
                <button onClick={decreaseScale} className="p-1 text-zinc-400 hover:text-white transition-colors" title="Perkecil Ukuran Huruf Arab">
                   <span className="text-[10px] font-bold">A-</span>
                </button>
                <div className="w-px h-3 bg-white/20 mx-1"></div>
                <button onClick={increaseScale} className="p-1 text-zinc-400 hover:text-white transition-colors" title="Perbesar Ukuran Huruf Arab">
                   <span className="text-sm font-bold">A+</span>
                </button>
             </div>
             <button 
               onClick={() => { setInitialSearchQuery(''); setShowSearch(true); }}
               className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-sm font-medium text-zinc-300 transition-colors"
             >
               <Search size={16} className="text-zinc-500" />
               <span className="hidden sm:inline">Pencarian Lanjutan</span>
             </button>
           </div>
        </header>
        )}

        {/* Main Area based on feature */}
        {activeFeature === 'beranda' ? (
          <Suspense fallback={<div className="flex-1 flex items-center justify-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <Dashboard 
              activeMatanTitle={activeMatan?.title || "Mulai Kitab Baru"} 
              activeMatanAuthor={activeMatan?.author || "Tidak ada kitab tersedia"} 
              onOpenCamera={() => setShowUploadModal(true)}
              onOpenSidebar={() => setIsSidebarOpen(true)}
              onOpenDrawer={() => setIsSyntopicalDrawerOpen(true)}
            />
          </Suspense>
        ) : activeFeature === 'mudawamah' ? (
          <Suspense fallback={<div className="flex-1 flex items-center justify-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
             <MudawamahTracker />
          </Suspense>
        ) : activeFeature === 'zettelkasten' || activeFeature === 'compilation' ? (
           <div className="flex-1 flex flex-col w-full h-full relative">
             <div className="w-full flex justify-center py-4 bg-black border-b border-white/5 shrink-0">
                <div className="flex items-center p-1 bg-[#111113] border border-white/10 rounded-full shadow-inner">
                  <button 
                    onClick={() => setActiveFeature('zettelkasten')} 
                    className={`px-6 py-1.5 rounded-full text-xs font-semibold transition-all ${activeFeature === 'zettelkasten' ? 'bg-zinc-100 text-black shadow-sm' : 'text-zinc-500 hover:text-white'}`}
                  >
                    Neural Graph
                  </button>
                  <button 
                    onClick={() => setActiveFeature('compilation')} 
                    className={`px-6 py-1.5 rounded-full text-xs font-semibold transition-all ${activeFeature === 'compilation' ? 'bg-zinc-100 text-black shadow-sm' : 'text-zinc-500 hover:text-white'}`}
                  >
                    Papan Draf
                  </button>
                </div>
             </div>
             <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
               <Suspense fallback={<div className="flex-1 flex items-center justify-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                 {activeFeature === 'zettelkasten' ? <ZettelkastenGraph /> : <CompilationBoard />}
               </Suspense>
             </div>
           </div>
        ) : (
          <main onScroll={handleScroll} className={`flex-1 overflow-y-auto scroll-smooth bg-black scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent transition-all duration-500 ease-in-out lg:pb-0 ${activeVerseId && isContextPanelOpen ? 'pb-[65vh] lg:pr-[420px] xl:pr-[480px]' : ''}`}>
             <div className="max-w-4xl mx-auto px-4 pt-12 pb-32 sm:px-8 sm:py-24">
             
             {isLoadingVerses ? (
               <div className="space-y-16 animate-pulse opacity-50">
                 {[1, 2, 3].map(i => (
                   <div key={i} className="flex gap-4">
                     <div className="w-8 h-8 bg-zinc-800 rounded-full shrink-0"></div>
                     <div className="space-y-4 flex-1">
                       <div className="w-3/4 h-6 bg-zinc-800 rounded-lg"></div>
                       <div className="w-1/2 h-6 bg-zinc-800 rounded-lg"></div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : error ? (
               <div className="flex flex-col items-center justify-center py-20 text-red-400 gap-4">
                 <AlertCircle className="w-12 h-12" />
                 <p>{error.message || "Gagal memuat bait."}</p>
                 <button onClick={() => window.location.reload()} className="px-6 py-2 mt-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-full text-zinc-300">Coba Lagi</button>
               </div>
             ) : verses?.map((verse, index) => {
                const isActive = activeVerseId === verse.id;
                
                return (
                  <div 
                    key={verse.id} 
                    id={`verse-${verse.id}`}
                    ref={el => { verseRefs.current[verse.id] = el; }}
                    onClick={() => handleVerseClick(verse.id)}
                    className={`block relative py-12 px-6 sm:px-10 rounded-3xl transition-all duration-500 cursor-pointer mb-8 group ${isActive ? 'bg-[#0a0a0c] border border-white/10 shadow-2xl scale-[1.02] ring-1 ring-white/5' : 'hover:bg-white/[0.02] border border-transparent'}`}
                  >
                    <div className="absolute -left-3 top-14 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs text-zinc-500 font-mono shadow-inner group-hover:text-zinc-300 transition-colors">
                      {index + 1}
                    </div>
                    {isActive && (
                      <motion.div layoutId="active-indicator" className="absolute -left-px top-10 bottom-10 w-1 bg-gradient-to-b from-transparent via-zinc-400 to-transparent opacity-50 rounded-r-4xl" />
                    )}
                    
                    <p className={`text-right leading-[3.5] font-arabic mb-8 transition-all duration-300 antialiased ${isActive ? 'text-zinc-100 text-shadow-sm' : 'text-zinc-400 drop-shadow-sm'}`} style={{ fontSize: `calc(${isActive ? '1.875rem' : '1.5rem'} * ${arabicScale})` }} dir="rtl" dangerouslySetInnerHTML={{ __html: verse.text_arabic.replace(/([^\s]+)/g, '<span class="hover:bg-white/10 px-1 py-0.5 rounded transition-colors inline-block">$1</span>') }} />
                    <p className={`text-base sm:text-lg leading-relaxed font-serif transition-colors duration-300 ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      {verse.text_translation}
                    </p>
                  </div>
                );
              })}
              
              {/* End Marker */}
              <div className="py-24 flex justify-center items-center gap-4 opacity-50">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-100/50"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-100/30"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-100/10"></div>
              </div>
            </div>
         </main>)}
      </div>

      {/* Context Panel (Bottom on Mobile, Right on Desktop) */}
      {activeFeature === 'maktabah' && (
      <>
      <AnimatePresence>
        {activeVerseId && isContextPanelOpen && (
        <motion.aside 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          style={{ height: typeof window !== 'undefined' && window.innerWidth >= 1024 ? '100%' : `${panelHeight}vh` }}
          className="fixed inset-x-0 bottom-0 z-50 bg-[#0a0a0c]/95 backdrop-blur-2xl border-t border-white/10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] rounded-t-3xl overflow-hidden lg:!fixed lg:!inset-y-0 lg:!right-0 lg:!left-auto lg:!w-[420px] xl:!w-[480px] lg:!h-full lg:!rounded-none lg:!border-t-0 lg:!border-l lg:!bg-[#050505] lg:!shadow-none lg:!opacity-100"
        >
        <div className="relative w-full lg:hidden shrink-0">
            <motion.div 
              className="w-full flex justify-center py-4 cursor-ns-resize touch-none"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0}
              onDrag={(e, info) => {
                const viewportHeight = window.innerHeight;
                const yMovement = info.delta.y; 
                const deltaVh = (yMovement / viewportHeight) * 100;
                setPanelHeight(prev => Math.max(30, Math.min(prev - deltaVh, 90)));
              }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100) setIsContextPanelOpen(false);
              }}
            >
                <div className="w-14 h-1.5 bg-white/20 hover:bg-white/40 transition-colors rounded-full mb-1"></div>
            </motion.div>
            <button 
              onClick={() => setIsContextPanelOpen(false)}
              className="absolute right-4 top-2 text-zinc-500 hover:text-white p-2 z-10"
            >
              <X size={20} />
            </button>
        </div>

        {/* Panel Tabs and Desktop Close */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-b border-white/5 shrink-0 bg-[#050505] z-10 box-border pt-0 lg:pt-6 relative">
          <button 
            onClick={() => setIsContextPanelOpen(false)}
            className="absolute right-4 top-2 lg:top-6 lg:right-6 text-zinc-500 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors hidden lg:flex"
          >
            <X size={20} />
          </button>

          <div className="flex p-1 bg-[#111113] border border-white/5 rounded-xl lg:mr-12">
            <button 
              onClick={() => setActiveTab('syarah')}
              className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${activeTab === 'syarah' ? 'bg-white/10 text-white shadow-sm border border-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Info size={16} /> Syarah
            </button>
            <button 
              onClick={() => setActiveTab('word')}
              className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${activeTab === 'word' ? 'bg-white/10 text-white shadow-sm border border-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Search size={16} /> I'rab
            </button>
            <button 
              onClick={() => {
                setActiveTab('notes');
                setHasNewNoteBadge(false);
              }}
              className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all relative ${activeTab === 'notes' ? 'bg-white/10 text-white shadow-sm border border-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <PenLine size={16} /> Catatan
              {hasNewNoteBadge && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#050505] pb-10 scrollbar-thin scrollbar-thumb-zinc-800">
          <AnimatePresence mode="wait">
            {!activeVerseId ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500"
              >
                <BookOpen className="w-16 h-16 mb-6 opacity-20 text-zinc-100" />
                <h3 className="text-sm font-medium text-zinc-300 mb-2">Eksplorasi Kitab</h3>
                <p className="text-xs max-w-[240px] leading-relaxed">Pilih salah satu bait pada teks utama untuk mempelajari syarah, i'rab, dan terjemahannya.</p>
              </motion.div>
            ) : activeTab === 'word' ? (
              <motion.div 
                key="word"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {!selectedWord ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                    <p className="text-sm">Pilih kata pada bait untuk melihat i'rab.</p>
                  </div>
                ) : (
                  <div className="bg-[#111113] p-6 rounded-2xl border border-white/5 shadow-xl">
                    <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                      <h4 className="font-arabic text-zinc-100" style={{ fontSize: `calc(1.875rem * ${arabicScale})` }}>{selectedWord.word_arabic}</h4>
                      <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-zinc-400 capitalize">Tahlil</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Akar Kata</p>
                        <p className="text-zinc-300 font-arabic" style={{ fontSize: `calc(1rem * ${arabicScale})` }}>{selectedWord.root_word}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Kedudukan/I'rab</p>
                        <p className="text-sm text-zinc-300">{selectedWord.nahwu_position}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Terjemahan</p>
                        <p className="text-sm text-zinc-300">{selectedWord.translation}</p>
                      </div>
                      
                      <button 
                        onClick={() => { setInitialSearchQuery(selectedWord.root_word); setShowSearch(true); }}
                        className="mt-4 w-full py-4 bg-zinc-100 hover:bg-white text-zinc-900 rounded-2xl text-sm font-semibold shadow-xl hover:shadow-2xl transition-all focus:ring-2 focus:ring-white/50 outline-none flex justify-center items-center gap-2 group"
                      >
                        <Search size={18} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" /> 
                        Pencarian Lanjutan Akar Kata
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="mt-8 border-t border-white/5 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold text-zinc-300">Daftar Kata (Bait Ini)</h4>
                    {(!mufradat || mufradat.length === 0) && (
                      <button 
                        onClick={() => generateMorphologyMutation.mutate()}
                        disabled={generateMorphologyMutation.isPending}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Sparkles size={14} className={generateMorphologyMutation.isPending ? "animate-spin" : ""} />
                        {generateMorphologyMutation.isPending ? "Menganalisis..." : "Ekstrak I'rab (AI)"}
                      </button>
                    )}
                  </div>
                  
                  {isLoadingMufradat ? (
                    <div className="flex justify-center py-8 text-zinc-500"><Loader2 className="w-5 h-5 animate-spin" /></div>
                  ) : mufradat && mufradat.length > 0 ? (
                    <div className="flex flex-wrap gap-2" dir="rtl">
                      {mufradat.map(word => (
                        <button
                          key={word.id}
                          onClick={() => setSelectedWord(word)}
                          style={{ fontSize: `calc(1.125rem * ${arabicScale})` }}
                          className={`px-3 py-1.5 rounded-lg font-arabic transition-colors ${selectedWord?.id === word.id ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200 border border-transparent'}`}
                        >
                          {word.word_arabic}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ) : activeTab === 'syarah' ? (
              <motion.div 
                key="syarah"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {!syarah ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                    <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm text-center mb-6">Belum ada syarah untuk bait ini.</p>
                    <button 
                      onClick={() => generateSyarahMutation.mutate()}
                      disabled={generateSyarahMutation.isPending || !activeVerse}
                      className="flex items-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      <Sparkles size={16} className={generateSyarahMutation.isPending ? "animate-spin" : ""} />
                      {generateSyarahMutation.isPending ? "Menyusun Syarah..." : "Buat Syarah (AI)"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div key={syarah.id} className="prose prose-invert prose-zinc max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: syarah.text_arabic || '' }} style={{ fontSize: `calc(0.875rem * ${arabicScale})` }} className="leading-loose text-zinc-300 font-arabic text-right mb-4" dir="rtl" />
                      <div className="text-sm leading-loose text-zinc-300 font-serif markdown-body">
                        <ReactMarkdown
                            components={{
                                strong: ({node, ...props}) => <strong className="text-amber-400 font-semibold bg-amber-400/10 px-1 rounded" {...props} />,
                                em: ({node, ...props}) => <em className="text-indigo-400 italic" {...props} />,
                                h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white mt-6 mb-2" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white mt-5 mb-2" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-base font-bold text-white mt-4 mb-2" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc list-inside my-4 space-y-1" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal list-inside my-4 space-y-1" {...props} />,
                                li: ({node, ...props}) => <li className="text-zinc-300" {...props} />,
                                p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />
                            }}
                        >
                            {syarah.text_translation || ''}
                        </ReactMarkdown>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                        <p className="text-xs text-zinc-500 font-mono">Diperbarui: {new Date(syarah.created_at).toLocaleDateString()}</p>
                        <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-zinc-500 uppercase tracking-wider">{syarah.source_author}</span>
                      </div>
                    </div>
                    <div className="pt-8 border-t border-white/5 flex justify-center">
                       <button 
                        onClick={() => generateSyarahMutation.mutate()}
                        disabled={generateSyarahMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Sparkles size={14} className={generateSyarahMutation.isPending ? "animate-spin" : ""} />
                        {generateSyarahMutation.isPending ? "Memperbarui..." : "Perbarui Syarah"}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="notes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>}>
                  {activeVerseId && <VaultNotes verseId={activeVerseId} />}
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </motion.aside>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
         {activeVerseId && !isContextPanelOpen && (
            <motion.button
               key="reopen-panel"
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               onClick={() => setIsContextPanelOpen(true)}
               className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-40 bg-[#111113]/90 border border-white/10 hover:border-white/30 hover:bg-[#1a1a1c] text-white rounded-full py-3.5 px-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] flex items-center justify-center gap-2.5 transition-all backdrop-blur-md group"
            >
               <Info size={18} className="text-zinc-400 group-hover:text-indigo-400 transition-colors" />
               <span className="hidden sm:inline font-medium text-sm text-zinc-300 tracking-wide pr-1">Buka Panel Konteks</span>
            </motion.button>
         )}
      </AnimatePresence>
      </>
      )}

      {/* Overlays and Modals */}
      <AnimatePresence>
        {showProfileModal && (
          <Suspense fallback={null}>
             <UserProfileModal onClose={() => setShowProfileModal(false)} />
          </Suspense>
        )}
        {showSearch && (
          <Suspense fallback={null}>
            <MorphologicalSearch onClose={() => setShowSearch(false)} initialQuery={initialSearchQuery} />
          </Suspense>
        )}
        {showUploadModal && (
          <Suspense fallback={null}>
            <UploadKitab 
              onClose={() => setShowUploadModal(false)}
              onSuccess={(newMatanId) => {
                setShowUploadModal(false);
                setSelectedMatanId(newMatanId);
                setActiveVerseId(null);
                setActiveTab('syarah');
              }}
              onStartOcrTask={(taskId, isSimulated) => {
                setActiveOcrTask({id: taskId, isSimulated});
                setShowUploadModal(false);
              }}
            />
          </Suspense>
        )}
        {showLensaTaqyidDirectly && (
          <Suspense fallback={null}>
            <LensaTaqyid
              onClose={() => setShowLensaTaqyidDirectly(false)}
              onUploadQueueStarted={(taskId, isSimulated) => {
                setActiveOcrTask({ id: taskId, isSimulated });
                setShowLensaTaqyidDirectly(false);
              }}
            />
          </Suspense>
        )}
        {ocrRevisionText !== null && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          >
             <motion.div
               initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
               className="bg-[#0a0a0c] border border-white/10 rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
             >
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#111113]">
                   <div>
                     <h3 className="text-xl font-semibold text-white mb-1">Revisi Hasil Lensa Taqyid</h3>
                     <p className="text-sm text-zinc-500">Periksa dan perbaiki teks sebelum disimpan ke Vault.</p>
                   </div>
                   <button onClick={() => setOcrRevisionText(null)} className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                      <X size={20} />
                   </button>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                   <textarea
                     value={ocrRevisionText}
                     onChange={(e) => setOcrRevisionText(e.target.value)}
                     className="w-full min-h-[300px] h-full bg-[#111113] border border-white/10 rounded-2xl p-6 text-zinc-200 font-arabic text-lg sm:text-xl leading-loose outline-none focus:ring-1 focus:ring-indigo-500 resize-none shadow-inner custom-scrollbar"
                     dir="rtl"
                   />
                </div>
                <div className="p-6 bg-[#111113] border-t border-white/5 flex justify-end gap-3 shrink-0">
                   <button onClick={() => setOcrRevisionText(null)} className="px-6 py-2.5 rounded-xl font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">Batal</button>
                   <button onClick={handleSaveOcrText} className="px-6 py-2.5 rounded-xl font-medium bg-white text-black hover:bg-zinc-200 transition-colors shadow-lg">Simpan ke Vault</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <SyntopicalDrawer 
        isOpen={isSyntopicalDrawerOpen} 
        onClose={() => setIsSyntopicalDrawerOpen(false)} 
        selectedText={drawerSelectedText}
        contextTags={activeMatan ? [activeMatan.title.replace(/\s+/g, '')] : []}
      />
      <Toaster theme="dark" position="top-right" closeButton richColors />
      <BottomNav activeFeature={activeFeature} setActiveFeature={setActiveFeature} onOpenLensa={() => setShowUploadModal(true)} isVisible={isNavVisible} />
    </div>
  );
}