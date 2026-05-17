import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, UploadCloud, RefreshCw, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export const LensaTaqyid = ({ onClose, onUploadQueueStarted }: { onClose: () => void, onUploadQueueStarted: (taskId: string, isSimulated: boolean) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied or error:", err);
      setCameraError("Akses kamera ditolak atau perangkat tidak memiliki kamera.");
      toast.error("Tidak dapat mengakses kamera.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async (blob: Blob) => {
      const formData = new FormData();
      formData.append('file', blob, 'capture.jpg');
      
      const res = await fetch('/api/v1/ocr/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error("Backend nlp-service tidak merespon");
      const data = await res.json();
      return data.task_id;
    },
    onSuccess: (id) => {
      onUploadQueueStarted(id, false);
    },
    onError: (err) => {
      console.warn("Upload gagal, berpindah ke mode simulasi (Backend tidak aktif):", err);
      onUploadQueueStarted('simulated-' + Date.now(), true);
    }
  });

  const handleProcess = () => {
    if (!capturedImage) return;
    
    // Convert base64 to blob
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        toast.info("Mengekstrak teks di latar belakang...");
        uploadMutation.mutate(blob);
        onClose(); // Return to home immediately
      });
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const isProcessing = uploadMutation.isPending;

  const handleClose = () => {
    if (capturedImage && !uploadMutation.isPending) {
      if (window.confirm("Gambar belum diunggah. Yakin ingin menutup Lensa Taqyid?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };


  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="absolute top-4 inset-x-4 flex justify-between items-center z-50">
        <h2 className="text-white font-medium tracking-wide">Lensa Taqyid</h2>
        <button onClick={handleClose} className="w-10 h-10 bg-white/10 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/20 transition">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 relative bg-zinc-900 flex items-center justify-center overflow-hidden">
        {!capturedImage ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Viewfinder guides */}
            <div className="absolute inset-x-8 top-1/4 bottom-1/4 border-2 border-zinc-100/50 rounded-2xl pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-zinc-100 -mt-0.5 -ml-0.5 rounded-tl-2xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-zinc-100 -mt-0.5 -mr-0.5 rounded-tr-2xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-zinc-100 -mb-0.5 -ml-0.5 rounded-bl-2xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-zinc-100 -mb-0.5 -mr-0.5 rounded-br-2xl"></div>
            </div>
            
            <div className="absolute bottom-12 inset-x-0 flex justify-center">
              <button 
                onClick={captureImage}
                className="w-20 h-20 rounded-full border-4 border-white/50 flex items-center justify-center p-1 active:scale-95 transition-transform"
              >
                <div className="w-full h-full bg-white rounded-full"></div>
              </button>
            </div>
          </>
        ) : (
          <>
            <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-contain" />

            <div className="absolute bottom-0 inset-x-0 p-8 bg-black/60 backdrop-blur-md flex justify-center gap-6">
              <button 
                onClick={retake}
                className="px-6 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 transition-colors"
              >
                Ulangi
              </button>
              <button 
                onClick={handleProcess}
                className="px-6 py-3 rounded-xl font-medium text-black bg-zinc-100 hover:bg-zinc-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-colors flex items-center gap-2"
              >
                <UploadCloud size={18} />
                Ekstrak Teks
              </button>
            </div>
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
