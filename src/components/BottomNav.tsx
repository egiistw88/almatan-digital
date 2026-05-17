import React from 'react';
import { Home, BookOpen, Camera, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BottomNavProps {
  activeFeature: 'beranda' | 'maktabah' | 'mudawamah' | 'zettelkasten' | 'compilation';
  setActiveFeature: (feature: 'beranda' | 'maktabah' | 'mudawamah' | 'zettelkasten' | 'compilation') => void;
  onOpenLensa: () => void;
  isVisible: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
  activeFeature, 
  setActiveFeature, 
  onOpenLensa,
  isVisible
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#050505]/80 backdrop-blur-3xl border-t border-white/5 pb-safe"
        >
          <div className="flex items-center justify-around px-4 py-4 relative max-w-md mx-auto">
            {/* Beranda */}
            <button 
              onClick={() => setActiveFeature('beranda')} 
              className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeFeature === 'beranda' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Home size={22} strokeWidth={activeFeature === 'beranda' ? 2 : 1.5} />
              <span className="text-[10px] font-medium tracking-wide">Beranda</span>
            </button>
            
            {/* Maktabah */}
            <button 
              onClick={() => setActiveFeature('maktabah')} 
              className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeFeature === 'maktabah' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <BookOpen size={22} strokeWidth={activeFeature === 'maktabah' ? 2 : 1.5} />
              <span className="text-[10px] font-medium tracking-wide">Maktabah</span>
            </button>
            
            {/* Center Lensa Taqyid Button */}
            <div className="relative -top-6 flex items-center justify-center">
               <button 
                 onClick={onOpenLensa} 
                 className="w-14 h-14 bg-zinc-100 text-black rounded-full flex items-center justify-center shadow-[0_4px_30px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95 transition-all"
               >
                 <Camera size={26} strokeWidth={1.5} />
               </button>
            </div>

            {/* Zettelkasten */}
            <button 
              onClick={() => setActiveFeature('zettelkasten')} 
              className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${activeFeature === 'zettelkasten' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Share2 size={22} strokeWidth={activeFeature === 'zettelkasten' ? 2 : 1.5} />
              <span className="text-[10px] font-medium tracking-wide">Zettelkasten</span>
            </button>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};
