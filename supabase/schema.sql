-- Setup Supabase Relational Schema untuk Al-Matan Digital
-- Silakan jalankan script SQL ini di SQL Editor Supabase Anda.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel Kitab/Matan Utama
CREATE TABLE matan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Bait Matan (Verses)
CREATE TABLE verses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matan_id UUID REFERENCES matan(id) ON DELETE CASCADE,
    sequence_number INT NOT NULL,     -- Urutan bait
    text_arabic TEXT NOT NULL,        -- Teks Arab asli
    text_translation TEXT,            -- Terjemahan umum
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Mufradat (Analisis Word-by-Word)
CREATE TABLE mufradat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verse_id UUID REFERENCES verses(id) ON DELETE CASCADE,
    word_arabic VARCHAR(100) NOT NULL,
    root_word VARCHAR(100),           -- Akar kata (hasil stemming/NLP CamelTools)
    translation VARCHAR(255),         -- Terjemahan harfiah per kata
    nahwu_position VARCHAR(255),      -- Posisi I'rab (contoh: fi'il madhi, fa'il)
    sequence_index INT NOT NULL,      -- Urutan kata dalam bait
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Syarah (Overlay Penjelasan Kontekstual)
CREATE TABLE syarah (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verse_id UUID REFERENCES verses(id) ON DELETE CASCADE,
    text_arabic TEXT,
    text_translation TEXT NOT NULL,
    source_author VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabel Personal Study Vault (Zettelkasten, Bookmark, Highlight)
CREATE TABLE user_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verse_id UUID REFERENCES verses(id) ON DELETE CASCADE,
    mufradat_id UUID REFERENCES mufradat(id) ON DELETE CASCADE,
    note_type VARCHAR(50) NOT NULL,   -- 'bookmark', 'highlight', 'zettelkasten'
    content TEXT,                     -- Isi catatan pengguna
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeksasi untuk mempercepat pencarian (Smart Morphological Search)
CREATE INDEX idx_mufradat_root_word ON mufradat(root_word);
CREATE INDEX idx_verses_matan_id ON verses(matan_id);
CREATE INDEX idx_user_notes_user_id ON user_notes(user_id);

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- -------------------------------------------------------------

-- Aktifkan RLS pada semua tabel
ALTER TABLE matan ENABLE ROW LEVEL SECURITY;
ALTER TABLE verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mufradat ENABLE ROW LEVEL SECURITY;
ALTER TABLE syarah ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- Policy untuk Tabel Publik (Matan, Verses, Mufradat, Syarah)
CREATE POLICY "Public matan are viewable by everyone." ON matan FOR SELECT USING (true);
CREATE POLICY "Anyone can insert matan." ON matan FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update matan." ON matan FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete matan." ON matan FOR DELETE USING (true);

CREATE POLICY "Public verses are viewable by everyone." ON verses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert verses." ON verses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update verses." ON verses FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete verses." ON verses FOR DELETE USING (true);

CREATE POLICY "Public mufradat are viewable by everyone." ON mufradat FOR SELECT USING (true);
CREATE POLICY "Anyone can insert mufradat." ON mufradat FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update mufradat." ON mufradat FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete mufradat." ON mufradat FOR DELETE USING (true);

CREATE POLICY "Public syarah are viewable by everyone." ON syarah FOR SELECT USING (true);
CREATE POLICY "Anyone can insert syarah." ON syarah FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update syarah." ON syarah FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete syarah." ON syarah FOR DELETE USING (true);

-- Policy untuk Tabel User Notes (Vault) -> Hanya bisa diakses & dimodifikasi oleh pemilik (user_id)
CREATE POLICY "Users can insert their own notes." ON user_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own notes." ON user_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes." ON user_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes." ON user_notes FOR DELETE USING (auth.uid() = user_id);

-- 6. Tabel Mudawamah (Habit Tracker)
CREATE TABLE mudawamah_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);
ALTER TABLE mudawamah_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own mudawamah." ON mudawamah_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own mudawamah." ON mudawamah_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own mudawamah." ON mudawamah_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mudawamah." ON mudawamah_sessions FOR DELETE USING (auth.uid() = user_id);
