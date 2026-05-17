import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Matan = {
  id: string;
  title: string;
  author: string;
  description: string;
  created_at: string;
};

export type Verse = {
  id: string;
  matan_id: string;
  sequence_number: number;
  text_arabic: string;
  text_translation: string;
  created_at: string;
};

export type Mufradat = {
  id: string;
  verse_id: string;
  word_arabic: string;
  root_word: string;
  translation: string;
  nahwu_position: string;
  sequence_index: number;
  created_at: string;
};

export type Syarah = {
  id: string;
  verse_id: string;
  text_arabic: string;
  text_translation: string;
  source_author: string;
  created_at: string;
};

export type UserNote = {
  id: string;
  user_id: string;
  verse_id: string;
  mufradat_id: string;
  note_type: 'bookmark' | 'highlight' | 'zettelkasten';
  content: string;
  created_at: string;
  updated_at: string;
};
