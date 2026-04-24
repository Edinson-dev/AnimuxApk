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

  // Enhanced Detectors
  const getYouTubeId = (url = '') => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = String(url).match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getDriveId = (url = '') => {
    const match = String(url).match(/\/d\/(.+?)\/(view|edit|preview)?/);
    return match ? match[1] : null;
  };

  const ytId = getYouTubeId(channel?.url);
  const driveId = getDriveId(channel?.url);
  const isYouTube = !!ytId;
  const isDrive = !!driveId;

  const getXtreamId = (targetChannel) => {
    let xtreamId = targetChannel.xtreamId;
    if (!xtreamId && targetChannel.url?.includes('/live/')) {
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

  useEffect(() => {
    if ('mediaSession' in navigator && channel) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: String(channel.displayName || channel.name || 'Animux'),
          artist: String(channel.category || 'Streaming'),
          album: 'Animux',
          artwork: [{ src: channel.logo || '/icon-512.png', sizes: '512x512', type: 'image/png' }]
        });
        navigator.mediaSession.setActionHandler('play', () => videoRef.current?.play());
        navigator.mediaSession.setActionHandler('pause', () => videoRef.current?.pause());
      } catch (e) { console.error(e); }
    }
  }, [channel]);

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (videoRef.current) await videoRef.current.requestPictureInPicture();
    } catch (err) { console.error(err); }
  };

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
    if (!channel) return;
    setUseEmbed(isYouTube || isDrive);
    setError(false);
    setLoading(true);
    setServerIndex(-1);
    setCurrentUrl(channel.url);
  }, [channel, isYouTube, isDrive]);

  useEffect(() => {
    if (serverIndex >= 0) {
      const newUrl = getStreamUrl(channel, serverIndex);
      if (newUrl) setCurrentUrl(newUrl);
      else { setError(true); setLoading(false); }
    }
  }, [serverIndex]);

  useEffect(() => {
    if (!currentUrl || !videoRef.current || isYouTube || isDrive) {
      if (isYouTube || isDrive) { setLoading(false); setError(false); }
      return;
    }

    const video = videoRef.current;
    let hls;
    const isM3U8 = currentUrl.toLowerCase().includes('.m3u8');
    const isDirectVideo = (currentUrl.toLowerCase().includes('.mp4') || currentUrl.toLowerCase().includes('.mkv')) && !isM3U8;

    const timeoutId = setTimeout(() => {
      if (!video.paused || video.currentTime > 0) return;
      tryNextServer();
    }, 8000);

    if (isDirectVideo) {
      video.src = currentUrl;
      video.load();
      video.oncanplay = () => { clearTimeout(timeoutId); setLoading(false); video.play().catch(() => {}); };
      video.onerror = () => tryNextServer();
    } else if (Hls.isSupported() && isM3U8) {
      hls = new Hls({ maxBufferLength: 30, enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(currentUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { clearTimeout(timeoutId); setLoading(false); video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (event, data) => { if (data.fatal) { clearTimeout(timeoutId); tryNextServer(); } });
    } else {
      video.src = currentUrl;
      video.load();
      video.play().catch(() => {});
      setLoading(false);
      clearTimeout(timeoutId);
    }
    return () => { clearTimeout(timeoutId); if (hls) hls.destroy(); };
  }, [currentUrl, isYouTube, isDrive]);

  if (!channel) return null;

  const renderPlayer = () => {
    if (isYouTube) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&modestbranding=1&rel=0`}
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        ></iframe>
      );
    }
    if (isDrive) {
      return (
        <iframe
          src={`https://drive.google.com/file/d/${driveId}/preview`}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen"
          allowFullScreen
        ></iframe>
      );
    }
    return (
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black shadow-2xl"
        controls
        autoPlay
        playsInline
      />
    );
  };

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
              </div>
            </div>
          </div>
          <button onClick={togglePiP} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-all">
            <PictureInPicture className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="relative flex-1 bg-black flex items-center justify-center group overflow-hidden">
          {renderPlayer()}
          {loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
              <Loader2 className="w-10 h-10 text-rose-600 animate-spin mb-4" />
              <p className="text-white font-black text-[10px] tracking-[0.4em] uppercase opacity-70">Sintonizando...</p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-20 p-6 text-center">
              <AlertCircle className="w-12 h-12 text-rose-600 mb-4 animate-bounce" />
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Emisión Caída</h3>
              <p className="text-gray-400 text-sm max-w-xs mx-auto font-medium">No se pudo cargar el video.</p>
              <button onClick={onClose} className="mt-8 px-10 py-3 bg-white/5 text-white rounded-full font-black text-[10px] uppercase tracking-widest border border-white/10">Cerrar</button>
            </div>
          )}
        </div>

        <div className="w-full lg:w-[400px] bg-[#050505] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col h-1/2 lg:h-full overflow-hidden">
          <div className="p-6 bg-gradient-to-br from-rose-600/10 to-transparent border-b border-white/5 animate-fade-in">
             <div className="flex items-center gap-2 mb-4">
               <Clock className="w-4 h-4 text-rose-600" />
               <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Más Canales</h3>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 max-h-[60vh]">
                {playlist.map((item) => {
                  const isActive = String(item.id) === String(channel.id);
                  return (
                    <div key={item.id} onClick={() => !isActive && onPlayNext(item)}
                      className={`flex gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${isActive ? 'bg-rose-600/10 border-rose-600/30 scale-[1.02]' : 'hover:bg-white/[0.03] border-transparent'}`}
                    >
                      <div className={`rounded-lg overflow-hidden shrink-0 relative bg-black shadow-lg w-20 aspect-video`}>
                        <img src={item.logo} alt="" className={`w-full h-full object-contain p-2 ${isActive ? 'opacity-20' : 'opacity-100'}`} />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className={`text-[13px] font-black truncate tracking-tight uppercase ${isActive ? 'text-rose-500 italic' : 'text-white'}`}>{item.name || item.title}</h4>
                        <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mt-1">{item.category}</p>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
