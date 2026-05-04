import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { X, Scale, Shield, ShoppingBag } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import Header from './components/layout/Header';
import Hero from './components/ui/Hero';
import Sidebar from './components/layout/Sidebar';
import CategoryBar from './components/layout/CategoryBar';
import BottomNav from './components/layout/BottomNav';
import ChannelCard from './components/ui/ChannelCard';
import LazyRow from './components/ui/LazyRow';
import Player from './components/core/Player';
import DetailsModal from './components/ui/DetailsModal';
import Skeleton from './components/ui/Skeleton';
import Toast, { toast } from './components/ui/Toast';
import NewsBanner from './components/ui/NewsBanner';

import { db } from './config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import AdminPanel from './components/core/AdminPanel';
import LegalModal from './components/ui/LegalModal';
import InstallGuide from './components/ui/InstallGuide';
import TvGuideModal from './components/ui/TvGuideModal';
import DonateModal from './components/ui/DonateModal';

const APP_VERSION = '3.4';

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isKidsMode, setIsKidsMode] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [visibleCount, setVisibleCount] = useState(48);
  const [lastSyncTime, setLastSyncTime] = useState(() => localStorage.getItem('animux_last_fetch'));
  const [showInstall, setShowInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showLegal, setShowLegal] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [showTvGuide, setShowTvGuide] = useState(false);
  const [showDonate, setShowDonate] = useState(false);

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

        // Mantenemos el splash un ratico incluso si es caché para profesionalismo
        setTimeout(() => setIsAppLoading(false), 3000);
        return;
      }

      // Solo mostramos el Splash si es la carga inicial (no forzada por botón)
      if (!force) setIsAppLoading(true);

      const [catSnapshot, chanSnapshot, movSnapshot, m3uRes, localRes] = await Promise.all([
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'channels')),
        getDocs(collection(db, 'movies')),
        fetch('/m3u_channels.json').then(r => r.ok ? r.json() : { channels: [] }).catch(() => ({ channels: [] })),
        fetch('/channels.json').then(r => r.ok ? r.json() : { channels: [] }).catch(() => ({ channels: [] }))
      ]);

      const cats = catSnapshot.docs.map(doc => doc.data().name);
      const firebaseChans = chanSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, fromCloud: true }));
      const firebaseMovs = movSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, isVOD: true, fromCloud: true }));

      const allChans = [
        ...m3uRes.channels.map(c => ({ ...c, isExternal: true })),
        ...firebaseChans,
        ...localRes.channels.map(c => ({ ...c, isLocal: true }))
      ];

      setCloudCategories(cats);
      setChannelData({ channels: allChans });
      setLocalMovies(firebaseMovs);

      localStorage.setItem('animux_cache_cats', JSON.stringify(cats));
      localStorage.setItem('animux_cache_chans', JSON.stringify(allChans));
      localStorage.setItem('animux_cache_movs', JSON.stringify(firebaseMovs));
      localStorage.setItem('animux_last_fetch', now.toString());
      setLastSyncTime(now.toString());

      if (force) toast.success('Canales actualizados correctamente');

    } catch (err) {
      console.error('Error loading app data:', err);
      toast.error('Error al sincronizar contenidos');
    }
    finally {
      if (!force) {
        // Aumentado a 4.5 segundos para que se aprecie bien la marca
        setTimeout(() => setIsAppLoading(false), 3000);
      }
    }
  };

  const forceRefresh = () => loadData(true);

  // ── Traductor de categorías (inglés → español) ───────────────
  const CATEGORY_TRANSLATIONS = {
    'sports': 'Deportes',
    'sport': 'Deportes',
    'news': 'Noticias',
    'entertainment': 'Entretenimiento',
    'movies': 'Películas',
    'movie': 'Películas',
    'music': 'Música',
    'kids': 'Infantil',
    'children': 'Infantil',
    'documentary': 'Documentales',
    'documentaries': 'Documentales',
    'religious': 'Religioso',
    'religion': 'Religioso',
    'education': 'Educación',
    'educational': 'Educación',
    'comedy': 'Comedia',
    'drama': 'Drama',
    'classic': 'Clásicos',
    'classics': 'Clásicos',
    'lifestyle': 'Estilo de Vida',
    'food': 'Cocina',
    'cooking': 'Cocina',
    'travel': 'Viajes',
    'nature': 'Naturaleza',
    'science': 'Ciencia',
    'business': 'Negocios',
    'weather': 'Clima',
    'animation': 'Animación',
    'family': 'Familia',
    'general': 'General',
    'culture': 'Cultura',
    'outdoor': 'Naturaleza',
    'shop': 'Tienda',
    'shopping': 'Tienda',
    'series': 'Series',
    'auto': 'Autos',
    'undefined': 'Otros',
    'xxx': null, // Ocultar esta categoría
    'adult': null,
  };

  const translateCat = (cat) => {
    if (!cat) return 'Otros';
    const key = cat.toLowerCase().trim();
    if (CATEGORY_TRANSLATIONS[key] === null) return null; // Ocultar
    return CATEGORY_TRANSLATIONS[key] || cat; // Traducir o dejar original
  };

  const allCategories = useMemo(() => {
    const baseCats = ['Nuevos', 'Series', 'Películas', 'Cine', 'Deportes', 'Noticias', 'Documentales', 'Nacionales', 'Infantil', 'Música', 'Anime', 'Entretenimiento'];
    const translatedCloud = cloudCategories.map(translateCat).filter(Boolean);
    return Array.from(new Set([...baseCats, ...translatedCloud, 'Favoritos']));
  }, [cloudCategories]);

  const allUnique = useMemo(() => {
    let base = [...localMovies, ...channelData.channels].filter(c => !brokenChannels.includes(String(c.id)));
    const deleted = JSON.parse(localStorage.getItem('animux_deleted') || '[]');

    // Deduplicación por nombre para evitar repetidos entre Local y Firebase
    const unique = new Map();
    base.forEach(item => {
      const name = (item.name || item.title || '').toLowerCase().trim();
      if (!deleted.includes(name) && !unique.has(name)) {
        // Traducir categoría al español
        const translated = translateCat(item.category);
        unique.set(name, translated ? { ...item, category: translated } : item);
      }
    });

    return Array.from(unique.values());
  }, [localMovies, channelData, brokenChannels]);

  const matchesCat = (c, target) => {
    const chCat = (c.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const normalizedChCat = chCat.includes('documentary') ? 'documentales' : chCat.includes('religious') ? 'religioso' : chCat;

    // Lógica invertida por petición: CINE = VOD, PELICULAS = Canales TV
    if (target === 'cine') return c.isVOD;
    if (target === 'peliculas') return !c.isVOD && (normalizedChCat.includes('cine') || normalizedChCat.includes('pelicula') || normalizedChCat.includes('movie'));

    if (target === 'series') return normalizedChCat.includes('serie') || normalizedChCat.includes('show');
    if (target === 'deportes') return normalizedChCat.includes('deporte') || normalizedChCat.includes('sport');
    return normalizedChCat === target || normalizedChCat.includes(target);
  };

  const handleReportBroken = (channel) => {
    const updated = [...brokenChannels, String(channel.id)];
    setBrokenChannels(updated);
    localStorage.setItem('animux_broken', JSON.stringify(updated));
    toast.error('Canal reportado. Se ocultará de la lista.');
    setActiveChannel(null);
  };

  const filteredChannels = useMemo(() => {
    let result = [...allUnique];

    // Filtro maestro de Modo Kids
    if (isKidsMode) {
      const kidsKeywords = ['infantil', 'kids', 'muñeco', 'disney', 'nickelodeon', 'cartoon', 'dibujo', 'niño', 'junior', 'boing', 'clan'];
      result = result.filter(c => {
        const cat = (c.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const name = (c.name || c.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return kidsKeywords.some(kw => cat.includes(kw) || name.includes(kw));
      });
    }

    if (searchQuery) return result.filter(c => (c.name || c.title || '').toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeCategory === 'Favoritos') return result.filter(c => favorites.includes(String(c.id)));
    if (activeCategory === 'Inicio') return result;

    const target = activeCategory.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    // Lógica especial para la pestaña "Nuevos"
    if (target === 'nuevos' || target === 'nuevo') {
      return result.filter(c => c.isNew === true);
    }

    return result.filter(c => matchesCat(c, target));
  }, [searchQuery, activeCategory, favorites, allUnique, isKidsMode]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    allCategories.forEach(cat => {
      const target = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

      if (cat === 'Favoritos') {
        counts[cat] = favorites.length;
      } else if (target === 'nuevos' || target === 'nuevo') {
        counts[cat] = allUnique.filter(c => c.isNew === true).length;
      } else if (target === 'cine') {
        counts[cat] = allUnique.filter(c => c.isVOD).length;
      } else if (target === 'peliculas') {
        counts[cat] = allUnique.filter(c => !c.isVOD && ((c.category || '').toLowerCase().includes('cine') || (c.category || '').toLowerCase().includes('pelicula'))).length;
      } else {
        counts[cat] = allUnique.filter(c => matchesCat(c, target)).length;
      }
    });
    return counts;
  }, [allCategories, allUnique, favorites]);

  const recentChannels = useMemo(() => {
    return recentlyWatched.map(id => allUnique.find(c => String(c.id) === String(id))).filter(Boolean).slice(0, 12);
  }, [recentlyWatched, allUnique]);

  // ── Memoized callbacks for ChannelCard (prevents re-renders) ──
  const handlePlay = useCallback((ch) => setActiveChannel(ch), []);
  const handleToggleFavorite = useCallback((id) => {
    setFavorites(prev => {
      const next = prev.includes(String(id)) ? prev.filter(f => f !== String(id)) : [...prev, String(id)];
      localStorage.setItem('animux_favs', JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Infinite scroll observer ──────────────────────────────────
  const loadMoreRef = useRef(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisibleCount(prev => prev + 24);
      }
    }, { rootMargin: '400px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeCategory, searchQuery]);

  // Reset visible count when category changes
  useEffect(() => { setVisibleCount(48); }, [activeCategory]);

  if (isAppLoading) {
    return (
      <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center font-sans overflow-hidden">
        {/* Animated Background Nebula */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-rose-600/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-10">
          {/* Logo con Glow Radiante */}
          <div className="relative group scale-110">
            <div className="absolute inset-0 bg-rose-600 rounded-full blur-[40px] opacity-20 animate-pulse" />
            <div className="relative w-24 h-24 md:w-32 md:h-32 p-4 bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-2xl flex items-center justify-center transform animate-float">
              <img
                src="/icon-192.png"
                alt="Animux Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(225,29,72,0.5)]"
              />
            </div>
          </div>

          {/* Titulo Cinematográfico */}
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tracking-[-0.05em] uppercase animate-letter-spacing">
                ANIMUX
              </h1>
              <div className="flex items-center justify-center gap-3 opacity-0 animate-fade-in animation-delay-500">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-rose-600" />
                <p className="text-[10px] md:text-xs text-rose-500 font-black uppercase tracking-[0.5em]">
                  Premium Streaming
                </p>
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-rose-600" />
              </div>
            </div>

            {/* Progress Bar Luxury */}
            <div className="w-48 h-[3px] bg-white/5 rounded-full overflow-hidden mx-auto border border-white/5">
              <div className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full animate-loading-bar shadow-[0_0_10px_rgba(225,29,72,0.8)]" />
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="absolute bottom-10 text-center space-y-2 opacity-30 animate-fade-in animation-delay-700">
          <p className="text-[9px] font-black text-white uppercase tracking-[0.3em]">
            V{APP_VERSION} • Sistema Verificado
          </p>
          <div className="w-1 h-1 bg-rose-600 rounded-full mx-auto animate-ping" />
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-[100dvh] bg-black text-white overflow-hidden w-full relative">
      <Header
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        onGoHome={() => { setActiveCategory('Inicio'); setSearchQuery(''); setLogoClicks(p => p + 1 === 5 ? (setShowAdmin(true), 0) : p + 1); }}
        onForceRefresh={() => loadData(true)}
        onInstall={() => setShowInstallGuide(true)}
        showInstall={showInstall}
        lastSync={lastSyncTime}
        appVersion={APP_VERSION}
        needRefresh={needRefresh}
        updateServiceWorker={updateServiceWorker}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        isKidsMode={isKidsMode}
        setIsKidsMode={setIsKidsMode}
        onShowLegal={() => setShowLegal(true)}
        onShowTvGuide={() => setShowTvGuide(true)}
      />

      <CategoryBar
        categories={allCategories} activeCategory={activeCategory}
        setActiveCategory={(cat) => { setActiveCategory(cat); setSearchQuery(''); }}
      />

      <div className="flex flex-1 overflow-hidden pt-[52px] md:pt-0">
        <Sidebar
          categories={['Inicio', ...allCategories]} activeCategory={activeCategory}
          setActiveCategory={setActiveCategory} counts={categoryCounts} version={APP_VERSION}
          isKidsMode={isKidsMode} setIsKidsMode={setIsKidsMode}
          onShowLegal={() => setShowLegal(true)}
          onShowTvGuide={() => setShowTvGuide(true)}
        />

        <main id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar bg-black pt-4 md:pt-16 pb-24 md:pb-6">
          <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-4 md:py-6 space-y-6 md:space-y-8">

            {activeCategory === 'Inicio' && !searchQuery ? (
              <div className="space-y-8 animate-fade-in">
                <Hero
                  featuredChannel={
                    isKidsMode
                      ? allUnique.find(c => (c.category || '').toLowerCase().includes('infantil') && c.featured) || allUnique.find(c => (c.category || '').toLowerCase().includes('infantil')) || allUnique[0]
                      : allUnique.find(m => m.featured) || allUnique[0]
                  }
                  onPlay={handlePlay}
                  onDetails={setSelectedDetail}
                />

                {isKidsMode ? (
                  <div className="space-y-8">
                    {/* Fila 1: Top Infantiles */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-yellow-400 rounded-full" />
                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Top Infantiles</h3>
                      </div>
                      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
                        {allUnique.filter(c => (c.category || '').toLowerCase().includes('infantil')).slice(0, 15).map(c => (
                          <div key={c.id} className="w-[140px] md:w-[220px] shrink-0">
                            <ChannelCard channel={c} onPlay={handlePlay} isFavorite={favorites.includes(String(c.id))} />
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Fila 2: Anime y Dibujos */}
                    <LazyRow>
                      <div className="space-y-5">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 bg-blue-400 rounded-full" />
                          <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Anime y Dibujos</h3>
                        </div>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
                          {allUnique.filter(c => (c.category || '').toLowerCase().includes('anime') || (c.category || '').toLowerCase().includes('muñeco')).slice(0, 15).map(c => (
                            <div key={c.id} className="w-[140px] md:w-[220px] shrink-0">
                              <ChannelCard channel={c} onPlay={handlePlay} isFavorite={favorites.includes(String(c.id))} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </LazyRow>

                    {/* Fila 3: Canales Disney & Nick */}
                    <LazyRow>
                      <div className="space-y-5">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 bg-purple-400 rounded-full" />
                          <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Mundo Disney & Nick</h3>
                        </div>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
                          {allUnique.filter(c => {
                            const name = (c.name || '').toLowerCase();
                            return name.includes('disney') || name.includes('nick') || name.includes('cartoon');
                          }).slice(0, 15).map(c => (
                            <div key={c.id} className="w-[140px] md:w-[220px] shrink-0">
                              <ChannelCard channel={c} onPlay={handlePlay} isFavorite={favorites.includes(String(c.id))} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </LazyRow>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Fila 1: Añadidos Recientemente (Solo los marcados como Nuevos) */}
                    {allUnique.filter(c => c.isNew).length > 0 && (
                      <div className="space-y-5">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                          <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Estrenos Exclusivos</h3>
                        </div>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
                          {allUnique.filter(c => c.isNew).slice(0, 10).map(c => (
                            <div key={c.id} className="w-[140px] md:w-[220px] shrink-0">
                              <ChannelCard channel={c} onPlay={handlePlay} isFavorite={favorites.includes(String(c.id))} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fila 2: Deportes en Vivo */}
                    {allUnique.filter(c => matchesCat(c, 'deportes')).length > 0 && (
                      <LazyRow>
                        <div className="space-y-5">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Deportes en Vivo</h3>
                          </div>
                          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
                            {allUnique.filter(c => matchesCat(c, 'deportes')).slice(0, 15).map(c => (
                              <div key={c.id} className="w-[160px] md:w-[260px] shrink-0">
                                <ChannelCard channel={c} onPlay={handlePlay} isFavorite={favorites.includes(String(c.id))} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </LazyRow>
                    )}

                    {/* Fila 4: Continuar Viendo */}
                    {recentChannels.length > 0 && (
                      <div className="space-y-5">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                          <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Continuar Viendo</h3>
                        </div>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
                          {recentChannels.map(c => (
                            <div key={c.id} className="w-[140px] md:w-[220px] shrink-0">
                              <ChannelCard channel={c} onPlay={handlePlay} isFavorite={favorites.includes(String(c.id))} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resto de Categorías dinámicas */}
                    {allCategories.filter(c => {
                      const baseFilter = !['Favoritos', 'Nuevos', 'Inicio', 'Deportes', 'Cine', 'Películas'].includes(c);
                      if (isKidsMode) {
                        const lowCat = c.toLowerCase();
                        return baseFilter && (lowCat.includes('infantil') || lowCat.includes('kids') || lowCat.includes('muñeco') || lowCat.includes('anime') || lowCat.includes('dibujo'));
                      }
                      return baseFilter;
                    }).map(cat => {
                      const target = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                      const items = allUnique.filter(c => matchesCat(c, target));
                      if (!items.length) return null;
                      return (
                        <LazyRow key={cat}>
                          <div className="space-y-5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-white/20 rounded-full" />
                                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">{cat}</h3>
                              </div>
                              <button onClick={() => setActiveCategory(cat)} className="text-[10px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-widest bg-rose-500/10 px-4 py-2 rounded-full transition-all">Explorar Todo</button>
                            </div>
                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
                              {items.slice(0, 15).map(c => <div key={c.id} className="w-[130px] md:w-[200px] shrink-0"><ChannelCard channel={c} onPlay={handlePlay} isFavorite={favorites.includes(String(c.id))} /></div>)}
                            </div>
                          </div>
                        </LazyRow>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-rose-600 rounded-full" />
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">{activeCategory}</h2>
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] bg-white/5 px-4 py-2 rounded-full border border-white/5">
                    {filteredChannels.length} Resultados
                  </p>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 md:gap-6">
                  {filteredChannels.slice(0, visibleCount).map(c => (
                    <ChannelCard key={c.id} channel={c} onPlay={handlePlay} isFavorite={favorites.includes(String(c.id))} onToggleFavorite={handleToggleFavorite} />
                  ))}
                </div>
                {/* Infinite scroll sentinel */}
                {visibleCount < filteredChannels.length && (
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin" />
                  </div>
                )}
              </div>
            )}

            {/* Footer de la Aplicación */}
            <footer className="mt-20 pb-10 pt-10 border-t border-white/5 flex flex-col items-center gap-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                  <img src="/icon-192.png" alt="Animux" className="w-6 h-6 opacity-50" />
                </div>
                <h2 className="text-sm font-black text-white/30 uppercase tracking-[0.4em]">Animux</h2>
              </div>

              {/* Botón de Apoyo / Donación */}
              <button
                onClick={() => setShowDonate(true)}
                className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-rose-600/20 group"
              >
                <span className="text-base group-hover:scale-110 transition-transform">💛</span>
                Apoyar el Proyecto
              </button>

              <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
                <button
                  onClick={() => setShowLegal(true)}
                  className="text-[10px] font-black text-gray-500 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <Scale className="w-3 h-3" />
                  Términos y Condiciones
                </button>
                <button
                  onClick={() => setShowLegal(true)}
                  className="text-[10px] font-black text-gray-500 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <Shield className="w-3 h-3" />
                  Privacidad
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] text-gray-700 font-bold uppercase tracking-[0.2em]">
                  Versión {APP_VERSION} • © {new Date().getFullYear()}
                </p>
                <p className="text-[8px] text-gray-800 font-medium max-w-[280px] leading-relaxed">
                  Animux es un reproductor de medios independiente. No alojamos contenido en nuestros servidores.
                </p>
              </div>
            </footer>
          </div>
        </main>
      </div>

      <BottomNav activeCategory={activeCategory} setActiveCategory={setActiveCategory} onSearchOpen={() => setIsSearchOpen(true)} />

      {activeChannel && (
        <Player
          channel={activeChannel}
          playlist={filteredChannels}
          onPlayNext={(c) => setActiveChannel(c)}
          onReportBroken={handleReportBroken}
          onClose={() => setActiveChannel(null)}
          isFavorite={favorites.includes(String(activeChannel.id))}
          onToggleFavorite={() => handleToggleFavorite(activeChannel)}
        />
      )}
      {selectedDetail && <DetailsModal channel={selectedDetail} onClose={() => setSelectedDetail(null)} onPlay={setActiveChannel} isFavorite={favorites.includes(String(selectedDetail.id))} />}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} onUpdate={loadData} />}
      {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}
      {showTvGuide && <TvGuideModal onClose={() => setShowTvGuide(false)} />}
      {showDonate && <DonateModal onClose={() => setShowDonate(false)} />}
      {showInstallGuide && (
        <InstallGuide
          onClose={() => setShowInstallGuide(false)}
          onInstall={() => {
            if (deferredPrompt) {
              deferredPrompt.prompt();
              deferredPrompt.userChoice.then(() => {
                setDeferredPrompt(null);
                setShowInstall(false);
              });
            }
          }}
        />
      )}

      <Toast />
      <NewsBanner />
    </div>
  );
}
