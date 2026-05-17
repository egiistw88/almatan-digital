import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Loader2, Maximize2, Minimize2, ZoomIn, ZoomOut, Target, Download, X, List, Share2, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFontScale } from '../lib/FontScaleContext';

interface NoteNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  content: string;
  tags: string[];
  radius: number;
}

interface NoteLink extends d3.SimulationLinkDatum<NoteNode> {
  source: string | NoteNode;
  target: string | NoteNode;
  type: 'tag' | 'bidirectional';
}

export const ZettelkastenGraph = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { arabicScale } = useFontScale();
  const [selectedNode, setSelectedNode] = useState<NoteNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  
  // D3 instances reference
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const svgSelectionRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);

  const { data: notes, isLoading } = useQuery({
    queryKey: ['zettelkasten_notes', user?.id],
    queryFn: async () => {
      // noteService dynamically routes to Supabase or offline cache based on user connection gracefully
      return import('../services/noteService').then(m => m.noteService.getUserNotes(user?.id || 'local-guest'));
    }
  });

  useEffect(() => {
    if (!notes || notes.length === 0 || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Parse Nodes
    const nodes: NoteNode[] = notes.map((rawNote) => {
      const n = rawNote as any;
      return {
        ...n,
        id: n.id.toString(),
        // Attempt to extract tags from content if not explicitly present, or title if empty
        title: n.title || (n.content.match(/^\[(.*?)\]/)?.[1]) || 'Catatan',
        tags: n.tags || (n.content.match(/Tags:\s*(.*)/)?.[1]?.split(',').map((t: string) => t.trim()) || []),
        radius: Math.max(15, Math.min(40, 10 + n.content.length / 50)) // size based on content length
      };
    });

    // Parse Links based on double brackets [[link]] and shared tags
    const links: NoteLink[] = [];
    
    // Bidirectional syntax [[Title]] and #hashtag
    nodes.forEach(sourceNode => {
      // #hashtag extraction
      const hashRegex = /#([\w-]+)/g;
      let hashMatch;
      while ((hashMatch = hashRegex.exec(sourceNode.content)) !== null) {
        const tag = hashMatch[1].toLowerCase();
        if (!sourceNode.tags.some(t => t.toLowerCase() === tag)) {
           sourceNode.tags.push(tag);
        }
      }

      const regex = /\[\[(.*?)\]\]/g;
      let match;
      while ((match = regex.exec(sourceNode.content)) !== null) {
        const targetTitle = match[1];
        const targetNode = nodes.find(n => n.title.toLowerCase() === targetTitle.toLowerCase());
        if (targetNode && targetNode.id !== sourceNode.id) {
          links.push({ source: sourceNode.id, target: targetNode.id, type: 'bidirectional' });
        }
      }
      
      // Shared tags (simplified)
      nodes.forEach(targetNode => {
         if (sourceNode.id === targetNode.id) return;
         const sharedTags = sourceNode.tags.filter(t => targetNode.tags.includes(t));
         if (sharedTags.length > 0) {
            // Check if link exists
            const exists = links.find(l => (l.source === sourceNode.id && l.target === targetNode.id) || (l.target === sourceNode.id && l.source === targetNode.id));
            if (!exists) {
                links.push({ source: sourceNode.id, target: targetNode.id, type: 'tag' });
            }
         }
      });
    });

    const svg = d3.select(svgRef.current);
    svgSelectionRef.current = svg;
    svg.selectAll('*').remove(); // Clear previous

    const defs = svg.append('defs');
    
    // Gradient definitions for glowing lines
    const gradient = defs.append('linearGradient')
      .attr('id', 'link-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#f59e0b').attr('stop-opacity', '0.2');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#f59e0b').attr('stop-opacity', '0.8');

    // Arrow markers
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 28) // Offset to avoid covering node
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-3 L 7 ,0 L 0,3')
      .attr('fill', '#f59e0b')
      .style('stroke','none');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3.5').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const container = svg.append('g').style('will-change', 'transform');

    // Setup zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    zoomRef.current = zoom;

    // Center initially
    const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8);
    svg.call(zoom.transform, initialTransform);

    // Simulation optimized for mobile (settles faster)
    const simulation = d3.forceSimulation<NoteNode>(nodes)
      .alphaDecay(0.05) // faster settle
      .force('link', d3.forceLink<NoteNode, NoteLink>(links).id(d => d.id).distance(l => l.type === 'bidirectional' ? 120 : 250))
      .force('charge', d3.forceManyBody().strength(-500).distanceMax(500))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide().radius(d => (d as NoteNode).radius + 25));

    // Draw Links
    const link = container.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => d.type === 'bidirectional' ? '#f59e0b' : '#3f3f46')
      .attr('stroke-width', d => d.type === 'bidirectional' ? 1.5 : 1)
      .attr('stroke-dasharray', d => d.type === 'tag' ? '4,4' : 'none')
      .attr('marker-end', d => d.type === 'bidirectional' ? 'url(#arrowhead)' : '');

    // Draw Nodes
    const drag = d3.drag<SVGGElement, NoteNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    const node = container.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(drag as any)
      .on('click', (event, d) => {
         setSelectedNode(d);
         event.stopPropagation();
      });

    // Node circles
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', '#18181b')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2)
      .style('filter', 'url(#glow)');

    // Inner glowing ring
    node.append('circle')
      .attr('r', d => d.radius - 2)
      .attr('fill', 'transparent')
      .attr('stroke', '#4338ca')
      .attr('stroke-width', 1);

    // Node labels
    node.append('text')
      .text(d => d.title)
      .attr('fill', '#e4e4e7')
      .attr('font-size', '12px')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.radius + 15)
      .style('pointer-events', 'none')
      .style('text-shadow', '0 2px 4px rgba(0,0,0,0.8)');

    // Inner icon or content length indicator conceptually
    node.append('circle')
      .attr('r', 4)
      .attr('fill', '#f59e0b');

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as NoteNode).x!)
        .attr('y1', d => (d.source as NoteNode).y!)
        .attr('x2', d => (d.target as NoteNode).x!)
        .attr('y2', d => (d.target as NoteNode).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Background click deselect
    svg.on('click', () => setSelectedNode(null));

    return () => {
      simulation.stop();
    };
  }, [notes]);

  const handleExport = async () => {
    if (!notes || notes.length === 0) return;
    
    const zip = new JSZip();
    const folder = zip.folder("Al-Manhaj_Vault");

    notes.forEach((note: any, index: number) => {
      const parsedTitle = note.title || (note.content.match(/^\[(.*?)\]/)?.[1]) || `Note_${index + 1}`;
      const safeTitle = parsedTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      let parsedTags = note.tags || (note.content.match(/Tags:\s*(.*)/)?.[1]?.split(',').map((t: string) => t.trim()) || []);
      
      const fileContent = `---
id: ${note.id}
tags: [${parsedTags.join(', ')}]
created_at: ${note.created_at}
type: ${note.note_type}
---

# ${parsedTitle}

${note.content}
`;
      // Generate a short ID to ensure unique filenames without blowing up chars or throwing for missing functions.
      const shortId = (note.id || index.toString()).toString().substring(0, 6);
      folder?.file(`${safeTitle}_${shortId}.md`, fileContent);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, "Al-Manhaj_Vault.zip");
  };

  const handleZoomIn = () => {
    if (svgSelectionRef.current && zoomRef.current) {
      svgSelectionRef.current.transition().call(zoomRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgSelectionRef.current && zoomRef.current) {
      svgSelectionRef.current.transition().call(zoomRef.current.scaleBy, 0.7);
    }
  };

  const handleCenter = () => {
     if (svgSelectionRef.current && zoomRef.current && containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        svgSelectionRef.current.transition().duration(750).call(
          zoomRef.current.transform, 
          d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8)
        );
     }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-3">
         <Loader2 className="w-8 h-8 animate-spin text-zinc-100" />
         <span className="text-sm">Menyiapkan Zettelkasten Graph...</span>
      </div>
    );
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-[100] bg-black' : 'w-full h-full min-h-0 flex-1'} flex flex-col overflow-hidden`}>
       {/* Floating Top Header - Only Logo on mobile */}
       <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 sm:border-none sm:bg-transparent sm:backdrop-blur-none sm:p-0">
             <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
             <h2 className="text-sm sm:text-lg font-bold text-white tracking-widest uppercase mix-blend-normal sm:mix-blend-difference">Exobrain</h2>
          </div>
          <p className="text-xs text-zinc-400 max-w-sm hidden sm:block bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/5 pointer-events-auto">
            Zettelkasten Command Center. <br/>
            <span className="text-zinc-100/80">Bidirectional flow (Panah Oranye)</span> dan <span className="text-indigo-400/80">Semantic Tags (Garis Putus)</span>.
          </p>
       </div>

       {/* Top Right Controls - Desktop Only */}
       <div className="absolute top-4 right-4 sm:right-6 z-10 flex gap-2">
          <div className="bg-black/60 border border-white/10 rounded-full p-1 flex mr-0 sm:mr-2 backdrop-blur-xl shadow-lg">
            <button 
              onClick={() => setViewMode('graph')}
              className={`px-4 sm:px-3 py-2 sm:py-1.5 rounded-full text-xs font-medium flex items-center gap-2 sm:gap-1 transition-all ${viewMode === 'graph' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'text-zinc-400 hover:text-white'}`}
            >
               <Share2 size={14} /> <span className="hidden sm:inline">Graph</span>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-4 sm:px-3 py-2 sm:py-1.5 rounded-full text-xs font-medium flex items-center gap-2 sm:gap-1 transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'text-zinc-400 hover:text-white'}`}
            >
               <List size={14} /> <span className="hidden sm:inline">List</span>
            </button>
          </div>
          <button 
            onClick={handleExport}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-full shadow-lg border border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
          >
            <Download size={14} />
            Export to Markdown
          </button>
       </div>

       {viewMode === 'list' ? (
         <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-6 pt-24 pb-28 sm:pt-20 sm:pb-6 bg-[#0a0a0c] z-20 pointer-events-auto">
            <div className="max-w-3xl mx-auto space-y-4 pb-32 relative z-10">
               {notes.length === 0 ? (
                 <div className="flex flex-col items-center justify-center text-center p-12 bg-[#111113] border border-white/5 rounded-3xl mt-10 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 w-full h-full bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
                   <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20 shadow-inner relative z-10">
                     <List className="w-8 h-8 text-indigo-400" />
                   </div>
                   <h3 className="text-xl font-medium text-white mb-3 relative z-10">Daftar Catatan Kosong</h3>
                   <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mb-8 relative z-10">
                     Belum ada catatan di Zettelkasten Vault Anda. Kumpulkan pemahaman dan hubungkan antar konsep.
                   </p>
                   <button 
                     onClick={() => window.dispatchEvent(new Event('navigate_to_beranda'))}
                     className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors shadow-lg relative z-10"
                   >
                     Mulai Mengkaji Kitab
                   </button>
                 </div>
               ) : (
                 notes.map((note: any, i: number) => {
                   const parsedTitle = note.title || (note.content.match(/^\[(.*?)\]/)?.[1]) || 'Catatan';
                   const parsedTags = note.tags || (note.content.match(/Tags:\s*(.*)/)?.[1]?.split(',').map((t: string) => t.trim()) || []);
                   
                   return (
                     <div key={note.id || i} className="bg-[#111113] border border-white/5 rounded-2xl p-5 hover:border-indigo-500/30 transition-colors shadow-xl">
                        <div className="flex items-start justify-between">
                           <h3 className="text-lg font-medium text-white flex items-center gap-2">
                              <Bookmark size={18} className="text-indigo-400" />
                              {parsedTitle}
                           </h3>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                           {parsedTags.map((t: string, idx: number) => (
                              <span key={idx} className="text-[10px] px-2 py-0.5 rounded-sm bg-indigo-500/20 text-indigo-300 font-medium uppercase tracking-widest">{t}</span>
                           ))}
                        </div>
                        <p className="mt-4 text-zinc-300 leading-relaxed font-serif whitespace-pre-wrap text-sm">{note.content}</p>
                     </div>
                   );
                 })
               )}
            </div>
         </div>
       ) : (
         <>
           {/* Zoom Controls & Tools - Moved down for mobile, right side. Avoiding bottom nav. */}
           <div className={`absolute ${selectedNode ? 'top-20 right-4 sm:top-auto sm:bottom-6 sm:right-6' : (isFullscreen ? 'bottom-6' : 'bottom-28') + ' right-4 sm:bottom-6 sm:right-6'} z-10 flex flex-col gap-2 transition-all duration-300 pointer-events-auto`}>
               <button onClick={handleCenter} className="w-10 h-10 sm:w-11 sm:h-11 bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl rounded-full flex items-center justify-center text-zinc-300 hover:text-white transition-colors" title="Pusatkan">
                  <Target size={18} />
               </button>
               <button onClick={handleZoomIn} className="w-10 h-10 sm:w-11 sm:h-11 bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl rounded-full flex items-center justify-center text-zinc-300 hover:text-white transition-colors" title="Perbesar">
                  <ZoomIn size={18} />
               </button>
               <button onClick={handleZoomOut} className="w-10 h-10 sm:w-11 sm:h-11 bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl rounded-full flex items-center justify-center text-zinc-300 hover:text-white transition-colors" title="Perkecil">
                  <ZoomOut size={18} />
               </button>
               <button onClick={() => setIsFullscreen(!isFullscreen)} className="w-10 h-10 sm:w-11 sm:h-11 bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl rounded-full flex items-center justify-center text-zinc-300 hover:text-white transition-colors mt-2" title="Layar Penuh">
                  {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
               </button>
           </div>

           <div className="flex-1 w-full h-full relative pointer-events-auto" ref={containerRef}>
             {notes.length === 0 && (
                <div className="absolute inset-0 bg-black z-10 overflow-y-auto custom-scrollbar">
                  <div className="min-h-full flex items-center justify-center p-6 pb-40 sm:pb-6">
                    <div className="max-w-[calc(100vw-3rem)] sm:max-w-md w-full p-6 sm:p-8 bg-[#111113] border border-white/5 rounded-[2rem] shadow-2xl flex flex-col items-center text-center relative z-10 overflow-hidden">
                     <div className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-indigo-500/5 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none"></div>
                     <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20 shadow-inner relative z-10">
                       <Share2 className="w-8 h-8 text-indigo-400" />
                     </div>
                     <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 relative z-10 tracking-tight">Neural Graph Kosong</h3>
                     <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 relative z-10">
                       Mulai membaca kitab dan tambahkan catatan ke Vault Anda untuk melihat bagaimana konsep-konsep saling terhubung.
                     </p>
                     <button 
                       onClick={() => window.dispatchEvent(new Event('navigate_to_beranda'))}
                       className="px-6 py-3.5 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors shadow-lg w-full flex justify-center relative z-10 active:scale-95"
                     >
                       Mulai Mengkaji Kitab
                     </button>
                    </div>
                  </div>
                </div>
             )}
             <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing outline-none touch-none select-none relative z-0" style={{ WebkitUserSelect: 'none' }} />
           </div>

           {/* Node Details Panel - Bottom Sheet on Mobile, Floating Panel on Desktop */}
           <AnimatePresence>
             {selectedNode && (
               <>
                 {/* Mobile Backdrop */}
                 <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 sm:hidden pointer-events-auto"
                   onClick={() => setSelectedNode(null)}
                 />
                 <motion.div 
                   initial={{ opacity: 0, y: 150, scale: 0.95 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   exit={{ opacity: 0, y: 150, scale: 0.95, pointerEvents: 'none' }}
                   transition={{ type: "spring", damping: 25, stiffness: 200 }}
                   className="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-20 left-0 right-0 sm:left-auto sm:right-6 w-full sm:w-[360px] h-[65vh] sm:h-auto sm:max-h-[70vh] bg-[#111113] sm:bg-[#0a0a0c]/95 backdrop-blur-2xl sm:backdrop-blur-xl border-t sm:border border-white/10 rounded-t-[2rem] sm:rounded-2xl shadow-[0_-20px_60px_rgba(0,0,0,0.8)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col z-50 pointer-events-auto"
                 >
                   {/* Mobile drag handle indicator */}
                   <div className="w-full flex justify-center pt-3 pb-2 sm:hidden cursor-pointer" onClick={() => setSelectedNode(null)}>
                      <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
                   </div>

                   <div className="p-5 sm:p-4 border-b border-white/5 flex justify-between items-start relative bg-white/[0.01] shrink-0">
                     <div className="pr-8">
                        <h3 className="font-semibold text-white text-lg sm:text-base leading-tight flex items-center gap-2">
                          <Bookmark size={16} className="text-indigo-400 shrink-0" />
                          {selectedNode.title}
                        </h3>
                        {selectedNode.tags && selectedNode.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3 sm:mt-2">
                             {selectedNode.tags.map((t, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded-sm bg-indigo-500/20 text-indigo-300 font-semibold uppercase tracking-widest">{t}</span>
                             ))}
                          </div>
                        )}
                     </div>
                     <button 
                       onClick={() => setSelectedNode(null)} 
                       className="absolute top-5 sm:top-6 right-5 sm:right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                     >
                       <X size={16} />
                     </button>
                   </div>
                   <div className="flex-1 p-5 sm:p-4 overflow-y-auto custom-scrollbar bg-black/20 pb-safe sm:pb-4 pointer-events-auto">
                      <p className="text-zinc-300 leading-loose whitespace-pre-wrap font-arabic text-left mb-4 sm:mb-0" style={{ fontSize: `calc(1rem * ${arabicScale})` }} dir="auto">
                         {selectedNode.content}
                      </p>
                   </div>
                 </motion.div>
               </>
             )}
           </AnimatePresence>
         </>
       )}
    </div>
  );
};
