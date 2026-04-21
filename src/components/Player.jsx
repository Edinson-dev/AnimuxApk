import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { X, Maximize, AlertCircle, Loader2, MessageSquare, Settings, PictureInPicture } from 'lucide-react';

export default function Player({ channel, onClose }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasSubtitles, setHasSubtitles] = useState(false);
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!channel || !videoRef.current) return;

    const video = videoRef.current;
    setError(false);
    setLoading(true);

    let hls;
    
    // Timeout de 12 segundos para detener la carga infinita (por CORS o canal caído)
    const timeoutId = setTimeout(() => {
      setError(true);
      setLoading(false);
    }, 12000);

    const clearTimer = () => clearTimeout(timeoutId);

    if (Hls.isSupported()) {
      hls = new Hls({ maxBufferLength: 30, enableWorker: true });
      hlsRef.current = hls;
      
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        clearTimer();
        setLoading(false);
        if (hls.levels) setLevels(hls.levels);
        video.play().catch(e => console.error("Auto-play prevented:", e));
      });
      
      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (event, data) => {
        const tracks = data.subtitleTracks;
        if (tracks && tracks.length > 0) {
          setHasSubtitles(true);
          const esTrackIndex = tracks.findIndex(t => 
            t.lang && (t.lang.toLowerCase().startsWith('es') || t.lang.toLowerCase().startsWith('spa'))
          );
          if (esTrackIndex !== -1) {
            hls.subtitleTrack = esTrackIndex;
          }
        }
      });

      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
           switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              clearTimer();
              // A veces NETWORK_ERROR es CORS estricto. Si no carga, marcamos error.
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              clearTimer();
              setError(true);
              setLoading(false);
              hls.destroy();
              break;
           }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.url;
      video.addEventListener('loadedmetadata', () => {
        clearTimer();
        setLoading(false);
        
        // Native Apple Subtitles check
        if (video.textTracks && video.textTracks.length > 0) {
          let foundEs = false;
          for (let i = 0; i < video.textTracks.length; i++) {
            const track = video.textTracks[i];
            if (track.language && (track.language.toLowerCase().startsWith('es') || track.language.toLowerCase().startsWith('spa'))) {
              track.mode = 'showing';
              foundEs = true;
            } else {
               track.mode = 'hidden';
            }
          }
          if (video.textTracks.length > 0) setHasSubtitles(true);
        }

        video.play().catch(e => console.error("Auto-play prevented:", e));
      });
      video.addEventListener('error', () => {
        clearTimer();
        setError(true);
        setLoading(false);
      });
    } else {
      clearTimer();
      setError(true);
      setLoading(false);
    }

    return () => {
      clearTimer();
      if (hls) hls.destroy();
      hlsRef.current = null;
    };
  }, [channel]);

  const toggleSubtitles = () => {
    if (hlsRef.current) {
      const currentTrack = hlsRef.current.subtitleTrack;
      if (currentTrack === -1) {
        const tracks = hlsRef.current.subtitleTracks;
        const esTrackIndex = tracks.findIndex(t => 
            t.lang && (t.lang.toLowerCase().startsWith('es') || t.lang.toLowerCase().startsWith('spa'))
        );
        hlsRef.current.subtitleTrack = esTrackIndex !== -1 ? esTrackIndex : 0;
      } else {
        hlsRef.current.subtitleTrack = -1;
      }
    } else if (videoRef.current && videoRef.current.textTracks) {
        let isShowing = false;
        for (let i = 0; i < videoRef.current.textTracks.length; i++) {
            if (videoRef.current.textTracks[i].mode === 'showing') isShowing = true;
        }
        for (let i = 0; i < videoRef.current.textTracks.length; i++) {
            videoRef.current.textTracks[i].mode = isShowing ? 'hidden' : 'showing';
        }
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().catch(e => console.log(e));
    }
  };

  const togglePiP = () => {
    if (videoRef.current !== document.pictureInPictureElement) {
      videoRef.current?.requestPictureInPicture().catch(console.error);
    } else {
      document.exitPictureInPicture().catch(console.error);
    }
  };

  const changeQuality = (index) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index;
      setCurrentLevel(index);
      setShowSettings(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorar si el usuario está escribiendo en algún hipotético input dentro del player (aunque no hay por ahora)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (!videoRef.current) return;
      
      switch(e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
          break;
        case 'm':
          e.preventDefault();
          videoRef.current.muted = !videoRef.current.muted;
          break;
        case 'f':
          e.preventDefault();
          toggleFullScreen();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDoubleClick = (direction) => {
    if (!videoRef.current) return;
    if (direction === 'forward') {
      videoRef.current.currentTime += 10;
    } else {
      videoRef.current.currentTime -= 10;
    }
  };

  if (!channel) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <div 
        ref={containerRef}
        className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 group"
      >
        <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-50 flex justify-between items-center transition-opacity duration-300 ${loading || error ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="flex items-center gap-3">
            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              En Vivo
            </span>
            <h2 className="text-white font-bold text-lg drop-shadow-md">{channel.name}</h2>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          autoPlay
          playsInline
        />

        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-white font-medium text-lg animate-pulse">Conectando a la señal...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 p-6 text-center">
            <AlertCircle className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-white mb-2">Canal Caído o Bloqueado (CORS)</h3>
            <p className="text-gray-300 max-w-md text-sm">
              La transmisión de <strong className="text-white">{channel.name}</strong> tardó demasiado o no está disponible. 
              Muchos enlaces gratuitos de internet están geobloqueados o duran poco tiempo (caídos periódicamente).
            </p>
            <button 
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-white/10 hover:bg-rose-500/20 text-white border border-white/20 hover:border-rose-500/50 rounded-lg transition-all"
            >
              Cerrar y buscar otro canal
            </button>
          </div>
        )}

        {!error && (
          <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2 items-center">
            
            {/* Opciones de Calidad (HLS.js) */}
            {levels.length > 0 && (
              <div className="relative">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 bg-black/60 hover:bg-primary/80 backdrop-blur-md text-white rounded-lg transition-colors border border-white/10 shadow-lg"
                  title="Calidad de Video"
                >
                  <Settings className="w-5 h-5" />
                </button>
                
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-3 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden flex flex-col w-32 shadow-2xl animate-fade-in z-50">
                    <button 
                      className={`px-4 py-2 text-sm text-left hover:bg-white/10 transition-colors ${currentLevel === -1 ? 'text-primary font-bold bg-primary/10' : 'text-white'}`}
                      onClick={() => changeQuality(-1)}
                    >
                      Automático
                    </button>
                    {levels.map((level, index) => (
                      <button 
                        key={index}
                        className={`px-4 py-2 text-sm text-left hover:bg-white/10 transition-colors ${currentLevel === index ? 'text-primary font-bold bg-primary/10' : 'text-white'}`}
                        onClick={() => changeQuality(index)}
                      >
                        {level.height}p
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {hasSubtitles && (
              <button 
                onClick={toggleSubtitles}
                className="p-2 bg-black/60 hover:bg-primary/80 backdrop-blur-md text-white rounded-lg transition-colors border border-white/10 shadow-lg"
                title="Activar/Desactivar Subtítulos"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            )}

            {/* Compartir Canal */}
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/?play=${channel.id}`);
                alert('¡Enlace de canal copiado para compartir!');
              }}
              className="p-2 bg-black/60 hover:bg-primary/80 backdrop-blur-md text-white rounded-lg transition-colors border border-white/10 shadow-lg"
              title="Copiar enlace de canal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            </button>

            {/* Picture in Picture */}
            <button 
              onClick={togglePiP}
              className="p-2 bg-black/60 hover:bg-primary/80 backdrop-blur-md text-white rounded-lg transition-colors border border-white/10 shadow-lg"
              title="Mini-Reproductor (PiP)"
            >
              <PictureInPicture className="w-5 h-5" />
            </button>

            {/* Fullscreen */}
            <button 
              onClick={toggleFullScreen}
              className="p-2 bg-black/60 hover:bg-primary/80 backdrop-blur-md text-white rounded-lg transition-colors border border-white/10 shadow-lg"
              title="Pantalla Completa (F)"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
