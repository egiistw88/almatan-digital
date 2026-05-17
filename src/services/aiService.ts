import { GoogleGenAI } from '@google/genai';
import { Verse, Mufradat, Syarah } from '../lib/supabase';

// Inisialisasi Gemini menggunakan GenAI SDK
const initGenAI = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? (process as any).env?.GEMINI_API_KEY : undefined);
    if (!apiKey) {
        console.warn('Gemini API Key is not configured.');
        return null; // Handle missing API key gracefully
    }
    return new GoogleGenAI({ apiKey });
}

export const aiService = {
  // Native PDF processing using Gemini
  async *streamPdfNatively(base64Pdf: string, fileName: string, targetContext?: string): AsyncGenerator<string, void, unknown> {
      const ai = initGenAI();
      if (!ai) return;
      
      try {
          const prompt = targetContext 
            ? `Lakukan ekstraksi (OCR presisi tinggi) teks bahasa Arab dari dokumen PDF kitab kuning "${fileName}" ini. FOKUS HANYA PADA KONTEKS/BAB BERIKUT: "${targetContext}".
Tugas utama Anda sebagai ahli Ulama dan Linguistik Arab:
1. Temukan dan ekstrak DENGAN SANGAT AKURAT teks Arab (matan) HANYA untuk bagian "${targetContext}" dari dokumen ini. Abaikan seluruh bab atau bagian lain.
2. Identifikasi pemisahan bait (nazham) atau fasal (bab) dan berikan satu baris kosong (ENTER) antar setiap pergantian bait. Pastikan setiap satu susunan bait berada dalam barisnya sendiri (atau maksimal 2 baris jika nazham) untuk kemudahan I'rab.
3. Pastikan teks Arab terbaca jelas dari kanan ke kiri, dan PERBAIKI penulisan harakat jika terdapat artefak scan yang rancu. 
4. ABAIKAN mutlak elemen non-matan: nomor urut halaman, header, footer, ornamen gambar, dan catatan kaki.
5. HANYA KEMBALIKAN TEKS ARABNYA SAJA DARI BAGIAN YANG DIMINTA, tanpa preamble, tanpa penjelasan, dan tanpa markdown (seperti \`\`\`arabic).`
            : `Lakukan ekstraksi (OCR presisi tinggi) teks bahasa Arab dari seluruh isi dokumen PDF kitab kuning "${fileName}" ini secara cermat.
Sebuah kitab matan klasik biasanya memiliki struktur bait (puisi/nazham) atau paragraf padat (natsar). 
Tugas utama Anda sebagai ahli Ulama dan Linguistik Arab:
1. Ekstrak dan pindahkan DENGAN SANGAT AKURAT seluruh teks Arab (matan) dari dokumen ini ke dalam teks digital.
2. Identifikasi pemisahan bait (nazham) atau fasal (bab) dan berikan satu baris kosong (ENTER) antar setiap pergantian bait. Pastikan setiap satu susunan bait berada dalam barisnya sendiri (atau maksimal 2 baris jika nazham) untuk kemudahan I'rab.
3. Pastikan teks Arab terbaca jelas dari kanan ke kiri, dan PERBAIKI penulisan harakat jika terdapat artefak scan yang rancu. 
4. ABAIKAN mutlak elemen non-matan: nomor urut halaman, header, footer, ornamen gambar, dan catatan kaki.
5. HANYA KEMBALIKAN TEKS ARABNYA SAJA DARI AWAL HINGGA AKHIR MATAN, tanpa preamble, tanpa penjelasan, dan tanpa markdown (seperti \`\`\`arabic).`;

          const stream = await ai.models.generateContentStream({
              model: 'gemini-2.5-flash',
              contents: [
                {
                  inlineData: {
                    data: base64Pdf,
                    mimeType: "application/pdf"
                  }
                },
                prompt
              ],
              config: {
                  temperature: 0.1,
              }
          });
          
          for await (const chunk of stream) {
              if (chunk.text) {
                  yield chunk.text;
              }
          }
      } catch (e) {
          console.error(`AI PDF Streaming Error:`, e);
          throw new Error('Gagal mengekstrak PDF. Silakan coba file lain atau periksa koneksi.');
      }
  },

  // Extract metadata (title, author, description) from raw PDF text
  async extractMetadata(rawText: string, fileName: string): Promise<{title: string, author: string, description: string} | null> {
      const ai = initGenAI();
      if (!ai) return null;
      
      try {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Analisis teks awalan dari kitab (PDF) berikut ini, yang bernama file "${fileName}".
Tolong identifikasi atau prediksikan:
1. Judul Kitab (title)
2. Penulis/Pengarang (author)
3. Deskripsi Singkat/Kategori Kitab (description)

Keluarkan hasilnya HANYA dalam format JSON yang valid. Jangan ada teks atau markdown lain (\`\`\`json).
Struktur JSON:
{
  "title": "...",
  "author": "...",
  "description": "..."
}

Teks mentah:
${rawText.substring(0, 3000)} // Analyzing first 3000 chars should be enough for metadata`,
              config: {
                  temperature: 0.1,
                  responseMimeType: "application/json",
              }
          });
          
          let rawRes = response.text || "{}";
          // Find the first { and the last } to extract JSON
          const start = rawRes.indexOf('{');
          const end = rawRes.lastIndexOf('}');
          if (start !== -1 && end !== -1) {
              rawRes = rawRes.substring(start, end + 1);
          }
          return JSON.parse(rawRes);
      } catch (e) {
          console.error("AI Metadata Extraction Error:", e);
          return null;
      }
  },

  // Translate a verse contextually
  async translateVerse(arabicText: string, kitabTitle: string): Promise<string> {
    const ai = initGenAI();
    if (!ai) return "Terjemahan AI tidak tersedia karena belum dikonfigurasi.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Posisikan diri Anda sebagai Ulama ahli ilmu alat (Nahwu, Shorof, Balaghah) dan sastra Arab.
Tolong terjemahkan teks matan/bait dari kitab "${kitabTitle}" berikut ke dalam bahasa Indonesia.
Metode Penerjemahan yang wajib digunakan:
1. Gunakan bahasa Indonesia yang baku, fasih, dan mudah dipahami, namun tetap mempertahankan ketelitian bahasa pesantren (seperti merujuk pada fa'il, maf'ul, dll secara tersirat untuk menjaga presisi makna).
2. Jika ada istilah teknis syar'i atau nahwu, gunakan terjemahan yang lazim di kalangan ulama muktabar (misal: "maka", "adapun bermula").
3. Terjemahkan secara komprehensif tanpa menghilangkan makna aslinya, pertimbangkan mafhum mukhalafah dan muwafaqah jika ada.
Hanya kembalikan teks terjemahannya saja, tanpa penjelasan (syarah) atau basa-basi tambahan.
Teks: ${arabicText}`,
            config: {
                temperature: 0.2, // Rendah untuk terjemahan akurat
            }
        });
        return response.text || "Gagal mendapatkan terjemahan.";
    } catch (e) {
        console.error("AI Translation Error:", e);
        return "Terjadi kesalahan saat memproses terjemahan.";
    }
  },

  // Generate Mufradat (Morphology Analysis)
  async analyzeMorphology(verseId: string, arabicText: string): Promise<Partial<Mufradat>[]> {
      const ai = initGenAI();
      if (!ai) return [];

      try {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Posisikan diri Anda sebagai seorang pakar linguistik bahasa Arab, ulama ahli Nahwu, Shorof, dan Balaghah.
Lakukan analisis morfologi (Mufradat dan I'rab) secara komprehensif pada setiap kata dalam kalimat matan berikut secara berurutan: "${arabicText}"

Keluarkan hasilnya HANYA dalam format JSON array yang valid. Jangan ada teks atau markdown lain (` + "```json" + `).
Setiap objek dalam array harus memiliki struktur berikut:
{
  "word_arabic": "kata (satu kata, dengan harakat jika mungkin)",
  "root_word": "akar kata (fi'il madhi dasar atau huruf hijaiyah dasar)",
  "translation": "terjemahan spesifik kata ini",
  "nahwu_position": "kedudukan i'rab kata secara spesifik (contoh: fi'il madhi mabni 'ala fath, fa'il marfu' bil dlammah, mubtada', muzaf ilaih, dll)"
}

Pastikan urutannya persis mengikuti susunan kalimat aslinya.`,
              config: {
                  temperature: 0.1,
                  responseMimeType: "application/json",
              }
          });
          
          let rawText = response.text || "[]";
          const start = rawText.indexOf('[');
          const end = rawText.lastIndexOf(']');
          if (start !== -1 && end !== -1) {
              rawText = rawText.substring(start, end + 1);
          }
          const parsed = JSON.parse(rawText) as Omit<Mufradat, 'id'|'verse_id'|'sequence_index'|'created_at'>[];
          return parsed.map((item, index) => ({
              ...item,
              verse_id: verseId,
              sequence_index: index
          }));
      } catch (e) {
          console.error("AI Morphology Analysis Error:", e);
          return [];
      }
  },

  // Generate Syarah
  async generateSyarah(verseId: string, arabicText: string, kitabTitle: string): Promise<Partial<Syarah> | null> {
    const ai = initGenAI();
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Posisikan diri Anda sebagai Ulama dan Syarih muktabar (pemberi penjelasan kitab kuning).
Berikan syarah (penjelasan kontekstual mendalam) mengenai matan/bait teks Arab berikut dari kitab "${kitabTitle}".
Fokus pembahasan:
1. Asbabun nuzul/wurud atau konteks penyusunan matan (jika relevan dengan matan tersebut).
2. Maksud penulis (musannif) dari teks tersebut berdasarkan kaidah ushul dan bahasa.
3. Penjelasan kaidah keilmuan (nahwu/shorof/fiqih/aqidah) yang terkandung di dalamnya sesuai pemahaman ulama salaf.
4. Faedah, hikmah, atau pengecualian (istitsna) dari kaidah tersebut.

INSTRUKSI PENTING TAMPILAN:
Gunakan cetak tebal (bold, contoh: **kata penting**) untuk menyoroti/highlight kata-kata kunci, istilah ilmiah, atau kalimat penting agar mudah dibaca dan dipahami.

Teks: "${arabicText}"

Jelaskan dalam 3-5 paragraf menggunakan bahasa Indonesia yang baku namun berjiwa bahasa santri keilmuan pesantren (misal menggunakan struktur "Adapun maksud musannif...", "Ketahuilah...", "Maka dapat difahami...").
Hanya berikan teks syarahnya saja, tidak perlu preamble awal atau akhir.`,
            config: {
                temperature: 0.6,
            }
        });
        
        return {
            verse_id: verseId,
            text_arabic: arabicText,
            text_translation: (response.text || "").trim(),
            source_author: `AI Syarih Assistant (Gemini)`
        };
    } catch (e) {
        console.error("AI Syarah Error:", e);
        return null;
    }
  },
  
  // Tasrif Explanation
  async generateTasrif(rootWord: string, word: string): Promise<string> {
    const ai = initGenAI();
    if (!ai) return "AI Belum dikonfigurasi.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Posisikan diri Anda sebagai ahli Ulama Shorof/Tasrif bahasa Arab dari kalangan santri.
Pengguna menanyakan detail wazan dan perubahan bentuk (tasrif) untuk kata "${word}" dengan akar kata "${rootWord}".
Jelaskan:
1. Wazan dasar kata tersebut (fi'il madhi - mudhari').
2. Tuliskan tasrif istilahi secara urut (madhi, mudhari', mashdar, isim fa'il, isim maf'ul, fi'il amr, fi'il nahi, isim zaman/makan, isim alat).
3. Jika relevan, sentuh sedikit tasrif lughawi (perubahan dhomir) singkat saja.
4. Jelaskan makna penambahan huruf (ziyadah) pada wazan tersebut jika ada, serta implikasi maknanya.
Hanya hasil penjelasannya saja.`,
            config: {
                temperature: 0.3,
            }
        });
        return response.text || "Tidak ada hasil tasrif.";
    } catch (e) {
        console.error("AI Tasrif Error:", e);
        return "Gagal memproses tasrif.";
    }
  }
};
