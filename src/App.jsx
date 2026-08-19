import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { X, Scale, Shield, ShoppingBag, SlidersHorizontal } from 'lucide-react';
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
import CommunityCard from './components/ui/CommunityCard';
import FilterControls from './components/ui/FilterControls';
import AdBanner from './components/ui/AdBanner';
import NativeAdCard from './components/ui/NativeAdCard';
import PrerollAd from './components/ui/PrerollAd';
import { ADS_CONFIG, shouldShowPreroll } from './config/ads';

import { db } from './config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import AdminPanel from './components/core/AdminPanel';
import LegalModal from './components/ui/LegalModal';
import InstallGuide from './components/ui/InstallGuide';
import TvGuideModal from './components/ui/TvGuideModal';
import DonateModal from './components/ui/DonateModal';
import { sendTelegramMessage } from './config/telegram';
import { translateCat, matchesCat } from './utils/categories';
import { matchesYear, matchesGenre, applySorting } from './utils/filters';
import { version } from '../package.json';

const APP_VERSION = version;

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
  const [pendingChannel, setPendingChannel] = useState(null);
  const [showPreroll, setShowPreroll] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [brokenChannels, setBrokenChannels] = useState(() => JSON.parse(localStorage.getItem('animux_broken') || '[]'));
  const [showAdmin, setShowAdmin] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Estados de Filtros: Año, Género y Popularidad
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedPopularity, setSelectedPopularity] = useState('default');

  const handleResetFilters = useCallback(() => {
    setSelectedYear('all');
    setSelectedGenre('all');
    setSelectedPopularity('default');
  }, []);

  const isCustomFiltering = selectedYear !== 'all' || selectedGenre !== 'all' || selectedPopularity !== 'default';

  // Auto-Actualización Inteligente (PWA)
  useEffect(() => {
    if (needRefresh) {
      if (activeChannel) {
        // Si están viendo una película, no se la cortamos.
        toast.success('Nueva actualización descargada en segundo plano.');
      } else {
        // Si están en el menú, recargamos automáticamente para aplicar la nueva versión.
        toast.success('Versión más reciente detectada. Recargando...', { duration: 3000 });
        setTimeout(() => updateServiceWorker(true), 3000);
      }
    }
  }, [needRefresh, activeChannel, updateServiceWorker]);
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

        // Splash rápido si hay caché — el usuario ya conoce la marca
        setTimeout(() => setIsAppLoading(false), 1200);
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
        // Splash breve — suficiente para apreciar la marca sin frustrar al usuario
        setTimeout(() => setIsAppLoading(false), 1500);
      }
    }
  };

  const forceRefresh = () => loadData(true);

  const allCategories = useMemo(() => {
    const baseCats = ['Cine (VOD)', 'Series (VOD)', 'Podcasts', 'Maratones 24/7', 'TV Abierta', 'Deportes', 'Documentales', 'Infantil', 'Música', 'Anime', 'Entretenimiento'];
    const translatedCloud = cloudCategories.map(translateCat).filter(Boolean);

    // Solo agregar categorías de la nube que no estén ya en nuestras baseCats lógicas
    const finalCats = new Set([...baseCats, 'Favoritos']);
    translatedCloud.forEach(cat => {
      const normalized = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      if (!normalized.includes('cine') && !normalized.includes('pelicula') && !normalized.includes('serie') && !normalized.includes('podcast')) {
        finalCats.add(cat);
      }
    });
    return Array.from(finalCats);
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

  const groupedChannels = useMemo(() => {
    const grouped = [];
    const seenGroups = new Set();

    for (const item of allUnique) {
      if (item.groupId && item.isVOD) {
        if (!seenGroups.has(item.groupId)) {
          seenGroups.add(item.groupId);
          // Eliminar el sufijo " - Cap X" o similar del nombre para la portada
          const seriesName = (item.name || item.title || '').split('-')[0].trim();
          grouped.push({ ...item, isGroupRepresentative: true, displayName: seriesName });
        }
      } else {
        grouped.push(item);
      }
    }
    return grouped;
  }, [allUnique]);

  const handleReportBroken = (channel) => {
    const updated = [...brokenChannels, String(channel.id)];
    setBrokenChannels(updated);
    localStorage.setItem('animux_broken', JSON.stringify(updated));
    toast.error('Canal reportado. Se ocultará de la lista.');

    // Notificar al administrador vía Telegram
    const message = `🚨 <b>REPORTE DE FALLO</b>\n\n` +
      `📺 <b>Canal:</b> ${channel.name || channel.title}\n` +
      `📂 <b>Categoría:</b> ${channel.category}\n` +
      `🔗 <b>URL:</b> ${channel.url}\n` +
      `🆔 <b>ID:</b> ${channel.id}\n\n` +
      `<i>El usuario ha reportado que este enlace no funciona.</i>`;

    sendTelegramMessage(message);
    setActiveChannel(null);
  };

  const filteredChannels = useMemo(() => {
    let result = [...groupedChannels];

    // 1. Filtro maestro de Modo Kids
    if (isKidsMode) {
      const kidsKeywords = ['infantil', 'kids', 'muñeco', 'disney', 'nickelodeon', 'cartoon', 'dibujo', 'niño', 'junior', 'boing', 'clan'];
      result = result.filter(c => {
        const cat = (c.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const name = (c.name || c.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return kidsKeywords.some(kw => cat.includes(kw) || name.includes(kw));
      });
    }

    // 2. Búsqueda por texto (Search Query)
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => 
        (c.name || c.title || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
      );
    }

    // 3. Categoría activa
    if (activeCategory === 'Favoritos') {
      result = result.filter(c => favorites.includes(String(c.id)));
    } else if (activeCategory !== 'Inicio') {
      const target = activeCategory.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      if (target === 'nuevos' || target === 'nuevo') {
        result = result.filter(c => c.isNew === true);
      } else {
        result = result.filter(c => matchesCat(c, target));
      }
    }

    // 4. Filtro por Género (Genre)
    if (selectedGenre && selectedGenre !== 'all') {
      result = result.filter(c => matchesGenre(c, selectedGenre));
    }

    // 5. Filtro por Año (Year)
    if (selectedYear && selectedYear !== 'all') {
      result = result.filter(c => matchesYear(c, selectedYear));
    }

    // 6. Popularidad / Ordenamiento (Popularity & Sorting)
    if (selectedPopularity && selectedPopularity !== 'default') {
      result = applySorting(result, selectedPopularity);
    }

    return result;
  }, [groupedChannels, isKidsMode, searchQuery, activeCategory, favorites, selectedGenre, selectedYear, selectedPopularity]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    allCategories.forEach(cat => {
      const target = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

      if (cat === 'Favoritos') {
        counts[cat] = favorites.length;
      } else if (target === 'nuevos' || target === 'nuevo') {
        counts[cat] = groupedChannels.filter(c => c.isNew === true).length;
      } else {
        counts[cat] = groupedChannels.filter(c => matchesCat(c, target)).length;
      }
    });
    return counts;
  }, [allCategories, allUnique, favorites]);

  const recentChannels = useMemo(() => {
    return recentlyWatched.map(id => allUnique.find(c => String(c.id) === String(id))).filter(Boolean).slice(0, 12);
  }, [recentlyWatched, allUnique]);

  // ── Memoized callbacks for ChannelCard (prevents re-renders) ──
  const handlePlay = useCallback((ch) => {
    // Si es una serie (representante de grupo), buscamos el último episodio visto
    let resolvedChannel = ch;
    if (ch.isGroupRepresentative && ch.groupId) {
      const lastEpisodeId = localStorage.getItem(`animux_last_episode_${ch.groupId}`);
      if (lastEpisodeId) {
        const lastEpisode = allUnique.find(item => String(item.id) === String(lastEpisodeId));
        if (lastEpisode) resolvedChannel = lastEpisode;
      }
    }
    // Pre-roll ad: mostrar antes de reproducir si aplica
    if (shouldShowPreroll()) {
      setPendingChannel(resolvedChannel);
      setShowPreroll(true);
    } else {
      setActiveChannel(resolvedChannel);
    }
  }, [allUnique]);
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
  }, [activeCategory, searchQuery, selectedYear, selectedGenre, selectedPopularity]);

  // Reset visible count when category or filters change
  useEffect(() => { setVisibleCount(48); }, [activeCategory, selectedYear, selectedGenre, selectedPopularity, searchQuery]);

  // ── Lógica de SEO Dinámico (Debe ir antes de cualquier return condicional) ────
  const seoData = useMemo(() => {
    const defaultTitle = "Animux - Streaming Premium de Películas, Series y TV en Vivo";
    const defaultDesc = "Disfruta de las mejores películas, series y canales de TV en vivo totalmente gratis en Animux. Calidad premium, sin anuncios intrusivos y actualizaciones diarias.";

    const active = activeChannel || selectedDetail;
    if (active) {
      const name = active.name || active.title;
      const type = active.isVOD ? (active.groupId ? 'Serie' : 'Película') : 'Canal';
      return {
        title: `Ver ${name} Online Gratis (${active.year || '2024'}) - Animux`,
        description: active.description || `Mira ${name} en calidad premium. ${type} disponible ahora en Animux Streaming.`,
        image: active.logo,
        url: window.location.href
      };
    }

    if (activeCategory !== 'Inicio') {
      return {
        title: `${activeCategory} Online - Catálogo Completo Animux`,
        description: `Explora nuestra sección de ${activeCategory}. Los mejores títulos de ${activeCategory} seleccionados para ti.`,
        image: "/icon-512.png",
        url: window.location.href
      };
    }

    return {
      title: defaultTitle,
      description: defaultDesc,
      image: "/icon-512.png",
      url: window.location.origin
    };
  }, [activeChannel, selectedDetail, activeCategory]);

  if (isAppLoading) {
    return (
      <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center font-sans overflow-hidden">
        {/* Lightweight ambient glow (no animate-pulse, no blur-[120px]) */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] bg-rose-600/8 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-10">
          {/* Logo */}
          <div className="relative scale-110">
            <div className="absolute inset-0 bg-rose-600 rounded-full blur-[30px] opacity-15" />
            <div className="relative w-24 h-24 md:w-32 md:h-32 p-4 bg-white/5 rounded-[2rem] border border-white/10 shadow-2xl flex items-center justify-center transform animate-float">
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

            {/* Loader sencillo */}
            <div className="w-10 h-10 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-rose-600/20" />
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
      <Helmet defaultTitle="Animux - Streaming Premium" titleTemplate="%s">
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />

        {/* Open Graph / Facebook / WhatsApp */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoData.title} />
        <meta property="og:description" content={seoData.description} />
        <meta property="og:image" content={seoData.image} />
        <meta property="og:url" content={seoData.url} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoData.title} />
        <meta name="twitter:description" content={seoData.description} />
        <meta name="twitter:image" content={seoData.image} />
      </Helmet>

      {/* Thematic Spotlights Background (Mundial / Deportes) */}
      {/* Ambient glow — estático para no consumir GPU con animate-pulse constante */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[40%] h-[50%] bg-blue-600/8 rounded-full blur-[150px]" />
        <div className="absolute top-[-10%] right-[10%] w-[40%] h-[50%] bg-emerald-600/6 rounded-full blur-[150px]" />
        <div className="absolute bottom-[20%] left-[30%] w-[50%] h-[50%] bg-rose-600/4 rounded-full blur-[150px]" />
      </div>

      <Header
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        onGoHome={() => {
          setActiveCategory('Inicio');
          setSearchQuery('');
          setLogoClicks(p => {
            if (p + 1 === 5) {
              const pwd = window.prompt('🔒 Acceso Restringido. Introduce la clave de administrador:');
              const correctPwd = import.meta.env.VITE_ADMIN_PASSWORD || 'animux2024';
              if (pwd === correctPwd) {
                setShowAdmin(true);
              } else if (pwd !== null) {
                alert('❌ Clave incorrecta. Acceso denegado.');
              }
              return 0;
            }
            return p + 1;
          });
        }}
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

        <main id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar bg-transparent pt-3 md:pt-16 pb-36 md:pb-12 safe-area-bottom z-10 relative scroll-smooth">
          <div className="max-w-[1800px] mx-auto px-3.5 sm:px-6 md:px-8 py-3 md:py-6 space-y-6 md:space-y-8">

            {activeCategory === 'Inicio' && !searchQuery && !isCustomFiltering ? (
              <div className="space-y-6 md:space-y-8 animate-fade-in">
                <Hero
                  featuredChannel={
                    isKidsMode
                      ? allUnique.find(c => (c.category || '').toLowerCase().includes('infantil') && c.featured) || allUnique.find(c => (c.category || '').toLowerCase().includes('infantil')) || allUnique[0]
                      : allUnique.find(m => m.featured) || allUnique[0]
                  }
                  onPlay={handlePlay}
                  onDetails={setSelectedDetail}
                />

                {/* Filtros rápidos en Inicio */}
                <FilterControls
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                  selectedGenre={selectedGenre}
                  setSelectedGenre={setSelectedGenre}
                  selectedPopularity={selectedPopularity}
                  setSelectedPopularity={setSelectedPopularity}
                  totalResults={groupedChannels.length}
                  onResetFilters={handleResetFilters}
                />

                <CommunityCard />

                {/* 📢 Banner Publicitario */}
                <AdBanner />

                {isKidsMode ? (
                  <div className="space-y-6 md:space-y-8">
                    {/* Fila 1: Top Infantiles */}
                    <div className="space-y-4 md:space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-yellow-400 rounded-full" />
                        <h3 className="text-lg md:text-2xl font-black uppercase tracking-tighter">Top Infantiles</h3>
                      </div>
                      <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-3 md:pb-4 -mx-3.5 sm:-mx-6 md:-mx-8 px-3.5 sm:px-6 md:px-8 scroll-smooth">
                        {allUnique.filter(c => (c.category || '').toLowerCase().includes('infantil')).slice(0, 15).map(c => (
                          <div key={c.id} className="w-[125px] min-[420px]:w-[145px] sm:w-[170px] md:w-[200px] lg:w-[220px] shrink-0">
                            <ChannelCard channel={c} onPlay={handlePlay} isFavorite={favorites.includes(String(c.id))} />
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Fila 2: Anime y Dibujos */}
                    <LazyRow>
                      <div className="space-y-4 md:space-y-5">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 bg-blue-400 rounded-full" />
                          <h3 className="text-lg md:text-2xl font-black uppercase tracking-tighter">Anime y Dibujos</h3>
                        </div>
                        <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-3 md:pb-4 -mx-3.5 sm:-mx-6 md:-mx-8 px-3.5 sm:px-6 md:px-8 scroll-smooth">
                          {groupedChannels.filter(c => (c.category || '').toLowerCase().includes('anime') || (c.category || '').toLowerCase().includes('muñeco')).slice(0, 15).map(c => (
                            <div key={c.id} className="w-[125px] min-[420px]:w-[145px] sm:w-[170px] md:w-[200px] lg:w-[220px] shrink-0">
                              <ChannelCard channel={c} onPlay={handlePlay} isFavorite={favorites.includes(String(c.id))} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </LazyRow>

                    {/* Fila 3: Canales Disney & Nick */}
                    <LazyRow>
                      <div className="space-y-4 md:space-y-5">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 bg-purple-400 rounded-full" />
                          <h3 className="text-lg md:text-2xl font-black uppercase tracking-tighter">Mundo Disney & Nick</h3>
                        </div>
                        <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-3 md:pb-4 -mx-3.5 sm:-mx-6 md:-mx-8 px-3.5 sm:px-6 md:px-8 scroll-smooth">
                          {groupedChannels.filter(c => {
                            const name = (c.name || '').toLowerCase();
                            return name.includes('disney') || name.includes('nick') || name.includes('cartoon');
                          }).slice(0, 15).map(c => (
                            <div key={c.id} className="w-[125px] min-[420px]:w-[145px] sm:w-[170px] md:w-[200px] lg:w-[220px] shrink-0">
                              <ChannelCard channel={c} onPlay={handlePlay} isFavorite={favorites.includes(String(c.id))} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </LazyRow>
                  </div>
                ) : (
                  <div className="space-y-6 md:space-y-8">
                    {/* Fila: Películas (VOD) */}
                    {allUnique.filter(c => matchesCat(c, 'cine (vod)')).length > 0 && (
                      <LazyRow>
                        <div className="space-y-4 md:space-y-5">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                            <h3 className="text-lg md:text-2xl font-black uppercase tracking-tighter">Cine (VOD)</h3>
                          </div>
                          <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-3 md:pb-4 -mx-3.5 sm:-mx-6 md:-mx-8 px-3.5 sm:px-6 md:px-8 scroll-smooth">
                            {allUnique.filter(c => matchesCat(c, 'cine (vod)')).slice(0, 15).map(c => (
                              <div key={c.id} className="w-[125px] min-[420px]:w-[145px] sm:w-[170px] md:w-[200px] lg:w-[220px] shrink-0">
                                <ChannelCard channel={c} onPlay={handlePlay} isFavorite={favorites.includes(String(c.id))} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </LazyRow>
                    )}

                    {/* Fila: Series (VOD) */}
                    {groupedChannels.filter(c => matchesCat(c, 'series (vod)')).length > 0 && (
                      <LazyRow>
                        <div className="space-y-4 md:space-y-5">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                            <h3 className="text-lg md:text-2xl font-black uppercase tracking-tighter">Series (VOD)</h3>
                          </div>
                          <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-3 md:pb-4 -mx-3.5 sm:-mx-6 md:-mx-8 px-3.5 sm:px-6 md:px-8 scroll-smooth">
                            {groupedChannels.filter(c => matchesCat(c, 'series (vod)')).slice(0, 15).map(c => (
                              <div key={c.id} className="w-[125px] min-[420px]:w-[145px] sm:w-[170px] md:w-[200px] lg:w-[220px] shrink-0">
                                <ChannelCard channel={c} onPlay={handlePlay} isFavorite={favorites.includes(String(c.id))} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </LazyRow>
                    )}

                    {/* Fila: Deportes */}
                    {allUnique.filter(c => matchesCat(c, 'deportes')).length > 0 && (
                      <LazyRow>
                        <div className="space-y-4 md:space-y-5">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                            <h3 className="text-lg md:text-2xl font-black uppercase tracking-tighter">Deportes en Vivo</h3>
                          </div>
                          <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-3 md:pb-4 -mx-3.5 sm:-mx-6 md:-mx-8 px-3.5 sm:px-6 md:px-8 scroll-smooth">
                            {allUnique.filter(c => matchesCat(c, 'deportes')).slice(0, 15).map(c => (
                              <div key={c.id} className="w-[125px] min-[420px]:w-[145px] sm:w-[170px] md:w-[200px] lg:w-[220px] shrink-0">
                                <ChannelCard channel={c} onPlay={handlePlay} isFavorite={favorites.includes(String(c.id))} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </LazyRow>
                    )}

                    {/* Fila 4: Continuar Viendo */}
                    {recentChannels.length > 0 && (
                      <div className="space-y-4 md:space-y-5">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                          <h3 className="text-lg md:text-2xl font-black uppercase tracking-tighter">Continuar Viendo</h3>
                        </div>
                        <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-3 md:pb-4 -mx-3.5 sm:-mx-6 md:-mx-8 px-3.5 sm:px-6 md:px-8 scroll-smooth">
                          {recentChannels.map(c => (
                            <div key={c.id} className="w-[125px] min-[420px]:w-[145px] sm:w-[170px] md:w-[200px] lg:w-[220px] shrink-0">
                              <ChannelCard channel={c} onPlay={handlePlay} isFavorite={favorites.includes(String(c.id))} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resto de Categorías dinámicas */}
                    {allCategories.filter(c => {
                      const baseFilter = !['Favoritos', 'Nuevos', 'Inicio', 'Deportes', 'Cine (VOD)', 'Series (VOD)'].includes(c);
                      if (isKidsMode) {
                        const lowCat = c.toLowerCase();
                        return baseFilter && (lowCat.includes('infantil') || lowCat.includes('kids') || lowCat.includes('muñeco') || lowCat.includes('anime') || lowCat.includes('dibujo'));
                      }
                      return baseFilter;
                    }).map(cat => {
                      const target = cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                      const items = groupedChannels.filter(c => matchesCat(c, target));
                      if (!items.length) return null;
                      return (
                        <LazyRow key={cat}>
                          <div className="space-y-4 md:space-y-5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-white/20 rounded-full" />
                                <h3 className="text-lg md:text-2xl font-black uppercase tracking-tighter">{cat}</h3>
                              </div>
                              <button onClick={() => setActiveCategory(cat)} className="text-[10px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-widest bg-rose-500/10 px-4 py-2 rounded-full transition-all">Explorar Todo</button>
                            </div>
                            <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-3 md:pb-4 -mx-3.5 sm:-mx-6 md:-mx-8 px-3.5 sm:px-6 md:px-8 scroll-smooth">
                              {items.slice(0, 15).map(c => <div key={c.id} className="w-[125px] min-[420px]:w-[145px] sm:w-[170px] md:w-[200px] lg:w-[220px] shrink-0"><ChannelCard channel={c} onPlay={handlePlay} isFavorite={favorites.includes(String(c.id))} /></div>)}
                            </div>
                          </div>
                        </LazyRow>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="animate-view-enter space-y-6" key={`${activeCategory}-${selectedYear}-${selectedGenre}-${selectedPopularity}-${searchQuery}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-rose-600 rounded-full" />
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter">
                      {searchQuery
                        ? `Búsqueda: "${searchQuery}"`
                        : isCustomFiltering && activeCategory === 'Inicio'
                        ? 'Explorar Catálogo'
                        : activeCategory}
                    </h2>
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] bg-white/5 px-3.5 py-1.5 rounded-full border border-white/5">
                    {filteredChannels.length} Resultados
                  </p>
                </div>

                {/* Filter Controls Bar */}
                <FilterControls
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                  selectedGenre={selectedGenre}
                  setSelectedGenre={setSelectedGenre}
                  selectedPopularity={selectedPopularity}
                  setSelectedPopularity={setSelectedPopularity}
                  totalResults={filteredChannels.length}
                  onResetFilters={handleResetFilters}
                />

                {filteredChannels.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-white/[0.02] border border-white/5 rounded-3xl p-8 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-rose-600/10 flex items-center justify-center text-rose-500">
                      <SlidersHorizontal className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">No se encontraron resultados</h3>
                      <p className="text-xs text-gray-400 max-w-md mx-auto font-medium">
                        No hay contenidos que coincidan con la combinación de filtros seleccionada (año, género o búsqueda).
                      </p>
                    </div>
                    <button
                      onClick={handleResetFilters}
                      className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-600/20 active:scale-95"
                    >
                      Restablecer Filtros
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 md:gap-6 stagger-grid">
                    {filteredChannels.slice(0, visibleCount).map((c, idx) => (
                      <React.Fragment key={c.id}>
                        {/* Insertar anuncio nativo cada N tarjetas */}
                        {ADS_CONFIG.inGridEnabled && idx > 0 && idx % ADS_CONFIG.inGridInterval === 0 && (
                          <NativeAdCard />
                        )}
                        <ChannelCard channel={c} onPlay={handlePlay} isFavorite={favorites.includes(String(c.id))} onToggleFavorite={handleToggleFavorite} />
                      </React.Fragment>
                    ))}
                  </div>
                )}

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
          playlist={allUnique}
          onPlayNext={(c) => setActiveChannel(c)}
          onReportBroken={handleReportBroken}
          onClose={() => setActiveChannel(null)}
          isFavorite={favorites.includes(String(activeChannel.id))}
          onToggleFavorite={() => handleToggleFavorite(activeChannel.id)}
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

      {/* Pre-roll Ad Overlay */}
      {showPreroll && pendingChannel && (
        <PrerollAd
          channelName={pendingChannel.displayName || pendingChannel.name}
          onComplete={() => {
            setShowPreroll(false);
            setActiveChannel(pendingChannel);
            setPendingChannel(null);
          }}
        />
      )}
    </div>
  );
}
