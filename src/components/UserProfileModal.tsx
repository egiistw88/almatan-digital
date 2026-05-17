import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, LogOut, User as UserIcon, BookOpen, PenLine, Flame, Cloud, Award } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Helper to check if Supabase is connected
const isSupabaseConfigured = () => {
    return import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== '';
  };

interface UserProfileModalProps {
  onClose: () => void;
}

export function UserProfileModal({ onClose }: UserProfileModalProps) {
  const { user, signInWithGoogle, mockSignIn, signOut } = useAuth();
  
  // Real or mock data fetching for basic stats
  const { data: stats } = useQuery({
    queryKey: ['user_stats', user?.id],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return { notes: 12, streak: 5, level: 'Thalib' };
      }
      
      const [notesRes, streakRes] = await Promise.all([
        supabase.from('vault_notes').select('id', { count: 'exact', head: true }).eq('user_id', user?.id || 'local-guest'),
        supabase.from('mudawamah_status').select('current_streak').eq('user_id', user?.id || 'local-guest').maybeSingle()
      ]);
      
      const streak = streakRes.data?.current_streak || 0;
      
      let level = 'Mubtadi (Pemula)';
      if (streak > 7) level = 'Mutawassith (Menengah)';
      if (streak > 30) level = 'Mutaqaddim (Mahir)';

      return {
        notes: notesRes.count || 0,
        streak: streak,
        level
      };
    }
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
      />
      
      {/* Modal Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-[#0a0a0c] border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-10"
      >
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-white/5">
           <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
             <UserIcon className="w-5 h-5 text-indigo-400" />
             {user ? 'Profil Pengguna' : 'Profil Tamu'}
           </h2>
           <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
              <X size={20} />
           </button>
        </div>

        <div className="p-6">
           {/* Profile Header */}
           <div className="flex flex-col items-center justify-center text-center mb-8">
             <div className="w-20 h-20 rounded-full border-2 border-indigo-500/30 overflow-hidden mb-4 bg-indigo-500/5 flex items-center justify-center relative shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                {user ? (
                   <img src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'user'}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                   <UserIcon className="w-10 h-10 text-zinc-500" />
                )}
             </div>
             <h3 className="text-xl font-bold text-white mb-1">
                {user ? (user.user_metadata?.name || user.email?.split('@')[0]) : 'Tamu (Guest)'}
             </h3>
             <p className="text-sm text-zinc-400">
                {user ? user.email : 'Belum Terautentikasi'}
             </p>
             
             {user && (
                 <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-zinc-300 uppercase tracking-widest">
                     <Award size={14} className="text-indigo-400" /> {stats?.level || 'Thalib'}
                 </span>
             )}
           </div>

           {/* Stats Section */}
           <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center">
                 <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 text-indigo-400">
                   <PenLine size={20} />
                 </div>
                 <div className="text-2xl font-bold text-white mb-1">{stats?.notes || 0}</div>
                 <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-1"><Cloud size={10} className="opacity-70" /> Catatan Zettel</div>
              </div>
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                     <Flame className="w-16 h-16" />
                 </div>
                 <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-3 text-orange-400 relative z-10">
                   <Flame size={20} />
                 </div>
                 <div className="text-2xl font-bold text-white mb-1 relative z-10">{stats?.streak || 0}</div>
                 <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold relative z-10">Hari Mudawamah</div>
              </div>
           </div>

           {/* Call to actions */}
           {!user ? (
             <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-sm font-semibold text-indigo-300 mb-2">Amankan Data Anda secara Cloud</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    Saat ini Anda masuk sebagai Tamu. Catatan dan rekam jejak mudawamah Anda hanya tersimpan secara lokal. Masuk dengan Google untuk menyinkronkan data antar perangkat.
                  </p>
                  <button 
                     onClick={() => isSupabaseConfigured() ? signInWithGoogle() : mockSignIn()}
                     className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                     <LogIn size={18} />
                     Masuk dengan Google
                  </button>
                </div>
             </div>
           ) : (
             <button 
                onClick={() => {
                   if(window.confirm('Apakah Anda yakin ingin keluar?')) {
                      signOut();
                      onClose();
                   }
                }}
                className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 group"
             >
                <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                Keluaran Akun
             </button>
           )}
        </div>
      </motion.div>
    </div>
  );
}
