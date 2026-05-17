import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, LogOut, User as UserIcon, BookOpen, PenLine, Flame, Cloud, Award, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { matanService } from '../services/matanService';

// Helper to check if Supabase is connected
const isSupabaseConfigured = () => {
    return import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== '';
  };

interface UserProfileModalProps {
  onClose: () => void;
}

export function UserProfileModal({ onClose }: UserProfileModalProps) {
  const { user, signInWithGoogle, mockSignIn, signOut } = useAuth();
  const queryClient = useQueryClient();
  
  // Real or mock data fetching for basic stats
  const { data: stats } = useQuery({
    queryKey: ['user_stats', user?.id],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return { notes: 12, streak: 5, level: 'Thalib' };
      }
      
      const [notesRes, streakRes] = await Promise.all([
        supabase.from('user_notes').select('id', { count: 'exact', head: true }).eq('user_id', user?.id || 'local-guest'),
        supabase.from('mudawamah_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user?.id || 'local-guest').eq('completed', true)
      ]);
      
      const streak = streakRes.count || 0;
      
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

  const handleResetData = () => {
    toast('PERINGATAN: Menghapus Seluruh Data', {
      description: 'Apakah Anda yakin ingin mengatur ulang SEMUA data Anda' + (user ? ' (termasuk data Cloud)' : ' secara lokal') + '? Tindakan ini tidak dapat dibatalkan.',
      icon: <AlertTriangle className="text-red-500" />,
      action: {
        label: 'Ya, Hapus Semua',
        onClick: async () => {
          localStorage.clear();
          
          try {
            await matanService.resetData();
          } catch (e) {
            console.error('Gagal reset kitab:', e);
          }

          if (user && isSupabaseConfigured()) {
            try {
              toast.loading('Menghapus data cloud...', { id: 'delete-cloud' });
              await Promise.all([
                supabase.from('user_notes').delete().eq('user_id', user.id),
                supabase.from('mudawamah_sessions').delete().eq('user_id', user.id)
              ]);
              toast.dismiss('delete-cloud');
            } catch (error) {
              console.error('Gagal menghapus data cloud:', error);
            }
          }

          toast.success('Seluruh data berhasil di-reset. Aplikasi akan dimuat ulang...', {
              duration: 2000,
              onAutoClose: () => {
                  window.location.reload();
              }
          });
          // Jaga-jaga jika onAutoClose tidak terpicu
          setTimeout(() => {
              window.location.reload();
          }, 2000);
        }
      },
      cancel: {
        label: 'Batal',
        onClick: () => {}
      },
      duration: 10000,
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      {/* Modal Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-sm bg-[#0f0f13] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col"
      >
        <div className="flex justify-between items-center p-4 border-b border-white/5 bg-[#0a0a0c]">
           <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
             <UserIcon className="w-4 h-4 text-indigo-400" />
             {user ? 'Profil Pengguna' : 'Profil Tamu'}
           </h2>
           <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-white/5 transition-colors">
              <X size={18} />
           </button>
        </div>

        <div className="p-5 flex flex-col gap-5 overflow-y-auto max-h-[80vh] custom-scrollbar">
           {/* Profile Header */}
           <div className="flex items-center text-left gap-4">
             <div className="w-16 h-16 shrink-0 rounded-full border border-indigo-500/30 overflow-hidden bg-indigo-500/5 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                {user ? (
                   <img src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'user'}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                   <UserIcon className="w-8 h-8 text-zinc-500" />
                )}
             </div>
             
             <div className="flex flex-col">
                 <h3 className="text-lg font-bold text-white leading-tight">
                    {user ? (user.user_metadata?.name || user.email?.split('@')[0]) : 'Tamu (Guest)'}
                 </h3>
                 <p className="text-xs text-zinc-400 mt-0.5">
                    {user ? user.email : 'Belum Terautentikasi'}
                 </p>
                 {user && (
                     <div className="mt-2">
                       <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] font-medium text-zinc-300 uppercase tracking-widest">
                           <Award size={10} className="text-indigo-400" /> {stats?.level || 'Thalib'}
                       </span>
                     </div>
                 )}
             </div>
           </div>

           {/* Stats Section */}
           <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#151518] border border-white/5 rounded-xl p-3 flex flex-col items-center text-center">
                 <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mb-2 text-indigo-400">
                   <PenLine size={16} />
                 </div>
                 <div className="text-xl font-bold text-white mb-0.5">{stats?.notes || 0}</div>
                 <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-1"><Cloud size={10} /> Zettel</div>
              </div>
              <div className="bg-[#151518] border border-white/5 rounded-xl p-3 flex flex-col items-center text-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                     <Flame className="w-12 h-12" />
                 </div>
                 <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center mb-2 text-orange-400 relative z-10">
                   <Flame size={16} />
                 </div>
                 <div className="text-xl font-bold text-white mb-0.5 relative z-10">{stats?.streak || 0}</div>
                 <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold relative z-10">Mudawamah</div>
              </div>
           </div>

           {/* Call to actions & Options */}
           <div className="flex flex-col gap-2 mt-2">
               {!user ? (
                 <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-2">
                    <h4 className="text-xs font-semibold text-indigo-300 mb-1.5">Amankan Data Anda secara Cloud</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                      Catatan dan rekam jejak Anda hanya tersimpan lokal. Masuk untuk menyinkronkan data.
                    </p>
                    <button 
                       onClick={() => isSupabaseConfigured() ? signInWithGoogle() : mockSignIn()}
                       className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
                    >
                       <LogIn size={16} />
                       Masuk dengan Google
                    </button>
                 </div>
               ) : (
                 <button 
                    onClick={() => {
                       if(window.confirm('Apakah Anda yakin ingin keluar?')) {
                          signOut();
                          onClose();
                       }
                    }}
                    className="w-full py-2.5 bg-zinc-800/50 hover:bg-zinc-800 border border-white/10 text-zinc-300 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
                 >
                    <LogOut size={16} />
                    Keluaran Akun
                 </button>
               )}
               
               <button 
                  onClick={handleResetData}
                  className="w-full py-2.5 mt-1 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 group"
               >
                  <RotateCcw size={16} className="group-hover:-rotate-90 transition-transform duration-300" />
                  Reset Seluruh Data Aplikasi
               </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
