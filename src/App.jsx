import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import Header from './components/Header';
import Hero from './components/Hero';
import Sidebar from './components/Sidebar';
import CategoryBar from './components/CategoryBar';
import BottomNav from './components/BottomNav';
import ChannelCard from './components/ChannelCard';
import Player from './components/Player';
import DetailsModal from './components/DetailsModal';
import Skeleton from './components/Skeleton';
import Toast, { toast } from './components/Toast';
import InstallPWA from './components/InstallPWA';
import { db } from './config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import AdminPanel from './components/AdminPanel';

export default function App() {
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

  // ── PWA Install ─────────────────────────────────────────────────────────────
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    // Detect if already running as standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');
    if (isStandalone) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setShowInstall(false);
      setDeferredPrompt(null);
      toast.success('¡Animux instalada correctamente! 🎉');
    });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.info('Usa el menú de Chrome (3 puntos) y selecciona "Instalar aplicación"');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') { 
      setShowInstall(false); 
      toast.success('¡App instalada! 🎉'); 
    }
    setDeferredPrompt(null);
  };

  // Reset pagination on category/search change
  useEffect(() => { setVisibleCount(48); }, [activeCategory, searchQuery]);

  // ── Data loading ─────────────────────────────────────────────────────────────
  const loadData = async (force = false) => {
    try {
      const now = Date.now();
      const lastFetch = localStorage.getItem('animux_last_fetch') || 0;
      const CACHE_TIME = 10 * 60 * 1000;

      if (!force && (now - lastFetch < CACHE_TIME)) {
        const cachedCats = localStorage.getItem('animux_cache_cats');
        const cachedChans = localStorage.getItem('animux_cache_chans');
        const cachedMovs = localStorage.getItem('animux_cache_movs');
        if (cachedCats && cachedChans && cachedMovs) {
          setCloudCategories(JSON.parse(cachedCats));
          setChannelData({ channels: JSON.parse(cachedChans) });
          setLocalMovies(JSON.parse(cachedMovs));
          setIsAppLoading(false);
          return;
        }
      }

      setIsAppLoading(true);
      const catSnapshot = await getDocs(collection(db, 'categories'));
      const cats = catSnapshot.docs.map(doc => doc.data().name).filter(n => n !== 'Regional');
      setCloudCategories(cats);

      const chanSnapshot = await getDocs(collection(db, 'channels'));
      const cloudChans = chanSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, fromCloud: true }));
      const [rChan, rM3U] = await Promise.all([
        fetch('/channels.json'),
        fetch('/m3u_channels.json')
      ]);
      const jsonChans = rChan.ok ? (await rChan.json()).channels : [];
      const m3uChans = rM3U.ok ? (await rM3U.json()).channels.map(c => ({ ...c, fromM3U: true })) : [];

      // Merge and deduplicate by name - PRIORITIZE M3U CHANNELS
      const allChannelsMap = new Map();
      
      // We process M3U channels FIRST so they take precedence in the Map
      [...m3uChans, ...cloudChans, ...jsonChans].forEach(ch => {
        const key = (ch.name || ch.displayName || '').toLowerCase().trim();
        if (!allChannelsMap.has(key)) {
          allChannelsMap.set(key, ch);
        }
      });

      // Final filtering: exclude 'Regional' category
      const finalChannels = Array.from(allChannelsMap.values()).filter(c => c.category !== 'Regional');
      
      const movSnapshot = await getDocs(collection(db, 'movies'));
      const cloudMovs = movSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, isVOD: true, displayName: doc.data().title, fromCloud: true }));
      const rMov = await fetch('/movies.json');
      const jsonMovs = rMov.ok ? (await rMov.json()).map(m => ({ ...m, isVOD: true, displayName: m.title })) : [];
      
      setChannelData({ channels: finalChannels });
      setLocalMovies([...cloudMovs, ...jsonMovs]);

      localStorage.setItem('animux_cache_cats', JSON.stringify(cats));
      localStorage.setItem('animux_cache_chans', JSON.stringify(finalChannels));
      localStorage.setItem('animux_cache_movs', JSON.stringify([...cloudMovs, ...jsonMovs]));
      localStorage.setItem('animux_last_fetch', now.toString());

    } catch (err) {
      const cachedCats = localStorage.getItem('animux_cache_cats');
      if (cachedCats) setCloudCategories(JSON.parse(cachedCats));
    } finally {
      setTimeout(() => setIsAppLoading(false), 500);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Memos ────────────────────────────────────────────────────────────────────
  const allCategories = useMemo(() => {
    const baseCats = ['Nuevos', 'Series', 'Películas', 'Deportes', 'Nacionales', 'Infantil', 'Música', 'Anime'];
    return Array.from(new Set([...baseCats, ...cloudCategories, 'Favoritos']));
  }, [cloudCategories]);

  const allUnique = useMemo(() => {
    let base = [...localMovies, ...channelData.channels];
    let result = base.filter(c => !brokenChannels.includes(String(c.id)));
    const unique = new Map();
    result.forEach(c => {
      const n = (c.displayName || c.title || c.name || '').toLowerCase().trim();
      if (n && (!unique.has(n) || c.fromCloud)) unique.set(n, c);
    });

    // Filter out channels explicitly deleted via AdminPanel (blocklist)
    const deleted = JSON.parse(localStorage.getItem('animux_deleted') || '[]');
    if (deleted.length > 0) {
      return Array.from(unique.values()).filter(c => {
        const n = (c.displayName || c.title || c.name || '').toLowerCase().trim();
        return !deleted.includes(n);
      });
    }

    return Array.from(unique.values());
  }, [localMovies, channelData, brokenChannels]);

  const filteredChannels = useMemo(() => {
    let result = [...allUnique];

    if (activeCategory === 'Nuevos') return result.filter(c => c.isNew === true).reverse();
    if (activeCategory === 'Favoritos') return result.filter(c => favorites.includes(String(c.id)));

    if (activeCategory !== 'Inicio') {
      const catNorm = activeCategory.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      result = result.filter(c => {
        if (c.isNew) return false;
        const chCat = (c.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        if (catNorm === 'peliculas') return chCat.includes('pelicula') || chCat.includes('cine') || chCat.includes('movie') || chCat.includes('filmes') || chCat.includes('vod') || c.isVOD;
        if (catNorm === 'series') return chCat.includes('serie') || chCat.includes('show') || chCat.includes('novela');
        if (catNorm === 'deportes') return chCat.includes('deporte') || chCat.includes('sport') || chCat.includes('futbol');
        if (catNorm === 'infantil') return chCat.includes('infantil') || chCat.includes('kid') || chCat.includes('dibujo') || chCat.includes('cartoon');
        if (catNorm === 'musica') return chCat.includes('musica') || chCat.includes('music') || chCat.includes('clip');
        return chCat === catNorm || chCat.includes(catNorm);
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => (c.name || c.title || '').toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q));
    }

    return result;
  }, [searchQuery, activeCategory, favorites, allUnique]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    allCategories.forEach(cat => {
      if (cat === 'Nuevos') { counts[cat] = allUnique.filter(c => c.isNew).length; return; }
      if (cat === 'Favoritos') { counts[cat] = favorites.length; return; }
      const target = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      counts[cat] = allUnique.filter(c => {
        if (c.isNew) return false;
        const chCat = (c.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        if (target === 'peliculas') return chCat.includes('pelicula') || chCat.includes('cine') || chCat.includes('movie') || c.isVOD;
        if (target === 'series') return chCat.includes('serie') || chCat.includes('show');
        if (target === 'deportes') return chCat.includes('deporte') || chCat.includes('sport');
        if (target === 'infantil') return chCat.includes('infantil') || chCat.includes('kid') || chCat.includes('cartoon');
        if (target === 'musica') return chCat.includes('musica') || chCat.includes('music');
        return chCat === target || chCat.includes(target);
      }).length;
    });
    return counts;
  }, [allCategories, allUnique, favorites]);

  const recentChannels = useMemo(() => {
    return recentlyWatched
      .map(id => allUnique.find(c => String(c.id) === String(id)))
      .filter(Boolean)
      .slice(0, 12);
  }, [recentlyWatched, allUnique]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const toggleFavorite = (id) => {
    const isFav = favorites.includes(String(id));
    const n = isFav ? favorites.filter(f => f !== String(id)) : [...favorites, String(id)];
    setFavorites(n);
    localStorage.setItem('animux_favs', JSON.stringify(n));
    toast.fav(isFav ? 'Eliminado de favoritos' : '¡Añadido a favoritos!');
  };

  const handleItemClick = (channel) => {
    setActiveChannel(channel);
    const newRecent = [String(channel.id), ...recentlyWatched.filter(id => String(id) !== String(channel.id))].slice(0, 15);
    setRecentlyWatched(newRecent);
    localStorage.setItem('animux_recent', JSON.stringify(newRecent));
  };

  const handleRefresh = () => {
    localStorage.removeItem('animux_cache_cats');
    localStorage.removeItem('animux_cache_chans');
    localStorage.removeItem('animux_cache_movs');
    localStorage.removeItem('animux_last_fetch');
    toast.success('Actualizando lista de canales...');
    loadData();
  };

  const handleReportBroken = (ch) => {
    const id = typeof ch === 'object' ? String(ch.id) : String(ch);
    const n = [...new Set([...brokenChannels, id])];
    setBrokenChannels(n);
    localStorage.setItem('animux_broken', JSON.stringify(n));
    toast.error('Canal reportado como no disponible');
  };

  // ── Skeleton loading screen ──────────────────────────────────────────────────
  if (isAppLoading) {
    return (
      <div className="h-[100dvh] bg-black text-white flex flex-col overflow-hidden">
        {/* Fake header */}
        <div className="h-[52px] shrink-0 bg-black border-b border-white/[0.05] flex items-center px-6 gap-3">
          <div className="w-9 h-9 bg-white/5 rounded-xl animate-pulse" />
          <div className="w-20 h-4 bg-white/5 rounded-full animate-pulse" />
          <div className="flex-1 max-w-lg hidden md:block h-8 bg-white/5 rounded-full animate-pulse mx-4" />
        </div>
        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          <div className="hidden md:block w-[220px] shrink-0 border-r border-white/[0.04] bg-[#090909]">
            <div className="p-4 space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 bg-white/[0.03] rounded-xl animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Skeleton />
          </div>
        </div>
      </div>
    );
  }

  // ── Category row helper ───────────────────────────────────────────────────────
  const matchesCat = (c, target) => {
    const chCat = (c.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (target === 'peliculas') return chCat.includes('pelicula') || chCat.includes('cine') || chCat.includes('movie') || chCat.includes('vod') || c.isVOD;
    if (target === 'series') return chCat.includes('serie') || chCat.includes('show') || chCat.includes('novela');
    if (target === 'deportes') return chCat.includes('deporte') || chCat.includes('sport');
    if (target === 'infantil') return chCat.includes('infantil') || chCat.includes('kid') || chCat.includes('cartoon');
    if (target === 'musica') return chCat.includes('musica') || chCat.includes('music');
    return chCat === target || chCat.includes(target);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-white overflow-hidden w-full relative">

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onGoHome={() => {
          setLogoClicks(p => { const next = p + 1; if (next === 5) { setShowAdmin(true); return 0; } return next; });
          setActiveCategory('Inicio');
          setSearchQuery('');
        }}
        onInstall={handleInstall}
        showInstall={showInstall}
      />

      {/* ── CATEGORY CHIPS — Mobile only ─────────────────────────────────── */}
      <CategoryBar
        categories={allCategories}
        activeCategory={activeCategory}
        setActiveCategory={(cat) => { setActiveCategory(cat); setSearchQuery(''); }}
        onInstall={handleInstall}
        showInstall={showInstall}
        onRefresh={handleRefresh}
      />

      {/* ── BODY: SIDEBAR + MAIN ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden pt-[52px] md:pt-0">

        <Sidebar
          categories={['Inicio', ...allCategories]}
          activeCategory={activeCategory}
          setActiveCategory={(cat) => { setActiveCategory(cat); setSearchQuery(''); }}
          counts={categoryCounts}
          onRefresh={handleRefresh}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar pb-20 md:pb-6">
          <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-4 md:py-6 space-y-6 md:space-y-10">

            {/* ── HOME ───────────────────────────────────────────────────── */}
            {activeCategory === 'Inicio' && !searchQuery ? (
              <div className="space-y-6 md:space-y-10 animate-fade-in">

                <Hero
                  featuredChannel={localMovies.find(m => m.featured) || localMovies[0] || channelData.channels[0]}
                  onPlay={handleItemClick}
                  onDetails={setSelectedDetail}
                />

                {/* Continúa Viendo */}
                {recentChannels.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-5 bg-rose-600 rounded-full" />
                      <h3 className="text-lg md:text-xl font-black uppercase tracking-widest">Continúa Viendo</h3>
                    </div>
                    <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-4">
                      {recentChannels.map(c => (
                        <div key={`recent-${c.id}`} className="w-[105px] md:w-[150px] shrink-0">
                          <ChannelCard channel={c} onPlay={handleItemClick} isFavorite={favorites.includes(String(c.id))} onToggleFavorite={toggleFavorite} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nuevos Estrenos */}
                {allUnique.filter(c => c.isNew).length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-5 bg-rose-600 rounded-full" />
                        <h3 className="text-lg md:text-xl font-black uppercase tracking-widest text-rose-400">Nuevos Estrenos</h3>
                      </div>
                      <button onClick={() => setActiveCategory('Nuevos')} className="text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:text-rose-500 transition-colors">Ver todo</button>
                    </div>
                    <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-4">
                      {allUnique.filter(c => c.isNew).slice(0, 16).map(c => (
                        <div key={`new-${c.id}`} className="w-[105px] md:w-[150px] shrink-0">
                          <ChannelCard channel={c} onPlay={handleItemClick} isFavorite={favorites.includes(String(c.id))} onToggleFavorite={toggleFavorite} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category rows */}
                {allCategories.filter(c => c !== 'Favoritos' && c !== 'Nuevos').map(cat => {
                  const target = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                  const items = allUnique.filter(c => !c.isNew && matchesCat(c, target));
                  if (!items.length) return null;
                  return (
                    <div key={cat} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-5 bg-white/20 rounded-full" />
                          <h3 className="text-lg md:text-xl font-black uppercase tracking-widest">{cat}</h3>
                        </div>
                        <button onClick={() => setActiveCategory(cat)} className="text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:text-rose-500 transition-colors">Ver todo</button>
                      </div>
                      <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-4">
                        {items.slice(0, 16).map(c => (
                          <div key={c.id} className="w-[105px] md:w-[150px] shrink-0">
                            <ChannelCard channel={c} onPlay={handleItemClick} isFavorite={favorites.includes(String(c.id))} onToggleFavorite={toggleFavorite} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

            ) : (
              /* ── CATEGORY / SEARCH VIEW ────────────────────────────────── */
              <div className="animate-fade-in space-y-8">
                <div className="flex items-end justify-between border-b border-white/[0.05] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-7 bg-rose-600 rounded-full" />
                    <h2 className="text-2xl md:text-4xl font-black uppercase tracking-widest">
                      {searchQuery ? `"${searchQuery}"` : activeCategory}
                    </h2>
                  </div>
                  <span className="text-[9px] font-bold text-gray-600 tracking-widest uppercase">
                    {filteredChannels.length} títulos
                  </span>
                </div>

                {filteredChannels.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <p className="text-4xl">🎬</p>
                    <p className="text-gray-600 font-bold uppercase tracking-widest text-sm">Sin resultados</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
                      {filteredChannels.slice(0, visibleCount).map(c => (
                        <ChannelCard
                          key={c.id} channel={c}
                          onPlay={handleItemClick}
                          isFavorite={favorites.includes(String(c.id))}
                          onToggleFavorite={toggleFavorite}
                        />
                      ))}
                    </div>

                    {/* Ver más */}
                    {filteredChannels.length > visibleCount && (
                      <div className="flex flex-col items-center gap-2 pt-4">
                        <button
                          onClick={() => setVisibleCount(v => v + 48)}
                          className="px-10 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-rose-600/40 text-white rounded-full font-black text-[11px] uppercase tracking-widest transition-all active:scale-95"
                        >
                          Ver más — {filteredChannels.length - visibleCount} restantes
                        </button>
                        <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest">
                          Mostrando {Math.min(visibleCount, filteredChannels.length)} de {filteredChannels.length}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── OVERLAYS ─────────────────────────────────────────────────────── */}
      {activeChannel && (
        <Player
          channel={activeChannel}
          onClose={() => setActiveChannel(null)}
          playlist={filteredChannels}
          onPlayNext={handleItemClick}
          onReportBroken={handleReportBroken}
        />
      )}
      {selectedDetail && (
        <DetailsModal
          channel={selectedDetail}
          onClose={() => setSelectedDetail(null)}
          onPlay={(ch) => { handleItemClick(ch); setSelectedDetail(null); }}
          isFavorite={favorites.includes(String(selectedDetail.id))}
          toggleFavorite={toggleFavorite}
          allChannels={[...channelData.channels, ...localMovies]}
          onSelect={setSelectedDetail}
        />
      )}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} onUpdate={() => loadData(true)} />}

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 bg-black z-[100] p-6 flex flex-col gap-6 animate-fade-in md:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Buscar</h2>
            <button onClick={() => { setMobileSearchOpen(false); setSearchQuery(''); }} className="p-2 bg-white/5 rounded-full">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          <input
            autoFocus type="text"
            placeholder="¿Qué quieres ver hoy?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-semibold outline-none focus:border-rose-600 transition-all text-sm placeholder:text-gray-600"
          />
          {searchQuery && (
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{filteredChannels.length} resultados</p>
              <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[60vh]">
                {filteredChannels.slice(0, 18).map(c => (
                  <ChannelCard
                    key={c.id} channel={c}
                    onPlay={(ch) => { handleItemClick(ch); setMobileSearchOpen(false); setSearchQuery(''); }}
                    isFavorite={favorites.includes(String(c.id))}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Nav — Mobile */}
      <BottomNav
        activeCategory={activeCategory}
        setActiveCategory={(cat) => { setActiveCategory(cat); setSearchQuery(''); }}
        onSearchOpen={() => setMobileSearchOpen(true)}
      />

      {/* PWA Install Banner — Floating, for Android/iOS/Desktop */}
      <InstallPWA
        onInstall={handleInstall}
        showInstall={showInstall}
        variant="banner"
      />

      {/* Toast Notifications */}
      <Toast />
    </div>
  );
}
