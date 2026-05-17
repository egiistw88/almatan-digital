import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { noteService } from '../services/noteService';
import { Bookmark, Loader2, Save, Trash2 } from 'lucide-react';
import { useFontScale } from '../lib/FontScaleContext';
import type { Mufradat, UserNote } from '../lib/supabase';

interface VaultNotesProps {
  verseId?: string;
  mufradatId?: string | null;
  selectedWord?: Mufradat | null;
}

export function VaultNotes({ verseId, mufradatId, selectedWord }: VaultNotesProps) {
  const { user, isLoading: isAuthLoading, signInWithGoogle, mockSignIn } = useAuth();
  const { arabicScale } = useFontScale();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'highlight' | 'zettelkasten'>('zettelkasten');

  const { data: notes, isLoading: isNotesLoading } = useQuery({
    queryKey: ['notes', user?.id, verseId],
    queryFn: () => {
      return noteService.getUserNotes(user?.id || 'local-guest', verseId);
    },
  });

  const saveNoteMutation = useMutation({
    mutationFn: async (noteData: Omit<UserNote, 'id' | 'created_at' | 'updated_at'>) => {
      return noteService.saveNote(noteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['zettelkasten_notes'] });
      window.dispatchEvent(new Event('vault_notes_updated'));
      setNewNote('');
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      return noteService.deleteNote(noteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['zettelkasten_notes'] });
      window.dispatchEvent(new Event('vault_notes_updated'));
    }
  });

  // Listen to external vault notes updates
  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    };
    window.addEventListener('vault_notes_updated', handleUpdate);
    return () => window.removeEventListener('vault_notes_updated', handleUpdate);
  }, [queryClient]);

  if (isAuthLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400 w-6 h-6" />
      </div>
    );
  }

  const handleSave = () => {
    if (!newNote.trim() || !verseId) return;
    saveNoteMutation.mutate({
      user_id: user?.id || 'local-guest',
      verse_id: verseId,
      mufradat_id: mufradatId || '',
      note_type: noteType,
      content: newNote
    });
  };

  const filteredNotes = mufradatId 
    ? notes?.filter(n => n.mufradat_id === mufradatId) 
    : notes;

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">Catatan untuk: 
           {selectedWord ? <span className="font-arabic font-normal ml-2 text-white" style={{ fontSize: `calc(1.25rem * ${arabicScale})` }} dir="rtl">{selectedWord.word_arabic}</span> : " Bait ini"}
        </h3>
      </div>

      <div className="bg-[#111113] border text-sm border-white/10 rounded-2xl overflow-hidden focus-within:ring-1 focus-within:ring-white/30 focus-within:border-transparent transition-all shadow-sm">
        <textarea
          className="w-full p-4 resize-none bg-transparent outline-none min-h-[100px] text-zinc-200 placeholder:text-zinc-600 focus:ring-0"
          placeholder="Tulis refleksi atau pemahaman Anda (Format Zettelkasten)..."
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
        />
        <div className="bg-white/5 border-t border-white/5 flex items-center justify-between px-3 py-3">
          <div className="flex bg-[#050505] border border-white/5 rounded-lg overflow-hidden">
             <button 
               onClick={() => setNoteType('zettelkasten')}
               className={`px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase transition-colors ${noteType === 'zettelkasten' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
               Catatan
             </button>
             <div className="w-px bg-white/5"></div>
             <button 
               onClick={() => setNoteType('highlight')}
               className={`px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase transition-colors ${noteType === 'highlight' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
               Sorotan
             </button>
          </div>
          <button 
            onClick={handleSave}
            disabled={!newNote.trim() || saveNoteMutation.isPending}
            className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {saveNoteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Simpan
          </button>
        </div>
      </div>

      <div className="mt-8 flex-1 pr-2">
        <h4 className="text-[11px] uppercase tracking-widest font-semibold text-zinc-500 mb-4">Vault ({filteredNotes?.length || 0})</h4>
        
        {isNotesLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-zinc-600 w-5 h-5" />
          </div>
        ) : !filteredNotes || filteredNotes.length === 0 ? (
          <div className="text-center py-12 px-6 bg-[#0a0a0c] rounded-3xl border border-white/5 shadow-xl flex flex-col items-center justify-center group relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
             <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/5 shadow-inner">
               <Bookmark className="w-5 h-5 text-zinc-500" />
             </div>
             <h5 className="text-sm font-semibold text-zinc-200 mb-2">Pusat Pengetahuan Kosong</h5>
             <p className="text-xs text-zinc-500 leading-relaxed max-w-[220px] mb-4">
               Belum ada catatan untuk bagian ini. Mulailah merangkai pemahaman Anda.
             </p>
             <button
               onClick={() => document.querySelector('textarea')?.focus()}
               className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-full transition-all border border-indigo-500/20"
             >
               Tulis Catatan Pertama
             </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotes?.map(note => (
              <div key={note.id} className="bg-[#111113] border border-white/5 p-5 rounded-2xl relative group hover:border-white/10 transition-colors">
                 <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={() => {
                        const newText = window.prompt("Edit Catatan:", note.content);
                        if (newText !== null && newText.trim() !== "") {
                            saveNoteMutation.mutate({ ...note, content: newText } as any);
                        }
                     }}
                     className="text-zinc-600 hover:text-indigo-400"
                   >
                     <Save className="w-4 h-4" /> {/* Or use an Edit icon, let's use a simple Edit/Pencil but we only have lucide-react Edit at best, actually we don't know if Edit is imported. Let's just use window.prompt. Wait, no. */}
                   </button>
                   <button 
                     onClick={() => { if (window.confirm('Apakah Anda yakin ingin menghapus catatan ini?')) { deleteNoteMutation.mutate(note.id); } }}
                     className="text-zinc-600 hover:text-red-400"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
                 <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded ${note.note_type === 'highlight' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/10 text-zinc-300'}`}>
                      {note.note_type}
                    </span>
                    <span className="text-xs text-zinc-500">{new Date(note.created_at).toLocaleDateString()}</span>
                 </div>
                 <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
                 {/* Jika punya mufradat id, kita bisa tampilkan ikon bahwa note ini terkait dgn Mufradat tertentu */}
                 {note.mufradat_id && (
                     <div className="mt-4 inline-flex items-center text-[10px] uppercase tracking-wider font-semibold bg-white/5 px-2.5 py-1 rounded border border-white/5 text-zinc-400">
                        Tertaut ke mufradat
                     </div>
                 )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
