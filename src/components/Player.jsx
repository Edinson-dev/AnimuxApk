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
    const isDirectVideo = channel?.url?.toLowerCase()?.includes('.mp4') || channel.isVOD;

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
    <div className={`${isInline ? 'relative h-full' : 'fixed inset-0'} z-[110] flex flex-col bg-[#060608] animate-fade-in font-sans`}>
      {/* Top Header - More compact */}
      {!isInline && (
        <div className="flex items-center justify-between p-3 bg-gradient-to-b from-black to-transparent z-50">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-all">
              <X className="w-5 h-5 text-white" />
            </button>
            <div>
              <h2 className="text-white font-black text-xs md:text-sm tracking-tighter truncate max-w-[200px] md:max-w-md uppercase">
                {currentName}
              </h2>
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
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
              <p className="text-white font-black text-xs animate-pulse tracking-[0.3em] uppercase">Cargando...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 p-4 text-center">
              <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
              <h3 className="text-lg font-black text-white mb-1 uppercase tracking-tighter">Error de Emisión</h3>
               <p className="text-gray-500 text-[10px] max-w-[200px] mx-auto font-medium">Contenido restringido o enlace caducado.</p>
               <div className="flex gap-2 mt-6">
                 <button onClick={onClose} className="px-6 py-2.5 bg-white/10 text-white rounded-full font-black uppercase tracking-widest text-[9px] hover:bg-white/20 transition-all">Cerrar</button>
                 <button 
                   onClick={() => {
                     onReportBroken(channel.id);
                     onClose();
                   }}
                   className="px-6 py-2.5 bg-rose-600 text-white rounded-full font-black uppercase tracking-widest text-[9px] hover:bg-rose-500 transition-all shadow-xl shadow-rose-500/20"
                 >
                   Eliminar
                 </button>
               </div>
            </div>
          )}
        </div>

        {/* Sidebar: Next Content - More compact */}
        <div className="w-full lg:w-[320px] bg-[#0a0a0f] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col h-1/3 lg:h-full overflow-hidden">
           <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Siguiente</h3>
              <span className="text-[9px] text-indigo-400 font-black uppercase">
                {playlist.length} Canales
              </span>
           </div>
           <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
              {playlist.map((item, idx) => {
                 const isActive = String(item.id) === String(channel.id);
                 const itemName = String(item.displayName || item.name || 'Sin Título').replace('undefined - ', '');
                 return (
                   <div 
                     key={item.id}
                     onClick={() => !isActive && onPlayNext(item)}
                     className={`flex gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-300 border ${isActive ? 'bg-indigo-600/10 border-indigo-500/20' : 'hover:bg-white/5 border-transparent'}`}
                   >
                     <div className={`rounded-xl overflow-hidden shrink-0 relative bg-[#12121e] ${item.isVOD ? 'w-10 aspect-[2/3]' : 'w-16 aspect-video'}`}>
                        <img src={item.logo} alt="" className={`w-full h-full transition-opacity duration-500 ${item.isVOD ? 'object-cover' : 'object-contain p-1'} ${isActive ? 'opacity-40' : 'opacity-60'}`} />
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center">
                             <Play className="w-3 h-3 text-white fill-current animate-pulse" />
                          </div>
                        )}
                     </div>
                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className={`text-[11px] font-bold truncate tracking-tight ${isActive ? 'text-indigo-400' : 'text-white/80'}`}>
                           {itemName}
                        </h4>
                        <p className="text-[8px] text-white/20 uppercase font-black tracking-widest mt-0.5">
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
