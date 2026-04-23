import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { X, AlertCircle, Loader2, Play, PictureInPicture } from 'lucide-react';
import { XTREAM_SERVERS, buildStreamURL } from '../config/servers';

export default function Player({ channel, onClose, playlist = [], onPlayNext, onReportBroken, isInline = false }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [useEmbed, setUseEmbed] = useState(false);
  const [serverIndex, setServerIndex] = useState(-1); // -1 means trying original URL first
  const [currentUrl, setCurrentUrl] = useState('');
  
  const isYouTube = channel?.url?.includes('youtube.com') || channel?.url?.includes('youtu.be');

  // Function to get the final URL (Original or Xtream Rotation)
  const getStreamUrl = (targetChannel, sIdx) => {
    if (sIdx === -1) return targetChannel.url;
    
    // Try to extract an Xtream ID from the original URL if not explicitly provided
    let xtreamId = targetChannel.xtreamId;
    if (!xtreamId && targetChannel.url.includes('/live/')) {
      const parts = targetChannel.url.split('/');
      const lastPart = parts[parts.length - 1]; // e.g. "7.m3u8"
      xtreamId = lastPart.split('.')[0]; // e.g. "7"
    }

    if (xtreamId && XTREAM_SERVERS[sIdx]) {
      return buildStreamURL(XTREAM_SERVERS[sIdx], xtreamId);
    }
    
    return null;
  };

  const tryNextServer = () => {
    const nextIndex = serverIndex + 1;
    if (nextIndex < XTREAM_SERVERS.length) {
      console.log(`Switching to Xtream Server ${nextIndex + 1}...`);
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

  useEffect(() => {
    if ('mediaSession' in navigator && channel) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: channel.displayName || channel.name,
        artist: 'Animux Streaming',
        album: channel.category || 'Televisión en Vivo',
        artwork: [{ src: channel.logo, sizes: '512x512', type: 'image/png' }]
      });
      navigator.mediaSession.setActionHandler('play', () => videoRef.current?.play());
      navigator.mediaSession.setActionHandler('pause', () => videoRef.current?.pause());
      navigator.mediaSession.setActionHandler('nexttrack', handleEnded);
    }
  }, [channel]);

  useEffect(() => {
    if (!channel) return;
    setUseEmbed(false);
    setError(false);
    setLoading(true);
    setServerIndex(-1); // Reset to original URL
    setCurrentUrl(channel.url);

    if (videoRef.current) {
      videoRef.current.onended = handleEnded;
      videoRef.current.onplaying = () => {
        setError(false);
        setLoading(false);
      };
    }
  }, [channel]);

  // Effect to update currentUrl when serverIndex changes
  useEffect(() => {
    if (serverIndex >= 0) {
      const newUrl = getStreamUrl(channel, serverIndex);
      if (newUrl) {
        setCurrentUrl(newUrl);
      } else {
        // If no Xtream ID can be found, skip to error
        setError(true);
        setLoading(false);
      }
    }
  }, [serverIndex]);

  useEffect(() => {
    if (!currentUrl || !videoRef.current || isYouTube) {
       if (isYouTube) setLoading(false);
       return;
    }
    
    const video = videoRef.current;
    let hls;
    const isDirectVideo = currentUrl.toLowerCase().includes('.mp4') || channel.isVOD;

    const timeoutId = setTimeout(() => {
      if (!video.paused || video.currentTime > 0) return;
      tryNextServer(); // Try next server on timeout
    }, 15000);

    if (isDirectVideo) {
      video.src = currentUrl;
      video.oncanplay = () => {
        clearTimeout(timeoutId);
        setLoading(false);
        video.play().catch(() => {});
      };
      video.onerror = () => {
        if (channel.embedUrl && !useEmbed) {
           setUseEmbed(true);
           setLoading(false);
        } else {
           tryNextServer();
        }
      };
    } else if (Hls.isSupported()) {
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
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try next server instead of just restarting
              clearTimeout(timeoutId);
              tryNextServer();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              clearTimeout(timeoutId);
              tryNextServer();
              hls.destroy();
              break;
          }
        }
      });
    }

    return () => {
      clearTimeout(timeoutId);
      if (hls) hls.destroy();
    };
  }, [currentUrl]);

  if (!channel) return null;

  const currentName = String(channel.displayName || channel.name || 'Cargando...').replace('undefined - ', '');

  return (
    <div className={`${isInline ? 'relative h-full' : 'fixed inset-0'} z-[110] flex flex-col bg-black animate-fade-in`}>
      {!isInline && (
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/90 to-transparent z-50">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
              <X className="w-6 h-6 text-white" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-white font-black text-xl md:text-2xl tracking-tight truncate max-w-[200px] md:max-w-md uppercase italic">
                {currentName}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-rose-600 text-[10px] font-black uppercase tracking-[0.2em]">{channel.category}</span>
                {serverIndex >= 0 && (
                  <span className="text-[8px] bg-rose-600/20 text-rose-500 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                    Servidor {serverIndex + 1}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={togglePiP} className="p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-all">
             <PictureInPicture className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="relative flex-1 bg-black flex items-center justify-center group overflow-hidden">
          {useEmbed || isYouTube ? (
            <iframe
              src={isYouTube ? `https://www.youtube.com/embed/${channel.url.split('v=')[1] || channel.url.split('/').pop()}?autoplay=1` : channel.embedUrl}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-contain bg-black"
              controls
              autoPlay
              playsInline
            />
          )}

          {loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
              <Loader2 className="w-10 h-10 text-rose-600 animate-spin mb-3" />
              <p className="text-white font-black text-xs tracking-[0.3em] uppercase">
                {serverIndex >= 0 ? `Rotando Servidor ${serverIndex + 1}...` : 'Sintonizando...'}
              </p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-20 p-6 text-center">
              <AlertCircle className="w-12 h-12 text-rose-600 mb-4" />
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Emisión Caída</h3>
               <p className="text-gray-400 text-sm max-w-xs mx-auto font-medium">Hemos probado {XTREAM_SERVERS.length + 1} servidores y ninguno responde actualmente.</p>
               <div className="flex gap-3 mt-8">
                 <button onClick={onClose} className="px-10 py-3 bg-white/10 text-white rounded-full font-black text-[10px] uppercase tracking-widest border border-white/10">Cerrar</button>
                 <button 
                   onClick={() => { onReportBroken(channel.id); onClose(); }}
                   className="px-10 py-3 bg-rose-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest"
                 >
                   Reportar
                 </button>
               </div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-[400px] bg-[#050505] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col h-1/3 lg:h-full overflow-hidden">
           <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Próximos Canales</h3>
              <span className="text-[10px] bg-rose-600/10 border border-rose-600/20 px-3 py-1 rounded text-rose-500 font-black">{playlist.length} CANALES</span>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {playlist.map((item, idx) => {
                 const isActive = String(item.id) === String(channel.id);
                 const itemName = String(item.displayName || item.name || 'Sin Título').replace('undefined - ', '');
                 return (
                   <div 
                     key={item.id}
                     onClick={() => !isActive && onPlayNext(item)}
                     className={`flex gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${isActive ? 'bg-rose-600/10 border-rose-600/30' : 'hover:bg-white/[0.03] border-transparent'}`}
                   >
                     <div className={`rounded-lg overflow-hidden shrink-0 relative bg-black shadow-lg ${item.isVOD ? 'w-12 aspect-[2/3]' : 'w-24 aspect-video'}`}>
                        <img src={item.logo} alt="" className={`w-full h-full transition-opacity ${item.isVOD ? 'object-cover' : 'object-contain p-2'} ${isActive ? 'opacity-30' : 'opacity-100'}`} />
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-2 h-2 bg-rose-600 rounded-full animate-ping" />
                          </div>
                        )}
                     </div>
                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className={`text-sm md:text-base font-black truncate leading-tight tracking-tight ${isActive ? 'text-rose-500' : 'text-white'}`}>
                           {itemName}
                        </h4>
                        <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest mt-1">
                          {item.category || 'General'}
                        </p>
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
