import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { X, AlertCircle, Loader2, Play, PictureInPicture, Calendar, Clock } from 'lucide-react';
import { XTREAM_SERVERS, buildStreamURL, fetchShortEPG } from '../config/servers';

export default function Player({ channel, onClose, playlist = [], onPlayNext, onReportBroken, isInline = false }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [useEmbed, setUseEmbed] = useState(false);
  const [serverIndex, setServerIndex] = useState(-1);
  const [currentUrl, setCurrentUrl] = useState('');
  const [epgData, setEpgData] = useState([]);
  
  const isYouTube = channel?.url?.includes('youtube.com') || channel?.url?.includes('youtu.be');

  const getXtreamId = (targetChannel) => {
    let xtreamId = targetChannel.xtreamId;
    if (!xtreamId && targetChannel.url.includes('/live/')) {
      const parts = targetChannel.url.split('/');
      const lastPart = parts[parts.length - 1];
      xtreamId = lastPart.split('.')[0];
    }
    return xtreamId;
  };

  const getStreamUrl = (targetChannel, sIdx) => {
    if (sIdx === -1) return targetChannel.url;
    const xtreamId = getXtreamId(targetChannel);
    if (xtreamId && XTREAM_SERVERS[sIdx]) {
      return buildStreamURL(XTREAM_SERVERS[sIdx], xtreamId);
    }
    return null;
  };

  const tryNextServer = () => {
    const nextIndex = serverIndex + 1;
    if (nextIndex < XTREAM_SERVERS.length) {
      setServerIndex(nextIndex);
      setLoading(true);
      setError(false);
    } else {
      setError(true);
      setLoading(false);
    }
  };

  const handleEnded = () => {
    if (onPlayNext && playlist.length > 0) {
      const currentIndex = playlist.findIndex(item => String(item.id) === String(channel.id));
      if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
        onPlayNext(playlist[currentIndex + 1]);
      }
    }
  };

  // Media Session API for background playback
  useEffect(() => {
    if ('mediaSession' in navigator && channel) {
      navigator.mediaSession.metadata = new MediaSessionMetadata({
        title: channel.displayName || channel.name,
        artist: channel.category || 'Animux Streaming',
        album: 'Animux',
        artwork: [
          { src: channel.logo || '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => videoRef.current?.play());
      navigator.mediaSession.setActionHandler('pause', () => videoRef.current?.pause());
    }
  }, [channel]);

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP Error:', err);
    }
  };

  // EPG Fetching Effect
  useEffect(() => {
    const loadEPG = async () => {
      const xtreamId = getXtreamId(channel);
      const activeServer = serverIndex >= 0 ? XTREAM_SERVERS[serverIndex] : XTREAM_SERVERS[0];
      
      if (xtreamId && activeServer) {
        const epg = await fetchShortEPG(activeServer, xtreamId);
        if (epg) setEpgData(epg);
      }
    };
    
    setEpgData([]);
    loadEPG();
  }, [channel, serverIndex]);

  useEffect(() => {
    if ('mediaSession' in navigator && channel) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: channel.displayName || channel.name,
        artist: 'Animux Streaming',
        album: epgData[0]?.title || channel.category,
        artwork: [{ src: channel.logo, sizes: '512x512', type: 'image/png' }]
      });
      navigator.mediaSession.setActionHandler('play', () => videoRef.current?.play());
      navigator.mediaSession.setActionHandler('pause', () => videoRef.current?.pause());
      navigator.mediaSession.setActionHandler('nexttrack', handleEnded);
    }
  }, [channel, epgData]);

  useEffect(() => {
    if (!channel) return;
    setUseEmbed(false);
    setError(false);
    setLoading(true);
    setServerIndex(-1);
    setCurrentUrl(channel.url);

    if (videoRef.current) {
      videoRef.current.onended = handleEnded;
      videoRef.current.onplaying = () => {
        setError(false);
        setLoading(false);
      };
    }
  }, [channel]);

  useEffect(() => {
    if (serverIndex >= 0) {
      const newUrl = getStreamUrl(channel, serverIndex);
      if (newUrl) setCurrentUrl(newUrl);
      else { setError(true); setLoading(false); }
    }
  }, [serverIndex]);

  useEffect(() => {
    if (!currentUrl || !videoRef.current || isYouTube) {
       if (isYouTube) setLoading(false);
       return;
    }
    
    const video = videoRef.current;
    let hls;
    
    // Improved detection: Only direct if it's .mp4 or .mkv, use HLS for .m3u8 even in VOD
    const isM3U8 = currentUrl.toLowerCase().includes('.m3u8');
    const isDirectVideo = (currentUrl.toLowerCase().includes('.mp4') || currentUrl.toLowerCase().includes('.mkv')) && !isM3U8;

    const timeoutId = setTimeout(() => {
      if (!video.paused || video.currentTime > 0) return;
      tryNextServer();
    }, 8000); // Faster rotation (8s)

    if (isDirectVideo) {
      video.src = currentUrl;
      video.load();
      video.oncanplay = () => {
        clearTimeout(timeoutId);
        setLoading(false);
        video.play().catch(() => {});
      };
      video.onerror = () => {
        if (channel.embedUrl && !useEmbed) {
           setUseEmbed(true);
           setLoading(false);
        } else tryNextServer();
      };
    } else if (Hls.isSupported() && isM3U8) {
      hls = new Hls({ maxBufferLength: 30, enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(currentUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        clearTimeout(timeoutId);
        setLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          clearTimeout(timeoutId);
          tryNextServer();
        }
      });
    } else {
      // Fallback for direct URLs
      video.src = currentUrl;
      video.load();
      video.play().catch(() => {});
      setLoading(false);
      clearTimeout(timeoutId);
    }

    return () => {
      clearTimeout(timeoutId);
      if (hls) hls.destroy();
    };
  }, [currentUrl]);

  if (!channel) return null;

  const currentName = String(channel.displayName || channel.name || 'Cargando...').replace('undefined - ', '');
  const nowPlaying = epgData[0];
  const nextUp = epgData[1];

  return (
    <div className={`${isInline ? 'relative h-full' : 'fixed inset-0'} z-[110] flex flex-col bg-black animate-fade-in`}>
      {!isInline && (
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black via-black/80 to-transparent z-50">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
              <X className="w-6 h-6 text-white" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-white font-black text-lg md:text-xl tracking-tight truncate max-w-[180px] md:max-w-md uppercase italic leading-tight">
                {currentName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-rose-600 text-[9px] font-black uppercase tracking-[0.2em]">{channel.category}</span>
                {serverIndex >= 0 && (
                  <span className="text-[8px] bg-rose-600/20 text-rose-500 px-2 py-0.5 rounded font-black uppercase tracking-widest border border-rose-600/10">
                    S{serverIndex + 1}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mini EPG Top Bar (Desktop) */}
          {nowPlaying && (
            <div className="hidden lg:flex items-center gap-6 px-6 py-2 bg-white/[0.03] rounded-full border border-white/[0.05] animate-fade-in">
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-pulse" />
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">En Vivo:</p>
                  <p className="text-[10px] font-bold text-white uppercase truncate max-w-[200px]">{nowPlaying.title}</p>
               </div>
               {nextUp && (
                 <div className="flex items-center gap-2 border-l border-white/10 pl-6">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Sigue:</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase truncate max-w-[150px]">{nextUp.title}</p>
                 </div>
               )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button onClick={togglePiP} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-all">
               <PictureInPicture className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="relative flex-1 bg-black flex items-center justify-center group overflow-hidden">
          {useEmbed || isYouTube ? (
            <iframe
              src={isYouTube ? `https://www.youtube.com/embed/${channel.url.split('v=')[1] || channel.url.split('/').pop()}?autoplay=1` : channel.embedUrl}
              className="w-full h-full border-0"
              allowFullScreen
            ></iframe>
          ) : (
            <video 
              ref={videoRef} 
              className="w-full h-full object-contain bg-black shadow-2xl" 
              controls 
              autoPlay 
              playsInline 
            />
          )}

          {loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
              <Loader2 className="w-10 h-10 text-rose-600 animate-spin mb-4" />
              <p className="text-white font-black text-[10px] tracking-[0.4em] uppercase opacity-70">
                {serverIndex >= 0 ? `Rotando Servidor ${serverIndex + 1}...` : 'Sintonizando...'}
              </p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-20 p-6 text-center">
              <AlertCircle className="w-12 h-12 text-rose-600 mb-4 animate-bounce" />
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Emisión Caída</h3>
               <p className="text-gray-400 text-sm max-w-xs mx-auto font-medium">Todos los servidores de respaldo han fallado.</p>
               <div className="flex gap-3 mt-8">
                 <button onClick={onClose} className="px-10 py-3 bg-white/5 text-white rounded-full font-black text-[10px] uppercase tracking-widest border border-white/10">Cerrar</button>
                 <button onClick={() => { onReportBroken(channel.id); onClose(); }} className="px-10 py-3 bg-rose-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-600/30">Reportar</button>
               </div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-[400px] bg-[#050505] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col h-1/2 lg:h-full overflow-hidden">
           {/* EPG or TMDB Metadata Sidebar Section */}
           {(nowPlaying || channel.description || channel.rating) && (
             <div className="p-6 bg-gradient-to-br from-rose-600/10 to-transparent border-b border-white/5 animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                   <Clock className="w-4 h-4 text-rose-600" />
                   <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                     {nowPlaying ? 'Guía de Programación' : 'Información del Film'}
                   </h3>
                </div>
                
                <div className="space-y-4">
                   <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                      {channel.rating && (
                        <div className="flex items-center gap-1 mb-2">
                           {[...Array(5)].map((_, i) => (
                             <span key={i} className={`text-[10px] ${i < Math.round(channel.rating / 2) ? 'text-yellow-500' : 'text-white/10'}`}>★</span>
                           ))}
                           <span className="text-[9px] font-bold text-white/40 ml-2">{channel.year}</span>
                        </div>
                      )}
                      
                      <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">
                        {nowPlaying ? 'Ahora en Vivo' : 'Sinopsis'}
                      </p>
                      
                      <h4 className="text-sm font-black text-white uppercase italic leading-tight">
                        {nowPlaying ? nowPlaying.title : (channel.displayName || channel.name)}
                      </h4>
                      
                      <p className="text-[10px] text-gray-500 mt-2 line-clamp-6 leading-relaxed">
                        {nowPlaying ? nowPlaying.description : (channel.description || 'Cargando detalles técnicos de la obra...')}
                      </p>
                   </div>
                   
                   {nowPlaying && nextUp && (
                     <div className="px-4 py-2 border-l-2 border-gray-800">
                        <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-0.5">A Continuación</p>
                        <h5 className="text-[11px] font-bold text-gray-400 uppercase truncate">{nextUp.title}</h5>
                     </div>
                   )}
                </div>
             </div>
           )}

           <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Más Canales</h3>
              <span className="text-[9px] bg-rose-600/10 border border-rose-600/20 px-3 py-1 rounded text-rose-500 font-black">{playlist.length} TOTAL</span>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {playlist.map((item) => {
                 const isActive = String(item.id) === String(channel.id);
                 const itemName = String(item.displayName || item.name || 'Sin Título').replace('undefined - ', '');
                 return (
                   <div key={item.id} onClick={() => !isActive && onPlayNext(item)}
                     className={`flex gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${isActive ? 'bg-rose-600/10 border-rose-600/30 scale-[1.02]' : 'hover:bg-white/[0.03] border-transparent'}`}
                   >
                     <div className={`rounded-lg overflow-hidden shrink-0 relative bg-black shadow-lg ${item.isVOD ? 'w-10 aspect-[2/3]' : 'w-20 aspect-video'}`}>
                        <img src={item.logo} alt="" className={`w-full h-full transition-opacity ${item.isVOD ? 'object-cover' : 'object-contain p-2'} ${isActive ? 'opacity-20' : 'opacity-100'}`} />
                        {isActive && <div className="absolute inset-0 flex items-center justify-center"><div className="w-2 h-2 bg-rose-600 rounded-full animate-ping" /></div>}
                     </div>
                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className={`text-[13px] font-black truncate tracking-tight uppercase ${isActive ? 'text-rose-500 italic' : 'text-white'}`}>{itemName}</h4>
                        <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mt-1">{item.category}</p>
                     </div>
                   </div>
                 );
              })}
           </div>
        </div>
      </div>
    </div>
  );
}
