import { supabase, Matan, Verse, Mufradat, Syarah } from '../lib/supabase';

// --- FALLBACK MOCK DATA ---
const DEFAULT_MATAN_ID = "11111111-1111-1111-1111-111111111111";
const DEFAULT_VERSE_V1_ID = "22222222-2222-2222-2222-222222222222";
const DEFAULT_VERSE_V2_ID = "33333333-3333-3333-3333-333333333333";

const MOCK_MATAN_LIST: Matan[] = [
  { id: DEFAULT_MATAN_ID, title: "Al-Ajurrumiyyah", author: "Ibnu Ajurrum", description: "Dasar Ilmu Nahwu", created_at: "" }
];

let MOCK_VERSES: Verse[] = [
  { id: DEFAULT_VERSE_V1_ID, matan_id: DEFAULT_MATAN_ID, sequence_number: 1, text_arabic: "الكَلَامُ هُوَ اللَّفْظُ المُرَكَّبُ المُفِيدُ بِالوَضْعِ", text_translation: "Kalam adalah lafaz yang tersusun, yang memberikan faedah (makna sempurna), dengan bahasa Arab (disengaja).", created_at: "" },
  { id: DEFAULT_VERSE_V2_ID, matan_id: DEFAULT_MATAN_ID, sequence_number: 2, text_arabic: "وَأَقْسَامُهُ ثَلَاثَةٌ : اسْمٌ وَفِعْلٌ وَحَرْفٌ جَاءَ لِمَعْنًى", text_translation: "Dan pembagian kalam itu ada tiga: Isim, Fi'il, dan Huruf yang memiliki makna.", created_at: "" },
];

let MOCK_MUFRADAT_V1: Mufradat[] = [
  { id: "44444444-4444-4444-4444-444444444441", verse_id: DEFAULT_VERSE_V1_ID, word_arabic: "الكَلَامُ", root_word: "ك ل م", translation: "Kalam (Kalimat)", nahwu_position: "Mubtada' Marfu'", sequence_index: 0, created_at: "" },
  { id: "44444444-4444-4444-4444-444444444442", verse_id: DEFAULT_VERSE_V1_ID, word_arabic: "هُوَ", root_word: "-", translation: "adalah (dia)", nahwu_position: "Dhamir Fashl", sequence_index: 1, created_at: "" },
  { id: "44444444-4444-4444-4444-444444444443", verse_id: DEFAULT_VERSE_V1_ID, word_arabic: "اللَّفْظُ", root_word: "ل ف ظ", translation: "Lafaz (Ucapan)", nahwu_position: "Khabar Marfu'", sequence_index: 2, created_at: "" },
  { id: "44444444-4444-4444-4444-444444444444", verse_id: DEFAULT_VERSE_V1_ID, word_arabic: "المُرَكَّبُ", root_word: "ر ك ب", translation: "Yang tersusun", nahwu_position: "Na'at (Sifat) ke-1", sequence_index: 3, created_at: "" },
  { id: "44444444-4444-4444-4444-444444444445", verse_id: DEFAULT_VERSE_V1_ID, word_arabic: "المُفِيدُ", root_word: "ف ي د", translation: "Yang berfaedah", nahwu_position: "Na'at (Sifat) ke-2", sequence_index: 4, created_at: "" },
  { id: "44444444-4444-4444-4444-444444444446", verse_id: DEFAULT_VERSE_V1_ID, word_arabic: "بِالوَضْعِ", root_word: "و ض ع", translation: "Dengan sengaja/Bahasa Arab", nahwu_position: "Jar Majrur", sequence_index: 5, created_at: "" },
];

let MOCK_MUFRADAT_V2: Mufradat[] = [
  { id: "55555555-5555-5555-5555-555555555551", verse_id: DEFAULT_VERSE_V2_ID, word_arabic: "وَأَقْسَامُهُ", root_word: "ق س م", translation: "Dan bagian-bagiannya", nahwu_position: "Mubtada'", sequence_index: 0, created_at: "" },
  { id: "55555555-5555-5555-5555-555555555552", verse_id: DEFAULT_VERSE_V2_ID, word_arabic: "ثَلَاثَةٌ", root_word: "ث ل ث", translation: "ada tiga", nahwu_position: "Khabar", sequence_index: 1, created_at: "" },
  { id: "55555555-5555-5555-5555-555555555553", verse_id: DEFAULT_VERSE_V2_ID, word_arabic: "اسْمٌ", root_word: "س م و", translation: "Isim", nahwu_position: "Badal", sequence_index: 2, created_at: "" },
  { id: "55555555-5555-5555-5555-555555555554", verse_id: DEFAULT_VERSE_V2_ID, word_arabic: "وَفِعْلٌ", root_word: "ف ع ل", translation: "Dan Fi'il", nahwu_position: "Ma'thuf", sequence_index: 3, created_at: "" },
  { id: "55555555-5555-5555-5555-555555555555", verse_id: DEFAULT_VERSE_V2_ID, word_arabic: "وَحَرْفٌ", root_word: "ح ر ف", translation: "Dan Huruf", nahwu_position: "Ma'thuf", sequence_index: 4, created_at: "" },
  { id: "55555555-5555-5555-5555-555555555556", verse_id: DEFAULT_VERSE_V2_ID, word_arabic: "جَاءَ", root_word: "ج ي ء", translation: "yang datang", nahwu_position: "Fi'il Madhi", sequence_index: 5, created_at: "" },
  { id: "55555555-5555-5555-5555-555555555557", verse_id: DEFAULT_VERSE_V2_ID, word_arabic: "لِمَعْنًى", root_word: "ع ن ي", translation: "untuk suatu makna", nahwu_position: "Jar Majrur", sequence_index: 6, created_at: "" },
];

let MOCK_MUFRADAT_MAP: Record<string, Mufradat[]> = {
  [DEFAULT_VERSE_V1_ID]: MOCK_MUFRADAT_V1,
  [DEFAULT_VERSE_V2_ID]: MOCK_MUFRADAT_V2,
};

let MOCK_SYARAH_MAP: Record<string, Syarah> = {
  [DEFAULT_VERSE_V1_ID]: { id: "66666666-6666-6666-6666-666666666661", verse_id: DEFAULT_VERSE_V1_ID, text_arabic: "", text_translation: "Syarah: Agar sebuah ucapan dapat disebut 'Kalam' dalam kaidah ilmu Nahwu, ia harus memenuhi empat syarat sekaligus. Jika hilang satu syarat saja, maka menurut ahli Nahwu ia bukanlah Kalam, meskipun menurut ahli bahasa (lughawi) ia disebut Kalam.", source_author: "Tuhfah as-Saniyyah bi Syarh al-Muqaddimah al-Ajurrumiyyah", created_at: "" },
  [DEFAULT_VERSE_V2_ID]: { id: "66666666-6666-6666-6666-666666666662", verse_id: DEFAULT_VERSE_V2_ID, text_arabic: "", text_translation: "Syarah: Kalimat dalam bahasa Arab hanya terbagi menjadi 3 jenis. Isim adalah kata benda/sifat. Fi'il adalah kata kerja yang terikat waktu. Huruf adalah kata tugas yang maknanya baru jelas jika digabung kata lain.", source_author: "Tuhfah as-Saniyyah", created_at: "" }
};


// Helper function untuk cek apakah supabase telah di-configure
const isSupabaseConfigured = () => {
  return import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== '';
};

export const matanService = {
  /**
   * Mengambil daftar literatur klasik (Matan).
   * @route GET /api/v1/matan
   * @returns {Promise<Matan[]>} Array dari objek Matan.
   */
  async getMatanList(): Promise<Matan[]> {
    if (!isSupabaseConfigured()) return [...MOCK_MATAN_LIST];
    const { data, error } = await supabase.from('matan').select('*');
    if (error) throw error;
    return data && data.length > 0 ? data : [...MOCK_MATAN_LIST];
  },

  /**
   * Mengambil bait-bait penyusun dari sebuah Maktabah spesifik.
   * @route GET /api/v1/matan/{matanId}/verses
   * @param {string} matanId - ID literatur yang akan diambil
   * @returns {Promise<Verse[]>} Array dari objek Verse secara berurutan.
   */
  async getVerses(matanId: string): Promise<Verse[]> {
    if (!isSupabaseConfigured()) {
      const verses = MOCK_VERSES.filter(v => v.matan_id === matanId);
      // Fallback jika tidak ditemukan (mungkin untuk matan default)
      return verses.length > 0 ? verses : MOCK_VERSES.filter(v => v.matan_id === DEFAULT_MATAN_ID);
    }
    const { data, error } = await supabase.from('verses').select('*').eq('matan_id', matanId).order('sequence_number', { ascending: true });
    if (error) throw error;
    if ((!data || data.length === 0) && matanId === DEFAULT_MATAN_ID) {
      return MOCK_VERSES.filter(v => v.matan_id === DEFAULT_MATAN_ID);
    }
    return data || [];
  },

  // Ambil data analisis kata (mufradat) berdasarkan Verse ID
  async getMufradat(verseId: string): Promise<Mufradat[]> {
    if (!isSupabaseConfigured()) return MOCK_MUFRADAT_MAP[verseId] || [];
    const { data, error } = await supabase.from('mufradat').select('*').eq('verse_id', verseId).order('sequence_index', { ascending: true });
    if (error) throw error;
    if ((!data || data.length === 0) && MOCK_MUFRADAT_MAP[verseId]) return MOCK_MUFRADAT_MAP[verseId];
    return data || [];
  },

  // Ambil Syarah (penjelasan kontekstual) berdasarkan Verse ID
  async getSyarah(verseId: string): Promise<Syarah | null> {
    if (!isSupabaseConfigured()) return MOCK_SYARAH_MAP[verseId] || null;
    const { data, error } = await supabase.from('syarah').select('*').eq('verse_id', verseId).single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 adalah error "No rows found"
    if (!data && MOCK_SYARAH_MAP[verseId]) return MOCK_SYARAH_MAP[verseId];
    return data;
  },

  // Simpan/Update terjemahan verse
  async updateVerseTranslation(verseId: string, translation: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      const verse = MOCK_VERSES.find(v => v.id === verseId);
      if (verse) verse.text_translation = translation;
      return;
    }
    const { error } = await supabase.from('verses').update({ text_translation: translation }).eq('id', verseId);
    if (error) throw error;
  },

  // Simpan Mufradat baru hasil AI
  async saveMufradat(verseId: string, mufradatList: Partial<Mufradat>[]): Promise<void> {
    if (!isSupabaseConfigured()) {
      MOCK_MUFRADAT_MAP[verseId] = mufradatList.map((m, i) => ({
          id: `m-ai-${Date.now()}-${i}`,
          verse_id: verseId,
          word_arabic: m.word_arabic || '',
          root_word: m.root_word || '',
          translation: m.translation || '',
          nahwu_position: m.nahwu_position || '',
          sequence_index: m.sequence_index || i,
          created_at: new Date().toISOString()
      }));
      return;
    }
    
    // Hapus mufradat pending sebelumnya jika ada
    await supabase.from('mufradat').delete().eq('verse_id', verseId);
    const { error } = await supabase.from('mufradat').insert(mufradatList);
    if (error) throw error;
  },

  // Simpan Syarah baru hasil AI
  async saveSyarah(syarah: Partial<Syarah>): Promise<void> {
    if (!isSupabaseConfigured()) {
      MOCK_SYARAH_MAP[syarah.verse_id!] = {
          id: `s-ai-${Date.now()}`,
          verse_id: syarah.verse_id!,
          text_arabic: syarah.text_arabic || '',
          text_translation: syarah.text_translation || '',
          source_author: syarah.source_author || 'AI',
          created_at: new Date().toISOString()
      };
      return;
    }

    const { error } = await supabase.from('syarah').insert([syarah]);
    if (error) throw error;
  },

  // Pencarian Pintar (Smart Morphological Search) berdasarkan akar kata
  async searchRootWord(rootWord: string): Promise<any[]> {
    const normalizedRoot = rootWord.replace(/\s+/g, '');
    const spaceSeparated = normalizedRoot.split('').join(' ');

    if (!isSupabaseConfigured()) {
        const allMufradat = [...MOCK_MUFRADAT_V1, ...MOCK_MUFRADAT_V2];
        const results = allMufradat.filter(m => {
          const rootVal = m.root_word.replace(/\s+/g, '');
          return rootVal === normalizedRoot || rootVal.includes(normalizedRoot);
        });
        
        // Return max 20 exact/closest results
        return results.slice(0, 20).map(r => ({ 
            ...r, 
            verses: MOCK_VERSES.find(v => v.id === r.verse_id) || { matan: {} } 
        })); 
    }
    
    // Optimisasi: Prioritaskan hasil exact match terlebih dahulu
    // Pertama, coba cari kecocokan persis pada root_word dengan membandingkan versi spasi atau tanpa spasi
    const { data: exactData, error: exactError } = await supabase
      .from('mufradat')
      .select(`
        *,
        verses (
           text_arabic,
           text_translation,
           matan (title, author)
        )
      `)
      .or(`root_word.eq.${normalizedRoot},root_word.eq.${spaceSeparated}`)
      .limit(20);

    if (exactError) throw exactError;

    // Jika hasil exact cukup, langsung kembalikan. Jika kurang ganti ke pencarian LIKE (contains)
    if (exactData && exactData.length > 0) {
      return exactData;
    }

    // Jika exact match tidak ada hasil, fallback menggunakan filter LIKE
    // Untuk menghindari full-table scan yang berat tanpa index, gunakan like biasa tanpa % di setiap huruf
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('mufradat')
      .select(`
        *,
        verses (
           text_arabic,
           text_translation,
           matan (title, author)
        )
      `)
      .or(`root_word.ilike.%${normalizedRoot}%,root_word.ilike.%${spaceSeparated}%`)
      .limit(20);
      
    if (fallbackError) throw fallbackError;
    return fallbackData || [];
  },

  // Menyimpan Kitab Baru (Simulasi Upload Kitab)
  async uploadKitab(matan: Partial<Matan>, versesText: string[]): Promise<Matan> {
    if (!isSupabaseConfigured()) {
      const newMatan: Matan = {
        id: `mat-${Date.now()}`,
        title: matan.title || 'Kitab Baru',
        author: matan.author || 'Anonim',
        description: matan.description || '',
        created_at: new Date().toISOString()
      };
      MOCK_MATAN_LIST.push(newMatan);

      versesText.forEach((text, lineIdx) => {
        const verseId = `v-${Date.now()}-${lineIdx}`;
        MOCK_VERSES.push({
          id: verseId,
          matan_id: newMatan.id,
          sequence_number: lineIdx + 1,
          text_arabic: text,
          text_translation: 'Menunggu terjemahan eksplorasi secara on-demand...',
          created_at: new Date().toISOString()
        });
        
        // Pseudo NLP: Memecah kata dengan spasi
        const words = text.split(/\s+/).filter(w => w.trim() !== '');
        const mufradatList: Mufradat[] = words.map((w, wIdx) => ({
          id: `m-${Date.now()}-${lineIdx}-${wIdx}`,
          verse_id: verseId,
          word_arabic: w,
          root_word: 'NLP Pending', // Placeholder simulasi
          translation: '...',
          nahwu_position: 'Pending',
          sequence_index: wIdx,
          created_at: new Date().toISOString()
        }));
        
        MOCK_MUFRADAT_MAP[verseId] = mufradatList;
      });

      return newMatan;
    }

    // Dalam implementasi nyata Supabase:
    // 1. Insert Matan
    const { data: newMatan, error: matanError } = await supabase
      .from('matan')
      .insert([matan])
      .select()
      .single();
      
    if (matanError) {
      console.error("Supabase error (matan):", matanError);
      if (matanError.code === '42P01' || matanError.message?.includes('schema cache')) throw new Error("Tabel 'matan' belum ada di database Supabase Anda. Anda HARUS menjalankan script di 'supabase/schema.sql' pada menu SQL Editor di dashboard Supabase Anda terlebih dahulu.");
      if (matanError.code === '42501') throw new Error("Akses ditolak (RLS). Pastikan Anda telah mengupdate policy di SQL Editor Supabase untuk mengizinkan INSERT (lihat schema.sql terbaru).");
      throw new Error(`Gagal menyimpan data matan: ${matanError.message || JSON.stringify(matanError)}`);
    }

    // 2. Insert Verses
    // (Akan ideal jika ada pemanggilan ke NLP Server Python di sini atau di Edge Function)
    const versesToInsert = versesText.map((text, idx) => ({
      matan_id: newMatan.id,
      sequence_number: idx + 1,
      text_arabic: text,
      text_translation: 'Menunggu terjemahan eksplorasi secara on-demand...'
    }));
    
    const { error: verseError } = await supabase.from('verses').insert(versesToInsert);
    if (verseError) {
      console.error("Supabase error (verses):", verseError);
      if (verseError.code === '42P01' || verseError.message?.includes('schema cache')) throw new Error("Tabel 'verses' belum ada di database Supabase Anda. Harap jalankan script 'supabase/schema.sql' di SQL Editor.");
      if (verseError.code === '42501') throw new Error("Akses ditolak (RLS) saat menyimpan bait. Harap update policy di SQL Editor Supabase.");
      throw new Error(`Gagal menyimpan bait: ${verseError.message || JSON.stringify(verseError)}`);
    }
    // Selanjutnya Supabase webhook / Edge Function akan memanggil NLP Pipeline (CamelTools) 
    // untuk mengisi tabel mufradat secara background process.

    return newMatan;
  },

  /**
   * Mereset seluruh data literatur baik lokal maupun cloud (jika dizinkan oleh RLS Supabase)
   */
  async resetData(): Promise<void> {
    if (!isSupabaseConfigured()) {
      MOCK_MATAN_LIST.length = 1; // Sisakan 1 matan default
      MOCK_VERSES = MOCK_VERSES.filter(v => v.matan_id === DEFAULT_MATAN_ID);
      
      const newMufradatMap: Record<string, Mufradat[]> = {};
      if (MOCK_MUFRADAT_MAP[DEFAULT_VERSE_V1_ID]) newMufradatMap[DEFAULT_VERSE_V1_ID] = MOCK_MUFRADAT_MAP[DEFAULT_VERSE_V1_ID];
      if (MOCK_MUFRADAT_MAP[DEFAULT_VERSE_V2_ID]) newMufradatMap[DEFAULT_VERSE_V2_ID] = MOCK_MUFRADAT_MAP[DEFAULT_VERSE_V2_ID];
      
      Object.keys(MOCK_MUFRADAT_MAP).forEach(key => {
        if (!newMufradatMap[key]) delete MOCK_MUFRADAT_MAP[key];
      });
      return;
    }

    try {
      // Upaya menghapus matan dari Supabase (jika RLS mengizinkan)
      // Kita menghapus matan yang bukan bawaan (jika ada id tertentu, atau hapus semua dan biarkan app fallback ke local mock)
      await supabase.from('matan').delete().neq('title', 'default-safe-guard'); 
    } catch (e) {
      console.error('Failed to clear cloud matan', e);
    }
  }
};
