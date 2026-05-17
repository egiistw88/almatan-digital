import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/AuthContext';
import { noteService } from '../services/noteService';
import { Loader2, BookOpen, AlertCircle, Bookmark, Copy, Check, GripVertical, Plus, X, Search, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const DraggableComponent = Draggable as any;

export const CompilationBoard: React.FC = () => {
  const { user } = useAuth();
  const { data: rawNotes, isLoading, error } = useQuery({
    queryKey: ['notes', user?.id],
    queryFn: () => noteService.getUserNotes(user?.id || ''),
    enabled: !!user?.id
  });

  const [availableNotes, setAvailableNotes] = useState<any[]>([]);
  const [boardNotes, setBoardNotes] = useState<any[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (rawNotes) {
      // Intialize available notes to all that are not in the board
      const boardNoteIds = new Set(boardNotes.map(n => n.id));
      const filtered = rawNotes.filter(n => !boardNoteIds.has(n.id));
      setAvailableNotes(filtered);
    }
  }, [rawNotes, boardNotes]);

  const moveNoteToBoard = (note: any) => {
    setBoardNotes(prev => [...prev, note]);
  };

  const moveNoteToAvailable = (note: any) => {
    setBoardNotes(prev => prev.filter(n => n.id !== note.id));
  };
  
  const moveAllToBoard = () => {
    setBoardNotes(prev => [...prev, ...availableNotes]);
    setIsDrawerOpen(false);
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    if (source.droppableId === 'board' && destination.droppableId === 'board') {
      const items = Array.from(boardNotes);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      setBoardNotes(items);
    }
  };

  const copyToClipboard = () => {
    const draftText = boardNotes.map((note) => {
      const title = note.title || note.content.match(/^\[(.*?)\]/)?.[1] || "Tanpa Judul";
      return `## ${title}\n\n${note.content}\n`;
    }).join('\n\n');

    navigator.clipboard.writeText(draftText)
      .then(() => {
        setIsCopied(true);
        toast.success("Draf berhasil disalin ke clipboard!");
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(() => {
        toast.error("Gagal menyalin draft");
      });
  };

  const filteredAvailableNotes = useMemo(() => {
    return availableNotes.filter(note => {
      const q = searchQuery.toLowerCase();
      return (note.title?.toLowerCase().includes(q)) || (note.content?.toLowerCase().includes(q));
    });
  }, [availableNotes, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full bg-black min-h-0 relative overflow-hidden">
      <header className="flex-none p-5 sm:p-8 flex items-center justify-between border-b border-white/5 relative z-10 bg-[#0a0a0c]/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <BookOpen size={20} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">Meja Kompilasi</h1>
            <p className="text-xs sm:text-sm text-zinc-500">Susun dan ekspor catatan menjadi karya utuh.</p>
          </div>
        </div>
        <button
          onClick={copyToClipboard}
          disabled={boardNotes.length === 0}
          className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-full shadow-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
           {isCopied ? <Check size={16} /> : <Copy size={16} />}
           Salin Draf Utuh
        </button>
      </header>

      {error ? (
         <div className="flex-1 flex items-center justify-center p-8 text-center bg-black">
            <div className="max-w-md space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
                <AlertCircle size={28} className="text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-red-200">Gagal memuat catatan</h3>
              <p className="text-sm text-red-300/60 leading-relaxed">Terjadi kesalahan. Silakan coba lagi.</p>
            </div>
          </div>
      ) : isLoading ? (
         <div className="flex-1 flex items-center justify-center text-zinc-500 bg-black">
            <Loader2 className="w-8 h-8 animate-spin" />
         </div>
      ) : rawNotes?.length === 0 ? (
         <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-black relative">
            <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="max-w-md w-full p-8 bg-[#0a0a0c] border border-white/5 rounded-[2rem] shadow-2xl flex flex-col items-center text-center relative z-10">
               <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20 shadow-inner">
                  <Bookmark className="w-8 h-8 text-indigo-400" />
               </div>
               <h3 className="text-xl font-bold text-white mb-3">Kompilasi Kosong</h3>
               <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                 Anda belum memiliki satupun catatan di Zettelkasten Vault Anda. Kumpulkan penjelasan mutiara hikmah dari dalam kitab dan susun karya Anda di sini.
               </p>
               <button 
                 onClick={() => window.dispatchEvent(new Event('navigate_to_beranda'))}
                 className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors shadow-lg w-full flex justify-center"
               >
                 Mulai Mengkaji Kitab
               </button>
            </div>
         </div>
      ) : (
        <div className="flex-1 overflow-hidden relative flex flex-col bg-[#0a0a0c]">
          {/* Main Draft Area */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 content-container">
            <div className="max-w-3xl mx-auto space-y-6 pb-40">
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-indigo-100 font-semibold text-lg flex items-center gap-2">
                    Lembar Draf
                  </h2>
                  <p className="text-xs text-indigo-200/50 mt-1">{boardNotes.length} elemen telah ditambahkan</p>
                </div>
                
                {boardNotes.length > 0 && (
                  <button
                    onClick={() => setBoardNotes([])}
                    className="text-xs text-red-400 border border-red-400/20 hover:bg-red-500/10 rounded-full px-4 py-1.5 transition-colors uppercase tracking-wider font-semibold"
                  >
                    Kosongkan Draf
                  </button>
                )}
              </div>

              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="board">
                  {(provided, snapshot) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className={`min-h-[300px] space-y-4 ${
                        boardNotes.length === 0 ? 'flex items-center justify-center border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.01]' : ''
                      }`}
                    >
                      {boardNotes.map((note, index) => {
                         const parsedTitle = note.title || (note.content.match(/^\[(.*?)\]/)?.[1]) || "Tanpa Judul";
                         
                         return (
                           <DraggableComponent key={note.id} draggableId={note.id} index={index}>
                             {(provided: any, snapshot: any) => (
                               <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`group flex items-start gap-2 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border ${snapshot.isDragging ? 'bg-[#1a1a24] border-indigo-500/60 shadow-[0_20px_60px_rgba(79,70,229,0.2)] z-50 scale-[1.02]' : 'bg-[#111113] border-white/5 shadow-xl shadow-black/40 hover:border-indigo-500/30'} transition-all relative overflow-hidden`}
                                  style={{...provided.draggableProps.style}}
                                >
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] rounded-bl-full pointer-events-none"></div>

                                  <div {...provided.dragHandleProps} className="mt-1 touch-manipulation text-zinc-600 md:opacity-50 md:group-hover:opacity-100 transition-opacity p-2 -m-2 cursor-grab active:cursor-grabbing hover:bg-white/5 rounded-lg">
                                     <GripVertical size={20} />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0 pr-4">
                                     <div className="flex items-center gap-3 mb-4">
                                       <div className="flex-none w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-xs sm:text-sm font-bold text-indigo-400 border border-indigo-500/20 shadow-inner">
                                          {index + 1}
                                       </div>
                                       <h3 className="text-base sm:text-lg font-semibold text-zinc-100 truncate tracking-tight">{parsedTitle}</h3>
                                     </div>
                                     <div className="prose prose-invert prose-zinc max-w-none text-sm text-zinc-400 leading-loose font-serif">
                                       {note.content}
                                     </div>
                                  </div>

                                  <button 
                                    onClick={() => moveNoteToAvailable(note)}
                                    className="flex-none p-2.5 rounded-full text-zinc-500 bg-white/5 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    title="Hapus dari Draf"
                                  >
                                    <X size={18} />
                                  </button>
                                </div>
                             )}
                           </DraggableComponent>
                         );
                      })}
                      {provided.placeholder}
                      
                      {boardNotes.length === 0 && (
                        <div className="text-center p-8 space-y-4">
                          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-600 shadow-inner">
                             <FileText size={32} />
                          </div>
                          <p className="text-sm text-zinc-400 font-medium">Belum ada catatan yang ditambahkan.</p>
                          <p className="text-xs text-zinc-600 max-w-[200px] mx-auto leading-relaxed">Gunakan tombol di bawah untuk menyisipkan catatan dari Vault Anda.</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>

          {/* Floating Actions (Mobile and Desktop) */}
          <div className="absolute z-20 bottom-0 left-0 right-0 p-4 sm:p-8 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/90 to-transparent pointer-events-none flex flex-col gap-3 sm:flex-row justify-center items-center">
             
             {/* Main Add Button */}
             <button
               onClick={() => setIsDrawerOpen(true)}
               className="pointer-events-auto flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-full shadow-[0_0_40px_rgba(79,70,229,0.3)] transition-all active:scale-95 w-full sm:w-auto hover:shadow-[0_0_60px_rgba(79,70,229,0.4)]"
             >
               <Plus size={22} className="stroke-[2.5]" />
               Sisipkan Catatan Vault
             </button>

             {/* Mobile Copy Button */}
             <button
               onClick={copyToClipboard}
               disabled={boardNotes.length === 0}
               className="sm:hidden pointer-events-auto flex items-center justify-center gap-2 px-6 py-4 bg-white/10 border border-white/10 text-white font-medium rounded-full shadow-lg backdrop-blur-md hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 w-full"
             >
                {isCopied ? <Check size={18} /> : <Copy size={18} />}
                Salin Draf Utuh
             </button>
          </div>

          {/* Available Notes Drawer / Bottom Sheet */}
          <AnimatePresence>
            {isDrawerOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsDrawerOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
                />
                <motion.div
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="absolute bottom-0 left-0 right-0 h-[85vh] sm:h-[80vh] bg-[#111113] border-t border-white/10 z-50 rounded-t-[2.5rem] flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.8)]"
                >
                  <div className="flex-none p-6 sm:p-8 border-b border-white/5 relative bg-white/[0.02]">
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-white/10 rounded-full"></div>
                    <div className="flex items-center justify-between mt-6">
                      <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Vault Notes</h2>
                        <p className="text-sm text-zinc-400 mt-1">Pilih catatan untuk disisipkan ke draf.</p>
                      </div>
                      <button 
                        onClick={() => setIsDrawerOpen(false)}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                      <div className="group relative flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                          type="text"
                          placeholder="Cari faedah ilmu..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-14 pr-6 py-4 bg-[#0a0a0c] border border-white/10 focus:border-indigo-500/50 text-white rounded-2xl text-base transition-all focus:ring-1 focus:ring-indigo-500/50 outline-none shadow-inner"
                        />
                      </div>
                      {filteredAvailableNotes.length > 0 && (
                        <button
                          onClick={moveAllToBoard}
                          className="flex items-center justify-center gap-2 px-6 py-4 bg-white/5 border border-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-2xl transition-colors whitespace-nowrap"
                        >
                          Sisipkan Semua
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 custom-scrollbar bg-black/20">
                    {filteredAvailableNotes.length === 0 ? (
                      <div className="text-center py-20 text-zinc-500">
                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                           <Bookmark size={32} className="opacity-40" />
                        </div>
                        <p className="text-base font-medium text-zinc-400">Tidak ada catatan yang tersedia.</p>
                        <p className="text-sm text-zinc-600 mt-2">Semua catatan telah disisipkan atau Anda belum membuatnya.</p>
                      </div>
                    ) : (
                      filteredAvailableNotes.map((note) => {
                        const parsedTitle = note.title || (note.content.match(/^\[(.*?)\]/)?.[1]) || "Tanpa Judul";
                        
                        return (
                          <div
                            key={note.id}
                            className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-5 sm:p-6 rounded-3xl border border-white/5 bg-[#1a1a24] shadow-lg hover:shadow-xl hover:border-indigo-500/20 transition-all relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-bl-full pointer-events-none"></div>

                            <div className="flex-1 min-w-0 pr-4 relative z-10">
                              <h3 className="text-base sm:text-lg font-semibold text-zinc-100 mb-2 truncate flex items-center gap-3">
                                <Bookmark size={16} className="text-indigo-400" />
                                {parsedTitle}
                              </h3>
                              <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed font-serif">
                                {note.content}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                moveNoteToBoard(note);
                                if (filteredAvailableNotes.length === 1) {
                                  setIsDrawerOpen(false);
                                }
                              }}
                              className="self-end sm:self-center flex-none w-full sm:w-auto px-6 py-3 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-300 hover:text-white rounded-2xl text-sm font-semibold transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] relative z-10"
                            >
                              Sisipkan
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

        </div>
      )}
    </div>
  );
};

