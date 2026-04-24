import React, { useState, useEffect, useMemo } from 'react';
import { Home, Tv, Film, Heart, AlertCircle, History, Search as SearchIcon, Loader2 } from 'lucide-react';
import Header from './components/Header';
import Hero from './components/Hero';
import ChannelCard from './components/ChannelCard';
import Player from './components/Player';
import DetailsModal from './components/DetailsModal';
import Skeleton from './components/Skeleton';
import { db } from './config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [channelData, setChannelData] = useState({ channels: [] });
  const [localMovies, setLocalMovies] = useState([]);
  const [vodData, setVodData] = useState([]);
  const [externalMovies, setExternalMovies] = useState([]);
  const [cloudCategories, setCloudCategories] = useState([]);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('animux_favs') || '[]'));
  const [recentlyWatched, setRecentlyWatched] = useState(() => JSON.parse(localStorage.getItem('animux_recent') || '[]'));
  
  // Mantenemos 'Inicio' como estado interno para la página principal
  const [activeCategory, setActiveCategory] = useState('Inicio');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannel, setActiveChannel] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [brokenChannels, setBrokenChannels] = useState(() => JSON.parse(localStorage.getItem('animux_broken') || '[]'));
  const [showAdmin, setShowAdmin] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

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
      const catSnapshot = await getDocs(collection(db, "categories"));
      const cats = catSnapshot.docs.map(doc => doc.data().name);
      setCloudCategories(cats);

      const chanSnapshot = await getDocs(collection(db, "channels"));
      const cloudChans = chanSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, fromCloud: true }));
      const rChan = await fetch('/channels.json');
      const jsonChans = rChan.ok ? (await rChan.json()).channels : [];
      setChannelData({ channels: [...cloudChans, ...jsonChans] });

      const movSnapshot = await getDocs(collection(db, "movies"));
      const cloudMovs = movSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, isVOD: true, displayName: doc.data().title, fromCloud: true }));
      const rMov = await fetch('/movies.json');
      const jsonMovs = rMov.ok ? (await rMov.json()).map(m => ({ ...m, isVOD: true, displayName: m.title })) : [];
      setLocalMovies([...cloudMovs, ...jsonMovs]);

      localStorage.setItem('animux_cache_cats', JSON.stringify(cats));
      localStorage.setItem('animux_cache_chans', JSON.stringify([...cloudChans, ...jsonChans]));
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

  const allCategories = useMemo(() => {
    // ELIMINADO: 'Explorar' o 'Todos' ya no aparecen en el texto del menú
    const baseCats = ['Nuevos', 'Series', 'Películas', 'Deportes', 'Infantil', 'Música', 'Anime'];
    return Array.from(new Set([...baseCats, ...cloudCategories, 'Favoritos']));
  }, [cloudCategories]);

  const filteredChannels = useMemo(() => {
    let base = [...localMovies, ...channelData.channels];
    let result = base.filter(c => !brokenChannels.includes(String(c.id)));
    
    const unique = new Map();
    result.forEach(c => { 
      const n = (c.displayName || c.title || c.name || "").toLowerCase().trim(); 
      if (n && (!unique.has(n) || c.fromCloud)) unique.set(n, c); 
    });
    result = Array.from(unique.values());

    if (activeCategory === 'Nuevos') return result.filter(c => c.isNew === true).reverse();

    if (activeCategory !== 'Inicio' && activeCategory !== 'Todos') {
      const catNorm = activeCategory.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      
      result = result.filter(c => {
        if (c.isNew) return false;
        const chCat = (c.category || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        if (catNorm === 'peliculas') return chCat.includes('pelicula') || chCat.includes('cine') || chCat.includes('movie') || chCat.includes('filmes') || chCat.includes('vod') || chCat.includes('entertainment') || c.isVOD;
        if (catNorm === 'series') return chCat.includes('serie') || chCat.includes('show') || chCat.includes('novela');
        if (catNorm === 'deportes') return chCat.includes('deporte') || chCat.includes('sport') || chCat.includes('futbol');
        if (catNorm === 'infantil') return chCat.includes('infantil') || chCat.includes('kid') || chCat.includes('dibujo') || chCat.includes('cartoon');
        if (catNorm === 'musica') return chCat.includes('musica') || chCat.includes('music') || chCat.includes('clip');
        return chCat === catNorm || chCat.includes(catNorm);
      });
    }

    if (activeCategory === 'Favoritos') return result.filter(c => favorites.includes(String(c.id)));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => (c.name || c.title || "").toLowerCase().includes(q) || (c.category || "").toLowerCase().includes(q));
    }
    return result;
  }, [searchQuery, activeCategory, favorites, channelData, localMovies, brokenChannels]);

  const handleItemClick = (channel) => {
    setActiveChannel(channel);
    const newRecent = [String(channel.id), ...recentlyWatched.filter(id => String(id) !== String(channel.id))].slice(0, 15);
    setRecentlyWatched(newRecent);
    localStorage.setItem('animux_recent', JSON.stringify(newRecent));
  };

  if (isAppLoading) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="w-10 h-10 text-rose-600 animate-spin" /></div>;

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-white overflow-hidden w-full relative">
      <Header 
        searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
        categories={allCategories} activeCategory={activeCategory} 
        setActiveCategory={setActiveCategory}
        onGoHome={() => { 
          setLogoClicks(p => p + 1 === 5 ? (setShowAdmin(true), 0) : p + 1); 
          setActiveCategory('Inicio'); // El logo nos lleva al inicio
          setSearchQuery(''); 
        }}
        onInstall={() => {}} showInstall={true}
      />

      <main className="flex-1 overflow-y-auto pb-32 pt-20 px-4 md:px-8 custom-scrollbar">
        <div className="max-w-[1920px] mx-auto py-6">
          {activeCategory === 'Inicio' && !searchQuery ? (
            <div className="space-y-12 animate-fade-in">
              <Hero featuredChannel={localMovies.find(m => m.featured) || localMovies[0]} onPlay={handleItemClick} onDetails={setSelectedDetail} />
              
              {filteredChannels.filter(c => c.isNew).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><h3 className="text-xl md:text-2xl font-black uppercase tracking-widest text-rose-500 italic">Nuevos Estrenos</h3><button onClick={() => setActiveCategory('Nuevos')} className="text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-white">Ver Todo</button></div>
                  <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-6">
                    {filteredChannels.filter(c => c.isNew).slice(0, 12).map(c => <div key={`new-${c.id}`} className="w-[110px] md:w-[160px] shrink-0"><ChannelCard channel={c} onPlay={handleItemClick} isFavorite={favorites.includes(String(c.id))} onToggleFavorite={() => {}} /></div>)}
                  </div>
                </div>
              )}

              {allCategories.filter(c => c !== 'Favoritos' && c !== 'Nuevos').map(cat => {
                const items = filteredChannels.filter(c => {
                  if (c.isNew) return false;
                  const chCat = (c.category || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                  const target = cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                  if (target === 'peliculas') return chCat.includes('pelicula') || chCat.includes('cine') || chCat.includes('movie') || chCat.includes('filmes') || chCat.includes('vod') || chCat.includes('entertainment') || c.isVOD;
                  if (target === 'series') return chCat.includes('serie') || chCat.includes('show') || chCat.includes('novela');
                  return chCat === target || chCat.includes(target);
                }).slice(0, 18);
                if (items.length === 0) return null;
                return (
                  <div key={cat} className="space-y-4">
                    <div className="flex items-center justify-between"><h3 className="text-xl md:text-2xl font-black uppercase tracking-widest italic">{cat}</h3><button onClick={() => setActiveCategory(cat)} className="text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-white">Ver Todo</button></div>
                    <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-6">{items.map(c => <div key={c.id} className="w-[110px] md:w-[160px] shrink-0"><ChannelCard channel={c} onPlay={handleItemClick} isFavorite={favorites.includes(String(c.id))} onToggleFavorite={(id) => { const n = favorites.includes(String(id)) ? favorites.filter(f => f !== String(id)) : [...favorites, String(id)]; setFavorites(n); localStorage.setItem('animux_favs', JSON.stringify(n)); }} /></div>)}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="animate-fade-in space-y-10">
              <div className="flex items-end justify-between border-b border-white/5 pb-4"><h2 className="text-2xl md:text-4xl font-black uppercase tracking-widest italic">{searchQuery ? `Buscar: ${searchQuery}` : activeCategory}</h2><span className="text-[9px] font-bold text-gray-600 tracking-widest uppercase">{filteredChannels.length} Títulos</span></div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6">{filteredChannels.slice(0, 64).map(c => <ChannelCard key={c.id} channel={c} onPlay={handleItemClick} isFavorite={favorites.includes(String(c.id))} onToggleFavorite={(id) => { const n = favorites.includes(String(id)) ? favorites.filter(f => f !== String(id)) : [...favorites, String(id)]; setFavorites(n); localStorage.setItem('animux_favs', JSON.stringify(n)); }} />)}</div>
            </div>
          )}
        </div>
      </main>

      {activeChannel && <Player channel={activeChannel} onClose={() => setActiveChannel(null)} playlist={filteredChannels} onPlayNext={handleItemClick} onReportBroken={(id) => { const n = [...new Set([...brokenChannels, String(id)])]; setBrokenChannels(n); localStorage.setItem('animux_broken', JSON.stringify(n)); }} />}
      {selectedDetail && <DetailsModal channel={selectedDetail} onClose={() => setSelectedDetail(null)} onPlay={(ch) => { handleItemClick(ch); setSelectedDetail(null); }} isFavorite={favorites.includes(String(selectedDetail.id))} toggleFavorite={(id) => { const n = favorites.includes(String(id)) ? favorites.filter(f => f !== String(id)) : [...favorites, String(id)]; setFavorites(n); localStorage.setItem('animux_favs', JSON.stringify(n)); }} allChannels={[...channelData.channels, ...localMovies]} onSelect={setSelectedDetail} />}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} onUpdate={() => loadData(true)} />}
    </div>
  );
}
