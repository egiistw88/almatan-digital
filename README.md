# Al-Manhaj: Infrastruktur Digital Literatur Klasik Arab

Al-Manhaj bukanlah sekadar aplikasi pembaca (*reader app*). Ia dirancang sebagai **infrastruktur epistemologis jangka panjang** untuk membedah, mengkaji, dan mengkristalisasi pemahaman atas literatur klasik (Matan) berbahasa Arab. Sistem ini memadukan tradisi keilmuan klasik dengan arsitektur komputasi modern untuk memberikan pengalaman syarah (eksplanasi), i'rab (analisis gramatikal), pencatatan atomik (*zettelkasten*), dan integrasi AI tingkat lanjut.

---

## ✨ Fitur Utama (Core Features)

### 1. Maktabah Multidimensi
Eksplorasi jalinan bait-bait matan (seperti *Alfiyah Ibnu Malik* atau *Nuruz Zholam*) yang dilengkapi dengan fungsionalitas turunan secara hierarkis:
- **Lapis Syarah:** Eksplanasi komprehensif pada tiap bait.
- **Lapis I'rab & Mufradat:** Analisis gramatikal (tasrif) struktural pada tingkat akar kata (*word-level*).

### 2. Mesin Pencari Morfologis Berbasis AI (Isytiqoq)
Sistem pencari teks pintar berbahasa Arab. Pengguna dapat mencari huruf (*huruf hijaiyah*) atau merumuskan Tasrif secara otomatis dengan bantuan integrasi Gemini AI (Google Generative AI) tingkat lanjut.

### 3. Exobrain (Sistem Zettelkasten)
Infrastruktur personalisasi pengetahuan melalui modul **Vault Notes**:
- Merangkul pola *Atomic Notes* lintas bait dan karya.
- **Visualisasi Relasi *(Zettelkasten Graph)*:** Melacak graf semantik dan koneksi antarcatatan menggunakan visualisasi *network graph* (D3.js).
- Integrasi papan kompilasi teks dengan Drawer Sintopikal.

### 4. Lensa Taqyid (AI OCR Pipeline)
Mengekstraksi, membersihkan, dan mendigitalkan teks Arab dari artefak fisik atau dokumen PDF. Lensa Taqyid menggunakan arsitektur antrean sinkronisasi proaktif untuk memproses *file* luring maupun daring.

### 5. Resiliensi Luring (Offline-First PWA)
- **Zero-Friction Offline:** Memanfaatkan `idb-keyval` dan Service Worker PWA agar aplikasi tetap hidup dan bernapas meski terputus tautan internet.
- Data disimulasikan menggunakan struktur **Optimistic UI Updates**, dan akan mengalir ke kluster aslinya (Supabase) secara transparan begitu jaringan pulih.

---

## 🏗 Modularitas & Arsitektur Teknologi

Aplikasi ini menggunakan perpaduan spesifik dalam paradigma modern Web SPA (*Single Page Application*):
- **Frontend Layer:** Bereaksi secara deklaratif melalui **React 19**, menggunakan mesin gerak **motion/react**, dan tatanan visual pragmatis **Tailwind CSS v4**.
- **State Management:** Dikelola penuh optimisme menggunakan **TanStack React Query**, terhubung simetris dengan memori lokal IndexedDB. 
- **Persistensi Data (BaaS):** Bermuara pada layanan **Supabase (PostgreSQL)** untuk *auth* maupun klasterisasi data (*realtime sync*).
- **Keamanan (Routing & Deploy):** Dibangun melingkari batasan-batasan statis (Vite) siap pelipatan (*deployment*) instan di medium *edge-network* semisal **Vercel** atau **Cloud Run**.

---

## 🚀 Panduan Instalasi & Pengembangan

### Prasyarat
- Node.js (v18+)
- Manajer paket npm / yarn / pnpm
- Akun layanan kunci Supabase & Google Gemini API.

### 1. Kloning Repositori & Instalasi
Buka terminal dan lakukan eksekusi paralel berikut:
```bash
git clone https://github.com/username/al-manhaj.git
cd al-manhaj
npm install
```

### 2. Konfigurasi Variabel Lingkungan (.env)
Salin `.env.example` ke file berformat `.env`:
```bash
cp .env.example .env
```
Lengkapi isinya menggunakan kunci akses proyek masing-masing:
```env
VITE_SUPABASE_URL="https://[proyek-kamu].supabase.co"
VITE_SUPABASE_ANON_KEY="[kunci-anon-kamu]"
VITE_GEMINI_API_KEY="[kunci-gemini-kamu]"
```

### 3. Persiapan Database (Supabase)
Masuk ke SQL Editor di *dashboard* Supabase Anda. Salin dan jalankan secara utuh seluruh kueri DDL yang berada di dalam berkas:
📄 `supabase/schema.sql` (Pastikan RLS dan autentikasinya siap pakai).

### 4. Jalankan Peladen Pengembangan
```bash
npm run dev
```
Kunjungi `http://localhost:3000` di tautan meramban Anda. Aplikasi akan disajikan panas (*hot mode*).

---

## 📦 Pembangunan & Deployment (Vercel)

Al-Manhaj dilindungi dari segala jenis keruntuhan siklus Vite ketika di-*deploy* dalam skenario SPA. Prosedur Produksi Ringkas:

```bash
npm run build
```

### Panduan Deployment Vercel Khusus
1. Masukkan proyek ini ke Github yang terhubung dengan Vercel.
2. Saat panel kompilasi Vercel terbuka, atur:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Tambahkan ke Vercel Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
4. Tekan **Deploy**.

> **⚠️ Solusi Layar Blank (Hitam) di Vercel:** Proyek ini telah dilengkapi dengan `vercel.json` dan perbaikan `vite.config.ts`. Jika menjumpai layar terblokir (*blank*) pada percobaan pertama Vercel, pastikan semua `Environment Variable` milik Vercel telah dimasukkan dengan tepat dan tidak menyertakan tanda petik tambahan. Vite akan secara cerdas memproses *fallback null* terhadap Variabel jika dikosongkan.

---

*"Demi masa, sesungguhnya manusia berada dalam kerugian, kecuali mereka yang terus menautkan ilmu dengan pemahaman (Al-Manhaj)."* ~ Catatan Ekspedisi Ilmu.
