import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import ChannelCard from './components/ChannelCard';
import Player from './components/Player';
import Hero from './components/Hero';
import Carousel from './components/Carousel';
import { Tv2, Heart, Compass, Grid, Zap, Play } from 'lucide-react';

function App() {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [recentlyWatched, setRecentlyWatched] = useState(null);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [channelData, setChannelData] = useState({ channels: [] });
  const [visibleCount, setVisibleCount] = useState(24);
  
  useEffect(() => {
    setVisibleCount(24);
  }, [activeCategory, searchQuery]);
  
  const featuredHeroChannel = useMemo(() => {
    if (!channelData.channels.length) return null;
    const defaultFeatured = channelData.channels.find(c => c.category === 'Series' || c.category === 'Cine') || channelData.channels[0];
    return defaultFeatured;
  }, [channelData]);

  useEffect(() => {
    fetch('/channels.json')
      .then(res => res.json())
      .then(data => {
        setChannelData(data);
        
        const urlParams = new URLSearchParams(window.location.search);
        const playId = urlParams.get('play');
        if (playId) {
           const channel = data.channels.find(c => c.id === parseInt(playId));
           if (channel) {
             setActiveChannel(channel);
             setRecentlyWatched(channel);
             localStorage.setItem('viciontv_recent', channel.id.toString());
             window.history.replaceState({}, document.title, "/");
           }
        } else {
          const savedRecent = localStorage.getItem('viciontv_recent');
          if (savedRecent) {
            const channel = data.channels.find(c => c.id === parseInt(savedRecent));
            if (channel) setRecentlyWatched(channel);
          }
        }
      })
      .catch(err => console.error("Error loading channels:", err))
      .finally(() => {
        setIsAppLoading(false);
      });

    const savedFavorites = localStorage.getItem('viciontv_favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const handlePlayChannel = (channel) => {
    setActiveChannel(channel);
    setRecentlyWatched(channel);
    localStorage.setItem('viciontv_recent', channel.id.toString());
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const newFavs = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('viciontv_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const filteredChannels = useMemo(() => {
    return channelData.channels.filter(channel => {
      const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (activeCategory === 'Todos') return matchesSearch;
      if (activeCategory === 'Favoritos') return matchesSearch && favorites.includes(channel.id);
      
      const cleanCategory = channel.category ? channel.category.split(';')[0].trim() : 'General';
      return matchesSearch && cleanCategory === activeCategory;
    });
  }, [searchQuery, activeCategory, favorites, channelData]);

  const dynamicCategories = useMemo(() => {
    const catsAndCounts = {};
    channelData.channels.forEach(c => {
      const cleanCat = c.category ? c.category.split(';')[0].trim() : 'General';
      catsAndCounts[cleanCat] = (catsAndCounts[cleanCat] || 0) + 1;
    });
    
    // Filtramos categorias muy raras de iptv-org si hay pocas (opcional, pero las agrupamos)
    const sortedNames = Object.keys(catsAndCounts).filter(k => catsAndCounts[k] > 2).sort();
    return [
      { name: 'Todos', count: channelData.channels.length },
      ...sortedNames.map(name => ({name, count: catsAndCounts[name]})),
      { name: 'Favoritos', count: favorites.length }
    ];
  }, [channelData, favorites]);

  return (
    <div className="flex h-[100dvh] bg-[#030305] text-white overflow-hidden w-full relative selection:bg-indigo-500/30 font-sans">
      
      {/* Immersive Deep Glows */}
      <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] bg-indigo-900/20 rounded-full blur-[200px] pointer-events-none mix-blend-screen opacity-50"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-900/20 rounded-full blur-[150px] pointer-events-none mix-blend-screen opacity-50"></div>

      <main className="flex-1 flex flex-col relative z-10 w-full h-full overflow-hidden custom-scrollbar bg-transparent">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        
        {/* Sleek Categories Navigation */}
        <div className="w-full px-6 md:px-12 py-6 overflow-x-auto custom-scrollbar sticky top-0 z-40 bg-gradient-to-b from-[#030305] via-[#030305]/95 to-transparent flex gap-4 items-center snap-x mask-fade overflow-y-hidden">
          {dynamicCategories.map((cat) => {
            const catName = typeof cat === 'string' ? cat : cat.name;
            const isActive = activeCategory === catName;
            return (
              <button
                key={catName}
                onClick={() => setActiveCategory(catName)}
                className={`snap-center shrink-0 flex items-center gap-2.5 px-7 py-3 rounded-2xl font-semibold tracking-wide transition-all duration-300 transform active:scale-95 ${isActive ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-[0_4px_25px_rgba(79,70,229,0.5)] border border-indigo-400/50' : 'glass-panel text-gray-400 hover:text-white hover:bg-white/[0.05] hover:-translate-y-0.5 border border-white/[0.05] shadow-lg hover:border-white/20'}`}
              >
                {catName === 'Todos' && <Compass className="w-4 h-4" />}
                {catName === 'Favoritos' && <Heart className={`w-4 h-4 ${isActive ? 'fill-white' : ''}`} />}
                {catName !== 'Todos' && catName !== 'Favoritos' && <Grid className="w-4 h-4" />}
                {catName}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 pt-4 relative custom-scrollbar scroll-smooth" id="scrollArea">
          
          {isAppLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-[2000px] mx-auto">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="glass-panel rounded-3xl overflow-hidden animate-pulse aspect-square md:aspect-video flex flex-col border border-white/[0.03]">
                  <div className="w-full h-full bg-white/[0.02]"></div>
                </div>
              ))}
            </div>
          ) : activeCategory === 'Todos' && !searchQuery ? (
            <div className="max-w-[2000px] mx-auto space-y-16">
              {/* Cinematic Hero */}
              <Hero featuredChannel={featuredHeroChannel} onPlay={handlePlayChannel} />
              
              {/* Continue Watching Section */}
              {recentlyWatched && (
                <div className="mb-12 animate-fade-in">
                   <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-3 tracking-tight">
                     <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg">
                       <Play className="w-5 h-5 text-white fill-current" />
                     </div>
                     Seguir Viendo
                   </h2>
                   <div className="w-full sm:w-[350px] transition-transform duration-300 hover:-translate-y-1">
                     <ChannelCard 
                       channel={recentlyWatched}
                       isFavorite={favorites.includes(recentlyWatched.id)}
                       toggleFavorite={toggleFavorite}
                       onPlay={handlePlayChannel}
                     />
                   </div>
                </div>
              )}

              {/* Dynamic Grids Categories */}
              {dynamicCategories.filter(cat => cat.name !== 'Todos' && cat.name !== 'Favoritos').map(category => {
                const categoryChannels = channelData.channels.filter(c => c.category === category.name).slice(0, 14); // Optimized limit for mobile perf
                if (categoryChannels.length === 0) return null;
                
                return (
                  <div key={category.name} className="animate-fade-in-up">
                    <div className="flex justify-between items-end mb-6 px-1">
                      <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight relative cursor-pointer group inline-block">
                        {category.name}
                        <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-indigo-500 rounded-full group-hover:w-full transition-all duration-500"></span>
                      </h2>
                      <button onClick={() => setActiveCategory(category.name)} className="text-indigo-400 hover:text-white font-medium text-sm transition-colors cursor-pointer hidden md:block">
                        Ver todo →
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-5">
                      {categoryChannels.map(channel => (
                        <ChannelCard 
                          key={channel.id}
                          channel={channel}
                          isFavorite={favorites.includes(channel.id)}
                          toggleFavorite={toggleFavorite}
                          onPlay={handlePlayChannel}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="max-w-[2000px] mx-auto pb-20">
              <div className="flex items-center gap-4 mb-10">
                <h2 className="text-4xl font-black text-white tracking-tight">
                  {searchQuery ? 'Resultados de ' : ''} <span className="text-indigo-400">{searchQuery || activeCategory}</span>
                </h2>
                <span className="bg-white/10 text-white font-medium px-4 py-1.5 rounded-full text-sm border border-white/5">
                  {filteredChannels.length} canales
                </span>
              </div>
              
              {filteredChannels.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-5 animate-fade-in">
                    {filteredChannels.slice(0, visibleCount).map(channel => (
                      <ChannelCard 
                        key={channel.id}
                        channel={channel}
                        isFavorite={favorites.includes(channel.id)}
                        toggleFavorite={toggleFavorite}
                        onPlay={handlePlayChannel}
                      />
                    ))}
                  </div>
                  {filteredChannels.length > visibleCount && (
                    <div className="flex justify-center mt-12 mb-8">
                      <button 
                        onClick={() => setVisibleCount(prev => prev + 24)}
                        className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full border border-white/20 transition-all hover:scale-105 shadow-[0_4px_20px_rgba(255,255,255,0.05)]"
                      >
                        Cargar más canales...
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center glass-panel rounded-[3rem] mt-10">
                  <div className="bg-white/[0.03] p-8 rounded-full mb-8 border border-white/[0.05]">
                    <Tv2 className="w-20 h-20 text-gray-500" />
                  </div>
                  <h3 className="text-4xl font-black text-gray-200 mb-4">No encontramos resultados</h3>
                  <p className="text-gray-400 max-w-lg text-lg">
                    Revisa si está bien escrito o intenta con otra categoría.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {activeChannel && (
        <Player 
          channel={activeChannel} 
          onClose={() => setActiveChannel(null)} 
        />
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          .mask-fade {
             -webkit-mask-image: linear-gradient(to right, black 80%, transparent 100%);
             mask-image: linear-gradient(to right, black 80%, transparent 100%);
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fade-in {
            animation: fadeIn 0.4s ease-out forwards;
          }
        `
      }} />
    </div>
  );
}

export default App;
