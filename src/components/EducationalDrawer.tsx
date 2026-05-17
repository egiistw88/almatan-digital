import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, BrainCircuit, Target, Lightbulb, Network, PenTool, Sparkles } from 'lucide-react';

interface EducationalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeFeature: string;
}

const FEATURE_GUIDES: Record<string, { title: string; subtitle: string; icon: React.ReactNode; sections: { title: string; content: string }[] }> = {
  'beranda': {
    title: 'Ringkasan Aktivitas',
    subtitle: 'Pusat kendali dan ikhtisar progres Anda.',
    icon: <BookOpen className="w-8 h-8 text-indigo-400" />,
    sections: [
      {
        title: 'Maksud & Filosofi',
        content: 'Beranda adalah halaman awal yang memberi Anda gambaran menyeluruh tentang perjalanan spiritual dan intelektual Anda. Di sini, Anda dapat melihat statistik kitab yang sedang Anda pelajari, catatan terbaru Anda, serta progres hafalan dan pemahaman Anda.'
      },
      {
        title: 'Cara Menggunakan',
        content: 'Pantau terus progres hafalan dan telaah Anda. Gunakan ringkasan ini untuk memotivasi diri agar senantiasa istiqomah (mudawamah) dalam menuntut ilmu setiap harinya.'
      }
    ]
  },
  'maktabah': {
    title: 'Maktabah (Perpustakaan)',
    subtitle: 'Eksplorasi mendalam terhadap literatur klasik Islam.',
    icon: <PenTool className="w-8 h-8 text-indigo-400" />,
    sections: [
      {
        title: 'Konteks Berlapis (Syarah & I\'rab)',
        content: 'Saat Anda mempelajari sebuah bait atau teks arab, sistem tidak hanya memberikan terjemahan, melainkan juga Syarah (penjelasan mendalam ala ulama salaf) serta I\'rab (analisis sintaksis/tata bahasa Arab) untuk setiap kata yang Anda pilih. Hal ini memastikan pemahaman yang komprehensif dari segi bahasa dan makna.'
      },
      {
        title: 'Penangkapan Pencerahan',
        content: 'Jika Anda menemukan faedah penting saat membaca Syarah, Anda dapat langsung menyorotnya dan menyimpannya sebagai "Atomic Note". Catatan ini akan menjadi pilar bagi Zettelkasten (Exobrain) Anda kelak.'
      }
    ]
  },
  'mudawamah': {
    title: 'Mudawamah (Konsistensi)',
    subtitle: 'Membangun kebiasaan melalui dedikasi harian.',
    icon: <Target className="w-8 h-8 text-emerald-400" />,
    sections: [
      {
        title: 'Filosofi Istiqomah',
        content: 'Sedikit namun rutin jauh lebih dicintai oleh Allah daripada amalan besar yang terputus. Fitur Mudawamah dirancang untuk memastikan Anda tetap terhubung dengan bait-bait ilmu setiap hari. Lacak rekor rentetan (streak) dedikasi Anda.'
      },
      {
        title: 'Cara Menggunakan',
        content: 'Kunjungi halaman ini setiap hari. Buktikan dedikasi Anda dengan melakukan aksi "Sweeping" atau mencatatkan aktivitas pembelajaran Anda. Jaga agar api semangat terus menyala.'
      }
    ]
  },
  'zettelkasten': {
    title: 'Exobrain (Zettelkasten)',
    subtitle: 'Otak kedua untuk menyusun jalinan ide dan ilmu.',
    icon: <BrainCircuit className="w-8 h-8 text-amber-400" />,
    sections: [
      {
        title: 'Jaringan Semantik',
        content: 'Setiap Atomic Note yang Anda simpan di Maktabah akan muncul di sini. Zettelkasten adalah metode membangun jaringan pengetahuan dengan menghubungkan satu catatan dengan catatan lain yang relevan secara organik (semantik).'
      },
      {
        title: 'Membangun Struktur',
        content: 'Tarik garis atau biarkan AI membantu menghubungkan catatan yang memiliki faedah beririsan. Semakin banyak koneksi, semakin dalam dan komprehensif pemahaman Anda atas suatu topik/disiplin ilmu.'
      }
    ]
  },
  'compilation': {
    title: 'Meja Kompilasi',
    subtitle: 'Merajut catatan atomik menjadi sebuah tulisan utuh.',
    icon: <Network className="w-8 h-8 text-blue-400" />,
    sections: [
      {
        title: 'Esensi Menulis',
        content: 'Pengetahuan yang berserakan belum menjadi ilmu yang terstruktur. Di Meja Kompilasi, Anda dapat menarik susunan Atomic Notes dari Vault Anda dan menyajikannya menjadi sebuah kerangka tulisan, buletin, atau buku.'
      },
      {
        title: 'Cara Menggunakan',
        content: 'Buka sidebar "Vault", lalu seret (drag and drop) catatan-catatan yang relevan ke Kanvas Draf. Susun ulang (reorder) posisi catatan tersebut hingga Anda merasa struktur bahasannya logis dan berkesinambungan.'
      }
    ]
  }
};

export const EducationalDrawer: React.FC<EducationalDrawerProps> = ({ isOpen, onClose, activeFeature }) => {
  const guide = FEATURE_GUIDES[activeFeature] || FEATURE_GUIDES['beranda'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0a0a0c] border-l border-white/10 z-[101] shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col"
          >
            {/* Header */}
            <div className="flex-none p-6 pb-8 border-b border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none -mt-32 -mr-32"></div>
               <div className="flex items-start justify-between relative z-10 mb-6">
                 <div className="bg-white/5 p-3 rounded-2xl ring-1 ring-white/10 shadow-inner">
                   {guide.icon}
                 </div>
                 <button 
                   onClick={onClose}
                   className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                 >
                   <X size={20} />
                 </button>
               </div>
               <div className="relative z-10">
                 <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">{guide.title}</h2>
                 <p className="text-zinc-400 leading-relaxed text-sm">{guide.subtitle}</p>
               </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-800">
               <div className="space-y-8 pb-12">
                 {guide.sections.map((section, idx) => (
                   <div key={idx} className="relative">
                     <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                       <Lightbulb size={16} /> {section.title}
                     </h3>
                     <div className="pl-6 border-l-2 border-white/5">
                        <p className="text-sm text-zinc-300 leading-loose">
                          {section.content}
                        </p>
                     </div>
                   </div>
                 ))}
               </div>
               
               <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-4 mt-8 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/20 blur-xl rounded-full"></div>
                  <Sparkles className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5 relative z-10" />
                  <div className="relative z-10">
                    <h4 className="text-sm font-medium text-indigo-300 mb-1">Tips Adaptasi</h4>
                    <p className="text-xs text-indigo-200/70 leading-relaxed">Luangkan waktu untuk mempraktikan fitur ini tiap hari. Kemahiran membangun relasi semantik muncul dari konsistensi berinteraksi.</p>
                  </div>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
