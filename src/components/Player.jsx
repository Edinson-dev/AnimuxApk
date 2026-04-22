import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { X, Maximize, AlertCircle, Loader2, MessageSquare, Settings, PictureInPicture, Play } from 'lucide-react';

export default function Player({ channel, onClose, playlist = [], onPlayNext, onReportBroken, isInline = false }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [useEmbed, setUseEmbed] = useState(false);
  
  const isYouTube = channel?.url?.includes('youtube.com') || channel?.url?.includes('youtu.be');

  const handleEnded = () => {
    if (onPlayNext && playlist.length > 0) {
      const currentIndex = playlist.findIndex(item => String(item.id) === String(channel.id));
      if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
        onPlayNext(playlist[currentIndex + 1]);
      }
    }
  };

  useEffect(() => {
    if (!channel) return;
    setUseEmbed(false);
    setError(false);
    setLoading(true);

    if (videoRef.current) {
      videoRef.current.onended = handleEnded;
    }
  }, [channel]);

  useEffect(() => {
    if (!channel || !videoRef.current || isYouTube) {
       if (isYouTube) setLoading(false);
       return;
    }
    
    const video = videoRef.current;
    let hls;
    const isDirectVideo = (channel?.url || "").toLowerCase().includes('.mp4') || channel.isVOD;

    const timeoutId = setTimeout(() => {
      if (channel.isVOD && channel.embedUrl) {
         setUseEmbed(true);
         setLoading(false);
      } else {
         setError(true);
         setLoading(false);
      }
    }, 15000);

    if (isDirectVideo) {
      video.src = channel.url;
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
           setError(true);
           setLoading(false);
        }
      };
    } else if (Hls.isSupported()) {
      hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        clearTimeout(timeoutId);
        setLoading(false);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, () => {
         setError(true);
         setLoading(false);
      });
    }

    return () => {
      clearTimeout(timeoutId);
      if (hls) hls.destroy();
    };
  }, [channel]);

  if (!channel) return null;

  const currentName = String(channel.displayName || channel.name || 'Cargando...').replace('undefined - ', '');

  return (
    <div className={`${isInline ? 'relative h-full' : 'fixed inset-0'} z-[110] flex flex-col bg-black animate-fade-in`}>
      {/* Top Header - Improved Readability */}
      {!isInline && (
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent z-50">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
              <X className="w-6 h-6 text-white" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-white font-bold text-lg md:text-xl tracking-tight truncate max-w-[200px] md:max-w-md">
                {currentName}
              </h2>
              <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">{channel.category}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Main Player Area */}
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
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
              <p className="text-white font-bold text-sm tracking-[0.2em] uppercase">Sintonizando...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-20 p-6 text-center">
              <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 uppercase">Error de Conexión</h3>
               <p className="text-gray-400 text-sm max-w-xs mx-auto">Este enlace no está disponible actualmente.</p>
               <div className="flex gap-3 mt-8">
                 <button onClick={onClose} className="px-8 py-3 bg-white/10 text-white rounded-full font-bold text-xs uppercase transition-all">Cerrar</button>
                 <button 
                   onClick={() => { onReportBroken(channel.id); onClose(); }}
                   className="px-8 py-3 bg-rose-600 text-white rounded-full font-bold text-xs uppercase transition-all"
                 >
                   Eliminar
                 </button>
               </div>
            </div>
          )}
        </div>

        {/* Sidebar: Playlist - Much more readable */}
        <div className="w-full lg:w-[380px] bg-[#0a0a0f] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col h-1/3 lg:h-full overflow-hidden">
           <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Siguiente Contenido</h3>
              <span className="text-[10px] bg-white/5 px-3 py-1 rounded text-gray-400 font-bold">{playlist.length} CANALES</span>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {playlist.map((item, idx) => {
                 const isActive = String(item.id) === String(channel.id);
                 const itemName = String(item.displayName || item.name || 'Sin Título').replace('undefined - ', '');
                 return (
                   <div 
                     key={item.id}
                     onClick={() => !isActive && onPlayNext(item)}
                     className={`flex gap-4 p-3.5 rounded-2xl cursor-pointer transition-all border ${isActive ? 'bg-indigo-600/20 border-indigo-500/40' : 'hover:bg-white/5 border-transparent'}`}
                   >
                     <div className={`rounded-lg overflow-hidden shrink-0 relative bg-black ${item.isVOD ? 'w-12 aspect-[2/3]' : 'w-20 aspect-video'}`}>
                        <img src={item.logo} alt="" className={`w-full h-full transition-opacity ${item.isVOD ? 'object-cover' : 'object-contain p-1'} ${isActive ? 'opacity-40' : 'opacity-100'}`} />
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center">
                             <Play className="w-4 h-4 text-white fill-current animate-pulse" />
                          </div>
                        )}
                     </div>
                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className={`text-[13px] md:text-sm font-bold truncate leading-tight ${isActive ? 'text-indigo-400' : 'text-white'}`}>
                           {itemName}
                        </h4>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">
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
