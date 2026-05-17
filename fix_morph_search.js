import fs from 'fs';

const newComponent = `import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Sparkles, X, BookOpen, ChevronRight } from 'lucide-react';
import { matanService } from '../services/matanService';
import { aiService } from '../services/aiService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface MorphologicalSearchProps {
  onClose: () => void;
  initialQuery?: string;
}

export function MorphologicalSearch({ onClose, initialQuery = '' }: MorphologicalSearchProps) {
  const [query, setQuery] = useState(initialQuery);
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
    <div className="fixed inset-0 z-[100] flex flex-col pt-0 sm:pt-16 pb-0 sm:pb-16 items-center bg-black/90 sm:bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div 
        className="w-full sm:max-w-3xl flex flex-col h-full sm:h-auto sm:max-h-[85vh] bg-[#0c0c0e] sm:rounded-3xl shadow-2xl sm:border border-white/10 overflow-hidden animate-in sm:fade-in sm:zoom-in-95 slide-in-from-bottom-5 sm:slide-in-from-bottom-0 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 sm:px-6 py-4 sm:py-5 border-b border-white/5 shrink-0 bg-[#121214]">
          <button onClick={onClose} className="p-2 sm:hidden text-zinc-400 hover:text-white mr-2">
            <X size={24} />
          </button>
          <Search className="w-5 h-5 text-zinc-500 mr-3 shrink-0 hidden sm:block" />
          <input 
            ref={inputRef}
            type="text" 
            dir="rtl"
            placeholder="Cari akar kata (contoh: ك ل م)..."
            className="flex-1 bg-transparent border-0 outline-none text-2xl sm:text-3xl text-white placeholder:text-zinc-600 font-arabic text-right pb-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isSearching ? (
             <Loader2 className="w-6 h-6 text-indigo-500 animate-spin ml-4 shrink-0" />
          ) : query.trim() !== '' ? (
             <button onClick={() => setQuery('')} className="p-2 text-zinc-500 hover:text-white ml-2 rounded-full hover:bg-white/5 transition-colors">
               <X className="w-5 h-5" />
             </button>
          ) : (
             <div className="w-9 ml-2" /> 
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {query.trim() !== '' && (
            <div className="px-5 sm:px-8 py-5 border-b border-white/5 bg-indigo-950/5">
              {generateTasrifMutation.isPending ? (
                <div className="flex items-center justify-center py-4 text-indigo-400 text-sm gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" /> 
                    <span className="font-medium animate-pulse">Merumuskan Tasrif AI...</span>
                </div>
              ) : aiTasrif ? (
                <div className="p-5 sm:p-6 bg-[#0a0a0c] border border-indigo-500/20 rounded-2xl shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                     <Sparkles className="w-24 h-24 text-indigo-400" />
                  </div>
                  <span className="inline-flex items-center gap-2 font-bold text-indigo-300 mb-4 text-xs uppercase tracking-widest bg-indigo-500/10 px-3 py-1.5 rounded-full">
                    <Sparkles size={14} /> Analisis Tasrif AI
                  </span>
                  <div className="text-zinc-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap relative z-10">
                    {aiTasrif}
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleGenerateTasrif}
                  className="w-full py-4 text-indigo-300 hover:text-indigo-200 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 text-sm transition-all flex items-center justify-center gap-2 font-medium group"
                >
                  <Sparkles size={18} className="opacity-70 group-hover:opacity-100 transition-opacity" /> 
                  <span className="font-medium">Elaborasi Tasrif dengan AI</span>
                </button>
              )}
            </div>
          )}

          {results.length > 0 ? (
            <div className="divide-y divide-white/5 pb-10">
              <div className="px-5 sm:px-8 py-3 bg-[#0a0a0c] text-xs font-medium text-zinc-500 uppercase tracking-widest border-b border-white/5">
                {results.length} Hasil Ditemukan
              </div>
              {results.map((result, idx) => (
                <div key={idx} className="p-5 sm:p-8 hover:bg-white/[0.02] transition-colors group cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col items-start gap-1">
                       <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded text-[10px] sm:text-xs font-semibold tracking-widest text-zinc-400 uppercase border border-white/5">
                         Akar Kata: <span className="text-white font-arabic text-sm tracking-normal">{result.root_word}</span>
                       </span>
                    </div>
                    <span className="text-3xl sm:text-4xl font-arabic text-white group-hover:text-indigo-300 transition-colors" dir="rtl">{result.word_arabic}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                     <p className="text-[15px] sm:text-[16px] font-serif leading-relaxed text-zinc-300">{result.translation}</p>
                     <span className="px-2.5 py-1 bg-zinc-800/50 rounded-lg text-zinc-400 font-sans text-[11px] font-medium border border-white/5">{result.nahwu_position}</span>
                  </div>
                  
                  {result.verses && (
                    <div className="mt-2 text-sm text-zinc-500 flex flex-col bg-[#050505] p-5 sm:p-6 rounded-2xl border border-white/5 relative overflow-hidden group-hover:border-white/10 transition-colors">
                      <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-zinc-800 to-transparent"></div>
                      <div className="font-arabic text-xl sm:text-2xl text-zinc-300 text-right w-full leading-loose mb-4" dir="rtl" dangerouslySetInnerHTML={{ __html: result.verses.text_arabic?.replace(new RegExp(result.word_arabic, 'g'), \`<span class="text-indigo-300 bg-indigo-500/10 px-1 rounded">\${result.word_arabic}</span>\`) || 'Bait dari terjemahan: ' + result.verses.text_translation }}>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/5 pt-4">
                        <div className="flex items-center gap-2 text-zinc-400">
                           <BookOpen size={14} className="opacity-70" />
                           <span className="font-medium text-xs sm:text-sm">{result.verses.matan?.title || "Al-Matan"}</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-zinc-600 group-hover:text-indigo-400 transition-colors">
                           Lihat Bait <ChevronRight size={14} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : query.trim() !== '' && !isSearching ? (
             <div className="flex flex-col items-center justify-center p-16 sm:p-24 text-center">
                <Search className="w-12 h-12 text-white/5 mb-6" />
                <p className="text-zinc-500 mb-2">Tidak ditemukan hasil derivasi untuk</p>
                <div className="px-6 py-2 bg-white/5 rounded-full border border-white/5">
                  <span className="text-zinc-300 font-arabic text-2xl" dir="rtl">{query}</span>
                </div>
             </div>
          ) : !isSearching && query.trim() === '' ? (
            <div className="h-full flex flex-col items-center justify-center p-10 sm:p-16 text-center min-h-[50vh]">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/5">
                   <Search className="w-8 h-8 text-zinc-600" />
                </div>
                <h3 className="text-lg font-medium text-zinc-200 mb-3">Pencarian Morfologis</h3>
                <p className="text-[14px] text-zinc-500 leading-relaxed max-w-sm px-4">
                  Gunakan keyboard bahasa Arab untuk mencari. Ketik karakter akar kata untuk menelusuri seluruh derivasi (isytiqoq) serta penggunaannya dalam maktabah.
                </p>
                
                <div className="mt-10 flex flex-col items-center gap-3 w-full max-w-xs">
                  <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Saran Pencarian</span>
                  <div className="flex flex-wrap justify-center gap-2 w-full" dir="rtl">
                     {['ك ل م', 'ف ع ل', 'ح ر ف', 'س م و'].map(suggest => (
                       <button 
                         key={suggest}
                         onClick={() => setQuery(suggest)}
                         className="px-4 py-2 bg-white/[0.02] hover:bg-indigo-500/10 hover:text-indigo-300 border border-white/5 hover:border-indigo-500/20 rounded-xl text-zinc-400 font-arabic text-xl transition-all"
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
`;

fs.writeFileSync('src/components/MorphologicalSearch.tsx', newComponent, 'utf8');
