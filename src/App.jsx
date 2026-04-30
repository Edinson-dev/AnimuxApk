import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import Header from './components/layout/Header';
import Hero from './components/ui/Hero';
import Sidebar from './components/layout/Sidebar';
import CategoryBar from './components/layout/CategoryBar';
import BottomNav from './components/layout/BottomNav';
import ChannelCard from './components/ui/ChannelCard';
import Player from './components/core/Player';
import DetailsModal from './components/ui/DetailsModal';
import Skeleton from './components/ui/Skeleton';
import Toast, { toast } from './components/ui/Toast';
import NewsBanner from './components/ui/NewsBanner';

import { db } from './config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import AdminPanel from './components/core/AdminPanel';

const APP_VERSION = '2.8';

export default function App() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) { r && setInterval(() => { r.update(); }, 60 * 1000); },
  });

  const [channelData, setChannelData] = useState({ channels: [] });
  const [localMovies, setLocalMovies] = useState([]);
  const [cloudCategories, setCloudCategories] = useState([]);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('animux_favs') || '[]'));
  const [recentlyWatched, setRecentlyWatched] = useState(() => JSON.parse(localStorage.getItem('animux_recent') || '[]'));
  const [activeCategory, setActiveCategory] = useState('Inicio');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannel, setActiveChannel] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [brokenChannels, setBrokenChannels] = useState(() => JSON.parse(localStorage.getItem('animux_broken') || '[]'));
  const [showAdmin, setShowAdmin] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(48);
  const [lastSyncTime, setLastSyncTime] = useState(() => localStorage.getItem('animux_last_fetch'));
  const [showInstall, setShowInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    loadData();
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setShowInstall(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const loadData = async (force = false) => {
    try {
      const now = Date.now();
      const lastFetch = localStorage.getItem('animux_last_fetch') || 0;
      const CACHE_TIME = 15 * 60 * 1000;
      
      const cachedCats = localStorage.getItem('animux_cache_cats');
      const cachedChans = localStorage.getItem('animux_cache_chans');
      const cachedMovs = localStorage.getItem('animux_cache_movs');

      if (!force && cachedCats && cachedChans && cachedMovs && (now - lastFetch < CACHE_TIME)) {
        setCloudCategories(JSON.parse(cachedCats));
        setChannelData({ channels: JSON.parse(cachedChans) });
        setLocalMovies(JSON.parse(cachedMovs));
        setIsAppLoading(false);
        return;
      }

      setIsAppLoading(true);

      // Fetch everything in parallel: Firebase + Local JSONs
      const [catSnapshot, chanSnapshot, movSnapshot, m3uRes, localRes] = await Promise.all([
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'channels')),
        getDocs(collection(db, 'movies')),
        fetch('/m3u_channels.json').then(r => r.ok ? r.json() : { channels: [] }).catch(() => ({ channels: [] })),
        fetch('/channels.json').then(r => r.ok ? r.json() : { channels: [] }).catch(() => ({ channels: [] }))
      ]);

      // Firebase Data
      const cats = catSnapshot.docs.map(doc => doc.data().name);
      const firebaseChans = chanSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, fromCloud: true }));
      const firebaseMovs = movSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, isVOD: true, fromCloud: true }));

      // Merge Channels: Local M3U + Public JSON + Firebase
      // Prioritize M3U and Firebase over general public channels
      const allChans = [
        ...m3uRes.channels.map(c => ({ ...c, isExternal: true })),
        ...firebaseChans,
        ...localRes.channels.map(c => ({ ...c, isLocal: true }))
      ];

      // Merge Movies
      const allMovs = [...firebaseMovs];

      setCloudCategories(cats);
      setChannelData({ channels: allChans });
      setLocalMovies(allMovs);
      
      localStorage.setItem('animux_cache_cats', JSON.stringify(cats));
      localStorage.setItem('animux_cache_chans', JSON.stringify(allChans));
      localStorage.setItem('animux_cache_movs', JSON.stringify(allMovs));
      localStorage.setItem('animux_last_fetch', now.toString());
      setLastSyncTime(now.toString());

    } catch (err) { 
      console.error('Error loading app data:', err);
      toast.error('Error al sincronizar contenidos');
    }
    finally { 
      // Pequeño delay artificial para que el splash se vea profesional
      setTimeout(() => setIsAppLoading(false), 2000);
    }
  };

  const forceRefresh = () => loadData(true);

  const allCategories = useMemo(() => {
    const baseCats = ['Nuevos', 'Series', 'Películas', 'Deportes', 'Noticias', 'Documentales', 'Nacionales', 'Infantil', 'Música', 'Anime'];
    return Array.from(new Set([...baseCats, ...cloudCategories, 'Favoritos']));
  }, [cloudCategories]);

  const allUnique = useMemo(() => {
    let base = [...localMovies, ...channelData.channels].filter(c => !brokenChannels.includes(String(c.id)));
    const deleted = JSON.parse(localStorage.getItem('animux_deleted') || '[]');
    
    // Deduplicación por nombre para evitar repetidos entre Local y Firebase
    const unique = new Map();
    base.forEach(item => {
      const name = (item.name || item.title || '').toLowerCase().trim();
      if (!deleted.includes(name) && !unique.has(name)) {
        unique.set(name, item);
      }
    });
    
    return Array.from(unique.values());
  }, [localMovies, channelData, brokenChannels]);

  const filteredChannels = useMemo(() => {
    let result = [...allUnique];
    if (searchQuery) return result.filter(c => (c.name || c.title || '').toLowerCase().includes(searchQuery.toLowerCase()));
    if (activeCategory === 'Favoritos') return result.filter(c => favorites.includes(String(c.id)));
    if (activeCategory === 'Inicio') return result;
    return result.filter(c => {
      const chCat = (c.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const target = activeCategory.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      if (target === 'peliculas') return chCat.includes('pelicula') || chCat.includes('cine') || c.isVOD;
      if (target === 'series') return chCat.includes('serie') || chCat.includes('show');
      return chCat === target || chCat.includes(target);
    });
  }, [searchQuery, activeCategory, favorites, allUnique]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    allCategories.forEach(cat => {
      if (cat === 'Favoritos') counts[cat] = favorites.length;
      else counts[cat] = allUnique.filter(c => (c.category || '').toLowerCase().includes(cat.toLowerCase())).length;
    });
    return counts;
  }, [allCategories, allUnique, favorites]);

  const recentChannels = useMemo(() => {
    return recentlyWatched.map(id => allUnique.find(c => String(c.id) === String(id))).filter(Boolean).slice(0, 12);
  }, [recentlyWatched, allUnique]);

  const matchesCat = (c, target) => {
    const chCat = (c.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (target === 'peliculas') return chCat.includes('pelicula') || chCat.includes('cine') || c.isVOD;
    if (target === 'series') return chCat.includes('serie') || chCat.includes('show');
    if (target === 'deportes') return chCat.includes('deporte') || chCat.includes('sport');
    return chCat === target || chCat.includes(target);
  };

  // ── Custom Splash Screen (Minimalist Netflix Style) ─────────────────────────
  if (isAppLoading) {
    return (
      <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center font-sans overflow-hidden">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          {/* Logo Central */}
          <div className="w-32 h-32 md:w-40 md:h-40">
            <img 
              src="/icon-192.png" 
              alt="Animux Logo" 
              className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            />
          </div>
          
          {/* Titulo con Estilo Netflix */}
          <div className="text-center space-y-1">
            <h1 className="text-4xl md:text-5xl font-black text-rose-600 tracking-tighter uppercase">
              ANIMUX
            </h1>
            <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-[0.4em]">
              Streaming de alta fidelidad
            </p>
          </div>
        </div>

        {/* Info de Desarrollo (Footer) */}
        <div className="absolute bottom-12 text-center space-y-2 opacity-60">
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full inline-block">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              Versión {APP_VERSION} • Stable Build
            </p>
          </div>
          <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest block">
            © 2026 Desarrollo Independiente
          </p>
        </div>

        {/* Loader Minimalista */}
        <div className="absolute bottom-24 flex gap-1.5">
          <div className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
          <div className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-[100dvh] bg-black text-white overflow-hidden w-full relative">
      <Header
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        onGoHome={() => { setActiveCategory('Inicio'); setSearchQuery(''); setLogoClicks(p => p + 1 === 5 ? (setShowAdmin(true), 0) : p + 1); }}
        onForceRefresh={loadData} lastSync={lastSyncTime} appVersion={APP_VERSION}
      />

      <CategoryBar
        categories={allCategories} activeCategory={activeCategory}
        setActiveCategory={(cat) => { setActiveCategory(cat); setSearchQuery(''); }}
      />

      <div className="flex flex-1 overflow-hidden pt-[52px] md:pt-0">
        <Sidebar
          categories={['Inicio', ...allCategories]} activeCategory={activeCategory}
          setActiveCategory={setActiveCategory} counts={categoryCounts} version={APP_VERSION}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar pb-20 md:pb-6">
          <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-4 md:py-6 space-y-6 md:space-y-10">
            
            {activeCategory === 'Inicio' && !searchQuery ? (
              <div className="space-y-8 animate-fade-in">
                <Hero featuredChannel={allUnique.find(m => m.featured) || allUnique[0]} onPlay={setActiveChannel} onDetails={setSelectedDetail} />

                {recentChannels.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg md:text-xl font-black uppercase tracking-widest border-l-4 border-blue-600 pl-3">Continúa Viendo</h3>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                      {recentChannels.map(c => <div key={c.id} className="w-[110px] md:w-[160px] shrink-0"><ChannelCard channel={c} onPlay={setActiveChannel} isFavorite={favorites.includes(String(c.id))} /></div>)}
                    </div>
                  </div>
                )}

                {allCategories.filter(c => c !== 'Favoritos' && c !== 'Nuevos').map(cat => {
                  const target = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                  const items = allUnique.filter(c => matchesCat(c, target));
                  if (!items.length) return null;
                  return (
                    <div key={cat} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg md:text-xl font-black uppercase tracking-widest border-l-4 border-white/20 pl-3">{cat}</h3>
                        <button onClick={() => setActiveCategory(cat)} className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-tighter">Ver todo</button>
                      </div>
                      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                        {items.slice(0, 15).map(c => <div key={c.id} className="w-[110px] md:w-[160px] shrink-0"><ChannelCard channel={c} onPlay={setActiveChannel} isFavorite={favorites.includes(String(c.id))} /></div>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3 md:gap-4">
                {filteredChannels.slice(0, visibleCount).map(c => (
                  <ChannelCard key={c.id} channel={c} onPlay={setActiveChannel} isFavorite={favorites.includes(String(c.id))} onToggleFavorite={(id) => {
                    const next = favorites.includes(String(id)) ? favorites.filter(f => f !== String(id)) : [...favorites, String(id)];
                    setFavorites(next);
                    localStorage.setItem('animux_favs', JSON.stringify(next));
                  }} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNav activeCategory={activeCategory} setActiveCategory={setActiveCategory} onSearchOpen={() => {}} />
      
      {activeChannel && <Player channel={activeChannel} onClose={() => setActiveChannel(null)} />}
      {selectedDetail && <DetailsModal channel={selectedDetail} onClose={() => setSelectedDetail(null)} onPlay={setActiveChannel} isFavorite={favorites.includes(String(selectedDetail.id))} />}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} onUpdate={loadData} />}
      
      <Toast />
      <NewsBanner />
    </div>
  );
}
