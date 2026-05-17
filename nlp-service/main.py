import time
import uuid
import re
import asyncio
from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict
from io import BytesIO

# Import camel tools (placeholder)
from camel_tools.tokenizers.word import simple_word_tokenize

try:
    import pytesseract
    from PIL import Image
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False

app = FastAPI(
    title="Al-Matan Linguistic Engine & Lensa Taqyid", 
    description="Pipeline Data, NLP, dan Ekstraksi Teks Asinkron",
    version="1.0"
)

# --- Memory Message Queue Placeholder (celery replacement for local) ---
ocr_tasks: Dict[str, dict] = {}

# --- Model Data (Pydantic) ---
class VerseRequest(BaseModel):
    text_arabic: str

class WordAnalysis(BaseModel):
    word_arabic: str
    root_word: Optional[str] = None
    lemma: Optional[str] = None
    nahwu_position: Optional[str] = None # POS Tagging (I'rab)
    sequence_index: int

class VerseResponse(BaseModel):
    words: List[WordAnalysis]

# --- Inisialisasi Model CamelTools ---
# Untuk implementasi produksi nyata, Anda akan memuat database morfologi di sini
# analyzer = Analyzer(MorphologyDB.builtin_db())
# pos_tagger = DefaultTagger(...)

@app.get("/")
def read_root():
    return {"message": "Al-Matan Linguistic Engine (FastAPI) berjalan dengan baik."}

@app.post("/api/v1/analyze", response_model=VerseResponse)
def analyze_verse(request: VerseRequest):
    """
    Endpoint ini memecah kalimat kalimat Arab (bait matan) menjadi token, 
    lalu menganalisis setiap kata untuk menemukan akar kata dan posisinya (I'rab/POS tagging).
    """
    text = request.text_arabic
    if not text.strip():
        raise HTTPException(status_code=400, detail="Teks Arab tidak boleh kosong.")

    # 1. Tokenisasi: Memecah kalimat menjadi token kata (word tokenization)
    tokens = simple_word_tokenize(text)
    
    # Filter token dari tanda baca untuk fokus ke kata-kata
    words = [t for t in tokens if re.search(r'[\u0600-\u06FF]', t)]
    
    analysis_results = []
    
    for i, word in enumerate(words):
        root_extracted = "placeholder_root" # Ganti dengan best_analysis['root']
        lemma_extracted = "placeholder_lemma" # Ganti dengan best_analysis['lex']
        pos_extracted = "noun" # Ganti dengan best_analysis['pos']

        analysis = WordAnalysis(
            word_arabic=word,
            root_word=root_extracted,
            lemma=lemma_extracted,
            nahwu_position=pos_extracted, # Misalnya: Noun, Verb, Adjective
            sequence_index=i
        )
        analysis_results.append(analysis)

    return VerseResponse(words=analysis_results)

# --- Lensa Taqyid (Asynchronous OCR Pipeline) ---

def clean_arabic_text(text: str) -> str:
    """Membersihkan noise teks OCR"""
    # Hapus spasi ganda
    text = re.sub(r'\s+', ' ', text)
    # Perbaiki format paragraf (hapus newline yang terputus di tengah kalimat)
    text = re.sub(r'([^\n])\n([^\n])', r'\1 \2', text)
    # Normalisasi karakter (contoh basic)
    text = text.replace('ـ', '') # Tatweel
    return text.strip()

async def process_ocr_task(task_id: str, image_bytes: bytes):
    """Fungsi worker asinkron (pengganti Celery task)"""
    try:
        ocr_tasks[task_id]['status'] = 'processing'
        # Simulasi delay antrean & komputasi GPU/CPU
        await asyncio.sleep(2) 
        
        if HAS_TESSERACT:
            image = Image.open(BytesIO(image_bytes))
            # Konfigurasi khusus bahasa Arab
            custom_config = r'--oem 3 --psm 6 -l ara'
            extracted_text = pytesseract.image_to_string(image, config=custom_config)
        else:
            # Fallback mockup jika tesseract tidak terinstall
            await asyncio.sleep(3)
            extracted_text = "قال محمد هو ابن مالك\nأحمد ربي الله خير مالك\nمصليا على النبي المصطفى\nوآله المستكملين الشرفا"
            
        cleaned_text = clean_arabic_text(extracted_text)
        
        ocr_tasks[task_id]['status'] = 'completed'
        ocr_tasks[task_id]['result'] = cleaned_text
        
        # Di sistem production, di sini kita bisa mengirim Notifikasi Push (FCM/WebSocket) 
        # ke UI bahwa task_id telah selesai.
        print(f"Task {task_id} completed. Sending Push Notification...")
        
    except Exception as e:
        ocr_tasks[task_id]['status'] = 'failed'
        ocr_tasks[task_id]['error'] = str(e)

@app.post("/api/v1/ocr/upload")
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Mengunggah gambar untuk diekstrak (Non-blocking)"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File harus berupa gambar.")
        
    # Generate unique ID untuk task
    task_id = str(uuid.uuid4())
    image_bytes = await file.read()
    
    # Daftarkan ke in-memory queue
    ocr_tasks[task_id] = {
        'status': 'queued',
        'result': None,
        'error': None,
        'created_at': time.time()
    }
    
    # Delegasikan ke background task
    background_tasks.add_task(process_ocr_task, task_id, image_bytes)
    
    return {
        "message": "Dokumen berhasil masuk antrean.",
        "task_id": task_id,
        "status": "queued"
    }

@app.get("/api/v1/ocr/status/{task_id}")
def get_ocr_status(task_id: str):
    """Polling atau status pengecekan task OCR"""
    if task_id not in ocr_tasks:
        raise HTTPException(status_code=404, detail="Task tidak ditemukan.")
        
    return ocr_tasks[task_id]

if __name__ == "__main__":
    import uvicorn
    # Menjalankan server uvicorn pada port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
