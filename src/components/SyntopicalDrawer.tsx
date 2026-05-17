import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { X, Save, Tag, Edit3, Type } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SyntopicalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  contextTags?: string[];
}

export const SyntopicalDrawer = ({ isOpen, onClose, selectedText, contextTags }: SyntopicalDrawerProps) => {
  const [noteTitle, setNoteTitle] = useState('');
  const [noteTags, setNoteTags] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dragControls = useDragControls();

  const handleClose = () => {
    const isDirty = noteTitle.trim() !== '' || noteContent !== selectedText || (noteTags !== (contextTags ? contextTags.join(', ') : ''));
    if (isDirty) {
      if (window.confirm("Ada perubahan yang belum disimpan. Yakin ingin menutup?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };


  useEffect(() => {
    if (isOpen) {
      setNoteContent(selectedText);
      setNoteTitle('');
      setNoteTags(contextTags ? contextTags.join(', ') : '');
    }
  }, [isOpen, selectedText, contextTags]);

  const handleSave = async () => {
    if (!noteContent.trim() && !noteTitle.trim()) {
      toast.error('Catatan tidak boleh kosong');
      return;
    }

    // Import noteService dynamically or globally. We will just use the global import
    const { noteService } = await import('../services/noteService');
    
    try {
      // Format content to include title and tags since schema only has content
      let fullContent = `[${noteTitle || 'Catatan Baru'}]`;
      if (noteTags) {
         fullContent += `\ntags: ${noteTags}`;
      }
      fullContent += `\n\n${noteContent}`;

      await noteService.saveNote({
        user_id: user?.id || 'local-guest',
        verse_id: '' as any,
        mufradat_id: '' as any,
        note_type: 'zettelkasten',
        content: `[${noteTitle || 'Catatan Baru'}]\n\n${fullContent}\n\nTags: ${noteTags.split(',').map(t => t.trim()).filter(Boolean).join(', ')}`,
      });
      
      toast.success('Atomic note disimpan');
      
      // Dispatch event to refresh graph or vault
      window.dispatchEvent(new Event('vault_notes_updated'));
      queryClient.invalidateQueries({ queryKey: ['zettelkasten_notes'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      onClose();
    } catch (e: any) {
      toast.error('Gagal menyimpan atomic note: ' + e.message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md transition-opacity"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className="fixed bottom-0 inset-x-0 sm:inset-x-auto sm:right-0 sm:w-[420px] lg:w-[480px] z-[70] bg-[#050505]/95 backdrop-blur-3xl border-t sm:border-t-0 sm:border-l border-white/10 rounded-t-[2rem] sm:rounded-none sm:top-0 sm:bottom-0 sm:h-full shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh] sm:max-h-full"
          >
            {/* Drag Handle for Mobile */}
            <div 
              className="w-full flex justify-center pt-4 pb-2 sm:hidden touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-12 h-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors" />
            </div>

            <div className="flex items-center justify-between px-6 pt-4 sm:pt-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-white font-medium text-lg">Syntopical Canvas</h3>
              </div>
              <button 
                onClick={handleClose} 
                className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 space-y-5 custom-scrollbar">
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Type size={14} className="text-indigo-400/70" />
                  Premis / Judul
                </label>
                <input 
                  type="text" 
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Beri judul ringkas..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Edit3 size={14} className="text-indigo-400/70" />
                  Ekstraksi Sorotan
                </label>
                <textarea 
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none min-h-[140px] font-arabic leading-loose text-lg custom-scrollbar"
                  placeholder="Teks sorotan..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Tag size={14} className="text-indigo-400/70" />
                  Tagar (Koma dipisah)
                </label>
                <input 
                  type="text" 
                  value={noteTags}
                  onChange={(e) => setNoteTags(e.target.value)}
                  placeholder="fiqih, ushul, nahwu..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>

            </div>

            <div className="p-6 border-t border-white/5 bg-white/[0.02] sm:rounded-b-[2rem]">
              <button 
                onClick={handleSave}
                className="w-full bg-zinc-100 hover:bg-white text-black font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98]"
              >
                <Save size={18} />
                Ekstrak ke Vault
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
