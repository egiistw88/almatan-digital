import { supabase, UserNote } from '../lib/supabase';

const isSupabaseConfigured = () => {
  return import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== '';
};

const SYNC_QUEUE_KEY = 'almanhaj_sync_queue';
const LOCAL_CACHE_KEY = 'vault_notes_local';

// Load from local storage
let localCache: UserNote[] = JSON.parse(localStorage.getItem(LOCAL_CACHE_KEY) || '[]');
let syncQueue: Omit<UserNote, 'id' | 'created_at' | 'updated_at'>[] = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');

const persistCache = () => {
  localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(localCache));
};

const persistQueue = () => {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(syncQueue));
};

export const noteService = {
  async getUserNotes(userId: string, verseId?: string): Promise<UserNote[]> {
    if (!isSupabaseConfigured() || !navigator.onLine) {
      if (verseId) {
        return localCache.filter(n => n.verse_id === verseId && n.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      return localCache.filter(n => n.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    try {
      let query = supabase.from('user_notes').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      
      if (verseId) {
        query = query.eq('verse_id', verseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const SEED_FLAG = 'almanhaj_has_seeded_' + userId;
      if ((!data || data.length === 0) && !verseId && !localStorage.getItem(SEED_FLAG) && userId && userId !== 'local-guest') {
         const sampleNotes = [
             { user_id: userId, verse_id: 'v1', note_type: 'zettelkasten' as const, content: '[Definisi Kalam]\nKalam dalam ilmu nahwu mensyaratkan 4 hal: Lafal, Murokkab, Mufid, Wadho\'. Berbeda dengan kalam secara bahasa yang bisa berupa isyarat.\nTags: nahwu, kalam' },
             { user_id: userId, verse_id: 'v2', note_type: 'zettelkasten' as const, content: '[Pembagian Kata]\nPembagian kata dasar bahasa Arab sangat revolusioner namun sederhana: Isim (benda/sifat), Fi\'il (kata kerja terikat waktu), dan Huruf (partikel/tugas).\nTags: isim, fiil, huruf' }
         ];
         
         supabase.from('user_notes').insert(sampleNotes).then(() => {
             localStorage.setItem(SEED_FLAG, 'true');
             window.dispatchEvent(new Event('vault_notes_updated'));
             window.dispatchEvent(new Event('zettelkasten_notes_updated'));
         });
         
         const seedData: UserNote[] = sampleNotes.map((n, i) => ({ 
             ...n, 
             id: `seed-${i}`, 
             created_at: new Date().toISOString(), 
             updated_at: new Date().toISOString(),
             mufradat_id: null
         }));
         
         localCache = [...localCache, ...seedData];
         persistCache();
         return seedData;
      }
      
      // Update local cache defensively
      if (data) {
        const otherNotes = localCache.filter(c => c.user_id !== userId || (verseId && c.verse_id !== verseId));
        localCache = [...otherNotes, ...data];
        persistCache();
      }
      return data || [];
    } catch (e) {
      // Fallback to offline cache
      if (verseId) {
        return localCache.filter(n => n.verse_id === verseId && n.user_id === userId);
      }
      return localCache.filter(n => n.user_id === userId);
    }
  },

  async saveNote(note: Omit<UserNote, 'id' | 'created_at' | 'updated_at'>): Promise<UserNote> {
    const newNote: UserNote = {
      ...note,
      id: `local-note-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Optimistic Update / Offline First
    localCache = [newNote, ...localCache];
    persistCache();

    if (!isSupabaseConfigured() || !navigator.onLine) {
      syncQueue.push(note);
      persistQueue();
      return newNote;
    }

    try {
      const { data, error } = await supabase
        .from('user_notes')
        .insert([note])
        .select()
        .single();

      if (error) throw error;
      
      // Replace optimistic ID with real DB ID
      localCache = localCache.map(n => n.id === newNote.id ? data : n);
      persistCache();
      return data;
    } catch (e) {
      syncQueue.push(note);
      persistQueue();
      return newNote;
    }
  },

  async deleteNote(noteId: string): Promise<void> {
    // Optimistic Delete
    localCache = localCache.filter(n => n.id !== noteId);
    persistCache();

    if (!isSupabaseConfigured() || !navigator.onLine) {
      // For a real production app, add to a delete queue. Skipping for brevity.
      return;
    }

    if (noteId.startsWith('local-note-')) {
       return; // Never synced yet
    }

    const { error } = await supabase
      .from('user_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  },

  // Manual trigger for background queue
  async syncOfflineData() {
    if (!isSupabaseConfigured() || !navigator.onLine || syncQueue.length === 0) return;
    
    // Process queue
    const currentQueue = [...syncQueue];
    syncQueue = [];
    persistQueue();

    for (const note of currentQueue) {
      try {
        await supabase.from('user_notes').insert([note]);
      } catch (e) {
        // Re-queue on failure
        syncQueue.push(note);
      }
    }
    persistQueue();
  }
};
