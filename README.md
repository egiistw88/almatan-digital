# Al-Manhaj: Epistemologi & Infrastruktur Literatur Klasik

Al-Manhaj bukanlah sekadar aplikasi pembaca (reader app). Ia dirancang sebagai **infrastruktur epistemologis jangka panjang** untuk membedah, mengkaji, dan mengkristalisasi pemahaman atas literatur klasik (Matan) berbahasa Arab. Sistem ini memadukan tradisi keilmuan klasik dengan arsitektur komputasi modern untuk memberikan pengalaman syarah (eksplanasi), i'rab (analisis gramatikal), dan pencatatan atomik (*zettelkasten*).

## ✨ Fitur Utama

### 1. Maktabah Multidimensi
Eksplorasi jalinan bait-bait matan (seperti *Alfiyah Ibnu Malik*) yang dilengkapi dengan fungsionalitas turunan secara hierarkis:
- **Lapis Syarah:** Eksplanasi komprehensif pada tiap bait.
- **Lapis I'rab & Mufradat:** Analisis gramatikal struktural pada tingkat kata (word-level).

### 2. Mesin Pencari Morfologis (Isytiqoq)
Sistem pencarian berbasis akar kata (*stemming search*) berbahasa Arab yang mampu memetakan seluruh derivasi (variasi bentuk kata) yang tersebar di sekujur literatur. 

### 3. Exobrain (Sistem Zettelkasten)
Infrastruktur personalisasi pengetahuan (*Vault Notes*):
- Pengguna dapat merangkai **Atomic Notes** lintas bait dan referensi.
- Dilengkapi dengan *Graph Visualization* yang memetakan relasi semantik antarcatatan untuk eskalasi pemahaman berkelanjutan.

### 4. Lensa Taqyid (AI OCR Pipeline)
Mengekstraksi, membersihkan, dan mendigitalkan teks Arab dari artefak fisik atau lembaran PDF ke dalam bentuk *atomic note* menggunakan pemrosesan di latar belakang.

### 5. Resiliensi Luring (Offline-First)
- Arsitektur tidak goyah ketika terputus dari jaringan. 
- Transaksi data disangga pada *Local Cache* dan *Sync Queue* menggunakan mekanisme *Optimistic UI Updates*. Sinkronisasi akan pulih dan menyalurkan data ke peladen ketika koneksi (*online*) terdeteksi kembali.

## 🏗 Modularitas & Arsitektur

Sistem dibangun menggunakan prinsip **Separation of Concerns** (Pemisahan Tanggung Jawab) yang membagi lapisan presentasi (UI) dan logika state/bisnis secara elegan:
- **Frontend Layer:** Bereaksi murni secara deklaratif menggunakan React, dan ditata visual secara pragmatis menggunakan Tailwind CSS, menerapkan konsep *Lazy Loading* terhadap komponen berat.
- **Service Layer (`services/`):** Mengabstraksi komunikasi terhadap *backend* (seperti Supabase) maupun transisi menuju memori lokal (IndexedDB/localStorage) untuk fitur tanpa gesekan (*frictionless*).
- **Backend / Realtime Sync:** Direncanakan termanifestasi menggunakan FastAPI (bersama Supabase/PostgreSQL) untuk menyikapi beban *Node Graph* berskala raksasa, bebas kutukan *N+1 query problem*.

## 🚀 Instalasi & Lingkungan Pengembangan

Ikuti panduan berikut untuk menduplikasi cermin pengembangan Al-Manhaj pada mesin lokal:

### Prasyarat
- Node.js (V 18+)
- Manajer paket npm / yarn
- (Fase Produksi) Akun Supabase untuk proyektor *database*.

### Menjalankan Lingkungan Lokal

1. **Clone Repositori:**
   ```bash
   git clone <repository_url>
   cd al-manhaj
   ```

2. **Instalasi Dependensi:**
   ```bash
   npm install
   ```

3. **Inisisalisasi Environtment Variables:**
   Salin `.env.example` menjadi `.env` lalu perbarui nilainya.
   ```bash
   cp .env.example .env
   ```

4. **Jalankan Peladen Pengembangan:**
   ```bash
   npm run dev
   ```
   Peladen akan dimuat pada instansi `http://localhost:3000`.

## 📦 Pembangunan untuk Produksi (Build)

Untuk kompilasi produksi massal dan melucuti beban kinerjanya:
```bash
npm run build
```
Skrip ini akan mengeksekusi kompilasi Vite yang ringkas, menghasilkan artefak statis pada direktori `dist/` siap tuang ke kluster peladen statis atau CDN.

---
*"Demi masa, sesungguhnya manusia berada dalam kerugian, kecuali mereka yang terus menautkan ilmu dengan pemahaman."* — Al-Manhaj
