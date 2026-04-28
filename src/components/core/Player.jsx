import React, { useEffect, useRef, useState, useMemo } from 'react';
  import Hls from 'hls.js';
  import { X, AlertCircle, Loader2, Play, PictureInPicture, Calendar, Clock } from 'lucide-react';
  import { XTREAM_SERVERS, buildStreamURL, fetchShortEPG, decodeCamouflage } from '../../config/servers';

  // ── Lista de proxies CORS en orden de prioridad ────────────────────────────
  const PROXIES = [
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://api.allorigins.win/raw?url=',
    'https://thingproxy.freeboard.io/fetch/',
  ];

  // ── Dominios que siempre necesitan proxy ──────────────────────────────────
  const PROXY_DOMAINS = ['pluto.tv', 'jmp2.uk', 'stirr.com', 'm3u8.space'];

  // ── Determina si una URL necesita proxy ──────────────────────────────────
  function needsProxy(url) {
    if (!url) return false;
    try {
      const isHTTPS = window.location.protocol === 'https:';
      const hostname = new URL(url).hostname;
      const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
      const isDomain = PROXY_DOMAINS.some(d => url.includes(d));
      // Solo usar proxy para IPs cuando estamos en HTTPS (mixed-content)
      // En localhost (HTTP) las IPs van directas
      const needsHTTPProxy = isHTTPS && url.startsWith('http://');
      return isDomain || needsHTTPProxy;
    } catch (e) {
      return false;
    }
  }

  // ── Aplica el primer proxy a una URL ─────────────────────────────────────
  function applyProxy(url, index = 0) {
    const proxy = PROXIES[index] || PROXIES[0];
    // corsproxy.io a veces funciona mejor con la URL sin encodeURIComponent 
    // pero para seguridad con caracteres especiales lo mantenemos encodeado,
    // a menos que cause problemas.
    if (proxy.includes('corsproxy.io')) {
      return `${proxy}${url}`; // corsproxy.io lo prefiere sin codificar
    }
    return `${proxy}${encodeURIComponent(url)}`;
  }

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

    const decodedChannelUrl = useMemo(() => decodeCamouflage(channel?.url), [channel?.url]);
    const isYouTube = !!getYouTubeId(decodedChannelUrl);
    const isDrive = !!getDriveId(decodedChannelUrl);

    const isEmbed = useMemo(() => {
      const url = String(decodedChannelUrl || '').toLowerCase();
      if (isYouTube || isDrive) return true;
      const embedKeywords = ['embed', 'player', 'iframe', '/v/', 'video.php', 'cuevana', '/nu/', '/lat/'];
      const hasKeyword = embedKeywords.some(kw => url.includes(kw));
      const isDirectFile = ['.m3u8', '.mp4', '.mkv', '.ts', '.mp3'].some(ext => url.includes(ext));
      return hasKeyword && !isDirectFile;
    }, [decodedChannelUrl, isYouTube, isDrive]);

    // ── Inicialización al cambiar canal ───────────────────────────────────
    useEffect(() => {
      if (!channel) return;
      serverIndexRef.current = 0;
      freezeRef.current = { lastTime: 0, counter: 0 };
      setError(false);
      setLoading(true);
      setServerIndex(0);
      // Usar URL directa del canal (ya viene decodificada si aplica)
      const url = channel.url ? decodeCamouflage(channel.url) : '';
      setCurrentUrl(url);
    }, [channel]);

    // ── Saltar al siguiente servidor ──────────────────────────────────────
    const tryNextServer = () => {
      const nextIdx = serverIndexRef.current + 1;
      if (nextIdx < XTREAM_SERVERS.length) {
        console.warn(`🔄 Cambiando al servidor ${nextIdx}...`);
        serverIndexRef.current = nextIdx;
        setServerIndex(nextIdx);
        freezeRef.current = { lastTime: 0, counter: 0 };
        const nextUrl = buildStreamURL(channel, XTREAM_SERVERS[nextIdx]);
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
      const isM3U8 = urlLower.includes('.m3u8');
      const isDirectVideo = !isM3U8 && ['.mp4', '.mkv', '.ts', '.mp3'].some(e => urlLower.includes(e));

      // 2. Timeout de conexión inicial (10s)
      const loadTimeout = setTimeout(() => {
        if (loading || video.currentTime === 0) {
          console.warn('⏰ Timeout de conexión. Cambiando servidor...');
          tryNextServer();
        }
      }, 10000);

      // 3. Monitor de congelamiento (cada 1s)
      const monitorInterval = setInterval(() => {
        if (!video.paused && !video.ended && video.readyState >= 2) {
          if (video.currentTime === freezeRef.current.lastTime) {
            freezeRef.current.counter++;
            if (freezeRef.current.counter >= 8) {
              console.warn('❄️ Stream congelado. Cambiando servidor...');
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
        const src = needsProxy(currentUrl) ? applyProxy(currentUrl) : currentUrl;
        video.src = src;
        video.load();
        video.oncanplay = () => { clearTimeout(loadTimeout); setLoading(false); video.play().catch(() => {}); };
        video.onerror = () => { clearTimeout(loadTimeout); tryNextServer(); };

      // 5. Reproducción HLS con SecureLoader
      } else if (Hls.isSupported() && isM3U8) {
        let baseUrl = '';
        try {
          const urlObj = new URL(currentUrl);
          baseUrl = urlObj.origin + urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
        } catch (e) {}

        class SecureLoader extends Hls.DefaultConfig.loader {
          constructor(config) {
            super(config);
            const superLoad = this.load.bind(this);

            // Primera pasada: resolver URL relativas y aplicar proxy si necesario
            this.load = (context, cfg, callbacks) => {
              let url = context.url;

              // Resolver URLs relativas
              if (!url.startsWith('http')) {
                try { url = new URL(url, baseUrl).href; }
                catch (e) { url = (baseUrl.endsWith('/') ? baseUrl : baseUrl + '/') + url.replace(/^\//, ''); }
              }

              // Aplicar proxy si es primera vez en este contexto
              if (context.proxyIndex === undefined) {
                context.originalUrl = url;
                if (needsProxy(url)) {
                  context.proxyIndex = 0;
                  context.url = applyProxy(url, 0);
                } else {
                  context.proxyIndex = -1;
                  context.url = url;
                }
              }

              // Sobrescribir onError para rotar proxies
              const origOnError = callbacks.onError;
              callbacks.onError = (resp, ctx, ldr) => {
                if (ctx.proxyIndex < PROXIES.length - 1) {
                  ctx.proxyIndex++;
                  ctx.url = applyProxy(ctx.originalUrl, ctx.proxyIndex);
                  console.warn(`🔄 Proxy ${ctx.proxyIndex + 1}/${PROXIES.length}...`);
                  superLoad(ctx, cfg, callbacks);
                } else {
                  origOnError(resp, ctx, ldr);
                }
              };

              superLoad(context, cfg, callbacks);
            };
          }
        }

        // Calcular URL del manifest (con proxy si aplica)
        const manifestUrl = needsProxy(currentUrl) ? applyProxy(currentUrl, 0) : currentUrl;

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          fLoader: SecureLoader,
          pLoader: SecureLoader,
          manifestLoadingMaxRetry: 1,
          levelLoadingMaxRetry: 1,
          fragLoadingMaxRetry: 2,
        });

        hlsRef.current = hls;
        hls.loadSource(manifestUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          clearTimeout(loadTimeout);
          setLoading(false);
          video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            clearInterval(monitorInterval);
            clearTimeout(loadTimeout);
            // Intentar recuperar errores de media antes de saltar de servidor
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              tryNextServer();
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

    // ── Renderizado del reproductor ───────────────────────────────────────
    const renderPlayer = () => {
      if (isYouTube) {
        const ytId = getYouTubeId(decodedChannelUrl);
        return <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1&modestbranding=1&rel=0`} className="w-full h-full border-0" allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />;
      }
      if (isDrive) {
        const driveId = getDriveId(decodedChannelUrl);
        return <iframe src={`https://drive.google.com/file/d/${driveId}/preview`} className="w-full h-full border-0" allow="autoplay; fullscreen" allowFullScreen />;
      }
      if (isEmbed) {
        return (
          <iframe
            src={decodedChannelUrl}
            className="w-full h-full border-0 bg-black"
            allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            title="Embed Player"
          />
        );
      }
      return <video ref={videoRef} className="w-full h-full object-contain bg-black" controls autoPlay playsInline />;
    };

    if (!channel) return null;

    return (
      <div className={`${isInline ? 'relative h-full' : 'fixed inset-0'} z-[110] flex flex-col bg-black animate-fade-in`}>
        {!isInline && (
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
                onClick={() => {
                  if (window.confirm('¿Reportar este canal como caído?')) {
                    onReportBroken?.(channel);
                    onClose();
                  }
                }}
                className="px-3 py-2 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl border border-rose-600/20 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="hidden md:inline">Reportar Error</span>
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

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          <div className="relative flex-1 bg-black flex items-center justify-center group overflow-hidden">
            {renderPlayer()}
            {loading && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 pointer-events-none">
                <Loader2 className="w-10 h-10 text-rose-600 animate-spin mb-4" />
                <p className="text-white font-black text-[10px] tracking-[0.4em] uppercase opacity-70">Conectando...</p>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-20 p-6 text-center">
                <AlertCircle className="w-12 h-12 text-rose-600 mb-4 animate-bounce" />
                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Enlace no compatible</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto font-medium">No se pudo cargar este servidor.</p>
                <button onClick={onClose} className="mt-8 px-10 py-3 bg-white/5 text-white rounded-full font-black text-[10px] uppercase tracking-widest border border-white/10">
                  Cerrar
                </button>
              </div>
            )}
          </div>

          <div className="w-full lg:w-[400px] bg-[#050505] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col h-1/2 lg:h-full overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-600" />
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Siguiente</h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {playlist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onPlayNext(item)}
                  className={`flex gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${String(item.id) === String(channel.id) ? 'bg-rose-600/10 border-rose-600/30' : 'hover:bg-white/[0.03] border-transparent'}`}
                >
                  <div className="rounded-lg overflow-hidden shrink-0 bg-black w-20 aspect-video">
                    <img src={item.logo} className="w-full h-full object-contain p-2" alt="" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className={`text-[13px] font-black truncate tracking-tight uppercase ${String(item.id) === String(channel.id) ? 'text-rose-500' : 'text-white'}`}>
                      {item.name || item.title}
                    </h4>
                    <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mt-1">{item.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
