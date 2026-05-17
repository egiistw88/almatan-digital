import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Sparkles, X, BookOpen, ChevronRight } from 'lucide-react';
import { matanService } from '../services/matanService';
import { aiService } from '../services/aiService';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useFontScale } from '../lib/FontScaleContext';

interface MorphologicalSearchProps {
  onClose: () => void;
  initialQuery?: string;
}

export function MorphologicalSearch({ onClose, initialQuery = '' }: MorphologicalSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const { arabicScale } = useFontScale();
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [aiTasrif, setAiTasrif] = useState<string | null>(null);

  useEffect(() => {
    // Timeout to make UI focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      setAiTasrif(null); // Reset AI tasrif on new query
      if (query.trim().length === 0) {
        setResults([]);
        return;
      }
      
      setIsSearching(true);
      try {
        const data = await matanService.searchRootWord(query);
        setResults(data);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const generateTasrifMutation = useMutation({
    mutationFn: async (rootWord: string) => {
      const response = await aiService.generateTasrif(rootWord, rootWord);
      return response;
    },
    onMutate: () => {
      if (!navigator.onLine) {
        toast.info("Koneksi terputus. Pencarian tasrif ini masuk antrean dan akan dieksekusi saat sinyal kembali.");
      }
    },
    onSuccess: (data) => {
      setAiTasrif(data);
    },
    onError: () => {
      setAiTasrif("Maaf, gagal memproses tasrif.");
    }
  });

  const handleGenerateTasrif = () => {
    if (!query) return;
    setAiTasrif(null);
    generateTasrifMutation.mutate(query);
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center sm:pt-24 sm:px-4 pointer-events-none">
      {/* Lighter backdrop overlay for the floating style */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-300" 
        onClick={onClose}
      ></div>
      
      <div 
        className="w-full max-w-2xl flex flex-col bg-[#111113] sm:bg-[#111113]/95 sm:backdrop-blur-2xl border-t sm:border border-white/10 sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] rounded-t-[2rem] sm:rounded-2xl overflow-hidden pointer-events-auto h-[85vh] sm:h-auto sm:max-h-[min(80vh,800px)] animate-in slide-in-from-bottom-full sm:slide-in-from-top-8 sm:zoom-in-95 duration-300 z-10 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile handle indicator */}
        <div className="w-full flex justify-center pt-3 pb-2 sm:hidden cursor-pointer shrink-0 bg-[#0a0a0c]" onClick={onClose}>
            <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
        </div>

        {/* Header / Search bar */}
        <div className="flex items-center px-4 sm:px-6 py-4 border-b border-white/10 shrink-0 bg-[#0a0a0c]">
          <Search className="w-5 h-5 text-indigo-400 mr-3 shrink-0" />
          <input 
            ref={inputRef}
            type="text" 
            dir="rtl"
            placeholder="Cari akar kata (contoh: ك ل م)..."
            className="flex-1 bg-transparent border-0 outline-none text-zinc-100 placeholder:text-zinc-600 font-arabic text-right pb-1 text-lg"
            style={{ fontSize: `calc(1.25rem * ${arabicScale})` }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isSearching ? (
             <Loader2 className="w-5 h-5 text-indigo-500 animate-spin ml-4 shrink-0" />
          ) : query.trim() !== '' ? (
             <button onClick={() => setQuery('')} className="p-1.5 text-zinc-500 hover:text-white ml-3 rounded-md hover:bg-white/10 transition-colors shrink-0">
               <X className="w-4 h-4" />
             </button>
          ) : (
             <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white ml-3 rounded-md hover:bg-white/10 transition-colors shrink-0">
               <X className="w-4 h-4" />
             </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto w-full custom-scrollbar pb-safe bg-[#050505] sm:bg-transparent">
          {query.trim() !== '' && (
            <div className="px-5 py-4 border-b border-white/5 bg-indigo-500/5">
              {generateTasrifMutation.isPending ? (
                <div className="flex items-center justify-center py-3 text-indigo-400 text-sm gap-3">
                    <Loader2 className="w-4 h-4 animate-spin" /> 
                    <span className="font-medium animate-pulse">Merumuskan Tasrif AI...</span>
                </div>
              ) : aiTasrif ? (
                <div className="p-4 sm:p-5 bg-[#0a0a0c]/80 border border-indigo-500/20 rounded-xl shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                     <Sparkles className="w-24 h-24 text-indigo-400" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 font-bold text-indigo-300 mb-3 text-[10px] uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-full">
                    <Sparkles size={12} /> Analisis Tasrif AI
                  </span>
                  <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap relative z-10 font-serif">
                    {aiTasrif}
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleGenerateTasrif}
                  className="w-full py-3 text-indigo-300 hover:text-indigo-200 rounded-lg border border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 text-sm transition-all flex items-center justify-center gap-2 font-medium group active:scale-[0.98]"
                >
                  <Sparkles size={16} className="opacity-70 group-hover:opacity-100 transition-opacity" /> 
                  <span className="font-medium text-xs sm:text-sm">Elaborasi Tasrif dengan AI</span>
                </button>
              )}
            </div>
          )}

          {results.length > 0 ? (
            <div className="divide-y divide-white/5 pb-6">
              <div className="px-5 py-2.5 bg-[#050505] text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-widest border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
                {results.length} Hasil Ditemukan
              </div>
              {results.map((result, idx) => (
                <div key={idx} className="p-5 hover:bg-white/[0.03] transition-colors group cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col items-start gap-1">
                       <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded text-[10px] font-semibold tracking-widest text-zinc-400 uppercase border border-white/5">
                         Akar Kata: <span className="text-zinc-100 font-arabic text-xs tracking-normal" style={{ fontSize: `calc(0.75rem * ${arabicScale})` }}>{result.root_word}</span>
                       </span>
                    </div>
                    <span className="font-arabic text-zinc-100 group-hover:text-indigo-300 transition-colors" style={{ fontSize: `calc(1.875rem * ${arabicScale})` }} dir="rtl">{result.word_arabic}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                     <p className="text-[13px] sm:text-[14px] font-serif leading-relaxed text-zinc-300">{result.translation}</p>
                     <span className="px-2 py-0.5 bg-[#111113] rounded-md text-zinc-400 font-sans text-[10px] sm:text-[11px] font-medium border border-white/5">{result.nahwu_position}</span>
                  </div>
                  
                  {result.verses && (
                    <div className="mt-2 text-sm text-zinc-500 flex flex-col bg-[#0a0a0c] p-4 rounded-xl border border-white/5 relative overflow-hidden group-hover:border-white/10 transition-colors shadow-inner">
                      <div className="font-arabic text-zinc-300 text-right w-full leading-loose mb-3 relative z-10" style={{ fontSize: `calc(1.125rem * ${arabicScale})` }} dir="rtl" dangerouslySetInnerHTML={{ __html: result.verses.text_arabic?.replace(new RegExp(result.word_arabic, 'g'), `<span class="text-indigo-300 bg-indigo-500/10 px-1 rounded">${result.word_arabic}</span>`) || 'Bait dari terjemahan: ' + result.verses.text_translation }}>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1 relative z-10">
                        <div className="flex items-center gap-1.5 text-zinc-500">
                           <BookOpen size={12} className="opacity-70" />
                           <span className="font-medium text-[10px] sm:text-[11px]">{result.verses.matan?.title || "Al-Matan"}</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-zinc-600 group-hover:text-indigo-400 transition-colors">
                           Lihat Bait <ChevronRight size={12} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : query.trim() !== '' && !isSearching ? (
             <div className="flex flex-col items-center justify-center p-12 text-center pb-32">
                <div className="w-12 h-12 rounded-full border border-white/5 bg-white/5 flex items-center justify-center mb-4">
                  <Search className="w-5 h-5 text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-400 mb-1">Pencarian tidak ditemukan untuk</p>
                <div className="text-zinc-100 font-arabic text-xl mt-1" dir="rtl">{query}</div>
             </div>
          ) : !isSearching && query.trim() === '' ? (
            <div className="h-full flex flex-col items-center justify-center p-8 sm:p-12 text-center min-h-[40vh] sm:min-h-[35vh] pb-32">
                <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-2xl sm:rounded-full bg-indigo-500/5 flex items-center justify-center mb-6 border border-indigo-500/10 shadow-inner">
                   <Search className="w-8 h-8 sm:w-6 sm:h-6 text-indigo-400/70" />
                </div>
                <h3 className="text-lg sm:text-base font-semibold text-zinc-200 mb-3 sm:mb-2 tracking-tight">Pencarian Cepat Akar Kata</h3>
                <p className="text-sm sm:text-xs text-zinc-500 leading-relaxed max-w-[280px]">
                  Ketikkan karakter akar kata Arab untuk mencari derivasi dan pemakaian kata tersebut pada teks maktabah.
                </p>
                
                <div className="mt-10 sm:mt-8 flex flex-col items-center gap-4 sm:gap-3 w-full">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Saran Pencarian</span>
                  <div className="flex flex-wrap justify-center gap-2" dir="rtl">
                     {['ك ل م', 'ف ع ل', 'ح ر ف', 'س م و'].map(suggest => (
                       <button 
                         key={suggest}
                         onClick={() => setQuery(suggest)}
                         className="px-4 py-2 sm:px-3 sm:py-1.5 bg-[#111113] hover:bg-indigo-500/10 hover:text-indigo-300 border border-white/5 hover:border-indigo-500/20 rounded-xl sm:rounded-lg text-zinc-400 font-arabic text-xl sm:text-lg transition-all active:scale-95 shadow-sm"
                       >
                         {suggest}
                       </button>
                     ))}
                  </div>
                </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
