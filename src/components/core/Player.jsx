import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  X, AlertCircle, Play, Pause, Volume2, VolumeX, PictureInPicture, 
  Calendar, Clock, Heart, Search, Languages, Subtitles, Upload, 
  Check, Trash2, Plus, Minus, Cast, Maximize, Minimize, Lock, Unlock 
} from 'lucide-react';
import { XTREAM_SERVERS, buildStreamURL, fetchShortEPG, decodeCamouflage } from '../../config/servers';
import { sendAdminAlert } from '../../config/telegram';
import ContentLoader from '../ui/ContentLoader';
import { convertSrtToVtt, createSubBlobUrl } from '../../utils/subtitles';
import { triggerCasting, checkCastSupport } from '../../utils/cast';
import VideoControls, { EQ_DURATIONS } from '../player/VideoControls';

const formatTime = (secs) => {
  if (isNaN(secs) || secs === null) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function Player({ channel, onClose, playlist = [], onPlayNext, onReportBroken, isInline = false, isFavorite, onToggleFavorite }) {
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const hlsRef = useRef(null);
  const serverIndexRef = useRef(0); // ref para acceder en closures sin stale state
  const freezeRef = useRef({ lastTime: 0, counter: 0 });
  const fileInputRef = useRef(null);

  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [serverIndex, setServerIndex] = useState(0);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isPiP, setIsPiP] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoFit, setVideoFit] = useState('contain'); // 'contain' | 'cover'
  const [minimized, setMinimized] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [sidebarFilter, setSidebarFilter] = useState('');
  const [selectedSeason, setSelectedSeason] = useState(channel?.season || 1);
  // â”€â”€ Audio & Subtitles State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [audioTracks, setAudioTracks] = useState([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState(-1);
  const [subtitleTracks, setSubtitleTracks] = useState([]);
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState(-1); // -1 = off, number = HLS index, 'external' = custom file
  const [showAudioSubtitlesModal, setShowAudioSubtitlesModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('subtitles'); // 'subtitles' | 'audio'
  const [externalSubtitle, setExternalSubtitle] = useState(null); // { name, rawText, isSrt, blobUrl }
  const [subOffset, setSubOffset] = useState(0); // in seconds
  const [subColor, setSubColor] = useState('white'); // 'white' | 'yellow' | 'cyan' | 'green'
  const [subSize, setSubSize] = useState('medium'); // 'small' | 'medium' | 'large'

  // â”€â”€ Playback Progress State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [savedTime, setSavedTime] = useState(0);

    // ── Screen Lock State ──────────────────────────────────────────
  const [isLocked, setIsLocked] = useState(false);
  const [showLockNotice, setShowLockNotice] = useState(false);
  const lockTimeoutRef = useRef(null);

  const triggerShowLockNotice = useCallback(() => {
    setShowLockNotice(true);
    if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
    lockTimeoutRef.current = setTimeout(() => {
      setShowLockNotice(false);
    }, 3000);
  }, []);

  const handleLock = useCallback(() => {
    setIsLocked(true);
    triggerShowLockNotice();
  }, [triggerShowLockNotice]);

  const handleUnlock = useCallback((e) => {
    e?.stopPropagation();
    setIsLocked(false);
    setShowLockNotice(false);
    if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
  }, []);

  useEffect(() => {
    setIsLocked(false);
    setShowLockNotice(false);
  }, [channel]);

  useEffect(() => {
    return () => {
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
    };
  }, []);

  const isPodcast = channel?.category === 'PODCASTS' || channel?.category === 'RADIO' || channel?.isPodcast;
  const getYouTubeId = (url) => { if (!url) return null; const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/); return match ? match[1] : null; };
  const getDriveId = (url) => { if (!url) return null; const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/); return match ? match[1] : null; };
  const isYouTube = currentUrl ? (currentUrl.includes('youtube.com') || currentUrl.includes('youtu.be')) : false;
  const isDrive = currentUrl ? currentUrl.includes('drive.google.com') : false;
  const isEmbed = isYouTube || isDrive || (currentUrl ? (currentUrl.includes('iframe') || currentUrl.includes('embed')) : false) || Boolean(channel?.isEmbed);

  const safePlay = () => { if (videoRef.current) { const p = videoRef.current.play(); if (p !== undefined) { p.catch(e => { console.warn('Autoplay prevented', e); setIsPlaying(false); }); } } };


    // â”€â”€ Saltar al siguiente servidor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // ── Inicialización del Canal ────────────────────────────────────────────────
  useEffect(() => {
    if (channel && channel.url) {
      setServerIndex(0);
      serverIndexRef.current = 0;
      setLoading(true);
      setError(false);
      freezeRef.current = { lastTime: 0, counter: 0 };
      
      let urls = [];
      if (typeof channel.url === 'string') {
        urls = channel.url.split(',').map(u => u.trim()).filter(Boolean);
      } else if (Array.isArray(channel.url)) {
        urls = channel.url;
      }
      
      if (urls.length > 0) {
        setCurrentUrl(urls[0] ? decodeCamouflage(urls[0]) : "");
      } else {
        setError(true);
        setLoading(false);
      }
    }
  }, [channel]);

    const tryNextServer = useCallback(() => {
      if (!channel || channel.isVOD || isEmbed) {
        setError(true);
        setLoading(false);
        return;
      }
      
      let urls = [];
      if (typeof channel.url === "string") {
        urls = channel.url.split(",").map(u => u.trim()).filter(Boolean);
      } else if (Array.isArray(channel.url)) {
        urls = channel.url;
      }
      
      if (serverIndexRef.current < urls.length - 1) {
        console.warn(`ðŸ”„ FallÃ³ el servidor ${serverIndexRef.current + 1}. Intentando el siguiente...`);
        serverIndexRef.current += 1;
        setServerIndex(serverIndexRef.current);
        const nextUrl = urls[serverIndexRef.current];
        setCurrentUrl(nextUrl ? decodeCamouflage(nextUrl) : "");
      } else {
        console.error("âŒ Todos los servidores fallaron.");
        setError(true);
        setLoading(false);
      }
    }, [channel, isEmbed]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !currentUrl) return;

      const urlLower = currentUrl.toLowerCase();
      const isExternal = currentUrl.startsWith("http");
      const isProd = import.meta.env.PROD;

      // DetecciÃ³n de tipo de stream
      const isM3U8 = !isPodcast && (
                     urlLower.includes('.m3u8') ||
                     urlLower.includes('jmp2.uk') ||
                     urlLower.includes('.ts') ||
                     urlLower.includes('.m3u') ||
                     (currentUrl.includes('/play/') && 
                      !urlLower.includes('.mp4') && 
                      !urlLower.includes('.mkv') && 
                      !urlLower.includes('.mp3') && 
                      !urlLower.includes('.m4a') && 
                      !urlLower.includes('podcast')) ||
                     (!channel.isVOD && !isEmbed));

      const isDirectMedia = isPodcast || (!isM3U8 && ['.mp4', '.mkv', '.mp3', '.m4a', '.aac', '.ogg', '.wav', '.flac', '.webm'].some(e => urlLower.includes(e)));
      
      // Lógica de Proxy Inteligente:
      // 1. Canales con Referer obligatorio (fubo18, latamvidzfy, vivolatamz)
      // 2. Canales con CORS restringido (jmp2.uk, pluto.tv, tubi, etc.)
      // 3. Contenido HTTP en sitio HTTPS (Mixed Content en producción)
      // 4. Flags explícitos de proxy en el canal
      const isRestrictedCorsHost = 
        urlLower.includes('jmp2.uk') || 
        urlLower.includes('pluto.tv') || 
        urlLower.includes('plutotv.net') || 
        urlLower.includes('fubo18.com') || 
        urlLower.includes('latamvidzfy.org') || 
        urlLower.includes('vivolatamz.org') ||
        urlLower.includes('dailymotion.com') ||
        urlLower.includes('voodc.com');

      const isMixedContent = isProd && currentUrl.startsWith('http:');
      const needsProxy = isExternal && (
        isRestrictedCorsHost || 
        isMixedContent || 
        Boolean(channel?.needsProxy)
      );

      console.log(`🎬 Reproduciendo: ${currentUrl} | Proxy: ${needsProxy} | Tipo: ${isPodcast ? 'Podcast/Audio' : (isM3U8 ? 'HLS' : 'Direct')}`);

      let loadTimeout;
      let monitorInterval;
      let isCancelled = false; // ← declarado aquí para que el cleanup siempre tenga acceso

      // SOLO aplicar timeouts y monitoreo si NO es un embed.
      // 2. Timeout de carga
      loadTimeout = setTimeout(() => {
        if (!isEmbed && !channel.isVOD && !isDirectMedia && !isPodcast && channel.streamId) {
          if (video && video.currentTime === 0 && !video.paused) {
            console.warn('⏱ Timeout de conexión (15s). Cambiando servidor...');
            tryNextServer();
          }
        } else {
          // Para VOD/Podcasts/Embeds, si pasaron 15s, forzamos ocultar el loading 
          // para evitar que se quede la pantalla negra si el evento onLoad/oncanplay falla.
          setLoading(false);
        }
      }, 15000);

        // 3. Monitor de congelamiento (Solo para Live TV con servidores Xtream)
        if (!channel.isVOD && !isDirectMedia && !isPodcast && channel.streamId) {
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

      // 4. Reproducción directa (podcasts, audio, mp4, ts, etc.)
      if (isDirectMedia) {
        video.src = needsProxy ? `/api/proxy?url=${encodeURIComponent(currentUrl)}` : currentUrl;
        video.load();
        video.oncanplay = () => { clearTimeout(loadTimeout); setLoading(false); safePlay(); };
        video.onloadeddata = () => { clearTimeout(loadTimeout); setLoading(false); };
        video.onerror = (err) => { 
          clearTimeout(loadTimeout); 
          console.error('❌ Error en reproducción directa:', currentUrl, err);
          // Si falló de forma directa en HTTPS, intentar con el proxy como alternativa antes de rendirse
          if (!needsProxy && isExternal && !currentUrl.startsWith('/api/proxy')) {
            console.warn('🔄 Reintentando audio/video con proxy de respaldo...');
            video.src = `/api/proxy?url=${encodeURIComponent(currentUrl)}`;
            video.load();
            safePlay();
            return;
          }
          if (isPodcast || channel.fromM3U || !channel.streamId) {
            setError(true);
            setLoading(false);
            return;
          }
          tryNextServer(); 
        };

      // 5. Reproducción HLS Pura (Con failover inteligente y reescritura de fragmentos proxy)
      } else if (Hls.isSupported() && isM3U8) {
        
        let needsProxyActive = needsProxy;
        let resolvedBaseUrl = currentUrl;

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true, // Activado para arranque inmediato
          startLevel: -1,       // Nivel automático inicial
          initialLiveManifestSize: 1, // Iniciar reproducción tan pronto como esté disponible el 1er segmento
          maxBufferLength: 20,  // Reducido a 20s para optimizar memoria y velocidad de buffer
          maxMaxBufferLength: 40, 
          liveSyncDurationCount: 3, 
          liveMaxLatencyDurationCount: 8,
          manifestLoadingTimeOut: 8000,
          manifestLoadingMaxRetry: 4,
          manifestLoadingRetryDelay: 500,
          levelLoadingTimeOut: 8000,
          levelLoadingMaxRetry: 4,
          fragLoadingTimeOut: 12000,
          fragLoadingMaxRetry: 6,
          fragLoadingRetryDelay: 500,
          xhrSetup: (xhr, url) => {
            // Si una petición relativa se resolvió localmente contra /api/ debido al proxy, redirigirla al proxy con la URL destino correcta
            if (needsProxyActive && !url.includes('?url=')) {
              try {
                const activeBase = resolvedBaseUrl || currentUrl;
                if (url.startsWith(window.location.origin + '/api/') || url.startsWith('/api/')) {
                  const relativePath = url.replace(window.location.origin, '').replace(/^\/api\//, '');
                  const targetBase = new URL(activeBase);
                  const resolvedUrl = new URL(relativePath, targetBase).href;
                  xhr.open('GET', `/api/proxy?url=${encodeURIComponent(resolvedUrl)}`, true);
                } else if (!url.startsWith('http')) {
                  const targetBase = new URL(activeBase);
                  const resolvedUrl = new URL(url, targetBase).href;
                  xhr.open('GET', `/api/proxy?url=${encodeURIComponent(resolvedUrl)}`, true);
                }
              } catch (e) {
                console.warn('HLS proxy path rewrite fallback:', e);
              }
            }
          }
        });

        hlsRef.current = hls;

        // Si la URL es un acortador o redirección (como jmp2.uk), resolvemos primero la URL final para que los chunks y sub-playlists relativos se resuelvan en el servidor final (ej. pluto stitcher) y no den 404
        const initHlsSource = async () => {
          let streamUrlToLoad = currentUrl;
          if (currentUrl.includes('jmp2.uk')) {
            try {
              const res = await fetch(currentUrl, { method: 'GET', redirect: 'follow' });
              if (res.url && res.url !== currentUrl) {
                resolvedBaseUrl = res.url;
                streamUrlToLoad = res.url;
                console.log(`🔗 Stream redireccionado resuelto: ${resolvedBaseUrl}`);
              }
            } catch (err) {
              console.warn('⚠️ No se pudo seguir redirección anticipada, usando URL base original:', err);
            }
          }
          if (isCancelled) return;

          const manifestUrl = needsProxyActive 
            ? `/api/proxy?url=${encodeURIComponent(streamUrlToLoad)}` 
            : streamUrlToLoad;

          hls.loadSource(manifestUrl);
          hls.attachMedia(video);
        };

        initHlsSource();

        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          clearTimeout(loadTimeout);
          setLoading(false);
          
          if (data && data.levels) {
             const availableLevels = data.levels.map((l, index) => ({ height: l.height || 'Auto', index }));
             // Filtrar duplicados o niveles sin altura definida
             const uniqueLevels = availableLevels.filter((l, i, self) => l.height && self.findIndex(t => t.height === l.height) === i).sort((a,b) => b.height - a.height);
             setLevels(uniqueLevels);
          }

          // Detect embedded audio tracks
          if (hls.audioTracks && hls.audioTracks.length > 0) {
            setAudioTracks(hls.audioTracks);
            setSelectedAudioTrack(hls.audioTrack);
          }

          // Detect embedded subtitle tracks
          if (hls.subtitleTracks && hls.subtitleTracks.length > 0) {
            setSubtitleTracks(hls.subtitleTracks);
          }
          
          safePlay();
        });

        hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (event, data) => {
          if (data && data.audioTracks) {
            setAudioTracks(data.audioTracks);
            setSelectedAudioTrack(hls.audioTrack);
          }
        });

        hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (event, data) => {
          if (data && typeof data.id === 'number') {
            setSelectedAudioTrack(data.id);
          }
        });

                hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (event, data) => {
          if (data && data.subtitleTracks) {
            setSubtitleTracks(data.subtitleTracks);
          }
        });
        hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, (event, data) => {
          if (data && typeof data.id === 'number') {
            if (selectedSubtitleTrack !== 'external') {
              setSelectedSubtitleTrack(data.id);
            }
          }
        });

        let retriedWithProxy = false;
        let networkErrorCount = 0;
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              if (!retriedWithProxy && !needsProxy && currentUrl.startsWith('http')) {
                console.warn('🔄 Reintentando HLS con proxy tras error de red (posible CORS)...');
                retriedWithProxy = true;
                needsProxyActive = true;
                hls.loadSource(`/api/proxy?url=${encodeURIComponent(currentUrl)}`);
                hls.startLoad();
              } else {
                networkErrorCount++;
                if (networkErrorCount >= 2) {
                  console.error('❌ Error de red fatal persistente. Cambiando de servidor...');
                  tryNextServer();
                } else {
                  hls.startLoad();
                }
              }
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              console.error('❌ Error fatal en HLS. Cambiando de servidor...', data);
              tryNextServer();
            }
          }
        });
      } else {
        video.src = needsProxy ? `/api/proxy?url=${encodeURIComponent(currentUrl)}` : currentUrl;
        video.load();
        safePlay();
        video.oncanplay = () => { clearTimeout(loadTimeout); setLoading(false); safePlay(); };
        video.onerror = () => { clearTimeout(loadTimeout); tryNextServer(); };
      }

      return () => {
        isCancelled = true;
        clearTimeout(loadTimeout);
        clearInterval(monitorInterval);
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }, [currentUrl, isEmbed]);

    // â”€â”€ Progress Saving Effect â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            
            // Notificar a otros componentes (tarjetas) que el progreso cambiÃ³
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

    // ── Gestor de Pantalla Completa (Multiplataforma: Móvil / Tablet / PC / iOS) ──
    const toggleFullscreen = useCallback(async () => {
      const isCurrentlyFs = isFullscreen || Boolean(document.fullscreenElement || document.webkitFullscreenElement);

      if (isCurrentlyFs) {
        try {
          if (document.fullscreenElement || document.webkitFullscreenElement) {
            if (document.exitFullscreen) {
              await document.exitFullscreen().catch(() => {});
            } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen();
            }
          }
        } catch (_) {}

        try {
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
        } catch (_) {}

        setIsFullscreen(false);
        return;
      }

      setIsFullscreen(true);

      // Bloquear a apaisado en móviles si está soportado
      try {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(() => {});
        }
      } catch (_) {}

      // Intentar API nativa Fullscreen
      const container = videoContainerRef.current;
      const video = videoRef.current;

      try {
        if (container && container.requestFullscreen) {
          await container.requestFullscreen().catch(() => {});
        } else if (container && container.webkitRequestFullscreen) {
          container.webkitRequestFullscreen();
        } else if (video && video.webkitEnterFullscreen) {
          // iOS Safari iPhone
          video.webkitEnterFullscreen();
        } else if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch (err) {
        console.warn('Native requestFullscreen failed, using CSS fullscreen fallback:', err);
      }
    }, [isFullscreen]);

    // Sincronizar listeners de fullscreen nativo
    useEffect(() => {
      const onFsChange = () => {
        const fsElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        const isFs = Boolean(fsElement);
        setIsFullscreen(isFs);
        if (!isFs) {
          try {
            if (screen.orientation && screen.orientation.unlock) {
              screen.orientation.unlock();
            }
          } catch (_) {}
        }
      };

      document.addEventListener('fullscreenchange', onFsChange);
      document.addEventListener('webkitfullscreenchange', onFsChange);
      document.addEventListener('mozfullscreenchange', onFsChange);
      document.addEventListener('MSFullscreenChange', onFsChange);

      const video = videoRef.current;
      const onIosBegin = () => setIsFullscreen(true);
      const onIosEnd = () => setIsFullscreen(false);

      if (video) {
        video.addEventListener('webkitbeginfullscreen', onIosBegin);
        video.addEventListener('webkitendfullscreen', onIosEnd);
      }

      return () => {
        document.removeEventListener('fullscreenchange', onFsChange);
        document.removeEventListener('webkitfullscreenchange', onFsChange);
        document.removeEventListener('mozfullscreenchange', onFsChange);
        document.removeEventListener('MSFullscreenChange', onFsChange);
        if (video) {
          video.removeEventListener('webkitbeginfullscreen', onIosBegin);
          video.removeEventListener('webkitendfullscreen', onIosEnd);
        }
      };
    }, []);

    // Manejar retroceso en Android para salir de pantalla completa
    useEffect(() => {
      if (isFullscreen) {
        try {
          window.history.pushState({ animuxFullscreen: true }, '');
        } catch (_) {}

        const handlePopState = () => {
          if (document.fullscreenElement || document.webkitFullscreenElement) {
            try {
              if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
              else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            } catch (_) {}
          }
          try {
            if (screen.orientation && screen.orientation.unlock) {
              screen.orientation.unlock();
            }
          } catch (_) {}
          setIsFullscreen(false);
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
          window.removeEventListener('popstate', handlePopState);
        };
      }
    }, [isFullscreen]);

    // ── Cleanup on Unmount (exit fullscreen / PiP to avoid black screen) ─────────────
    useEffect(() => {
      return () => {
        // Salir de pantalla completa si está activa
        try {
          if (document.fullscreenElement || document.webkitFullscreenElement) {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
          }
        } catch (_) {}
        try {
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
        } catch (_) {}
        // Salir de Picture-in-Picture si está activo
        try {
          if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(() => {});
          }
        } catch (_) {}
        // Pausar y vaciar el video para evitar frame negro colgado
        const v = videoRef.current;
        if (v) {
          try { v.pause(); } catch (_) {}
          try { v.removeAttribute('src'); v.load(); } catch (_) {}
        }
      };
    }, []);

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

    // Funcion de cierre con fade-out animado para evitar pantalla negra
    const triggerClose = () => {
      setIsClosing(true);
      const doClose = () => {
        try {
          if (document.fullscreenElement || document.webkitFullscreenElement) {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
          }
        } catch (_) {}
        try {
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
        } catch (_) {}
        onClose();
      };
      setTimeout(doClose, 280);
    };

    const playerContainerClasses = minimized 
      ? "fixed bottom-20 md:bottom-6 right-4 w-[280px] sm:w-[340px] md:w-[380px] aspect-video z-[150] rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95)] border-2 border-rose-500/40 animate-slide-up group bg-black backdrop-blur-2xl ring-1 ring-white/10"
      : isFullscreen
      ? "fixed inset-0 z-[200] flex flex-col bg-black w-screen h-[100dvh] overflow-hidden"
      : `${isInline ? 'relative h-full w-full' : 'fixed inset-0'} z-[110] flex flex-col bg-black ${
          isClosing ? 'animate-player-fade-out' : 'animate-fade-in'
        }`;
    // Identificar el grupo de la serie actual
    const currentGroupId = channel.groupId || (channel.isVOD ? (channel.displayName || channel.name || '').split('-')[0].trim() : null);

    // Obtener exclusivamente los elementos pertenecientes a esta serie/podcast
    const seriesItems = playlist.filter(item => {
      if (channel.groupId && item.groupId) {
        return item.groupId === channel.groupId;
      }
      if (currentGroupId && item.isVOD) {
        const itemGroup = item.groupId || (item.displayName || item.name || '').split('-')[0].trim();
        return itemGroup.toLowerCase() === currentGroupId.toLowerCase();
      }
      return false;
    });

    const relevantPlaylist = (seriesItems.length > 0) ? seriesItems : (channel.groupId ? [channel] : playlist);
    const availableSeasons = [...new Set(relevantPlaylist.map(item => item.season))].filter(Boolean).sort((a,b) => a-b);

    const sidebarEpisodes = relevantPlaylist.filter(item => {
      if (item.season && item.season !== selectedSeason && !isPodcast) return false;
      if (!sidebarFilter) return true;
      return (item.name || item.title || '').toLowerCase().includes(sidebarFilter.toLowerCase());
    });

    return (
      <div className={playerContainerClasses}>
        {/* Full Controls */}
        {!minimized && !isInline && !isFullscreen && !isLocked && (
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3.5 bg-gradient-to-b from-black via-black/80 to-transparent z-50">
            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 mr-2">
              <button onClick={triggerClose} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-all shrink-0 cursor-pointer">
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
              <div className="flex flex-col min-w-0">
                <h2 className="text-white font-black text-sm sm:text-lg md:text-xl tracking-tight truncate max-w-[130px] xs:max-w-[170px] sm:max-w-xs md:max-w-md uppercase leading-tight">
                  {channel.displayName || channel.name}
                </h2>
                <span className="text-rose-600 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] truncate">{channel.category}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Botón de Favorito */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleFavorite) onToggleFavorite();
                }}
                title={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
                className={`p-1.5 sm:p-2 rounded-full border transition-all cursor-pointer active:scale-95 ${
                  isFavorite
                    ? "bg-rose-600/20 border-rose-500/50 text-rose-500 shadow-lg shadow-rose-600/30"
                    : "bg-white/5 hover:bg-white/10 border-white/5 text-white/80 hover:text-white"
                }`}
              >
                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isFavorite ? "fill-rose-500 scale-105" : ""}`} />
              </button>

              {/* Botón de Transmitir a Smart TV / Chromecast */}
              {!isEmbed && (
                <button
                  onClick={async () => {
                    const v = videoRef.current;
                    if (!v) return;
                    await triggerCasting(v, {
                      title: channel?.displayName || channel?.name,
                      category: channel?.category,
                      logo: channel?.logo,
                      url: v.src || v.currentSrc
                    });
                  }}
                  title="Transmitir a Smart TV o Chromecast"
                  className="p-1.5 sm:p-2 rounded-full bg-white/5 hover:bg-rose-600/20 hover:border-rose-500/40 border border-white/5 text-white/80 hover:text-white transition-all cursor-pointer active:scale-95"
                >
                  <Cast className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

                            {/* Botón de Bloqueo de Pantalla Táctil */}
              {!isPodcast && (
                <button
                  onClick={handleLock}
                  title="Bloquear pantalla táctil"
                  className="p-1.5 sm:p-2 rounded-full bg-white/5 hover:bg-rose-600/20 hover:border-rose-500/40 border border-white/5 text-white/80 hover:text-white transition-all cursor-pointer active:scale-95"
                >
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {/* Botón de Pantalla Completa */}
              {!isPodcast && (
                <button
                  onClick={toggleFullscreen}
                  title="Pantalla Completa"
                  className="p-1.5 sm:p-2 rounded-full bg-white/5 hover:bg-rose-600/20 hover:border-rose-500/40 border border-white/5 text-white transition-all cursor-pointer active:scale-95"
                >
                  <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              <button
                onClick={() => setMinimized(true)}
                title="Minimizar"
                className="p-1.5 sm:p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-all cursor-pointer active:scale-95"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
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
                title={isPiP ? "Salir de PiP" : "Pantalla en pantalla"}
                className={`hidden sm:flex p-1.5 sm:p-2 rounded-full border transition-all cursor-pointer active:scale-95 ${isPiP ? "bg-rose-600/20 border-rose-600/50 text-rose-400" : "bg-white/5 hover:bg-white/10 border-white/5 text-white"}`}
              >
                <PictureInPicture className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Mini Controls Dynamic Island Pill */}
        {minimized && (
          <>
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-50">
              <button 
                onClick={() => setMinimized(false)} 
                title="Maximizar Reproductor"
                className="p-2 bg-black/80 hover:bg-rose-600 backdrop-blur-xl rounded-full text-white border border-white/10 transition-all cursor-pointer shadow-lg"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              </button>
              <button 
                onClick={triggerClose} 
                title="Cerrar"
                className="p-2 bg-black/80 hover:bg-white/20 backdrop-blur-xl rounded-full text-white border border-white/10 transition-all cursor-pointer shadow-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Bottom mini status bar */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black via-black/80 to-transparent z-40 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                <span className="text-[10px] font-black text-white uppercase tracking-wider truncate drop-shadow">
                  {channel.displayName || channel.name}
                </span>
              </div>
            </div>
          </>
        )}

        <div className={`flex-1 flex flex-col ${minimized ? '' : (isFullscreen ? '' : 'lg:flex-row')} overflow-hidden relative ${isFullscreen ? 'w-full h-full' : ''}`}>
          {/* Ambience Background Layer */}
          {!minimized && !isFullscreen && (
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-tr from-rose-900/20 via-black to-black" />
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-600/5 blur-[120px] rounded-full animate-pulse" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/5 blur-[100px] rounded-full" />
            </div>
          )}

          <div 
            ref={videoContainerRef}
            className={`relative shrink-0 w-full ${
              isFullscreen
                ? 'w-full h-full flex-1 flex items-center justify-center bg-black'
                : (isPodcast ? 'aspect-auto min-h-[380px] sm:min-h-[440px]' : 'aspect-video lg:aspect-auto lg:flex-1')
            } flex items-center justify-center group overflow-hidden z-10 bg-black`}
          >
            {/* Real Video Player */}
            <div className="w-full h-full flex items-center justify-center relative">
              {isEmbed && isFullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/80 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-2xl transition-all cursor-pointer active:scale-95"
                  title="Salir de Pantalla Completa"
                >
                  <Minimize className="w-5 h-5" />
                </button>
              )}
              {isYouTube ? (
                 <iframe src={`https://www.youtube.com/embed/${getYouTubeId(currentUrl)}?autoplay=1&modestbranding=1&rel=0`} className="w-full h-full border-0" allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen onLoad={() => setLoading(false)} />
              ) : isDrive ? (
                 <iframe src={`https://drive.google.com/file/d/${getDriveId(currentUrl)}/preview`} className="w-full h-full border-0" allow="autoplay; fullscreen" allowFullScreen onLoad={() => setLoading(false)} />
              ) : isEmbed ? (
                 <iframe src={currentUrl} referrerPolicy="no-referrer" className="w-full h-full border-0 bg-black" allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen title="Embed Player" onLoad={() => setLoading(false)} />
              ) : (
                 <>
                   <video 
                     ref={videoRef} 
                     className={`${isPodcast ? "opacity-0 absolute pointer-events-none w-0 h-0" : `w-full h-full ${videoFit === 'cover' ? 'object-cover' : 'object-contain'} shadow-2xl`} sub-color-${subColor} sub-size-${subSize}`} 
                     autoPlay 
                     playsInline
                     onContextMenu={(e) => e.preventDefault()}
                     onPlay={() => { setLoading(false); setIsPlaying(true); }}
                     onPlaying={() => { setLoading(false); setIsPlaying(true); }}
                     onPause={() => setIsPlaying(false)}
                     onWaiting={() => setLoading(true)}
                     onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                     onLoadedMetadata={(e) => setDuration(e.target.duration)}
                     onDurationChange={(e) => setDuration(e.target.duration)}
                   >
                     {selectedSubtitleTrack === 'external' && externalSubtitle?.blobUrl && (
                       <track 
                         key={`${externalSubtitle.blobUrl}-${subOffset}`}
                         kind="subtitles" 
                         src={externalSubtitle.blobUrl} 
                         srcLang="es" 
                         label={externalSubtitle.name || 'Subtítulo Personalizado'} 
                         default 
                       />
                     )}
                   </video>
                   {/* Professional custom controls overlay (hidden for podcast which has its own UI) */}
                   {!isPodcast && (
                     <VideoControls
                       videoRef={videoRef}
                       isPlaying={isPlaying}
                       isMuted={isMuted}
                       currentTime={currentTime}
                       duration={duration}
                       isPiP={isPiP}
                       levels={levels}
                       currentLevel={currentLevel}
                       channel={channel}
                       serverIndex={serverIndex}
                       loading={loading}
                       isFullscreen={isFullscreen}
                       onToggleFullscreen={toggleFullscreen}
                        onToggleLock={handleLock}
                       videoFit={videoFit}
                       onToggleVideoFit={() => setVideoFit(f => f === 'contain' ? 'cover' : 'contain')}
                                              hasSubtitlesActive={selectedSubtitleTrack !== -1 || audioTracks.length > 1}
                       onTogglePlay={() => {
                         const v = videoRef.current;
                         if (!v) return;
                         if (v.paused) safePlay();
                         else v.pause();
                       }}
                       onLevelChange={(lvl) => {
                         if (hlsRef.current) {
                           hlsRef.current.currentLevel = lvl;
                           setCurrentLevel(lvl);
                         }
                       }}
                     />
                   )}
                                       {/* Screen Lock Overlay */}
                    {isLocked && (
                      <div 
                        className="absolute inset-0 z-[160] flex flex-col items-center justify-center select-none bg-black/20"
                        onClick={triggerShowLockNotice}
                      >
                        {/* Centered Unlock Prompt Button */}
                        <div 
                          className={`transition-all duration-300 transform ${
                            showLockNotice 
                              ? 'opacity-100 scale-100 pointer-events-auto' 
                              : 'opacity-0 scale-95 pointer-events-none'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={handleUnlock}
                            className="flex items-center gap-3 px-6 py-3.5 rounded-full bg-neutral-950/95 hover:bg-black active:scale-95 backdrop-blur-2xl border border-rose-500/50 shadow-[0_10px_40px_rgba(225,29,72,0.4)] text-white transition-all cursor-pointer group"
                          >
                            <div className="p-2 rounded-full bg-rose-600 group-hover:bg-rose-500 text-white shadow-md shadow-rose-600/40 transition-colors">
                              <Unlock className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col text-left pr-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">
                                Pantalla Bloqueada
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                                Toca aquí para desbloquear
                              </span>
                            </div>
                          </button>
                        </div>

                        {/* Subtle Floating Lock Icon in top-left when prompt is hidden */}
                        <div 
                          className={`absolute top-4 left-4 transition-opacity duration-300 ${
                            showLockNotice ? 'opacity-0 pointer-events-none' : 'opacity-60 hover:opacity-100 pointer-events-auto'
                          }`}
                        >
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerShowLockNotice();
                            }}
                            className="p-2.5 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/15 text-rose-400 cursor-pointer shadow-lg active:scale-95 transition-all"
                            title="Toca para desbloquear"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

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

                         {/* Mini Sound Equalizer Waves â€” fixed durations for stable animation */}
                         <div className="flex items-end justify-center gap-1.5 h-8">
                           {EQ_DURATIONS.map((eqDuration, bar) => (
                             <div 
                               key={bar} 
                               className="w-1 h-full rounded-full bg-gradient-to-t from-rose-500 to-violet-500 equalizer-bar"
                               style={{
                                 transform: isPlaying ? 'scaleY(1)' : 'scaleY(0.15)',
                                 transformOrigin: 'bottom',
                                 animation: isPlaying ? `equalizer-wave ${eqDuration}s ease-in-out infinite alternate` : 'none',
                                 animationDelay: `${bar * 0.07}s`
                               }}
                             />
                           ))}
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

                       {/* Keyframes moved to index.css â€” no inline styles needed */}

                     </div>
                   )}
                 </>
              )}

              {/* Resume Prompt Overlay */}
              {showResumePrompt && !loading && !error && !minimized && (
                <div className="absolute inset-0 flex items-center justify-center z-[60] pointer-events-none p-4 animate-fade-in">
                  <div className="bg-neutral-950/95 backdrop-blur-2xl border border-white/15 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 max-w-sm sm:max-w-md w-full pointer-events-auto shadow-rose-950/40 border-rose-500/20">
                    <div className="flex flex-col min-w-0 text-center sm:text-left flex-1">
                      <span className="text-[10px] sm:text-xs font-black text-rose-500 uppercase tracking-widest">
                        ¿Continuar Viendo?
                      </span>
                      <span className="text-white text-xs sm:text-sm font-bold uppercase tracking-tight truncate mt-0.5">
                        Quedaste en {new Date(savedTime * 1000).toISOString().substr(11, 8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setShowResumePrompt(false)}
                        className="px-3.5 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-white/80 hover:text-white text-[10px] sm:text-xs font-black uppercase transition-all"
                      >
                        Ignorar
                      </button>
                      <button
                        onClick={handleResume}
                        className="px-4 sm:px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-[10px] sm:text-xs font-black uppercase shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
                      >
                        <Play className="w-3 h-3 fill-current shrink-0" />
                        <span>Reanudar</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Audio and Subtitles Modal Overlay */}
              {showAudioSubtitlesModal && !minimized && (
                <div className="absolute inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
                  <div 
                    className="absolute inset-0" 
                    onClick={() => setShowAudioSubtitlesModal(false)} 
                  />
                  <div className="relative w-full max-w-md bg-[#0d0d12] border border-white/15 rounded-3xl p-5 md:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.95)] z-10 space-y-4 animate-slide-up">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <Languages className="w-5 h-5 text-rose-500" />
                        <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-white">Audio y Subtítulos</h3>
                      </div>
                      <button 
                        onClick={() => setShowAudioSubtitlesModal(false)}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                      <button
                        onClick={() => setActiveModalTab('subtitles')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          activeModalTab === 'subtitles'
                            ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Subtitles className="w-3.5 h-3.5" />
                        Subtítulos
                        {selectedSubtitleTrack !== -1 && (
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        )}
                      </button>
                      <button
                        onClick={() => setActiveModalTab('audio')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          activeModalTab === 'audio'
                            ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        Audio
                        {audioTracks.length > 1 && (
                          <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-black">
                            {audioTracks.length}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Subtitles Tab Content */}
                    {activeModalTab === 'subtitles' && (
                      <div className="space-y-3.5 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                        {/* Subtitle Selection List */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">
                            Pistas Disponibles
                          </span>

                          {/* Desactivados */}
                          <button
                            onClick={() => handleSelectSubtitleTrack(-1)}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                              selectedSubtitleTrack === -1
                                ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 font-black'
                                : 'bg-white/[0.02] hover:bg-white/5 text-gray-300 border border-white/5'
                            }`}
                          >
                            <span>Desactivados</span>
                            {selectedSubtitleTrack === -1 && <Check className="w-4 h-4 text-rose-400" />}
                          </button>

                          {/* Embedded Subtitle Tracks */}
                          {subtitleTracks.map((st, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectSubtitleTrack(st.id ?? idx)}
                              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                                selectedSubtitleTrack === (st.id ?? idx)
                                  ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 font-black'
                                  : 'bg-white/[0.02] hover:bg-white/5 text-gray-300 border border-white/5'
                              }`}
                            >
                              <span>{st.name || st.lang || `SubtÃ­tulo ${idx + 1}`}</span>
                              {selectedSubtitleTrack === (st.id ?? idx) && <Check className="w-4 h-4 text-rose-400" />}
                            </button>
                          ))}

                          {/* External Subtitle Track (If loaded) */}
                          {externalSubtitle && (
                            <div className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                              selectedSubtitleTrack === 'external'
                                ? 'bg-rose-600/20 text-rose-300 border-rose-500/40'
                                : 'bg-white/[0.02] hover:bg-white/5 text-gray-300 border border-white/5'
                            }`}>
                              <button
                                onClick={() => handleSelectSubtitleTrack('external')}
                                className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                              >
                                <Subtitles className="w-4 h-4 text-rose-400 shrink-0" />
                                <div className="truncate">
                                  <p className="text-xs font-black truncate">{externalSubtitle.name}</p>
                                  <span className="text-[9px] text-gray-400 uppercase tracking-wider">SubtÃ­tulo Personalizado</span>
                                </div>
                              </button>
                              <div className="flex items-center gap-2">
                                {selectedSubtitleTrack === 'external' && <Check className="w-4 h-4 text-rose-400" />}
                                <button
                                  onClick={handleRemoveExternalSub}
                                  title="Eliminar subtÃ­tulo externo"
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-600/20 text-gray-400 hover:text-rose-400 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Upload External Subtitle File */}
                        <div className="pt-1">
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept=".srt,.vtt,text/plain"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-rose-500/50 text-gray-200 hover:text-white text-xs font-black uppercase tracking-wider transition-all"
                          >
                            <Upload className="w-4 h-4 text-rose-500" />
                            Cargar archivo .SRT o .VTT
                          </button>
                        </div>

                        {/* Sync Offset and Styling Settings (if subtitle is active) */}
                        {selectedSubtitleTrack !== -1 && (
                          <div className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-3 pt-2.5">
                            {/* Timing Delay / Offset */}
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">SincronizaciÃ³n</span>
                                <span className="text-xs font-bold text-white">
                                  {subOffset === 0 ? '0.0s (Normal)' : `${subOffset > 0 ? '+' : ''}${subOffset}s`}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleOffsetChange(-0.5)}
                                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-black border border-white/10 active:scale-95"
                                  title="Retrasar 0.5s"
                                >
                                  -0.5s
                                </button>
                                <button
                                  onClick={() => setSubOffset(0)}
                                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] font-bold border border-white/5"
                                  title="Restablecer sincronÃ­a"
                                >
                                  Reset
                                </button>
                                <button
                                  onClick={() => handleOffsetChange(0.5)}
                                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-black border border-white/10 active:scale-95"
                                  title="Adelantar 0.5s"
                                >
                                  +0.5s
                                </button>
                              </div>
                            </div>

                            {/* Color & Size */}
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                              <div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Color</span>
                                <div className="flex gap-2">
                                  {[
                                    { id: 'white', bg: 'bg-white', label: 'Blanco' },
                                    { id: 'yellow', bg: 'bg-yellow-400', label: 'Amarillo' },
                                    { id: 'cyan', bg: 'bg-sky-400', label: 'Cian' },
                                  ].map(c => (
                                    <button
                                      key={c.id}
                                      onClick={() => setSubColor(c.id)}
                                      className={`w-5 h-5 rounded-full ${c.bg} border-2 transition-all ${
                                        subColor === c.id ? 'border-rose-500 scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                                      }`}
                                      title={c.label}
                                    />
                                  ))}
                                </div>
                              </div>

                              <div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">TamaÃ±o</span>
                                <div className="flex gap-1">
                                  {[
                                    { id: 'small', label: 'S' },
                                    { id: 'medium', label: 'M' },
                                    { id: 'large', label: 'L' },
                                  ].map(s => (
                                    <button
                                      key={s.id}
                                      onClick={() => setSubSize(s.id)}
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase transition-all border ${
                                        subSize === s.id
                                          ? 'bg-rose-600 text-white border-rose-500'
                                          : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'
                                      }`}
                                    >
                                      {s.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Audio Tab Content */}
                    {activeModalTab === 'audio' && (
                      <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">
                          Pistas de Audio ({audioTracks.length || 1})
                        </span>

                        {audioTracks.length > 0 ? (
                          audioTracks.map((at, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectAudioTrack(idx)}
                              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                                selectedAudioTrack === idx
                                  ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 font-black'
                                  : 'bg-white/[0.02] hover:bg-white/5 text-gray-300 border border-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Volume2 className="w-4 h-4 text-rose-400" />
                                <span>{at.name || at.lang || `Pista ${idx + 1}`}</span>
                              </div>
                              {selectedAudioTrack === idx && <Check className="w-4 h-4 text-rose-400" />}
                            </button>
                          ))
                        ) : (
                          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1">
                            <p className="text-xs font-bold text-gray-300">Pista Principal (Predeterminada)</p>
                            <p className="text-[10px] text-gray-500 font-medium">Esta transmisión cuenta con una única pista de audio estéreo.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status Overlays */}
            {loading && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl z-20">
                <ContentLoader channel={channel} className="w-16 h-16" />
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
          {!minimized && !isFullscreen && (
            <div className="w-full lg:w-[400px] bg-[#050505]/60 backdrop-blur-3xl border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col h-auto lg:h-full overflow-hidden z-20 relative">
              {/* Quick Info / Cinematic Header (Visible only when not minimized) */}
              <div className="p-3.5 sm:p-4 lg:p-5 border-b border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 min-w-0">
                    <div className="px-2.5 py-1 bg-rose-600/15 border border-rose-500/30 rounded-lg flex items-center gap-1.5 shadow-sm shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.18em]">
                        {channel.groupId && channel.isVOD ? "SERIE" : channel.isVOD ? "PELÍCULA" : isPodcast ? "PÓDCAST" : "CANAL EN VIVO"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-[9px] font-bold text-gray-300 shadow-sm shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-emerald-400 font-extrabold tracking-wider">SEÑAL ESTABLE</span>
                      <span className="w-1 h-1 rounded-full bg-gray-500" />
                      <span className="text-rose-400 font-extrabold tracking-wider">{currentLevel !== -1 && levels[currentLevel]?.height ? `${levels[currentLevel].height}P HD` : "1080P HD"}</span>
                    </div>
                    </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => {
                        if (window.confirm("¿Reportar señal de este canal?")) onReportBroken?.(channel);
                      }}
                      title="Reportar Problema"
                      className="p-1.5 sm:p-2 hover:bg-rose-600/20 text-gray-400 hover:text-rose-400 rounded-xl transition-all border border-transparent hover:border-rose-500/20 cursor-pointer"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4 className="text-white font-extrabold text-sm lg:text-base tracking-tight leading-snug mb-1.5 line-clamp-1">
                  {channel.displayName || channel.name}
                </h4>

                <p className="text-gray-400 text-[11px] leading-relaxed font-medium line-clamp-2">
                  {channel.description || `Disfruta del mejor contenido en transmisión digital de alta definición sin interrupciones con calidad de estudio.`}
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

                            {/* Playing border indicator */}
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
                            ? `group relative flex flex-col items-center justify-between p-0 rounded-2xl cursor-pointer transition-all duration-300 border overflow-hidden aspect-video w-full shadow-lg ${
                                isCurrentlyPlaying 
                                  ? 'bg-rose-950/40 border-rose-500 shadow-[0_0_25px_rgba(225,29,72,0.35)] scale-[1.02]' 
                                  : 'bg-[#0f0f15] hover:bg-[#161622] border-white/[0.08] hover:border-white/25 hover:scale-[1.02]'
                              }`
                            : `group flex items-center gap-3.5 p-2.5 rounded-2xl cursor-pointer transition-all duration-300 border shrink-0 w-44 lg:w-full ${
                                isCurrentlyPlaying 
                                  ? 'bg-rose-600/15 border-rose-500/40 shadow-md' 
                                  : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-white/10'
                              }`
                          }
                        >
                          {channel.groupId && channel.isVOD ? (
                            <>
                              {/* Imagen de fondo con degradado cinemático */}
                              <div className="absolute inset-0 z-0 overflow-hidden">
                                <img 
                                  src={item.logo} 
                                  className="w-full h-full object-cover opacity-40 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500" 
                                  alt="" 
                                  onError={(e) => { e.target.src = '/icon-512.png'; }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                              </div>

                              {/* Badge Superior de Episodio */}
                              <div className="relative z-10 w-full p-2.5 flex items-center justify-between">
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider backdrop-blur-md ${
                                  isCurrentlyPlaying 
                                    ? 'bg-rose-600 text-white shadow-sm' 
                                    : 'bg-black/60 text-white/80 border border-white/10'
                                }`}>
                                  EP {item.name.match(/\d+$/) ? item.name.match(/\d+$/)[0] : (idx + 1)}
                                </span>
                                
                                {isCurrentlyPlaying && (
                                  <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                                  </span>
                                )}
                              </div>

                              {/* Pie de tarjeta con título y botón de play */}
                              <div className="relative z-10 w-full p-2.5 flex items-end justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className={`text-[10px] font-extrabold uppercase truncate tracking-tight ${
                                    isCurrentlyPlaying ? 'text-rose-400' : 'text-white/90 group-hover:text-white'
                                  }`}>
                                    {item.name?.split('-').pop()?.trim() || `Capítulo ${idx + 1}`}
                                  </p>
                                  <span className="text-[8px] font-bold text-gray-400 tracking-wider">
                                    {isCurrentlyPlaying ? 'Reproduciendo' : 'Ver ahora'}
                                  </span>
                                </div>

                                <div className={`p-2 rounded-xl backdrop-blur-md transition-all ${
                                  isCurrentlyPlaying 
                                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' 
                                    : 'bg-white/10 text-white opacity-0 group-hover:opacity-100 group-hover:scale-110'
                                }`}>
                                  <Play className="w-2.5 h-2.5 fill-current" />
                                </div>
                              </div>

                              {/* Indicador de progreso de reproducción inferior */}
                              {isCurrentlyPlaying && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-600 shadow-[0_0_8px_#e11d48]" />
                              )}
                            </>
                          ) : (
                            <>
                              <div className="rounded-xl overflow-hidden shrink-0 bg-black/60 border border-white/5 w-16 lg:w-20 aspect-video relative group-hover:scale-105 transition-transform duration-300">
                                <img src={item.logo} className="w-full h-full object-contain p-1.5" alt="" onError={(e) => { e.target.src = '/icon-512.png'; }} />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Play className="w-3.5 h-3.5 text-white fill-current" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className={`text-[11px] font-extrabold truncate tracking-tight uppercase group-hover:text-rose-400 transition-colors ${
                                  String(item.id) === String(channel.id) ? 'text-rose-400' : 'text-white'
                                }`}>
                                  {item.name || item.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-[8px] uppercase font-bold tracking-widest ${
                                    String(item.id) === String(channel.id) ? 'text-rose-500' : 'text-gray-400'
                                  }`}>
                                    {String(item.id) === String(channel.id) ? 'En Vivo' : channel.category || 'Canal'}
                                  </span>
                                  {String(item.id) === String(channel.id) && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                 {/* Second Section: Global Trends (Solo en modo TV en vivo) */}
                 {!channel.groupId && !channel.isVOD && !isPodcast && (
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
                 )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }





