# Al-Matan Linguistic Engine (NLP Data Pipeline)

Layanan microservice ini bertugas menangani pemrosesan bahasa alami (NLP) pada kalimat Arab menggunakan ekosistem Python, FastAPI, dan CamelTools. 
Microservice ini diakses oleh frontend (atau backend Next.js/Supabase Edge Functions) kita melalui HTTP/REST API.

## Prasyarat

- Python 3.9+
- pip (Python package manager)

## Cara Instalasi & Menjalankan (Local Development)

1. Buka terminal baru dan masuk ke direktori ini:
   ```bash
   cd nlp-service
   ```

2. Buat Virtual Environment (opsional namun sangat disarankan):
   ```bash
   python -m venv venv
   source venv/bin/activate  # di Windows: venv\Scripts\activate
   ```

3. Install dependensi:
   ```bash
   pip install -r requirements.txt
   ```

4. **Penting untuk CamelTools:** Anda perlu mengunduh dataset bahasa Arab yang digunakan oleh alat tersebut. Modulnya mungkin meminta Anda menjalankan:
   ```bash
   camel_data -i morphology pmo
   ```

5. Jalankan server FastAPI:
   ```bash
   python main.py
   # atau menggunakan uvicorn langsung: uvicorn main:app --reload
   ```

Server akan aktif di `http://localhost:8000`. 
Anda bisa langsung melihat dokumentasi Swagger API secara interaktif di `http://localhost:8000/docs`.

## Endpoint API

### `POST /api/v1/analyze`

Memecah sebuah kalimat bahasa Arab (*matan*) ke dalam data terstruktur per kata.

**Request body:**
```json
{
  "text_arabic": "الكَلَامُ هُوَ اللَّفْظُ المُرَكَّبُ"
}
```

**Response body:**
```json
{
  "words": [
    {
      "word_arabic": "الكَلَامُ",
      "root_word": "ك ل م",
      "lemma": "كَلام",
      "nahwu_position": "noun",
      "sequence_index": 0
    },
    ...
  ]
}
```

## Proses Migrasi ke Supabase
Setelah data di-extract dan dikembalikan ke antarmuka aplikasi atau backend Node, aplikasi (frontend/serverless function) dapat langsung melakukan *upserting* (memasukkan/menyimpan) hasil pemetaan struktur kalimat (verse) ke database PostgreSQL Supabase sesuai dengan skema relasional tabel `mufradat`.
