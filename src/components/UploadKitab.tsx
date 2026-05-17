import React, { useState, useRef, DragEvent, lazy, Suspense, useEffect } from 'react';
import { Upload, X, Loader2, FileText, CheckCircle, Sparkles, Terminal, FileCheck2, Camera } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { matanService } from '../services/matanService';
import { aiService } from '../services/aiService';
import { useFontScale } from '../lib/FontScaleContext';

const LensaTaqyid = lazy(() => import('./LensaTaqyid').then(m => ({ default: m.LensaTaqyid })));

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      let encoded = reader.result?.toString().replace(/^data:(.*,)?/, '');
      if ((encoded?.length || 0) % 4 > 0) {
        encoded += '='.repeat(4 - (encoded?.length || 0) % 4);
      }
      resolve(encoded || '');
    };
    reader.onerror = error => reject(error);
  });
};

interface UploadKitabProps {
  onClose: () => void;
  onSuccess: (matanId: string) => void;
  onStartOcrTask: (taskId: string, isSimulated: boolean) => void;
}

export function UploadKitab({ onClose, onSuccess, onStartOcrTask }: UploadKitabProps) {
  const queryClient = useQueryClient();
  const { arabicScale } = useFontScale();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [targetContext, setTargetContext] = useState('');
  const [content, setContent] = useState('');
  const [isProcessingNlp, setIsProcessingNlp] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showLensaTaqyid, setShowLensaTaqyid] = useState(false);

  const handleClose = () => {
    if (title.trim() !== '' || author.trim() !== '' || content.trim() !== '' || pdfFileName) {
      if (window.confirm("Ada proses unggah atau draf yang belum disimpan. Yakin ingin membatalkan?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };


  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setErrorStatus('Hanya format dokumen PDF yang didukung saat ini.');
      return;
    }

    setErrorStatus(null);
    setPdfFileName(file.name);
    setIsExtractingPdf(true);

    try {
      const base64Pdf = await fileToBase64(file);
      
      let accumulatedText = '';
      setContent(''); // Clear previous
      
      const stream = aiService.streamPdfNatively(base64Pdf, file.name, targetContext);
      
      for await (const chunk of stream) {
        accumulatedText += chunk;
        setContent(accumulatedText);
      }

      const finalOptimizedText = accumulatedText.trim();
      setContent(finalOptimizedText);
      
      // Auto-extract metadata (optional, run only if we have text)
      if (finalOptimizedText) {
        const metadata = await aiService.extractMetadata(finalOptimizedText, file.name);
        
        if (metadata) {
            if (!title) setTitle(metadata.title || file.name.replace('.pdf', '').replace(/[-_]/g, ' '));
            if (!author) setAuthor(metadata.author || '');
        } else if (!title) {
          setTitle(file.name.replace('.pdf', '').replace(/[-_]/g, ' '));
        }
      } else if (!title) {
        setTitle(file.name.replace('.pdf', '').replace(/[-_]/g, ' '));
      }
    } catch (error) {
      console.error('Error extracting PDF:', error);
      setErrorStatus('Gagal mengekstrak teks. Pastikan PDF tidak terenkripsi atau merupakan gambar scan tanpa OCR.');
    } finally {
      setIsExtractingPdf(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      setIsProcessingNlp(true);
      setErrorStatus(null);
      // Small pause to let UI breathe
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const verses = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
        
      if (verses.length === 0) throw new Error('Konten teks matan kosong atau tidak valid.');

      return matanService.uploadKitab({
        title,
        author,
        description: targetContext ? `Fokus Ekstraksi: ${targetContext}` : ''
      }, verses);
    },
    onSuccess: (newMatan) => {
      queryClient.invalidateQueries({ queryKey: ['matan'] });
      setIsProcessingNlp(false);
      onSuccess(newMatan.id);
    },
    onError: (error) => {
      setIsProcessingNlp(false);
      
      let message = String(error);
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'object' && error !== null) {
         if ('message' in error && typeof (error as any).message === 'string') {
           message = (error as any).message;
         } else {
           message = JSON.stringify(error);
         }
      }
      
      setErrorStatus(message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorStatus("Judul dan teks arab kitab tidak boleh kosong.");
      return;
    }
    uploadMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md" onClick={handleClose}>
      <div 
        className="w-full max-w-2xl bg-[#0a0a0c] rounded-[2rem] shadow-2xl border border-white/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-[#050505]">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-3">
              <FileCheck2 className="w-5 h-5 text-zinc-300" />
              Ekstrak & Simpan Kitab
            </h2>
            <span className="text-[11px] uppercase tracking-widest font-medium text-zinc-500 mt-1">AI Pipeline Terintegrasi</span>
          </div>
          <button onClick={handleClose} className="p-2 text-zinc-500 hover:text-white rounded-full hover:bg-white/5 transition-colors group">
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 no-scrollbar">
           
           {errorStatus && (
             <div className="p-4 bg-red-400/10 border border-red-400/20 text-red-400 rounded-2xl text-sm flex items-center gap-3 shadow-lg">
               <X className="w-4 h-4 shrink-0" />
               {errorStatus}
             </div>
           )}

           <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
               <div className="flex-1 flex flex-col gap-3">
                 <div 
                   className={`flex-1 relative border-2 border-dashed rounded-[1.5rem] p-6 flex flex-col items-center justify-center transition-all cursor-pointer group ${
                     isDragging 
                       ? 'border-zinc-100/40 bg-zinc-100/5' 
                       : pdfFileName 
                         ? 'border-zinc-100/30 bg-zinc-100/5 shadow-inner' 
                         : 'border-white/10 bg-[#050505] hover:bg-white/5 hover:border-white/20'
                   }`}
                   onClick={() => fileInputRef.current?.click()}
                   onDragOver={handleDragOver}
                   onDragLeave={handleDragLeave}
                   onDrop={handleDrop}
                 >
                   <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                   
                   {isExtractingPdf ? (
                      <div className="flex flex-col items-center gap-3 w-full animate-in fade-in">
                          <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
                          <div className="text-center w-full">
                            <p className="text-sm font-semibold text-zinc-200">Menganalisis Kitab...</p>
                            <p className="text-[10px] text-zinc-300/60 uppercase tracking-widest mt-1">Gemini AI Engine</p>
                          </div>
                      </div>
                   ) : pdfFileName ? (
                      <div className="flex flex-col items-center gap-3 animate-in zoom-in slide-in-from-bottom-2">
                         <div className="relative">
                           <div className="absolute inset-0 bg-zinc-100/20 blur-xl rounded-full"></div>
                           <FileCheck2 className="w-10 h-10 text-zinc-300 relative z-10" />
                         </div>
                         <p className="text-xs text-zinc-400 truncate max-w-[200px] text-center" title={pdfFileName}>{pdfFileName}</p>
                         <span className="text-[10px] font-semibold tracking-wider text-zinc-100 mt-1 uppercase group-hover:text-zinc-300 transition-colors">Ganti Dokumen</span>
                      </div>
                   ) : (
                      <div className="flex flex-col items-center gap-3 text-center px-4">
                         <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-colors mb-1">
                            <Upload className="w-5 h-5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                         </div>
                         <p className="text-sm font-medium text-zinc-200">Unggah <span className="font-bold text-zinc-300">PDF</span></p>
                         <p className="text-xs text-zinc-500 leading-relaxed">Tarik & lepas file atau ketuk untuk browse</p>
                      </div>
                   )}
                 </div>
                 <button 
                  type="button"
                  onClick={() => setShowLensaTaqyid(true)}
                  className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-400 p-3 rounded-[1rem] flex items-center justify-center gap-2 text-sm font-medium transition-all"
                 >
                   <Camera size={16} />
                   Scan Kitab Fisik
                 </button>
               </div>

                <div className="flex-[1.5] space-y-4 flex flex-col">
                  <div className="space-y-1.5 flex-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 ml-1">Judul Kitab <span className="text-red-400">*</span></label>
                    <input 
                      type="text" required
                      value={title} onChange={e => setTitle(e.target.value)}
                      className="w-full px-4 h-[46px] bg-[#050505] border border-white/10 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 text-white text-sm transition-all shadow-inner"
                      placeholder="Cth: Safinatun Naja"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 ml-1">Penulis (Opsional)</label>
                      <input 
                        type="text" 
                        value={author} onChange={e => setAuthor(e.target.value)}
                        className="w-full px-4 h-[46px] bg-[#050505] border border-white/10 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 text-white text-sm transition-all shadow-inner"
                        placeholder="Cth: Salim bin Sumair"
                      />
                    </div>
                    <div className="space-y-1.5 flex-[1.5]">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 ml-1">Fokus Bab (Opsional)</label>
                      <input 
                        type="text" 
                        value={targetContext} onChange={e => setTargetContext(e.target.value)}
                        className="w-full px-4 h-[46px] bg-[#050505] border border-white/10 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 text-white text-sm transition-all shadow-inner"
                        placeholder="Cth: Bab Thaharah"
                        disabled={isExtractingPdf}
                      />
                    </div>
                  </div>
                </div>
             </div>
           </div>

           <div className="space-y-2 relative group flex flex-col h-[280px]">
             <div className="flex items-center justify-between mb-2 absolute -top-8 left-0 right-0">
               <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 ml-1 flex items-center gap-2">
                 <Terminal className="w-3 h-3 text-zinc-100" /> Hasil Teks Bahasa Arab <span className="text-red-400">*</span>
               </label>
               {content && <span className="text-[10px] bg-zinc-100/10 border border-zinc-100/20 text-zinc-300 px-2 py-0.5 rounded-full font-semibold">{content.split('\n').filter(Boolean).length} Bait</span>}
             </div>
             <textarea 
               dir="rtl"
               required
               value={content} onChange={e => setContent(e.target.value)}
               className="w-full h-full p-6 bg-[#050505] border border-white/10 rounded-2xl outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 text-zinc-200 font-arabic leading-[2.5] resize-none transition-all placeholder:text-zinc-700 shadow-inner custom-scrollbar"
               style={{ fontSize: `calc(1.25rem * ${arabicScale})` }}
               placeholder="الكَلامُ هُوَ اللَّفْظُ المُرَكَّبُ المُفِيدُ بِالوَضْعِ..."
             />
           </div>

        </form>

        <div className="px-6 py-5 border-t border-white/5 bg-[#050505] flex items-center justify-between z-10">
          <p className="text-[10px] text-zinc-500 hidden sm:block max-w-[200px] leading-relaxed">
            Sistem secara otomatis akan meregistrasi setiap baris bait untuk eksplorasi I'rab dan Syarah.
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
               type="button" 
               onClick={handleClose}
               className="px-6 py-3 text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex-1 sm:flex-none text-center"
            >
              Batal
            </button>
            <button 
               onClick={handleSubmit}
               disabled={!title.trim() || !content.trim() || isProcessingNlp || isExtractingPdf || uploadMutation.isPending}
               className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all disabled:opacity-50 disabled:grayscale focus:ring-2 focus:ring-indigo-500/50 outline-none"
            >
              {isProcessingNlp || uploadMutation.isPending ? (
                <>
                   <Loader2 className="w-4 h-4 animate-spin text-indigo-200" /> 
                   Memproses Kitab...
                </>
              ) : (
                <>
                   <Sparkles className="w-4 h-4" /> 
                   Simpan & Mulai
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showLensaTaqyid && (
         <Suspense fallback={null}>
           <LensaTaqyid 
             onClose={() => setShowLensaTaqyid(false)} 
             onUploadQueueStarted={(taskId, isSimulated) => {
               onStartOcrTask(taskId, isSimulated);
               setShowLensaTaqyid(false);
             }}
           />
         </Suspense>
      )}
    </div>
  );
}
