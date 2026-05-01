import React, { useEffect, useRef, useState, useMemo } from 'react';
  import Hls from 'hls.js';
  import { X, AlertCircle, Loader2, Play, PictureInPicture, Calendar, Clock } from 'lucide-react';
  import { XTREAM_SERVERS, buildStreamURL, fetchShortEPG, decodeCamouflage } from '../../config/servers';



  export default function Player({ channel, onClose, playlist = [], onPlayNext, onReportBroken, isInline = false }) {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const serverIndexRef = useRef(0); // ref para acceder en closures sin stale state
    const freezeRef = useRef({ lastTime: 0, counter: 0 });

    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [serverIndex, setServerIndex] = useState(0);
    const [currentUrl, setCurrentUrl] = useState('');
    const [isPiP, setIsPiP] = useState(false);
    const [minimized, setMinimized] = useState(false);

    // ── PiP events ────────────────────────────────────────────────────────
    useEffect(() => {
      const onEnter = () => setIsPiP(true);
      const onLeave = () => setIsPiP(false);
      document.addEventListener('enterpictureinpicture', onEnter);
      document.addEventListener('leavepictureinpicture', onLeave);
      return () => {
        document.removeEventListener('enterpictureinpicture', onEnter);
        document.removeEventListener('leavepictureinpicture', onLeave);
      };
    }, []);

    // ── MediaSession API ──────────────────────────────────────────────────
    useEffect(() => {
      if (!channel || !('mediaSession' in navigator)) return;
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: channel.displayName || channel.name || 'Animux',
          artist: channel.category || 'Animux Streaming',
          album: 'Animux',
          artwork: [
            { src: channel.logo || '/icon-512.png', sizes: '256x256', type: 'image/jpeg' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          ],
        });
        const vid = videoRef.current;
        navigator.mediaSession.setActionHandler('play', () => { vid?.play(); navigator.mediaSession.playbackState = 'playing'; });
        navigator.mediaSession.setActionHandler('pause', () => { vid?.pause(); navigator.mediaSession.playbackState = 'paused'; });
        navigator.mediaSession.setActionHandler('stop', () => onClose());
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          const idx = playlist.findIndex(p => String(p.id) === String(channel.id));
          if (idx >= 0 && idx < playlist.length - 1) onPlayNext(playlist[idx + 1]);
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          const idx = playlist.findIndex(p => String(p.id) === String(channel.id));
          if (idx > 0) onPlayNext(playlist[idx - 1]);
        });
      } catch (e) {}
      return () => {
        try {
          navigator.mediaSession.metadata = null;
          ['play', 'pause', 'stop', 'nexttrack', 'previoustrack'].forEach(a => {
            try { navigator.mediaSession.setActionHandler(a, null); } catch (_) {}
          });
        } catch (_) {}
      };
    }, [channel, playlist]);

    // ── Helpers ───────────────────────────────────────────────────────────
    const getYouTubeId = (url = '') => {
      const match = String(url).match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
      return (match && match[2].length === 11) ? match[2] : null;
    };

    const getDriveId = (url = '') => {
      const match = String(url).match(/\/d\/(.+?)\/(view|edit|preview)?/);
      return match ? match[1] : null;
    };

    const isYouTube = !!getYouTubeId(currentUrl);
    const isDrive = !!getDriveId(currentUrl);

    const isEmbed = useMemo(() => {
      const url = String(currentUrl || '').toLowerCase();
      if (isYouTube || isDrive) return true;
      const embedKeywords = ['embed', 'player', 'iframe', '/v/', 'video.php', 'cuevana', '/nu/', '/lat/'];
      const hasKeyword = embedKeywords.some(kw => url.includes(kw));
      const isDirectFile = ['.m3u8', '.mp4', '.mkv', '.ts', '.mp3'].some(ext => url.includes(ext));
      return hasKeyword && !isDirectFile;
    }, [currentUrl, isYouTube, isDrive]);

    // ── Inicialización al cambiar canal ───────────────────────────────────
    useEffect(() => {
      if (!channel) return;
      serverIndexRef.current = 0;
      freezeRef.current = { lastTime: 0, counter: 0 };
      setError(false);
      setLoading(true);
      setServerIndex(0);
      setMinimized(false);
      // Usar URL directa del canal (ya viene decodificada si aplica)
      const url = channel.url ? decodeCamouflage(channel.url) : '';
      setCurrentUrl(url);
    }, [channel]);

    // ── Saltar al siguiente servidor ──────────────────────────────────────
    const tryNextServer = () => {
      // Canales M3U directos no tienen ID de Xtream → solo mostramos cargando si falla
      if (channel.fromM3U || !channel.streamId) {
        console.warn('⚠️ Señal M3U interrumpida. Esperando recuperación nativa...');
        setLoading(true);
        setError(false);
        return;
      }

      const nextIdx = serverIndexRef.current + 1;
      if (nextIdx < XTREAM_SERVERS.length) {
        console.warn(`🔄 Cambiando al servidor ${nextIdx}...`);
        serverIndexRef.current = nextIdx;
        setServerIndex(nextIdx);
        freezeRef.current = { lastTime: 0, counter: 0 };
        // CORRECCIÓN: buildStreamURL(server, channelId) — orden correcto
        const nextUrl = buildStreamURL(XTREAM_SERVERS[nextIdx], channel.streamId);
        setCurrentUrl(nextUrl);
        setLoading(true);
        setError(false);
      } else {
        console.error('❌ Todos los servidores fallaron.');
        setError(true);
        setLoading(false);
      }
    };


    // ── Efecto principal de reproducción ──────────────────────────────────
    useEffect(() => {
      // Embeds se manejan en renderPlayer, solo quitamos loading
      if (!currentUrl || isEmbed) {
        if (isEmbed) {
          const t = setTimeout(() => setLoading(false), 1500);
          return () => clearTimeout(t);
        }
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      // 1. Limpiar instancia HLS previa
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const urlLower = currentUrl.toLowerCase();
      const isProd = window.location.protocol === 'https:';
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isExternal = currentUrl.startsWith('http');

      // Detección de tipo de stream
      // .ts directo se trata como HLS: el proxy lo sirve con Content-Type correcto
      const isM3U8 = urlLower.includes('.m3u8') ||
                     urlLower.includes('jmp2.uk') ||
                     urlLower.includes('.ts') ||
                     (currentUrl.includes('/play/') && !urlLower.includes('.mp4') && !urlLower.includes('.mkv'));

      const isDirectVideo = !isM3U8 && ['.mp4', '.mkv', '.mp3'].some(e => urlLower.includes(e));

      // TODOS los streams externos siempre pasan por el proxy
      // El proxy gestiona CORS — sin excepciones
      const needsProxy = isExternal && (isProd || isLocal);

      console.log(`🎬 Reproduciendo: ${currentUrl} | Proxy: ${needsProxy} | Tipo: ${isM3U8 ? 'HLS' : 'Direct'}`);

      // 2. Timeout de conexión inicial (15s — servidores IPTV colombianos pueden ser lentos)
      const loadTimeout = setTimeout(() => {
        if (video.currentTime === 0) {
          console.warn('⏰ Timeout de conexión (15s). Cambiando servidor...');
          tryNextServer();
        }
      }, 15000);

      // 3. Monitor de congelamiento (cada 1s — actúa a los 6s de inactividad)
      const monitorInterval = setInterval(() => {
        if (!video.paused && !video.ended && video.readyState >= 2) {
          if (video.currentTime === freezeRef.current.lastTime) {
            freezeRef.current.counter++;
            // Solo actuar para Xtream (M3U se queda cargando nativamente)
            if (freezeRef.current.counter >= 6 && (!channel.fromM3U && channel.streamId)) {
              console.warn('❄️ Stream congelado 6s. Cambiando servidor...');
              clearInterval(monitorInterval);
              tryNextServer();
            }
          } else {
            freezeRef.current = { lastTime: video.currentTime, counter: 0 };
          }
        }
      }, 1000);

      // 4. Reproducción de video directo (mp4, ts, etc.)
      if (isDirectVideo) {
        video.src = needsProxy ? `/api/proxy?url=${encodeURIComponent(currentUrl)}` : currentUrl;
        video.load();
        video.oncanplay = () => { clearTimeout(loadTimeout); setLoading(false); video.play().catch(() => {}); };
        video.onerror = () => { clearTimeout(loadTimeout); tryNextServer(); };

      // 5. Reproducción HLS Pura (El backend inyecta los proxies a los fragmentos)
      } else if (Hls.isSupported() && isM3U8) {
        
        const manifestUrl = needsProxy 
          ? `/api/proxy?url=${encodeURIComponent(currentUrl)}` 
          : currentUrl;

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 30, // Corto para no ahogar la memoria del Proxy
          maxMaxBufferLength: 60,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 10,
          manifestLoadingMaxRetry: 3,
          manifestLoadingRetryDelay: 1000,
          levelLoadingMaxRetry: 3,
          fragLoadingMaxRetry: 5,     // 🚀 Alto retry automático por si un .ts falla
          fragLoadingRetryDelay: 500,
        });

        hlsRef.current = hls;
        hls.loadSource(manifestUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          clearTimeout(loadTimeout);
          setLoading(false);
          video.play().catch(() => {});
        });

        let networkRetryCount = 0;
        // Manejo y rotación automática de caídas
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            clearInterval(monitorInterval);
            clearTimeout(loadTimeout);
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              networkRetryCount++;
              // M3U infinitos reintentos, Xtream solo 2
              if ((channel.fromM3U || !channel.streamId) || networkRetryCount <= 2) {
                console.warn('Network error, reintentando nativamente...', networkRetryCount);
                hls.startLoad();
              } else {
                console.error('Network error persistente. Cambiando servidor...');
                tryNextServer(); // 🔥 Fallback después de intentos fallidos
              }
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              console.warn('Media error, recuperando...');
              hls.recoverMediaError();
            } else {
              tryNextServer(); // 🔥 Fallback de servidor de Xtream
            }
          }
        });

      // 6. Fallback nativo del navegador
      } else {
        video.src = currentUrl;
        video.load();
        video.play().catch(() => {});
        video.oncanplay = () => { clearTimeout(loadTimeout); setLoading(false); };
        video.onerror = () => { clearTimeout(loadTimeout); tryNextServer(); };
      }

      return () => {
        clearTimeout(loadTimeout);
        clearInterval(monitorInterval);
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }, [currentUrl, isEmbed]);

    if (!channel) return null;

    const playerContainerClasses = minimized 
      ? "fixed bottom-24 right-4 w-64 md:w-80 aspect-video z-[150] rounded-3xl overflow-hidden shadow-2xl border-2 border-rose-600/30 animate-slide-up group bg-black"
      : `${isInline ? 'relative h-full w-full' : 'fixed inset-0'} z-[110] flex flex-col bg-black animate-fade-in`;

    return (
      <div className={playerContainerClasses}>
        {/* Full Controls */}
        {!minimized && !isInline && (
          <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black via-black/80 to-transparent z-50">
            <div className="flex items-center gap-4">
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <X className="w-6 h-6 text-white" />
              </button>
              <div className="flex flex-col min-w-0">
                <h2 className="text-white font-black text-lg md:text-xl tracking-tight truncate max-w-[200px] md:max-w-md uppercase leading-tight">
                  {channel.displayName || channel.name}
                </h2>
                <span className="text-rose-600 text-[9px] font-black uppercase tracking-[0.2em]">{channel.category}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMinimized(true)}
                title="Minimizar"
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <button
                onClick={async () => {
                  try {
                    if (document.pictureInPictureElement) {
                      await document.exitPictureInPicture();
                    } else if (videoRef.current && document.pictureInPictureEnabled) {
                      await videoRef.current.requestPictureInPicture();
                    }
                  } catch (e) {}
                }}
                title={isPiP ? 'Salir de PiP' : 'Pantalla en pantalla'}
                className={`p-2.5 rounded-full border transition-all ${isPiP ? 'bg-rose-600/20 border-rose-600/50 text-rose-400' : 'bg-white/5 hover:bg-white/10 border-white/5 text-white'}`}
              >
                <PictureInPicture className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Mini Controls */}
        {minimized && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
             <button onClick={() => setMinimized(false)} className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white border border-white/10">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
             </button>
             <button onClick={onClose} className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white border border-white/10">
                <X className="w-4 h-4" />
             </button>
          </div>
        )}

        <div className={`flex-1 flex flex-col ${minimized ? '' : 'lg:flex-row'} overflow-hidden relative`}>
          {/* Ambience Background Layer */}
          {!minimized && (
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-tr from-rose-900/20 via-black to-black" />
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-600/5 blur-[120px] rounded-full animate-pulse" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/5 blur-[100px] rounded-full" />
            </div>
          )}

          <div className="relative flex-1 flex items-center justify-center group overflow-hidden z-10">
            {/* Real Video Player */}
            <div className="w-full h-full flex items-center justify-center relative">
              {isYouTube ? (
                 <iframe src={`https://www.youtube.com/embed/${getYouTubeId(currentUrl)}?autoplay=1&modestbranding=1&rel=0`} className="w-full h-full border-0" allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
              ) : isDrive ? (
                 <iframe src={`https://drive.google.com/file/d/${getDriveId(currentUrl)}/preview`} className="w-full h-full border-0" allow="autoplay; fullscreen" allowFullScreen />
              ) : isEmbed ? (
                 <iframe src={currentUrl} className="w-full h-full border-0 bg-black" allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen title="Embed Player" />
              ) : (
                 <video 
                   ref={videoRef} 
                   className="w-full h-full object-contain shadow-2xl" 
                   controls 
                   autoPlay 
                   playsInline 
                   onPlay={() => setLoading(false)}
                   onPlaying={() => setLoading(false)}
                 />
              )}

              {/* Technical Badges (Hidden when minimized) */}
              {!minimized && !loading && (
                <div className="absolute top-6 right-6 flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Señal Estable</span>
                  </div>
                  <div className="bg-rose-600/20 backdrop-blur-md px-3 py-1 rounded-md border border-rose-600/30">
                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Full HD 1080p</span>
                  </div>
                </div>
              )}
            </div>

            {/* Status Overlays */}
            {loading && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl z-20">
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-rose-600 animate-spin mb-4" />
                  <div className="absolute inset-0 blur-xl bg-rose-600/20 animate-pulse rounded-full" />
                </div>
                <p className="text-white font-black text-[11px] tracking-[0.5em] uppercase opacity-80 animate-pulse">Optimizando Señal...</p>
                <div className="mt-8 flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-1 h-4 bg-white/10 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-rose-600 animate-loading-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 p-6 text-center">
                <AlertCircle className="w-16 h-16 text-rose-600 mb-6 animate-bounce" />
                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Enlace Caído</h3>
                <p className="text-gray-500 text-sm mb-10 max-w-xs font-medium">Este servidor no responde. Estamos intentando reconectar con otra fuente...</p>
                <div className="flex gap-4">
                  <button onClick={onClose} className="px-10 py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all">
                    Cerrar
                  </button>
                  <button onClick={tryNextServer} className="px-10 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:scale-105 transition-all">
                    Siguiente Fuente
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Side Panel - Vertical on Desktop, Horizontal on Mobile */}
          {!minimized && (
            <div className="w-full lg:w-[400px] bg-[#050505]/60 backdrop-blur-3xl border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col h-auto lg:h-full overflow-hidden z-20 relative">
              {/* Quick Info / Description (Visible only when not minimized) */}
              <div className="p-4 lg:p-6 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-600/10 rounded-lg">
                      <Clock className="w-4 h-4 text-rose-600" />
                    </div>
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Programación</h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                        if (window.confirm('¿Reportar este canal?')) onReportBroken?.(channel);
                    }} className="p-2 hover:bg-rose-600/20 rounded-full transition-all group">
                      <AlertCircle className="w-4 h-4 text-gray-500 group-hover:text-rose-500" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed font-medium line-clamp-2 lg:line-clamp-none">
                  Estás viendo <span className="text-white font-bold">{channel.displayName || channel.name}</span> en alta definición. Disfruta de la mejor programación de {channel.category} sin interrupciones.
                </p>
              </div>

              {/* Responsive List: Horizontal on Mobile, Vertical on Desktop */}
              <div className="p-2 lg:p-4">
                 <div className="flex items-center justify-between mb-4 px-2 lg:px-0">
                    <div className="flex items-center gap-2">
                       <div className="w-1 h-4 bg-rose-600 rounded-full" />
                       <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Más de {channel.category}</h4>
                    </div>
                    <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest animate-pulse">En Vivo</span>
                 </div>
                 
                 <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto custom-scrollbar gap-3 pb-6 lg:pb-0">
                    {playlist.filter(item => String(item.id) !== String(channel.id)).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onPlayNext(item)}
                        className="group flex flex-col lg:flex-row gap-3 lg:gap-4 p-3 lg:p-4 rounded-2xl lg:rounded-3xl cursor-pointer transition-all border shrink-0 w-40 lg:w-full bg-white/[0.02] hover:bg-rose-600/5 border-transparent hover:border-rose-600/20"
                      >
                        <div className="rounded-xl lg:rounded-2xl overflow-hidden shrink-0 bg-black w-full lg:w-24 aspect-video relative group-hover:scale-105 transition-transform duration-500">
                          <img src={item.logo} className="w-full h-full object-contain p-2 lg:p-3" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                             <Play className="w-4 h-4 text-white fill-current" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h4 className="text-[11px] lg:text-[12px] font-black truncate tracking-tight uppercase group-hover:text-rose-500 transition-colors text-white">
                            {item.name || item.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[8px] lg:text-[9px] text-gray-500 uppercase font-black tracking-widest">Sugerido</span>
                             <div className="w-1 h-1 bg-rose-600 rounded-full" />
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>

                 {/* Second Section: Global Trends */}
                 <div className="mt-6 lg:mt-8 px-2 lg:px-0">
                    <div className="flex items-center gap-2 mb-4">
                       <div className="w-1 h-4 bg-blue-600 rounded-full" />
                       <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Tendencias Globales</h4>
                    </div>
                    <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto custom-scrollbar gap-3">
                       {playlist.slice(0, 5).map((item) => (
                          <div key={`trend-${item.id}`} onClick={() => onPlayNext(item)} className="shrink-0 w-32 lg:w-full group cursor-pointer">
                             <div className="aspect-video bg-white/5 rounded-xl lg:rounded-2xl border border-white/5 group-hover:border-blue-600/30 overflow-hidden transition-all">
                                <img src={item.logo} className="w-full h-full object-contain p-3 grayscale group-hover:grayscale-0 transition-all" alt="" />
                             </div>
                             <p className="text-[9px] font-black text-gray-500 mt-2 uppercase tracking-tighter truncate text-center lg:text-left">{item.name}</p>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
