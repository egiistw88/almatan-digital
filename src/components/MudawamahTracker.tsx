import React, { useState } from 'react';
import { motion, useAnimation, PanInfo } from 'motion/react';
import { Check } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface Session {
  id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

// Generate last 35 days (5 weeks) for the heatmap
const generateDays = (): { date: string, completed: boolean }[] => {
  const days = [];
  const today = new Date();
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({ 
      date: d.toISOString().split('T')[0],
      completed: false
    });
  }
  return days;
};

export const MudawamahTracker = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const controls = useAnimation();
  const [swipeComplete, setSwipeComplete] = useState(false);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['mudawamah', user?.id],
    queryFn: async () => {
      if (!user) {
        const local = localStorage.getItem('mudawamah_local');
        return local ? JSON.parse(local) : [];
      }
      
      const { data, error } = await supabase
        .from('mudawamah_sessions')
        .select('*')
        .eq('user_id', user.id);
        
      // For local testing without supabase table, we will silence the error
      if (error && error.code === '42P01') return []; 
      return data as Session[] || [];
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async (dateStr: string) => {
      if (!user) {
        let local: Session[] = [];
        try { local = JSON.parse(localStorage.getItem('mudawamah_local') || '[]'); } catch (e) {}
        
        const existing = local.find(s => s.date === dateStr);
        if (existing) {
          if (existing.completed) {
              local = local.filter(s => s.id !== existing.id);
          } else {
              existing.completed = true;
          }
        } else {
          local.push({ id: Date.now().toString(), date: dateStr, completed: true });
        }
        localStorage.setItem('mudawamah_local', JSON.stringify(local));
        return;
      }

      const existing = sessions?.find(s => s.date === dateStr);
      
      try {
        if (existing) {
          if (existing.completed) {
              const { error } = await supabase.from('mudawamah_sessions').delete().eq('id', existing.id);
              if (error) throw error;
          } else {
              const { error } = await supabase.from('mudawamah_sessions').update({ completed: true }).eq('id', existing.id);
              if (error) throw error;
          }
        } else {
          const { error } = await supabase.from('mudawamah_sessions').insert({
            user_id: user.id,
            date: dateStr,
            completed: true
          });
          if (error) throw error;
        }
      } catch (e: any) {
          console.error("Supabase Mudawamah Error:", e);
          // Auto fallback to local storage if table doesn't exist
          if (e.code === '42P01') {
             console.warn("Tabel mudawamah belum ada, menyimpan ke local storage sementara.");
             let local: Session[] = [];
             try { local = JSON.parse(localStorage.getItem('mudawamah_local') || '[]'); } catch (error) {}
             local.push({ id: Date.now().toString(), date: dateStr, completed: true });
             localStorage.setItem('mudawamah_local', JSON.stringify(local));
          }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mudawamah', user?.id] });
    }
  });

  const heatmapDays = generateDays().map(day => {
    const s = sessions?.find(sess => sess.date === day.date && sess.completed);
    return { ...day, completed: !!s };
  });

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If swiped far enough to right
    if (info.offset.x > 150) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todaySession = sessions?.find(s => s.date === todayStr && s.completed);
      
      if (!todaySession) {
        if (navigator.vibrate) navigator.vibrate(50);
        toggleMutation.mutate(todayStr);
        setSwipeComplete(true);
        setTimeout(() => setSwipeComplete(false), 2000);
      }
      controls.start({ x: 0 });
    } else {
      controls.start({ x: 0 }); // snap back
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isTodayCompleted = sessions?.find(sess => sess.date === todayStr && sess.completed);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-black text-zinc-100 p-6 sm:p-12 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-100/[0.03] via-black to-black pointer-events-none" />
      
      <div className="z-10 w-full max-w-md space-y-16">
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-arabic tracking-tight text-zinc-100/90 font-bold">مُدَاوَمَة</h1>
          <p className="text-xs sm:text-sm text-zinc-500 uppercase tracking-[0.2em] font-medium">Micro-Session Tracker</p>
        </div>

        {/* Heatmap Grid */}
        <div className="w-full">
            <div className="grid grid-cols-7 gap-2 sm:gap-3 dir-rtl mx-auto w-max">
                {heatmapDays.map((day, idx) => (
                    <motion.div
                        key={day.date}
                        onClick={() => toggleMutation.mutate(day.date)}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ delay: idx * 0.01 }}
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-[4px] sm:rounded-md transition-colors duration-300 cursor-pointer ${
                            day.completed 
                            ? 'bg-zinc-100/40 shadow-[0_0_12px_rgba(255,255,255,0.1)] border border-zinc-100/50' 
                            : 'bg-white/5 border border-white/5'
                        } ${day.date === todayStr ? 'ring-1 ring-zinc-500/50 ring-offset-2 ring-offset-[#0a0a0c]' : ''}`}
                        title={day.date}
                    />
                ))}
            </div>
            <div className="flex justify-between items-center mt-6 text-[10px] text-zinc-600 uppercase tracking-widest font-mono">
                <span>35 Hari Terakhir</span>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-white/5"></span>
                    <span className="w-2 h-2 rounded-sm bg-zinc-100/40"></span>
                    <span className="ml-1 tracking-widest">Intensitas</span>
                </div>
            </div>
        </div>

        {/* Swipe Interaction for Today */}
        <div className="bg-white/5 p-2 rounded-2xl border border-white/10 relative overflow-hidden h-[76px] flex items-center justify-center">
            {isTodayCompleted || swipeComplete ? (
               <motion.div 
                 onClick={() => toggleMutation.mutate(todayStr)}
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 className="flex items-center gap-3 text-zinc-100 font-medium tracking-wide text-sm z-10 cursor-pointer"
               >
                 <span className="w-8 h-8 rounded-full bg-zinc-100/10 flex items-center justify-center">
                   <Check size={16} />
                 </span>
                 Sesi hari ini selesai (Klik batal)
               </motion.div>
            ) : (
                <>
                <div className="absolute inset-x-0 hidden sm:flex items-center justify-center text-xs tracking-widest text-zinc-600 uppercase pointer-events-none select-none">
                    Geser untuk simpan progres
                </div>
                <div className="absolute left-2 inset-y-2 flex items-center z-20">
                    <motion.div
                        drag="x"
                        dragConstraints={{ left: 0, right: 280 }}
                        dragElastic={0.1}
                        onDragEnd={handleDragEnd}
                        animate={controls}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-14 h-full bg-zinc-100 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-zinc-300 border border-zinc-400/20"
                    >
                        <div className="flex flex-col gap-1 opacity-60">
                            <span className="w-1 h-3 bg-black rounded-full" />
                            <span className="w-1 h-3 bg-black rounded-full" />
                        </div>
                    </motion.div>
                </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
}
