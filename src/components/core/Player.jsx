import React, { useEffect, useRef, useState, useMemo } from 'react';
  import Hls from 'hls.js';
  import { X, AlertCircle, Play, Pause, Volume2, VolumeX, PictureInPicture, Calendar, Clock, Heart, Search } from 'lucide-react';
  import { XTREAM_SERVERS, buildStreamURL, fetchShortEPG, decodeCamouflage } from '../../config/servers';
  import { sendAdminAlert } from '../../config/telegram';

const formatTime = (secs) => {
  if (isNaN(secs) || secs === null) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

  export default function Player({ channel, onClose, playlist = [], onPlayNext, onReportBroken, isInline = false, isFavorite, onToggleFavorite }) {
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
    
    const [levels, setLevels] = useState([]);
    const [currentLevel, setCurrentLevel] = useState(-1);

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);

    // ── Playback Progress State ──────────────────────────────────────────
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [savedTime, setSavedTime] = useState(0);

    // ── Season Management ──────────────────────────────────────────────────
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [sidebarFilter, setSidebarFilter] = useState('');

    const availableSeasons = useMemo(() => {
      if (!channel || !channel.groupId || !channel.isVOD) return [];
      const seasons = new Set();
      playlist
        .filter(item => item.groupId === channel.groupId)
        .forEach(item => {
          seasons.add(item.season || 1);
        });
      return Array.from(seasons).sort((a, b) => a - b);
    }, [channel, playlist]);

    // Update selectedSeason when channel changes
    useEffect(() => {
      if (channel && channel.season) {
        setSelectedSeason(channel.season);
      }
    }, [channel]);

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
    const isArchive = currentUrl.includes('archive.org');

    const isEmbed = useMemo(() => {
      const url = String(currentUrl || '').toLowerCase();
      // YouTube y Drive siempre son embeds
      if (isYouTube || isDrive) return true;
      
      // Archive.org solo es embed si NO es un archivo directo de video
      if (isArchive) {
        const isDirect = ['.m3u8', '.mp4', '.mkv', '.ts', '.mp3'].some(ext => url.includes(ext));
        if (!isDirect) return true;
      }
      
      const embedKeywords = ['embed', 'player', 'iframe', '/v/', 'video.php', 'canal.php', 'cuevana', '/nu/', '/lat/'];
      const hasKeyword = embedKeywords.some(kw => url.includes(kw));
      const isDirectFile = ['.m3u8', '.mp4', '.mkv', '.ts', '.mp3'].some(ext => url.includes(ext));
      
      return hasKeyword && !isDirectFile;
    }, [currentUrl, isYouTube, isDrive, isArchive]);

    const isPodcast = useMemo(() => {
      if (!channel) return false;
      const urlLower = String(currentUrl || '').toLowerCase();
      return (
        channel.isPodcast || 
        channel.category === 'Podcasts' || 
        channel.category === 'podcast' || 
        urlLower.includes('.mp3') ||
        urlLower.includes('.m4a')
      );
    }, [channel, currentUrl]);

    // ── Sidebar Episodes filtering and sorting (Spotify/TV isolated) ───────
    const sidebarEpisodes = useMemo(() => {
      if (!channel) return [];
      
      let baseList = [];
      
      if (isPodcast) {
        // Filter out only podcast items
        const allPodcasts = playlist.filter(item => 
          item.isPodcast || 
          item.category === 'Podcasts' || 
          item.category === 'podcast'
        );
        
        if (channel.groupId) {
          baseList = allPodcasts.filter(item => item.groupId === channel.groupId);
        } else if (channel.author) {
          baseList = allPodcasts.filter(item => item.author === channel.author);
        } else {
          const prefix = (channel.name || channel.title || '').split(' - ')[0]?.trim();
          if (prefix) {
            baseList = allPodcasts.filter(item => {
              const itemPrefix = (item.name || item.title || '').split(' - ')[0]?.trim();
              return itemPrefix && itemPrefix.toLowerCase() === prefix.toLowerCase();
            });
          } else {
            baseList = allPodcasts;
          }
        }
      } else {
        if (!channel.groupId || !channel.isVOD) return [];
        baseList = playlist.filter(item => item.groupId === channel.groupId);
        baseList = baseList.filter(item => (item.season || 1) === selectedSeason);
      }
      
      // Apply sidebar filter if active
      if (sidebarFilter.trim()) {
        const q = sidebarFilter.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        baseList = baseList.filter(item => {
          const name = (item.name || item.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const desc = (item.description || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          return name.includes(q) || desc.includes(q);
        });
      }
      
      // Sort episodes naturally by name/title
      return baseList.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }));
    }, [channel, playlist, isPodcast, selectedSeason, sidebarFilter]);

    // ── Inicialización al cambiar canal ───────────────────────────────────
    useEffect(() => {
      if (!channel) return;
      serverIndexRef.current = 0;
      freezeRef.current = { lastTime: 0, counter: 0 };
      setError(false);
      setLoading(true);
      setServerIndex(0);
      setMinimized(false);
      setLevels([]);
      setCurrentLevel(-1);
      setPlaybackRate(1);
      setSidebarFilter('');
      
      // Decodificar si es necesario
      let url = channel.url ? decodeCamouflage(channel.url) : '';
      
      // Lógica para Archive.org:
      // Si es un archivo directo (.mp4, .mkv, etc.), NO lo convertimos a embed 
      // para que funcione la función de REANUDAR y la barra de progreso.
      if (url.includes('archive.org/')) {
        const isDirectArchiveFile = ['.mp4', '.mkv', '.m3u8', '.ts'].some(ext => url.toLowerCase().includes(ext));
        
        if (!isDirectArchiveFile) {
          if (url.includes('archive.org/details/')) {
            url = url.replace('archive.org/details/', 'archive.org/embed/');
          } else if (url.includes('archive.org/download/') && !isDirectArchiveFile) {
            url = url.replace('archive.org/download/', 'archive.org/embed/');
          }
          console.log('🛡️ Archive.org: Usando reproductor embebido (No permite reanudar)');
        } else {
          console.log('🎬 Archive.org: Enlace directo detectado. ¡Función REANUDAR activada!');
        }
      }

      setCurrentUrl(url);

      // Check for saved progress (only for VOD)
      if (channel.isVOD) {
        const saved = localStorage.getItem(`animux_progress_${channel.id}`);
        if (saved) {
          try {
            const data = JSON.parse(saved);
            const time = data.time || 0;
            // Only offer to resume if it's more than 10 seconds
            if (time > 10) {
              setSavedTime(time);
              setShowResumePrompt(true);
              // Auto-hide prompt after 10 seconds
              setTimeout(() => setShowResumePrompt(false), 10000);
            }
          } catch (e) {
            // Fallback for old simple string format
            const time = parseFloat(saved);
            if (!isNaN(time) && time > 10) {
              setSavedTime(time);
              setShowResumePrompt(true);
              setTimeout(() => setShowResumePrompt(false), 10000);
            }
          }
        }
      }
    }, [channel]);

    // ── Sync Video Playback State (For Podcast Custom Controls) ───────────
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const onTimeUpdate = () => setCurrentTime(video.currentTime);
      const onDurationChange = () => setDuration(video.duration || 0);
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      const onVolumeChange = () => setIsMuted(video.muted);

      video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('durationchange', onDurationChange);
      video.addEventListener('play', onPlay);
      video.addEventListener('pause', onPause);
      video.addEventListener('volumechange', onVolumeChange);

      // Sync initial state
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
      setIsPlaying(!video.paused);
      setIsMuted(video.muted);

      return () => {
        video.removeEventListener('timeupdate', onTimeUpdate);
        video.removeEventListener('durationchange', onDurationChange);
        video.removeEventListener('play', onPlay);
        video.removeEventListener('pause', onPause);
        video.removeEventListener('volumechange', onVolumeChange);
      };
    }, [currentUrl]);

    // Sync playback rate when source or speed changes
    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.playbackRate = playbackRate;
      }
    }, [currentUrl, playbackRate]);

    // ── Saltar al siguiente servidor ──────────────────────────────────────
    const tryNextServer = () => {
      // Canales M3U directos no tienen ID de Xtream → mostrar error directamente
      if (channel.fromM3U || !channel.streamId) {
        console.error('❌ Canal M3U sin fallback Xtream disponible.');
        setError(true);
        setLoading(false);
        
        // Reportar al administrador
        sendAdminAlert(`⚠️ <b>ENLACE CAÍDO</b>\n\n📺 Canal: ${channel.displayName || channel.name}\n🔗 URL: <code>${currentUrl}</code>`);
        return;
      }

      const nextIdx = serverIndexRef.current + 1;
      if (nextIdx < XTREAM_SERVERS.length) {
        console.warn(`🔄 Cambiando al servidor ${nextIdx}...`);
        serverIndexRef.current = nextIdx;
        setServerIndex(nextIdx);
        freezeRef.current = { lastTime: 0, counter: 0 };
        const nextUrl = buildStreamURL(XTREAM_SERVERS[nextIdx], channel.streamId);
        setCurrentUrl(nextUrl);
        setLoading(true);
        setError(false);
      } else {
        console.error('❌ Todos los servidores fallaron.');
        setError(true);
        setLoading(false);
        
        // Reportar al administrador que todo falló
        sendAdminAlert(`❌ <b>CAÍDA TOTAL</b>\n\n📺 Canal: ${channel.displayName || channel.name}\n⚠️ Fallaron todos los servidores de respaldo.`);
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
      const isM3U8 = urlLower.includes('.m3u8') ||
                     urlLower.includes('jmp2.uk') ||
                     urlLower.includes('.ts') ||
                     (currentUrl.includes('/play/') && 
                      !urlLower.includes('.mp4') && 
                      !urlLower.includes('.mkv') && 
                      !urlLower.includes('.mp3') && 
                      !urlLower.includes('.m4a') && 
                      !urlLower.includes('podcast'));

      const isDirectVideo = !isM3U8 && ['.mp4', '.mkv', '.mp3', '.m4a'].some(e => urlLower.includes(e));
      
      // Lógica de Proxy Protegida:
      // 1. Canales de TV (HLS/M3U8): Usan proxy si no están marcados como directos (Necesario para Caracol/ESPN)
      // 2. Películas/Series (VOD/Direct): NUNCA usan proxy para no saturar Render/Cloudflare
      const isDirectHost = urlLower.includes('fubo18.com') || urlLower.includes('latamvidzfy.org') || urlLower.includes('vivolatamz.org');
      const needsProxy = isExternal && (isProd || isLocal) && !channel.direct && !isDirectVideo && !channel.isVOD && !isDirectHost;

      console.log(`🎬 Reproduciendo: ${currentUrl} | Proxy: ${needsProxy} | Tipo: ${isM3U8 ? 'HLS' : 'Direct'}`);

      let loadTimeout;
      let monitorInterval;

      // SOLO aplicar timeouts y monitoreo si NO es un embed.
      // Los embeds (Archive.org, Drive, YouTube) no deben lanzar "Enlace Caído" por timeout de video
      if (!isEmbed) {
        // 2. Timeout de conexión inicial (Solo para Live TV con servidores Xtream)
        // Para VOD (Archive.org, Drive, etc) permitimos que el navegador cargue sin límite de tiempo
        if (!channel.isVOD && !isDirectVideo && channel.streamId) {
          loadTimeout = setTimeout(() => {
            if (video && video.currentTime === 0) {
              console.warn('⏰ Timeout de conexión (15s). Cambiando servidor...');
              tryNextServer();
            }
          }, 15000);
        }

        // 3. Monitor de congelamiento (Solo para Live TV con servidores Xtream)
        if (!channel.isVOD && !isDirectVideo && channel.streamId) {
          monitorInterval = setInterval(() => {
            if (video && !video.paused && !video.ended && video.readyState >= 2) {
              if (video.currentTime === freezeRef.current.lastTime) {
                freezeRef.current.counter++;
                if (freezeRef.current.counter >= 6) {
                  console.warn('❄️ Stream congelado 6s. Cambiando servidor...');
                  clearInterval(monitorInterval);
                  tryNextServer();
                }
              } else {
                freezeRef.current = { lastTime: video.currentTime, counter: 0 };
              }
            }
          }, 1000);
        }
      }


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
          lowLatencyMode: true, // Activado para arranque rápido
          startLevel: -1,       // Empieza en auto (baja resolución) para cargar al instante
          maxBufferLength: 30,  // Reducido de 60 a 30
          maxMaxBufferLength: 60, // Reducido de 120 a 60
          liveSyncDurationCount: 3, // Reducido de 5 a 3
          liveMaxLatencyDurationCount: 10,
          manifestLoadingMaxRetry: 5,
          manifestLoadingRetryDelay: 1000,
          levelLoadingMaxRetry: 5,
          fragLoadingMaxRetry: 8,
          fragLoadingRetryDelay: 500,
        });

        hlsRef.current = hls;
        hls.loadSource(manifestUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          clearTimeout(loadTimeout);
          setLoading(false);
          
          if (data && data.levels) {
             const availableLevels = data.levels.map((l, index) => ({ height: l.height || 'Auto', index }));
             // Filtrar duplicados o niveles sin altura definida
             const uniqueLevels = availableLevels.filter((l, i, self) => l.height && self.findIndex(t => t.height === l.height) === i).sort((a,b) => b.height - a.height);
             setLevels(uniqueLevels);
          }
          
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
              if (networkRetryCount <= 2) {
                console.warn('Network error, reintentando...', networkRetryCount);
                hls.startLoad();
              } else {
                console.error('Network error persistente. Cambiando servidor...');
                tryNextServer(); // 🔥 Fallback después de 2 intentos fallidos
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

    // ── Progress Saving Effect ────────────────────────────────────────────
    useEffect(() => {
      const video = videoRef.current;
      if (!video || !channel || !channel.isVOD || isEmbed) return;

      const saveProgress = () => {
        if (video.currentTime > 0 && !video.ended && video.duration > 0) {
          const percent = (video.currentTime / video.duration) * 100;
          if (percent > 95) {
            localStorage.removeItem(`animux_progress_${channel.id}`);
          } else {
            const progressData = {
              time: video.currentTime,
              duration: video.duration,
              percent: percent
            };
            localStorage.setItem(`animux_progress_${channel.id}`, JSON.stringify(progressData));
            
            // Notificar a otros componentes (tarjetas) que el progreso cambió
            window.dispatchEvent(new CustomEvent('animux_progress_updated', { 
              detail: { channelId: channel.id, progress: progressData } 
            }));

            if (channel.groupId) {
              localStorage.setItem(`animux_last_episode_${channel.groupId}`, channel.id);
            }
          }
        }
      };

      const interval = setInterval(saveProgress, 5000);
      return () => {
        saveProgress();
        clearInterval(interval);
      };
    }, [channel, isEmbed]);

    const handleResume = () => {
      if (videoRef.current && savedTime > 0) {
        const video = videoRef.current;
        
        const applyTime = () => {
          video.currentTime = savedTime;
          setShowResumePrompt(false);
          setSavedTime(0);
          video.play().catch(() => {});
        };

        if (video.readyState >= 1) {
          applyTime();
        } else {
          video.addEventListener('loadedmetadata', applyTime, { once: true });
          // Fallback por si ya cargó pero el readyState miente
          setTimeout(applyTime, 1000);
        }
      }
    };

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

          <div className="relative shrink-0 w-full aspect-video lg:aspect-auto lg:flex-1 flex items-center justify-center group overflow-hidden z-10 bg-black">
            {/* Real Video Player */}
            <div className="w-full h-full flex items-center justify-center relative">
              {isYouTube ? (
                 <iframe src={`https://www.youtube.com/embed/${getYouTubeId(currentUrl)}?autoplay=1&modestbranding=1&rel=0`} className="w-full h-full border-0" allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
              ) : isDrive ? (
                 <iframe src={`https://drive.google.com/file/d/${getDriveId(currentUrl)}/preview`} className="w-full h-full border-0" allow="autoplay; fullscreen" allowFullScreen />
              ) : isEmbed ? (
                 <iframe src={currentUrl} referrerPolicy="no-referrer" className="w-full h-full border-0 bg-black" allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen title="Embed Player" />
              ) : (
                 <>
                   <video 
                     ref={videoRef} 
                     className={isPodcast ? "opacity-0 absolute pointer-events-none w-0 h-0" : "w-full h-full object-contain shadow-2xl"} 
                     controls={!isPodcast} 
                     autoPlay 
                     playsInline
                     controlsList="nodownload"
                     onContextMenu={(e) => e.preventDefault()}
                     onPlay={() => setLoading(false)}
                     onPlaying={() => setLoading(false)}
                   />
                   {isPodcast && (
                     <div className="absolute inset-0 flex flex-col items-center justify-between p-6 md:p-8 bg-gradient-to-b from-[#0c0c0e]/80 via-[#121216]/95 to-[#08080a]/98 text-white overflow-hidden select-none">
                       {/* Background pulsing glow */}
                       <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                         <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gradient-to-tr from-rose-500/20 to-violet-500/10 rounded-full blur-[80px] transition-transform duration-1000 ${isPlaying ? 'scale-125 opacity-100 animate-pulse' : 'scale-100 opacity-60'}`} />
                         <div className="absolute inset-0 bg-black/40 backdrop-blur-[20px]" />
                       </div>

                       {/* Holographic Cover Art Card */}
                       <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 mt-4 w-full max-w-sm">
                         {/* 3D Glassmorphism Frame with rotating disk/vinyl style cover */}
                         <div className="relative group">
                           {/* Glow ring under the cover */}
                           <div className={`absolute -inset-1.5 bg-gradient-to-r from-rose-500 to-violet-600 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-700 ${isPlaying ? 'animate-pulse' : ''}`} />
                           
                           {/* Disc Container */}
                           <div className="relative w-44 h-44 md:w-56 md:h-56 p-1.5 bg-white/5 border border-white/10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center backdrop-blur-md">
                             {/* Central vinyl spindle hole representation */}
                             <div className="absolute w-6 h-6 bg-black border-2 border-white/20 rounded-full z-20 flex items-center justify-center">
                               <div className="w-1.5 h-1.5 bg-rose-600 rounded-full" />
                             </div>
                             
                             {/* Floating / Rotating Cover */}
                             <img 
                               src={channel.logo || '/icon-512.png'} 
                               alt="Podcast Cover" 
                               className={`w-full h-full object-cover rounded-full border border-white/20 shadow-inner ${isPlaying ? 'animate-spin-slow' : ''}`}
                               style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
                               onError={(e) => { e.target.src = '/icon-512.png'; }}
                             />
                           </div>
                         </div>

                         {/* Track Metadata */}
                         <div className="text-center space-y-2 px-4 w-full">
                           <h3 className="text-base md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 tracking-tight line-clamp-2 uppercase">
                             {channel.displayName || channel.name}
                           </h3>
                           <p className="text-[9px] md:text-[10px] text-rose-500 font-extrabold tracking-[0.2em] uppercase">
                             {channel.author || channel.category || 'Podcast Episode'}
                           </p>
                         </div>

                         {/* Mini Sound Equalizer Waves */}
                         <div className="flex items-end justify-center gap-1.5 h-8">
                           {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => {
                             const duration = 0.6 + Math.random() * 0.8;
                             return (
                               <div 
                                 key={bar} 
                                 className="w-1 h-full rounded-full bg-gradient-to-t from-rose-500 to-violet-500 transition-all equalizer-bar"
                                 style={{
                                   transform: isPlaying ? 'scaleY(1)' : 'scaleY(0.15)',
                                   transformOrigin: 'bottom',
                                   animation: isPlaying ? `equalizer-wave ${duration}s ease-in-out infinite alternate` : 'none',
                                   animationDelay: `${bar * 0.07}s`
                                 }}
                               />
                             );
                           })}
                         </div>
                       </div>

                       {/* Interactive Timeline & Premium Controls */}
                       <div className="relative z-10 w-full max-w-md space-y-4 md:space-y-6 mt-4">
                         {/* Timeline Seeker */}
                         <div className="space-y-2">
                           <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400 tracking-wider">
                             <span>{formatTime(currentTime)}</span>
                             <span>{formatTime(duration)}</span>
                           </div>
                           <div className="relative group/timeline w-full">
                             <input 
                               type="range" 
                               min="0" 
                               max={duration || 100} 
                               value={currentTime} 
                               onChange={(e) => {
                                 const val = parseFloat(e.target.value);
                                 if (videoRef.current) videoRef.current.currentTime = val;
                                 setCurrentTime(val);
                               }}
                               className="w-full h-1.5 bg-white/10 rounded-full appearance-none outline-none cursor-pointer accent-rose-600 transition-all group-hover/timeline:h-2"
                               style={{
                                 background: `linear-gradient(to right, rgb(225, 29, 72) 0%, rgb(225, 29, 72) ${(currentTime / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.1) ${(currentTime / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.1) 100%)`
                               }}
                             />
                           </div>
                         </div>

                         {/* Control Buttons Panel */}
                         <div className="flex items-center justify-between px-4 md:px-8">
                           {/* Mute/Volume Toggle */}
                           <button 
                             onClick={() => {
                               if (videoRef.current) videoRef.current.muted = !isMuted;
                             }}
                             className="p-3 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                             title="Silenciar / Activar Sonido"
                           >
                             {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                           </button>

                           {/* Main playback group */}
                           <div className="flex items-center gap-4">
                             {/* Skip Backward 15s */}
                             <button 
                               onClick={() => {
                                 if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 15);
                               }}
                               className="p-3.5 text-white/80 hover:text-white rounded-full bg-white/5 hover:bg-white/10 border border-white/5 active:scale-90 transition-all flex items-center justify-center"
                               title="Retroceder 15s"
                             >
                               <span className="text-[10px] font-black tracking-tighter mr-0.5">-15s</span>
                             </button>

                             {/* Play / Pause Holographic Trigger */}
                             <button 
                               onClick={() => {
                                 if (videoRef.current) {
                                   if (isPlaying) videoRef.current.pause();
                                   else videoRef.current.play().catch(() => {});
                                 }
                               }}
                               className="w-16 h-16 rounded-full bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 active:scale-95 hover:scale-105 transition-all border border-rose-400/20"
                               title={isPlaying ? 'Pausar' : 'Reproducir'}
                             >
                               {isPlaying ? <Pause className="w-6 h-6 text-white fill-current animate-pulse" /> : <Play className="w-6 h-6 text-white fill-current translate-x-0.5" />}
                             </button>

                             {/* Skip Forward 15s */}
                             <button 
                               onClick={() => {
                                 if (videoRef.current) videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 15);
                               }}
                               className="p-3.5 text-white/80 hover:text-white rounded-full bg-white/5 hover:bg-white/10 border border-white/5 active:scale-90 transition-all flex items-center justify-center"
                               title="Avanzar 15s"
                             >
                               <span className="text-[10px] font-black tracking-tighter ml-0.5">+15s</span>
                             </button>
                           </div>

                            {/* Playback speed toggle */}
                            <button 
                              onClick={() => {
                                const speeds = [1, 1.25, 1.5, 1.75, 2];
                                const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
                                const newSpeed = speeds[nextIdx];
                                if (videoRef.current) videoRef.current.playbackRate = newSpeed;
                                setPlaybackRate(newSpeed);
                              }}
                              className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/5 text-[9px] font-black text-rose-500 uppercase tracking-widest transition-all min-w-[75px] text-center animate-pulse"
                              style={{ animationDuration: '3s' }}
                              title="Velocidad de reproducción"
                            >
                              {playbackRate === 1 ? '1.0x SPEED' : `${playbackRate}x SPEED`}
                            </button>
                         </div>
                       </div>

                       {/* Floating custom styles */}
                       <style>{`
                         @keyframes spin-slow {
                           from { transform: rotate(0deg); }
                           to { transform: rotate(360deg); }
                         }
                         .animate-spin-slow {
                           animation: spin-slow 25s linear infinite;
                         }
                         @keyframes equalizer-wave {
                           0% { transform: scaleY(0.15); }
                           100% { transform: scaleY(1); }
                         }
                         .equalizer-bar {
                           transform-origin: bottom;
                         }
                       `}</style>
                     </div>
                   )}
                 </>
              )}

              {/* Resume Prompt Overlay */}
              {showResumePrompt && !loading && !error && !minimized && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[60] animate-slide-up">
                  <div className="bg-black/80 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl shadow-2xl flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">¿Continuar Viendo?</span>
                      <span className="text-white text-[11px] font-bold uppercase tracking-tight">Quedaste en {new Date(savedTime * 1000).toISOString().substr(11, 8)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowResumePrompt(false)}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase transition-all"
                      >
                        Ignorar
                      </button>
                      <button 
                        onClick={handleResume}
                        className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase shadow-lg shadow-rose-600/20 transition-all active:scale-95"
                      >
                        Reanudar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Technical Badges (Hidden when minimized) */}
              {!minimized && !loading && (
                <div className="absolute top-6 right-6 flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-50">
                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Señal Estable</span>
                  </div>

                  {/* Botón de Favorito en el Player */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleFavorite) onToggleFavorite();
                    }}
                    className="p-2.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 transition-colors shadow-2xl group/fav"
                  >
                    <Heart className={`w-5 h-5 transition-all ${isFavorite ? 'fill-rose-500 text-rose-500 group-hover/fav:scale-110' : 'text-white/70 group-hover/fav:text-white group-hover/fav:scale-110'}`} />
                  </button>
                  
                  {levels.length > 1 ? (
                    <div className="flex flex-col gap-1 items-end bg-black/80 backdrop-blur-xl p-2 rounded-xl border border-white/10 shadow-2xl">
                      <span className="text-[8px] text-gray-500 font-black uppercase px-2 mb-1 tracking-widest">Calidad</span>
                      <button 
                         onClick={() => {
                            if (hlsRef.current) hlsRef.current.currentLevel = -1;
                            setCurrentLevel(-1);
                         }} 
                         className={`w-full text-right px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${currentLevel === -1 ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                      >
                         Auto
                      </button>
                      {levels.map(l => (
                        <button 
                           key={l.index} 
                           onClick={() => {
                              if (hlsRef.current) hlsRef.current.currentLevel = l.index;
                              setCurrentLevel(l.index);
                           }}
                           className={`w-full text-right px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${currentLevel === l.index ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                           {l.height}p
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-rose-600/20 backdrop-blur-md px-3 py-1 rounded-md border border-rose-600/30">
                      <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">1080p HD</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status Overlays */}
            {loading && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl z-20">
                <div className="relative mb-6">
                  <SoccerLoader className="w-16 h-16" />
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
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 lg:p-4 pb-24">
                 <div className="flex items-center justify-between mb-4 px-2 lg:px-0">
                    <div className="flex items-center gap-2">
                       <div className="w-1 h-4 bg-rose-600 rounded-full" />
                       <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                          {channel.groupId && channel.isVOD ? (isPodcast ? 'Pistas del Pódcast' : 'Episodios') : `Más de ${channel.category}`}
                       </h4>
                    </div>
                    {(!channel.groupId || !channel.isVOD) && <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest animate-pulse">En Vivo</span>}
                 </div>

                 {isPodcast && channel.groupId && channel.isVOD && (
                    <div className="mb-4 px-2 lg:px-0">
                      <div className="relative group/search">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within/search:text-rose-500 transition-colors" />
                        <input
                          type="text"
                          placeholder="Buscar episodio..."
                          value={sidebarFilter}
                          onChange={(e) => setSidebarFilter(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 text-[10px] font-black uppercase tracking-wider bg-white/[0.03] hover:bg-white/[0.06] focus:bg-[#08080a] text-white rounded-xl border border-white/5 focus:border-rose-500/50 outline-none transition-all placeholder-gray-500"
                        />
                        {sidebarFilter && (
                          <button
                            onClick={() => setSidebarFilter('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                 )}
                 
                 {channel.groupId && channel.isVOD && !isPodcast && availableSeasons.length > 1 && (
                    <div className="flex gap-2 mb-6 px-2 lg:px-0 overflow-x-auto no-scrollbar pb-1">
                      {availableSeasons.map(s => (
                        <button
                          key={s}
                          onClick={() => setSelectedSeason(s)}
                          className={`shrink-0 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${selectedSeason === s ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/20' : 'bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}
                        >
                          Temporada {s}
                        </button>
                      ))}
                    </div>
                 )}
                  <div className={`flex-1 pb-6 lg:pb-0 px-2 lg:px-0 ${
                     channel.groupId && channel.isVOD
                       ? (isPodcast 
                           ? 'flex flex-col gap-2' 
                           : 'grid grid-cols-4 md:grid-cols-6 lg:grid-cols-2 gap-3 lg:gap-4')
                       : 'flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible no-scrollbar lg:custom-scrollbar gap-3'
                   }`}>
                    {((channel.groupId && channel.isVOD) || isPodcast 
                      ? sidebarEpisodes 
                      : playlist.filter(item => true)
                    ).map((item, idx) => {
                      const isCurrentlyPlaying = String(item.id) === String(channel.id) || item.url === channel.url;
                      
                      if (isPodcast) {
                        return (
                          <div
                            key={item.id}
                            onClick={() => onPlayNext(item)}
                            className={`group flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer border transition-all duration-300 relative ${
                              isCurrentlyPlaying
                                ? 'bg-rose-500/10 border-rose-500/30'
                                : 'bg-white/[0.02] hover:bg-white/[0.06] border-transparent hover:border-white/10'
                            }`}
                          >
                            {/* Track Index or Play indicator */}
                            <div className="w-6 shrink-0 flex items-center justify-center relative">
                              {isCurrentlyPlaying ? (
                                <div className="flex items-end gap-0.5 h-3 w-3">
                                  {[1, 2, 3].map((bar) => {
                                    const duration = 0.5 + Math.random() * 0.5;
                                    return (
                                      <div
                                        key={bar}
                                        className="w-[2px] h-full bg-rose-500"
                                        style={{
                                          transform: isPlaying ? 'scaleY(1)' : 'scaleY(0.2)',
                                          transformOrigin: 'bottom',
                                          animation: isPlaying ? `equalizer-wave ${duration}s ease-in-out infinite alternate` : 'none',
                                          animationDelay: `${bar * 0.15}s`
                                        }}
                                      />
                                    );
                                  })}
                                </div>
                              ) : (
                                <>
                                  <span className="text-[10px] font-black text-gray-500 group-hover:opacity-0 transition-opacity">
                                    {idx + 1}
                                  </span>
                                  <Play className="w-3 h-3 text-white fill-current absolute opacity-0 group-hover:opacity-100 transition-opacity" />
                                </>
                              )}
                            </div>

                            {/* Cover logo */}
                            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-black border border-white/5 relative group-hover:scale-105 transition-transform duration-300">
                              <img src={item.logo} className="w-full h-full object-cover" alt="" onError={(e) => { e.target.src = '/icon-512.png'; }} />
                              {isCurrentlyPlaying && <div className="absolute inset-0 bg-rose-950/20" />}
                            </div>

                            {/* Text details */}
                            <div className="flex-1 min-w-0">
                              <h5 className={`text-[11px] font-extrabold truncate uppercase tracking-tight transition-colors ${
                                isCurrentlyPlaying ? 'text-rose-400' : 'text-white group-hover:text-rose-500'
                              }`}>
                                {item.title || item.name}
                              </h5>
                              <div className="flex items-center gap-2 mt-0.5 opacity-60">
                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest truncate max-w-[120px]">
                                  {item.author || 'Podcast'}
                                </span>
                                {item.year && (
                                  <>
                                    <div className="w-1 h-1 rounded-full bg-gray-500" />
                                    <span className="text-[8px] font-bold text-gray-400">{item.year}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Left highlight strip */}
                            {isCurrentlyPlaying && (
                              <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-rose-600 rounded-full" />
                            )}
                          </div>
                        );
                      }

                      return (
                      <div
                        key={item.id}
                        onClick={() => onPlayNext(item)}
                        className={channel.groupId && channel.isVOD 
                          ? `group relative flex flex-col items-center justify-center gap-2 p-0 rounded-2xl lg:rounded-3xl cursor-pointer transition-all border overflow-hidden aspect-square lg:aspect-video w-full ${isCurrentlyPlaying ? 'bg-rose-600/20 border-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.3)]' : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5 hover:border-white/20'}`
                          : `group flex flex-col lg:flex-row gap-3 lg:gap-4 p-3 lg:p-4 rounded-2xl lg:rounded-3xl cursor-pointer transition-all border shrink-0 w-40 lg:w-full ${isCurrentlyPlaying ? 'bg-rose-600/10 border-rose-600/30' : 'bg-white/[0.02] hover:bg-rose-600/5 border-transparent hover:border-rose-600/20'}`
                        }
                      >
                        {channel.groupId && channel.isVOD ? (
                          <>
                             {/* Imagen de fondo con degradado */}
                             <div className="absolute inset-0 z-0">
                               <img src={item.logo} className="w-full h-full object-cover opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-700" alt="" />
                               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                             </div>
 
                             {/* Contenido Visual */}
                             <div className="relative z-10 flex flex-col items-center justify-center p-2 text-center w-full h-full">
                               <div className="flex flex-col items-center gap-0.5">
                                 <span className={`text-[8px] font-black uppercase tracking-widest ${isCurrentlyPlaying ? 'text-rose-400' : 'text-white/40'}`}>EPISODIO</span>
                                 <span className="text-xl lg:text-2xl font-black text-white leading-none">
                                   {item.name.match(/\d+$/) ? item.name.match(/\d+$/)[0] : (idx + 1)}
                                 </span>
                                 <span className={`text-[6px] lg:text-[7px] font-black uppercase tracking-widest mt-1 ${isCurrentlyPlaying ? 'text-rose-500 animate-pulse' : 'text-white/40'}`}>
                                   {isCurrentlyPlaying ? 'Viendo Ahora' : 'Reproducir'}
                                 </span>
                               </div>
                               
                               {/* Titulo pequeño solo en PC si cabe */}
                               <span className="hidden lg:block mt-2 text-[8px] font-bold text-white/60 truncate w-full px-2 uppercase tracking-tighter">
                                 {item.name?.split('-').pop() || 'Reproducir'}
                               </span>
                             </div>
 
                             {/* Icono Play flotante en hover */}
                             <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <div className="p-1.5 bg-rose-600 rounded-full shadow-lg">
                                  <Play className="w-2 h-2 text-white fill-current" />
                                </div>
                             </div>
 
                             {String(item.id) === String(channel.id) && (
                               <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-600 animate-pulse" />
                             )}
                          </>
                        ) : (
                          <>
                            <div className="rounded-xl lg:rounded-2xl overflow-hidden shrink-0 bg-black w-full lg:w-24 aspect-video relative group-hover:scale-105 transition-transform duration-500">
                              <img src={item.logo} className="w-full h-full object-contain p-2 lg:p-3" alt="" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                <Play className="w-4 h-4 text-white fill-current" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <h4 className={`text-[11px] lg:text-[12px] font-black truncate tracking-tight uppercase group-hover:text-rose-500 transition-colors ${String(item.id) === String(channel.id) ? 'text-rose-400' : 'text-white'}`}>
                                {item.name || item.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[8px] lg:text-[9px] uppercase font-black tracking-widest ${String(item.id) === String(channel.id) ? 'text-rose-500' : 'text-gray-500'}`}>
                                  {String(item.id) === String(channel.id) ? 'En Vivo' : 'Canal'}
                                </span>
                                <div className={`w-1 h-1 rounded-full ${String(item.id) === String(channel.id) ? 'bg-rose-500 animate-pulse' : 'bg-rose-600'}`} />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      )
                    })}
                  </div>

                 {/* Second Section: Global Trends */}
                 <div className="mt-6 lg:mt-8 px-2 lg:px-0">
                    <div className="flex items-center gap-2 mb-4">
                       <div className="w-1 h-4 bg-blue-600 rounded-full" />
                       <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Tendencias Globales</h4>
                    </div>
                    <div className="flex flex-col gap-1">
                       {playlist.slice(0, 5).map((item, index) => (
                          <div key={`trend-${item.id}`} onClick={() => onPlayNext(item)} className="group flex items-center gap-4 p-2 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-all border border-transparent hover:border-white/5">
                             <div className="text-3xl font-black text-white/5 group-hover:text-blue-500/20 italic w-8 text-center transition-colors">
                                {index + 1}
                             </div>
                             <div className="w-14 h-9 bg-black rounded-lg border border-white/5 overflow-hidden shrink-0 shadow-lg group-hover:shadow-blue-500/10 transition-shadow">
                                <img src={item.logo} className="w-full h-full object-contain p-1.5" alt="" />
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="text-[10px] md:text-[11px] font-black text-gray-500 group-hover:text-white uppercase tracking-wider truncate transition-colors">
                                   {item.name || item.title}
                                </p>
                             </div>
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
