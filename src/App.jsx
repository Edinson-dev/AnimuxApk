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
      const [catSnapshot, chanSnapshot, movSnapshot] = await Promise.all([
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'channels')),
        getDocs(collection(db, 'movies'))
      ]);

      const cats = catSnapshot.docs.map(doc => doc.data().name);
      const chans = chanSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      const movs = movSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, isVOD: true }));

      setCloudCategories(cats);
      setChannelData({ channels: chans });
      setLocalMovies(movs);
      
      localStorage.setItem('animux_cache_cats', JSON.stringify(cats));
      localStorage.setItem('animux_cache_chans', JSON.stringify(chans));
      localStorage.setItem('animux_cache_movs', JSON.stringify(movs));
      localStorage.setItem('animux_last_fetch', now.toString());
      setLastSyncTime(now.toString());

    } catch (err) { console.error(err); }
    finally { setIsAppLoading(false); }
  };

  const forceRefresh = () => loadData(true);

  const allCategories = useMemo(() => {
    const baseCats = ['Nuevos', 'Series', 'Películas', 'Deportes', 'Noticias', 'Documentales', 'Nacionales', 'Infantil', 'Música', 'Anime'];
    return Array.from(new Set([...baseCats, ...cloudCategories, 'Favoritos']));
  }, [cloudCategories]);

  const allUnique = useMemo(() => {
    let base = [...localMovies, ...channelData.channels].filter(c => !brokenChannels.includes(String(c.id)));
    const deleted = JSON.parse(localStorage.getItem('animux_deleted') || '[]');
    return base.filter(c => !deleted.includes((c.name || c.title || '').toLowerCase().trim()));
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

  // ── Custom Splash Screen (Premium) ─────────────────────────────────────────
  if (isAppLoading) {
    return (
      <div className="h-[100dvh] w-full bg-[#020206] flex flex-col items-center justify-center relative overflow-hidden font-sans">
        {/* Fondo con efectos de luz dinámica */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full animate-pulse [animation-delay:1s]" />
        
        {/* Contenedor Central */}
        <div className="z-10 flex flex-col items-center gap-8 animate-fade-in">
          {/* Logo con Resplandor Animado */}
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-600/20 blur-2xl rounded-full animate-pulse group-hover:bg-blue-600/40 transition-all duration-700" />
            <div className="relative w-28 h-28 md:w-36 md:h-36 bg-gradient-to-tr from-white/10 to-white/5 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-center shadow-2xl p-6 overflow-hidden">
              <img 
                src="/icon-192.png" 
                alt="Animux" 
                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            </div>
          </div>

          {/* Nombre y Versión */}
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-[0.2em] uppercase bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
              Animux
            </h1>
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
              <p className="text-[10px] font-black text-blue-500 tracking-[0.3em] uppercase">
                Sistema v{APP_VERSION}
              </p>
            </div>
          </div>

          {/* Barra de Progreso Minimalista */}
          <div className="w-48 h-[2px] bg-white/5 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 w-full animate-pulse" />
          </div>

          {/* Mensajes de Estado Dinámicos */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-[9px] font-bold text-white/40 tracking-[0.4em] uppercase animate-pulse">
              Optimizando Biblioteca...
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-12 flex flex-col items-center gap-3 animate-fade-in opacity-40">
          <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase">Streaming de alta fidelidad</p>
          <div className="flex gap-4">
             <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
             <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
             <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
          </div>
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
