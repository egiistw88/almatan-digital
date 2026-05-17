import fs from 'fs';

const oldContent = fs.readFileSync('src/App.tsx', 'utf8');

const prefix = oldContent.split('<div className="relative w-full lg:hidden">')[0];
let suffix = oldContent.split('<div className="w-12 h-1.5 bg-white/20 rounded-full mb-1"></div>')[1];
suffix = suffix.split('</motion.div>')[1];

const replacement = `    <div className="flex h-[100dvh] w-full bg-black text-zinc-100 overflow-hidden font-sans selection:bg-white/20 selection:text-white">
      {/* Tour Overlay with elevated z-index */}
      {isTourActive && <TourOverlay />}
      
      <MainSidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        activeFeature={activeFeature}
        setActiveFeature={setActiveFeature}
        matanList={matanList}
        isLoadingMatan={isLoadingMatan}
        matanId={matanId}
        setSelectedMatanId={setSelectedMatanId}
        setActiveVerseId={setActiveVerseId}
        setShowUploadModal={setShowUploadModal}
        user={user}
        signOut={signOut}
        startTour={startTour}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-black">
        {activeFeature !== 'beranda' && (
        <header className="h-[72px] border-b border-white/5 bg-[black]/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-8 shrink-0 z-20 sticky top-0">
           <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-zinc-400 hover:text-zinc-100 transition-colors">
               <Menu size={24} />
             </button>
             <div className="hidden sm:block">
               {activeFeature === 'beranda' && <h2 className="text-lg font-semibold text-zinc-100">Beranda</h2>}
               {activeFeature === 'mudawamah' && <h2 className="text-lg font-semibold text-zinc-100">Mudawamah</h2>}
               {(activeFeature === 'zettelkasten' || activeFeature === 'compilation') && <h2 className="text-lg font-semibold text-zinc-100">Knowledge Base</h2>}
               {activeFeature === 'maktabah' && activeMatan && (
                 <>
                   <h2 className="text-lg font-semibold text-zinc-100">{activeMatan.title}</h2>
                   <p className="text-xs text-zinc-500">{activeMatan.author}</p>
                 </>
               )}
             </div>
           </div>

           <div className="flex items-center gap-4">
             <button 
               onClick={() => { setInitialSearchQuery(''); setShowSearch(true); }}
               className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-sm font-medium text-zinc-300 transition-colors"
             >
               <Search size={16} className="text-zinc-500" />
               <span className="hidden sm:inline">Pencarian Lanjutan</span>
             </button>
           </div>
        </header>
        )}

        {/* Main Area based on feature */}
        {activeFeature === 'beranda' ? (
          <Suspense fallback={<div className="flex-1 flex items-center justify-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <Dashboard 
              activeMatanTitle={activeMatan?.title || "Mulai Kitab Baru"} 
              activeMatanAuthor={activeMatan?.author || "Tidak ada kitab tersedia"} 
              onOpenCamera={() => setShowUploadModal(true)}
              onOpenSidebar={() => setIsSidebarOpen(true)}
              onOpenDrawer={() => setIsSyntopicalDrawerOpen(true)}
            />
          </Suspense>
        ) : activeFeature === 'mudawamah' ? (
          <Suspense fallback={<div className="flex-1 flex items-center justify-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
             <MudawamahTracker />
          </Suspense>
        ) : activeFeature === 'zettelkasten' || activeFeature === 'compilation' ? (
           <div className="flex-1 flex flex-col w-full h-full relative">
             <div className="w-full flex justify-center py-4 bg-black border-b border-white/5 shrink-0">
                <div className="flex items-center p-1 bg-[#1a1a1c] border border-white/10 rounded-full shadow-inner">
                  <button 
                    onClick={() => setActiveFeature('zettelkasten')} 
                    className={\`px-6 py-1.5 rounded-full text-xs font-semibold transition-all \${activeFeature === 'zettelkasten' ? 'bg-zinc-100 text-black shadow-sm' : 'text-zinc-500 hover:text-white'}\`}
                  >
                    Neural Graph
                  </button>
                  <button 
                    onClick={() => setActiveFeature('compilation')} 
                    className={\`px-6 py-1.5 rounded-full text-xs font-semibold transition-all \${activeFeature === 'compilation' ? 'bg-zinc-100 text-black shadow-sm' : 'text-zinc-500 hover:text-white'}\`}
                  >
                    Papan Draf
                  </button>
                </div>
             </div>
             <div className="flex-1 overflow-hidden relative">
               <Suspense fallback={<div className="flex-1 flex items-center justify-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                 {activeFeature === 'zettelkasten' ? <ZettelkastenGraph /> : <CompilationBoard />}
               </Suspense>
             </div>
           </div>
        ) : (
          <main onScroll={handleScroll} className={\`flex-1 overflow-y-auto scroll-smooth bg-black scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent transition-all lg:pb-0 \${activeVerseId ? 'pb-[65vh]' : ''}\`}>
             <div className="max-w-4xl mx-auto px-4 pt-12 pb-32 sm:px-8 sm:py-24">
             
             {isLoadingVerses ? (
               <div className="space-y-16 animate-pulse opacity-50">
                 {[1, 2, 3].map(i => (
                   <div key={i} className="flex gap-4">
                     <div className="w-8 h-8 bg-zinc-800 rounded-full shrink-0"></div>
                     <div className="space-y-4 flex-1">
                       <div className="w-3/4 h-6 bg-zinc-800 rounded-lg"></div>
                       <div className="w-1/2 h-6 bg-zinc-800 rounded-lg"></div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : error ? (
               <div className="flex flex-col items-center justify-center py-20 text-red-400 gap-4">
                 <AlertCircle className="w-12 h-12" />
                 <p>{error.message || "Gagal memuat bait."}</p>
                 <button onClick={() => window.location.reload()} className="px-6 py-2 mt-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-full text-zinc-300">Coba Lagi</button>
               </div>
             ) : verses?.map((verse, index) => {
                const isActive = activeVerseId === verse.id;
                
                return (
                  <div 
                    key={verse.id} 
                    id={\`verse-\${verse.id}\`}
                    ref={el => verseRefs.current[verse.id] = el}
                    onClick={() => handleVerseClick(verse.id)}
                    className={\`block relative py-12 px-6 sm:px-10 rounded-3xl transition-all duration-500 cursor-pointer mb-8 group \${isActive ? 'bg-[#0a0a0c] border border-white/10 shadow-2xl scale-[1.02] ring-1 ring-white/5' : 'hover:bg-white/[0.02] border border-transparent'}\`}
                  >
                    <div className="absolute -left-3 top-14 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs text-zinc-500 font-mono shadow-inner group-hover:text-zinc-300 transition-colors">
                      {index + 1}
                    </div>
                    {isActive && (
                      <motion.div layoutId="active-indicator" className="absolute -left-px top-10 bottom-10 w-1 bg-gradient-to-b from-transparent via-zinc-400 to-transparent opacity-50 rounded-r-4xl" />
                    )}
                    
                    <p className={\`text-right leading-[3.5] font-arabic mb-8 transition-all duration-300 antialiased \${isActive ? 'text-3xl sm:text-4xl text-zinc-100 text-shadow-sm' : 'text-2xl sm:text-3xl text-zinc-400 drop-shadow-sm'}\`} dir="rtl" dangerouslySetInnerHTML={{ __html: verse.text_arabic.replace(/([^\\s]+)/g, '<span class="hover:bg-white/10 px-1 py-0.5 rounded transition-colors inline-block">$1</span>') }} />
                    <p className={\`text-base sm:text-lg leading-relaxed font-serif transition-colors duration-300 \${isActive ? 'text-zinc-300' : 'text-zinc-500'}\`}>
                      {verse.translation}
                    </p>
                  </div>
                );
              })}
              
              {/* End Marker */}
              <div className="py-24 flex justify-center items-center gap-4 opacity-50">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-100/50"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-100/30"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-100/10"></div>
              </div>
            </div>
         </main>)}
      </div>

      {/* Context Panel (Bottom on Mobile, Right on Desktop) */}
      {activeFeature === 'maktabah' && (
      <AnimatePresence>
        {activeVerseId && (
        <motion.aside 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          style={{ height: typeof window !== 'undefined' && window.innerWidth >= 1024 ? '100%' : \`\${panelHeight}vh\` }}
          className="fixed inset-x-0 bottom-0 z-50 bg-[#0a0a0c]/95 backdrop-blur-2xl border-t border-white/10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] rounded-t-3xl overflow-hidden lg:!static lg:!transform-none lg:!translate-y-0 lg:!w-[420px] xl:!w-[480px] lg:!h-auto lg:!rounded-none lg:!border-t-0 lg:!border-l lg:!bg-[#050505] lg:!shadow-none lg:!opacity-100"
        >
        <div className="relative w-full lg:hidden shrink-0">
            <motion.div 
              className="w-full flex justify-center py-4 cursor-ns-resize touch-none"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0}
              onDrag={(e, info) => {
                const viewportHeight = window.innerHeight;
                const yMovement = info.delta.y; 
                const deltaVh = (yMovement / viewportHeight) * 100;
                setPanelHeight(prev => Math.max(30, Math.min(prev - deltaVh, 90)));
              }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100) setActiveVerseId(null);
              }}
            >
                <div className="w-14 h-1.5 bg-white/20 hover:bg-white/40 transition-colors rounded-full mb-1"></div>
            </motion.div>
        </div>`;

const finalContent = prefix + replacement + suffix;
fs.writeFileSync('src/App.tsx', finalContent);
