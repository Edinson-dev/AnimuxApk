import React, { useState, useEffect, useMemo } from 'react';
import { Home, Tv, Film, Heart, AlertCircle, History, Search as SearchIcon, Loader2 } from 'lucide-react';
import Header from './components/Header';
import Hero from './components/Hero';
import ChannelCard from './components/ChannelCard';
import Player from './components/Player';
import DetailsModal from './components/DetailsModal';
import Skeleton from './components/Skeleton';
import { XTREAM_SERVERS, fetchVODStreams } from './config/servers';
import { fetchAndFilterMovies } from './utils/m3uParser';
import { getMovieDetails } from './utils/tmdb';

export default function App() {
  const [channelData, setChannelData] = useState({ channels: [] });
  const [localMovies, setLocalMovies] = useState([]);
  const [vodData, setVodData] = useState([]);
  const [externalMovies, setExternalMovies] = useState([]);
  const [isVodLoading, setIsVodLoading] = useState(false);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('animux_favs') || '[]'));
  const [recentlyWatched, setRecentlyWatched] = useState(() => JSON.parse(localStorage.getItem('animux_recent') || '[]'));
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannel, setActiveChannel] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [brokenChannels, setBrokenChannels] = useState(() => JSON.parse(localStorage.getItem('animux_broken') || '[]'));
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  const channelsPerPage = 48;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }
    if (!installPrompt) {
      setShowInstallInstructions(true);
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const loadData = async () => {
    try {
      setIsAppLoading(true);
      setError(null);
      // Load Live Channels
      const chRes = await fetch('/channels.json');
      if (chRes.ok) {
        const data = await chRes.json();
        setChannelData(data);
      }
      // Load Local Movies
      const movRes = await fetch('/movies.json');
      if (movRes.ok) {
        const data = await movRes.json();
        setLocalMovies(data.map(m => ({ ...m, isVOD: true, displayName: m.title })));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setTimeout(() => setIsAppLoading(false), 800);
    }
  };

  useEffect(() => {
    const loadContent = async () => {
      if (activeCategory === 'Filmes' && (vodData.length === 0 || externalMovies.length === 0)) {
        setIsVodLoading(true);
        try {
          if (externalMovies.length === 0) {
            const ext = await fetchAndFilterMovies();
            setExternalMovies(ext);
          }
          if (vodData.length === 0) {
            const movies = await fetchVODStreams(XTREAM_SERVERS[0]);
            if (movies && movies.length > 0) setVodData(movies);
          }
        } catch (err) {
          console.error("Content Fetch failed:", err);
        } finally {
          setIsVodLoading(false);
        }
      }
    };
    loadContent();
  }, [activeCategory]);

  useEffect(() => {
    loadData();
    window.onGoHome = () => { setActiveCategory('Todos'); setSearchQuery(''); };
    window.setActiveCategory = (cat) => setActiveCategory(cat);
  }, []);

  const addToRecent = (channel) => {
    if (!channel) return;
    const filtered = recentlyWatched.filter(id => String(id) !== String(channel.id));
    const newRecent = [String(channel.id), ...filtered].slice(0, 15);
    setRecentlyWatched(newRecent);
    localStorage.setItem('animux_recent', JSON.stringify(newRecent));
  };

  const toggleFavorite = (id) => {
    const newFavs = favorites.includes(String(id))
      ? favorites.filter(fid => fid !== String(id))
      : [...favorites, String(id)];
    setFavorites(newFavs);
    localStorage.setItem('animux_favs', JSON.stringify(newFavs));
  };

  const handleReportBroken = (id) => {
    const newBroken = [...new Set([...brokenChannels, String(id)])];
    setBrokenChannels(newBroken);
    localStorage.setItem('animux_broken', JSON.stringify(newBroken));
  };

  const handleItemClick = async (channel) => {
    // Play immediately
    setActiveChannel(channel);
    addToRecent(channel);

    // Enrich in background if it's a movie/film category
    const isVOD = channel.isVOD || channel.category?.toLowerCase().includes('cine') || channel.category?.toLowerCase().includes('filmes');
    if (isVOD) {
      try {
        const details = await getMovieDetails(channel.displayName || channel.name);
        if (details) {
          setActiveChannel(prev => (prev && String(prev.id) === String(channel.id) ? { ...prev, ...details } : prev));
        }
      } catch (err) {
        console.error("Background enrichment failed:", err);
      }
    }
  };

  const filteredChannels = useMemo(() => {
    let baseList = [...channelData.channels, ...localMovies];
    
    if (activeCategory === 'Filmes' || searchQuery) {
      baseList = [...baseList, ...vodData, ...externalMovies];
    }

    let result = baseList.filter(c => !brokenChannels.includes(String(c.id)));
    
    // De-duplication
    const uniqueMap = new Map();
    result.forEach(c => {
      const cleanName = (c.displayName || c.name || "").toLowerCase().trim();
      if (!uniqueMap.has(cleanName)) uniqueMap.set(cleanName, c);
    });
    result = Array.from(uniqueMap.values());

    if (activeCategory === 'Favoritos') {
      result = result.filter(c => favorites.includes(String(c.id)));
    } else if (activeCategory !== 'Todos') {
      const catNorm = activeCategory.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      
      result = result.filter(c => {
        const chCat = (c.category || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        
        if (activeCategory === 'Filmes') {
          return chCat.includes('cine') || chCat.includes('movie') || chCat.includes('film') || c?.isVOD || c?.isExternal;
        }
        if (activeCategory === 'General') {
          const mainNames = ['series', 'cine', 'movie', 'film', 'infantil', 'kids', 'ninos', 'musica', 'deportes', 'sports', 'anime'];
          return !mainNames.some(m => chCat.includes(m));
        }
        return chCat.includes(catNorm);
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        (c.name || "").toLowerCase().includes(q) || 
        (c.category || "").toLowerCase().includes(q)
      );
    }

    return result.map(channel => ({
       ...channel,
       displayName: (channel.displayName || channel.name || "").split(' [')[0].split(' (')[0].trim()
    })).filter(Boolean);
  }, [searchQuery, activeCategory, favorites, channelData, vodData, localMovies, externalMovies, brokenChannels]);

  const allCategories = useMemo(() => {
    try {
      const mainCats = ['Todos', 'Series', 'Filmes', 'Infantil', 'Música', 'Anime', 'Deportes', 'General', 'Favoritos'];
      const cats = new Set(mainCats);
      const allItems = [
        ...(Array.isArray(channelData?.channels) ? channelData.channels : []),
        ...(Array.isArray(localMovies) ? localMovies : []),
        ...(Array.isArray(vodData) ? vodData : []),
        ...(Array.isArray(externalMovies) ? externalMovies : [])
      ];
      
      const normalizeName = (name) => {
        if (!name || typeof name !== 'string') return "";
        const clean = name.trim()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        
        if (clean === 'musica') return 'Música';
        if (clean === 'pelicula' || clean === 'peliculas' || clean === 'cine') return 'Filmes';
        if (clean === 'infantil' || clean === 'kids' || clean === 'ninos') return 'Infantil';
        if (clean === 'deportes' || clean === 'sports') return 'Deportes';
        if (clean === 'anime') return 'Anime';
        if (clean === 'series') return 'Series';
        
        // If it's not one of the main ones, we don't add it as a top level category
        // but we'll use it to fill the "General" bucket later in filtering
        return null;
      };

      allItems.forEach(item => {
        if (item && typeof item.category === 'string') {
          const catPart = item.category.split(';')[0];
          const prettyName = normalizeName(catPart);
          if (prettyName) cats.add(prettyName);
        }
      });

      return Array.from(cats);
    } catch (err) {
      console.error("Categories error:", err);
      return ['Todos', 'Filmes', 'Series', 'General', 'Favoritos'];
    }
  }, [channelData, localMovies, vodData, externalMovies]);

  const displayedChannels = useMemo(() => {
    return filteredChannels.slice(0, page * channelsPerPage);
  }, [filteredChannels, page]);

  const loadMore = () => {
    if (displayedChannels.length < filteredChannels.length) {
      setPage(prev => prev + 1);
    }
  };

  const recentChannels = useMemo(() => {
    const allPossible = [...channelData.channels, ...vodData, ...localMovies, ...externalMovies];
    return recentlyWatched
      .map(id => allPossible.find(c => String(c.id) === String(id)))
      .filter(Boolean);
  }, [recentlyWatched, channelData.channels, vodData, localMovies, externalMovies]);

  if (isAppLoading) {
    return (
      <div className="flex flex-col h-screen bg-[#000000]">
        <Header searchQuery="" setSearchQuery={() => {}} />
        <div className="flex-1 overflow-hidden pt-24"><Skeleton /></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#000000] text-white overflow-hidden w-full relative">
      <Header 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        categories={allCategories || []} 
        activeCategory={activeCategory} 
        onInstall={handleInstall}
        showInstall={true}
      />

      {/* Floating Install Button */}
      <button 
        onClick={handleInstall}
        className="fixed bottom-28 right-6 md:bottom-10 md:right-10 z-[999] flex items-center justify-center gap-3 bg-rose-600 text-white p-4 md:px-8 md:py-4 rounded-full md:rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(225,29,72,0.4)] hover:bg-rose-700 transition-all animate-bounce-subtle group border border-white/10"
      >
        <Tv className="w-6 h-6 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
        <span className="hidden md:inline">Instalar Animux</span>
        <span className="md:hidden sr-only">Instalar</span>
      </button>

      {/* Android/Universal Install Instructions Modal */}
      {showInstallInstructions && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0d0d0f] border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-600/20">
              <SearchIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic mb-4 tracking-tighter">Instalar App</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Si no ves el aviso automático, puedes instalar Animux manualmente:
            </p>
            <div className="space-y-4 text-left mb-8">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 font-black text-rose-500 text-xs">1</div>
                <p className="text-[11px] text-white font-bold uppercase tracking-wide">Pulsa los '3 puntos' (Menú) de Chrome</p>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 font-black text-rose-500 text-xs">2</div>
                <p className="text-[11px] text-white font-bold uppercase tracking-wide">Selecciona 'Instalar aplicación'</p>
              </div>
            </div>
            <button 
              onClick={() => setShowInstallInstructions(false)}
              className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-600/20"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}

      {/* iOS Install Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0d0d0f] border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-600/20">
              <Tv className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic mb-4 tracking-tighter">Instalar en iPhone</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Para instalar la app en tu iPhone, sigue estos pasos:
            </p>
            <div className="space-y-4 text-left mb-8">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 font-black text-rose-500 text-xs">1</div>
                <p className="text-[11px] text-white font-bold uppercase tracking-wide">Pulsa el botón 'Compartir' en Safari</p>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 font-black text-rose-500 text-xs">2</div>
                <p className="text-[11px] text-white font-bold uppercase tracking-wide">Busca 'Añadir a pantalla de inicio'</p>
              </div>
            </div>
            <button 
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-600/20"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-32 md:pb-12 custom-scrollbar relative pt-20 px-4 md:px-8" id="scrollArea">
        <div className="max-w-[1920px] mx-auto py-6">
          {activeCategory === 'Todos' && !searchQuery ? (
            <div className="space-y-10 md:space-y-16 animate-fade-in">
              <Hero 
                featuredChannel={localMovies[0] || channelData.channels[0]} 
                onPlay={handleItemClick} 
                onDetails={setSelectedDetail} 
              />

              {recentChannels.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <History className="w-5 h-5 text-rose-500" />
                     <h3 className="text-xl md:text-2xl font-normal text-white uppercase tracking-widest">Continuar Viendo</h3>
                  </div>
                  <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-6">
                     {recentChannels.map(channel => (
                       <div key={`recent-${channel.id}`} className="w-[110px] md:w-[160px] shrink-0">
                         <ChannelCard 
                            channel={channel} 
                            onPlay={handleItemClick} 
                            isFavorite={favorites.includes(String(channel.id))}
                            onToggleFavorite={toggleFavorite}
                         />
                       </div>
                     ))}
                  </div>
                </div>
              )}
              
              {['Series', 'Filmes', 'Infantil', 'Musica', 'Anime', 'Deportes', 'Documentales', 'Religión'].map((cat) => {
                const items = (cat === 'Filmes' ? [...channelData.channels, ...vodData, ...localMovies, ...externalMovies] : channelData.channels)
                  .filter(c => {
                    const chCat = (c.category || "").toLowerCase();
                    if (cat === 'Filmes') return chCat.includes('cine') || chCat.includes('movie') || c.isVOD || c.isExternal;
                    return chCat.includes(cat.toLowerCase());
                  })
                  .slice(0, 18);
                
                if (items.length === 0) return null;

                return (
                  <div key={cat} className="space-y-4">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xl md:text-2xl font-normal text-white uppercase tracking-widest">{cat}</h3>
                       <button onClick={() => setActiveCategory(cat)} className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-white">Ver Todo</button>
                    </div>
                    <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-6">
                       {items.map(channel => (
                         <div key={channel.id} className="w-[110px] md:w-[160px] shrink-0">
                           <ChannelCard 
                              channel={channel} 
                              onPlay={handleItemClick} 
                              isFavorite={favorites.includes(String(channel.id))}
                              onToggleFavorite={toggleFavorite}
                           />
                         </div>
                       ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="animate-fade-in space-y-10">
              <div className="flex items-end justify-between border-b border-white/5 pb-4">
                 <h2 className="text-2xl md:text-4xl font-normal text-white uppercase tracking-widest">
                    {searchQuery ? `Resultados: ${searchQuery}` : activeCategory}
                 </h2>
                 {isVodLoading ? (
                    <div className="flex items-center gap-2">
                       <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
                       <span className="text-[9px] font-bold text-rose-500 tracking-widest uppercase">Cargando Catálogo...</span>
                    </div>
                 ) : (
                    <span className="text-[9px] font-bold text-gray-600 tracking-widest uppercase">{filteredChannels.length} Títulos</span>
                 )}
              </div>

              {displayedChannels.length === 0 && !isVodLoading ? (
                 <div className="py-20 text-center">
                    <SearchIcon className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                    <p className="text-gray-500 uppercase font-black text-xs tracking-widest">No se encontraron resultados</p>
                 </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6">
                  {displayedChannels.map(channel => (
                    <ChannelCard 
                      key={channel.id} 
                      channel={channel} 
                      onPlay={handleItemClick}
                      isFavorite={favorites.includes(String(channel.id))}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              )}
              
              {displayedChannels.length < filteredChannels.length && (
                <div className="flex justify-center mt-12 mb-12">
                  <button onClick={loadMore} className="px-10 py-3 bg-white/5 border border-white/10 hover:border-white/30 text-white rounded-full font-bold text-[9px] tracking-widest uppercase transition-all">Ver más</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-[70] bg-black/80 backdrop-blur-3xl border-t border-white/[0.03] py-4 flex justify-around items-center md:hidden">
         <button onClick={() => { setActiveCategory('Todos'); setSearchQuery(''); }} className={`p-2 ${activeCategory === 'Todos' ? 'text-white' : 'text-gray-500'}`}><Home className="w-6 h-6" /></button>
         <button onClick={() => setActiveCategory('Series')} className={`p-2 ${activeCategory === 'Series' ? 'text-white' : 'text-gray-500'}`}><Tv className="w-6 h-6" /></button>
         <button onClick={() => setActiveCategory('Filmes')} className={`p-2 ${activeCategory === 'Filmes' ? 'text-white' : 'text-gray-500'}`}><Film className="w-6 h-6" /></button>
         <button onClick={() => setActiveCategory('Favoritos')} className={`p-2 ${activeCategory === 'Favoritos' ? 'text-white' : 'text-gray-500'}`}><Heart className="w-6 h-6" /></button>
      </nav>

      {activeChannel && (
        <Player 
          channel={activeChannel} 
          onClose={() => setActiveChannel(null)} 
          playlist={filteredChannels}
          onPlayNext={(ch) => { setActiveChannel(ch); addToRecent(ch); }}
          onReportBroken={handleReportBroken}
        />
      )}

      {selectedDetail && (
        <DetailsModal 
          channel={selectedDetail} 
          onClose={() => setSelectedDetail(null)} 
          onPlay={(ch) => { setActiveChannel(ch); addToRecent(ch); setSelectedDetail(null); }}
          isFavorite={favorites.includes(String(selectedDetail.id))}
          toggleFavorite={toggleFavorite}
          allChannels={[...channelData.channels, ...vodData, ...localMovies, ...externalMovies]}
          onSelect={setSelectedDetail}
        />
      )}
    </div>
  );
}
