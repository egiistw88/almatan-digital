import fs from 'fs';

const oldContent = fs.readFileSync('src/App.tsx', 'utf8');

const prefix = oldContent.split('<h3 className="text-sm font-medium text-zinc-300 mb-2">Eksplorasi Kitab</h3>')[0];

const reconstructedEnd = `<h3 className="text-sm font-medium text-zinc-300 mb-2">Eksplorasi Kitab</h3>
                <p className="text-xs max-w-[240px] leading-relaxed">Pilih salah satu bait pada teks utama untuk mempelajari syarah, i'rab, dan terjemahannya.</p>
              </motion.div>
            ) : activeTab === 'word' ? (
              <motion.div 
                key="word"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {!selectedWord ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                    <p className="text-sm">Pilih kata pada bait untuk melihat i'rab.</p>
                  </div>
                ) : (
                  <div className="bg-[#111113] p-6 rounded-2xl border border-white/5 shadow-xl">
                    <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                      <h4 className="text-3xl font-arabic text-zinc-100">{selectedWord.word_arabic}</h4>
                      <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-zinc-400 capitalize">{selectedWord.word_type}</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Akar Kata</p>
                        <p className="text-base text-zinc-300 font-arabic">{selectedWord.root_word}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Morfologi</p>
                        <p className="text-sm text-zinc-300">{selectedWord.morphological_pattern}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Terjemahan</p>
                        <p className="text-sm text-zinc-300">{selectedWord.translation}</p>
                      </div>
                      
                      <button 
                        onClick={() => { setInitialSearchQuery(selectedWord.root_word); setShowSearch(true); }}
                        className="mt-4 w-full py-4 bg-zinc-100 hover:bg-white text-zinc-900 rounded-2xl text-sm font-semibold shadow-xl hover:shadow-2xl transition-all focus:ring-2 focus:ring-white/50 outline-none flex justify-center items-center gap-2 group"
                      >
                        <Search size={18} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" /> 
                        Pencarian Lanjutan Akar Kata
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="mt-8 border-t border-white/5 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold text-zinc-300">Daftar Kata (Bait Ini)</h4>
                    {(!mufradat || mufradat.length === 0) && (
                      <button 
                        onClick={() => generateMorphologyMutation.mutate()}
                        disabled={generateMorphologyMutation.isPending}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Sparkles size={14} className={generateMorphologyMutation.isPending ? "animate-spin" : ""} />
                        {generateMorphologyMutation.isPending ? "Menganalisis..." : "Ekstrak I'rab (AI)"}
                      </button>
                    )}
                  </div>
                  
                  {isLoadingMufradat ? (
                    <div className="flex justify-center py-8 text-zinc-500"><Loader2 className="w-5 h-5 animate-spin" /></div>
                  ) : mufradat && mufradat.length > 0 ? (
                    <div className="flex flex-wrap gap-2" dir="rtl">
                      {mufradat.map(word => (
                        <button
                          key={word.id}
                          onClick={() => setSelectedWord(word)}
                          className={\`px-3 py-1.5 rounded-lg font-arabic text-lg transition-colors \${selectedWord?.id === word.id ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200 border border-transparent'}\`}
                        >
                          {word.word_arabic}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ) : activeTab === 'syarah' ? (
              <motion.div 
                key="syarah"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {!syarah || syarah.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                    <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm text-center mb-6">Belum ada syarah untuk bait ini.</p>
                    <button 
                      onClick={() => generateSyarahMutation.mutate()}
                      disabled={generateSyarahMutation.isPending || !activeVerse}
                      className="flex items-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      <Sparkles size={16} className={generateSyarahMutation.isPending ? "animate-spin" : ""} />
                      {generateSyarahMutation.isPending ? "Menyusun Syarah..." : "Buat Syarah (AI)"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {syarah.map(s => (
                      <div key={s.id} className="prose prose-invert prose-zinc max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: s.content }} className="text-sm leading-loose text-zinc-300 font-serif" />
                        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                          <p className="text-xs text-zinc-500 font-mono">Diperbarui: {new Date(s.updated_at).toLocaleDateString()}</p>
                          <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-zinc-500 uppercase tracking-wider">{s.source}</span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-8 border-t border-white/5 flex justify-center">
                       <button 
                        onClick={() => generateSyarahMutation.mutate()}
                        disabled={generateSyarahMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Sparkles size={14} className={generateSyarahMutation.isPending ? "animate-spin" : ""} />
                        {generateSyarahMutation.isPending ? "Memperbarui..." : "Perbarui Syarah"}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="notes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>}>
                  {activeVerseId && <VaultNotes verseId={activeVerseId} />}
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </motion.aside>
        )}
      </AnimatePresence>
      )}

      {/* Overlays and Modals */}
      <AnimatePresence>
        {showSearch && (
          <Suspense fallback={null}>
            <MorphologicalSearch onClose={() => setShowSearch(false)} initialQuery={initialSearchQuery} />
          </Suspense>
        )}
        {showUploadModal && (
          <Suspense fallback={null}>
            <UploadKitab 
              onClose={() => setShowUploadModal(false)}
              onSuccess={(newMatanId) => {
                setShowUploadModal(false);
                setSelectedMatanId(newMatanId);
                setActiveVerseId(null);
                setActiveTab('syarah');
              }}
              onStartOcrTask={(taskId, isSimulated) => {
                setActiveOcrTask({id: taskId, isSimulated});
                setShowUploadModal(false);
              }}
            />
          </Suspense>
        )}
        {showLensaTaqyidDirectly && (
          <Suspense fallback={null}>
            <LensaTaqyid
              onClose={() => setShowLensaTaqyidDirectly(false)}
              onUploadQueueStarted={(taskId, isSimulated) => {
                setActiveOcrTask({ id: taskId, isSimulated });
                setShowLensaTaqyidDirectly(false);
              }}
            />
          </Suspense>
        )}
      </AnimatePresence>
      <SyntopicalDrawer 
        isOpen={isSyntopicalDrawerOpen} 
        onClose={() => setIsSyntopicalDrawerOpen(false)} 
        selectedText={drawerSelectedText}
        contextTags={activeMatan ? [activeMatan.title.replace(/\\s+/g, '')] : []}
      />
      <Toaster theme="dark" position="top-right" closeButton richColors />
      <BottomNav activeFeature={activeFeature} setActiveFeature={setActiveFeature} onOpenLensa={() => setShowUploadModal(true)} isVisible={isNavVisible} />
    </div>
  );
}`;

fs.writeFileSync('src/App.tsx', prefix + reconstructedEnd);
