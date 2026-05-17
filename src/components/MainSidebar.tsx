import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LibraryBig, X, Sparkles, LogOut, HelpCircle, User as UserIcon } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface Matan {
  id: string;
  title: string;
  author: string;
}

interface MainSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  activeFeature: 'beranda' | 'maktabah' | 'mudawamah' | 'zettelkasten' | 'compilation';
  setActiveFeature: (feature: 'beranda' | 'maktabah' | 'mudawamah' | 'zettelkasten' | 'compilation') => void;
  matanList: Matan[] | undefined;
  isLoadingMatan: boolean;
  matanId: string;
  setSelectedMatanId: (id: string) => void;
  setActiveVerseId: (id: string | null) => void;
  setShowUploadModal: (show: boolean) => void;
  setShowProfileModal: (show: boolean) => void;
  user: User | null;
  signOut: () => void;
  startTour: () => void;
}

export function MainSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  activeFeature,
  setActiveFeature,
  matanList,
  isLoadingMatan,
  matanId,
  setSelectedMatanId,
  setActiveVerseId,
  setShowUploadModal,
  setShowProfileModal,
  user,
  signOut,
  startTour
}: MainSidebarProps) {
  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div 
        className={`fixed lg:static inset-y-0 left-0 w-[280px] bg-black border-r border-white/5 z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}
      >
        <div className="p-8 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-white">
              <LibraryBig size={24} strokeWidth={1.5} />
            </div>
            <h1 className="font-medium text-white tracking-wide text-lg">Al-Manhaj</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-zinc-600 hover:text-white transition-colors">
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2 flex flex-col gap-8 scrollbar-none">
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => { setActiveFeature('beranda'); setIsSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-colors ${activeFeature === 'beranda' ? 'bg-white/10 text-white font-medium' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
            >
              Beranda
            </button>
            <button
              onClick={() => { setActiveFeature('maktabah'); setIsSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-colors ${activeFeature === 'maktabah' ? 'bg-white/10 text-white font-medium' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
            >
              Maktabah
            </button>
            <button
              onClick={() => { setActiveFeature('mudawamah'); setIsSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-colors ${activeFeature === 'mudawamah' ? 'bg-white/10 text-white font-medium' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
            >
              Mudawamah
            </button>
            <button
              onClick={() => { setActiveFeature('zettelkasten'); setIsSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-colors ${activeFeature === 'zettelkasten' ? 'bg-white/10 text-white font-medium' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
            >
              Exobrain
            </button>
            <button
              onClick={() => { setActiveFeature('compilation'); setIsSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-colors ${activeFeature === 'compilation' ? 'bg-white/10 text-white font-medium' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
            >
              Meja Kompilasi
            </button>
          </nav>

          {activeFeature === 'maktabah' && (
            <div className="space-y-1 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="px-4 pb-3 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest leading-none">Koleksi Kitab</div>
              {isLoadingMatan ? (
                <div className="px-4 text-sm text-zinc-600">Memuat pustaka...</div>
              ) : matanList?.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMatanId(m.id);
                    setActiveVerseId(null);
                    setIsSidebarOpen(false);
                    setActiveFeature('maktabah');
                  }}
                 className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex flex-col ${m.id === matanId ? 'bg-white/5 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}`}
               >
                 <span className="font-medium text-[15px] truncate">{m.title}</span>
                 <span className="text-xs mt-1 truncate opacity-60">{m.author}</span>
               </button>
             ))}
          </div>
          )}

          <div className="mt-auto pb-4">
            <button
               onClick={() => {
                 setShowUploadModal(true);
                 setIsSidebarOpen(false);
               }}
               className="w-full py-4 text-zinc-400 hover:text-white rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-sm transition-all flex flex-col items-center justify-center gap-1.5"
            >
              <Sparkles className="w-5 h-5 mb-1 opacity-80" />
              <span className="font-medium">Ekstrak PDF Kitab</span>
              <span className="text-[10px] uppercase tracking-widest opacity-50">AI Pipeline</span>
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-white/5">
           {user ? (
             <div className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white/5 rounded-xl transition-colors group" onClick={() => setShowProfileModal(true)}>
               <img src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'user'}`} alt="Avatar" className="w-8 h-8 rounded-full ring-2 ring-white/10 group-hover:ring-indigo-500/50 transition-all" />
               <div className="flex-1 min-w-0">
                 <div className="text-sm font-medium text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">{user.user_metadata?.name || user.email?.split('@')[0]}</div>
                 <div className="text-[10px] text-zinc-500 truncate">Siswa Mutawassith</div>
               </div>
               <button onClick={(e) => { e.stopPropagation(); startTour(); }} title="Bantuan & Filosofi" className="text-zinc-500 hover:text-indigo-400 transition-colors p-1"><HelpCircle size={16} /></button>
             </div>
           ) : (
             <div className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white/5 rounded-xl transition-colors group" onClick={() => setShowProfileModal(true)}>
               <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                  <UserIcon className="w-4 h-4" />
               </div>
               <div className="flex-1 min-w-0">
                 <span className="text-sm font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors">Tamu (Guest)</span>
                 <div className="text-[10px] text-zinc-500 truncate">Ketuk untuk masuk</div>
               </div>
               <button onClick={(e) => { e.stopPropagation(); startTour(); }} title="Bantuan & Filosofi" className="text-zinc-500 hover:text-indigo-400 transition-colors p-1"><HelpCircle size={16} /></button>
             </div>
           )}
        </div>
      </div>
    </>
  );
}
