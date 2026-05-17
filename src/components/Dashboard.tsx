import React, { useState, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'motion/react';
import { Camera, Menu } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  activeMatanTitle?: string;
  activeMatanAuthor?: string;
  onOpenCamera: () => void;
  onOpenSidebar: () => void;
  onOpenDrawer: () => void;
}

interface Session {
  id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export function Dashboard({ activeMatanTitle = "Nuruz Zholam", activeMatanAuthor = "Syekh Nawawi al-Bantani", onOpenCamera, onOpenSidebar, onOpenDrawer }: DashboardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const controls = useAnimation();
  const x = useMotionValue(0);

  const todayStr = new Date().toISOString().split('T')[0];
  
  const { data: sessions } = useQuery({
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
          if (e.code === '42P01') {
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

  const isCompleted = sessions?.some(s => s.date === todayStr && s.completed) || false;
  
  // Transform background to indicate completion as we drag
  const backgroundColor = useTransform(x, [0, 150], ['#121212', '#1a1a1a']);
  const borderColor = useTransform(x, [0, 150], ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.2)']);
  const swipeTextOpacity = useTransform(x, [0, 50], [1, 0]);

  const handleDragEnd = async (e: any, info: any) => {
    if (info.offset.x > 100) {
      if (!isCompleted) {
        toggleMutation.mutate(todayStr);
      }
      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate([30, 50, 30]); // Haptic feedback
      }
      await controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  // Generate heatmap data matching mudawamah tracker (35 days)
  const generateHeatmap = () => {
    const days = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const isActive = sessions?.some(s => s.date === dStr && s.completed);
      days.push({ id: dStr, active: !!isActive });
    }
    return days;
  };

  const heatmapData = generateHeatmap();

  return (
    <div className="flex-1 flex flex-col bg-black overflow-y-auto scrollbar-none relative pt-8 sm:pt-12">
      <main className="flex-1 px-6 sm:px-12 pb-32 max-w-2xl w-full mx-auto flex flex-col gap-12">
        {/* 1. Sektor Sapaan */}
        <div>
           <h1 className="text-2xl sm:text-3xl tracking-tight text-white font-medium mb-1">
             {getGreeting()}
           </h1>
        </div>

        {/* 2. Pusat Fokus Utama: Kartu Literatur Aktif */}
        <section className="flex flex-col gap-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-600 pl-1">Target Harian</p>
          
          <div className="relative group rounded-3xl overflow-hidden">
            {/* Background completion indicator */}
            <div className={`absolute inset-0 bg-white/5 transition-opacity duration-500 ${isCompleted ? 'opacity-100' : 'opacity-0'}`}></div>
            
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              animate={controls}
              style={{ x, backgroundColor, borderColor, borderWidth: 1 }}
              onClick={onOpenDrawer}
              className="relative p-8 sm:p-10 rounded-3xl flex flex-col gap-6 cursor-pointer touch-pan-y"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-2">
                  <h2 className="font-serif text-3xl sm:text-4xl text-zinc-100 leading-tight">
                    {activeMatanTitle}
                  </h2>
                  <p className="font-sans text-sm text-zinc-400">
                    {activeMatanAuthor}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <motion.div style={{ opacity: swipeTextOpacity }} className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-widest font-medium">
                  {isCompleted ? (
                    <span className="text-zinc-300">Selesai (15 mnt)</span>
                  ) : (
                    <span>Geser kanan untuk tandai selesai</span>
                  )}
                </motion.div>
                {!isCompleted && (
                  <motion.div style={{ opacity: swipeTextOpacity }} className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse"></motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3. Sektor Konsistensi: Heat-map Mudawamah */}
        <section className="flex flex-col gap-6 mt-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-600 pl-1">Konsistensi Mudawamah</p>
          <div className="flex flex-wrap gap-1.5 opacity-80">
            {heatmapData.map((day) => (
              <div 
                key={day.id} 
                className={`w-3 h-3 sm:w-4 sm:h-4 rounded-[2px] ${day.active ? 'bg-zinc-400' : 'bg-white/5'}`} 
              />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
