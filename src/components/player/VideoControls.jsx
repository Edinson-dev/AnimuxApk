import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, PictureInPicture,
  Maximize, Minimize, SkipBack, SkipForward, Settings, Cast, Lock, Unlock
} from "lucide-react";
import { triggerCasting, checkCastSupport } from "../../utils/cast";

const formatTime = (secs) => {
  if (isNaN(secs) || !secs) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

// Fixed equalizer bar durations - never recalculated on re-render
export const EQ_DURATIONS = [0.72, 1.08, 0.85, 1.25, 0.68, 0.95, 1.18, 0.78, 1.02, 0.82];

export default function VideoControls({
  videoRef,
  isPlaying,
  isMuted,
  currentTime,
  duration,
  isPiP,
  levels = [],
  currentLevel,
  channel,
  serverIndex = 0,
  loading = false,
  onTogglePlay,
  onLevelChange,
  isFullscreen: isFullscreenProp,
  onToggleFullscreen,
  videoFit = 'contain',
  onToggleVideoFit,
  onToggleLock,
  onOpenAudioSubtitles,
  hasSubtitlesActive = false,
}) {
  const [visible, setVisible] = useState(true);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreenLocal, setIsFullscreenLocal] = useState(false);
  const isFullscreen = typeof isFullscreenProp === "boolean" ? isFullscreenProp : isFullscreenLocal;
  const [seekFlash, setSeekFlash] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCasting, setIsCasting] = useState(false);
  const [canCast, setCanCast] = useState(true);

  const hideTimerRef = useRef(null);
  const volumeTimerRef = useRef(null);
  const lastTapRef = useRef({ time: 0, side: null });
  const singleClickTimerRef = useRef(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Detect Cast & RemotePlayback
  useEffect(() => {
    const video = videoRef?.current;
    if (!video) return;

    setCanCast(checkCastSupport(video));

    if (video.remote) {
      const onConnecting = () => setIsCasting(true);
      const onConnect = () => setIsCasting(true);
      const onDisconnect = () => setIsCasting(false);

      video.remote.addEventListener('connecting', onConnecting);
      video.remote.addEventListener('connect', onConnect);
      video.remote.addEventListener('disconnect', onDisconnect);

      return () => {
        video.remote.removeEventListener('connecting', onConnecting);
        video.remote.removeEventListener('connect', onConnect);
        video.remote.removeEventListener('disconnect', onDisconnect);
      };
    }
  }, [videoRef]);

  const handleCast = async () => {
    const video = videoRef?.current;
    if (!video) return;
    await triggerCasting(video, {
      title: channel?.displayName || channel?.name,
      category: channel?.category,
      logo: channel?.logo,
      url: video.src || video.currentSrc
    });
  };

  // Auto-hide controls
  const showControls = useCallback(() => {
    setVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!isDragging) setVisible(false);
    }, 3500);
  }, [isDragging]);

  useEffect(() => {
    showControls();
    return () => clearTimeout(hideTimerRef.current);
  }, [showControls]);

  useEffect(() => {
    if (!isPlaying) {
      setVisible(true);
      clearTimeout(hideTimerRef.current);
    } else {
      showControls();
    }
  }, [isPlaying, showControls]);

  // Sync volume from video element
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      setVolume(video.volume);
      setPlaybackRate(video.playbackRate || 1);
    }
  }, [videoRef]);

  // Fullscreen detection (cross-browser)
  useEffect(() => {
    const onFsChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreenLocal(isFs);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    document.addEventListener("mozfullscreenchange", onFsChange);
    document.addEventListener("MSFullscreenChange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      document.removeEventListener("mozfullscreenchange", onFsChange);
      document.removeEventListener("MSFullscreenChange", onFsChange);
    };
  }, []);

  const handlePlayPause = useCallback(() => {
    if (onTogglePlay) {
      onTogglePlay();
    } else {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
    showControls();
  }, [onTogglePlay, showControls, videoRef]);

  const handleSkip = useCallback((seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    setSeekFlash(seconds > 0 ? "right" : "left");
    setTimeout(() => setSeekFlash(null), 500);
    showControls();
  }, [showControls, videoRef]);

  const handleFullscreen = () => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
    } else {
      const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      if (isFs) {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else {
        const video = videoRef?.current;
        const target = video?.parentElement || document.documentElement;
        if (target.requestFullscreen) target.requestFullscreen().catch(() => {});
        else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
        else if (video?.webkitEnterFullscreen) video.webkitEnterFullscreen();
      }
    }
  };

  const handlePiP = async () => {
    try {
      const video = videoRef.current;
      if (!video) return;
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (_) {}
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          handlePlayPause();
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSkip(10);
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleSkip(-10);
          break;
        case "ArrowUp":
          e.preventDefault();
          {
            const v = Math.min(1, video.volume + 0.1);
            video.volume = v;
            video.muted = false;
            setVolume(v);
            showControls();
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          {
            const v = Math.max(0, video.volume - 0.1);
            video.volume = v;
            setVolume(v);
            showControls();
          }
          break;
        case "m":
        case "M":
          video.muted = !video.muted;
          showControls();
          break;
        case "f":
        case "F":
          handleFullscreen();
          break;
        case "i":
        case "I":
          handlePiP();
          break;
        case "c":
        case "C":
          handleCast();
          break;
        default:
          if (e.key >= "0" && e.key <= "9" && video.duration) {
            video.currentTime = (parseInt(e.key) / 10) * video.duration;
            showControls();
          }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handlePlayPause, handleSkip, showControls, videoRef]);

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = parseFloat(e.target.value);
  };

  const handleVolume = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    video.muted = val === 0;
    setVolume(val);
  };

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const handleUnmute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.volume = 1;
    setVolume(1);
    showControls();
  };

  const handleSpeed = () => {
    const video = videoRef.current;
    if (!video) return;
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    video.playbackRate = newSpeed;
    setPlaybackRate(newSpeed);
    showControls();
  };

  // Video surface click & double-tap handling
  const handleSurfaceClick = (e) => {
    // If click originated from interactive control elements, ignore
    if (e.target.closest("button") || e.target.closest("input") || e.target.closest(".interactive-panel")) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftThird = x < rect.width * 0.35;
    const isRightThird = x > rect.width * 0.65;
    const now = Date.now();

    // Check double tap for skip -10s / +10s or center double-tap fullscreen
    if (now - lastTapRef.current.time < 300) {
      clearTimeout(singleClickTimerRef.current);
      if (isLeftThird) {
        handleSkip(-10);
        lastTapRef.current = { time: 0, side: null };
        return;
      } else if (isRightThird) {
        handleSkip(10);
        lastTapRef.current = { time: 0, side: null };
        return;
      } else {
        // Doble toque central: alternar pantalla completa
        handleFullscreen();
        lastTapRef.current = { time: 0, side: null };
        return;
      }
    }

    lastTapRef.current = { time: now, side: isLeftThird ? "left" : isRightThird ? "right" : "center" };

    // Single click: toggle play/pause or show controls
    singleClickTimerRef.current = setTimeout(() => {
      const video = videoRef.current;
      if (video && video.paused) {
        handlePlayPause();
      } else {
        if (visible) {
          setVisible(false);
        } else {
          showControls();
        }
      }
    }, 250);
  };

  const effectiveVolume = isMuted ? 0 : volume;
  const qualityLabel = currentLevel === -1 ? "Auto" : (levels[currentLevel]?.height ? `${levels[currentLevel].height}p` : "Auto");
  const serverLabel = `S${serverIndex + 1}`;

  return (
    <div
      className="absolute inset-0 z-30 select-none overflow-hidden"
      onMouseMove={showControls}
      onClick={handleSurfaceClick}
      style={{ cursor: visible ? "default" : "none" }}
    >
      {/* Seek Flash Overlay (-10s / +10s) */}
      {seekFlash && (
        <div className={`absolute inset-y-0 ${seekFlash === "left" ? "left-0 right-1/2" : "left-1/2 right-0"} flex items-center ${seekFlash === "left" ? "justify-start pl-10" : "justify-end pr-10"} pointer-events-none z-50 animate-fade-in`}>
          <div className="flex flex-col items-center gap-1.5 p-4 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl">
            {seekFlash === "left"
              ? <SkipBack className="w-6 h-6 text-white fill-current" />
              : <SkipForward className="w-6 h-6 text-white fill-current" />
            }
            <span className="text-[11px] font-black text-white uppercase tracking-widest">
              {seekFlash === "left" ? "-10s" : "+10s"}
            </span>
          </div>
        </div>
      )}

      {/* Prominent Center Play Button when paused and not loading */}
      {!isPlaying && !loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePlayPause();
            }}
            className="pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-600/90 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-[0_0_50px_rgba(225,29,72,0.6)] backdrop-blur-md border border-white/20 transition-all hover:scale-110 group cursor-pointer"
            title="Reproducir"
          >
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1 text-white group-hover:scale-105 transition-transform" />
          </button>
        </div>
      )}

      {/* Top Banner when Autoplay starts muted */}
      {isMuted && isPlaying && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUnmute();
            }}
            className="px-4 py-2 rounded-full bg-black/85 hover:bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-xl border border-white/20 shadow-2xl flex items-center gap-2 transition-all active:scale-95 animate-pulse cursor-pointer"
            title="Activar sonido"
          >
            <VolumeX className="w-4 h-4 text-rose-400" />
            <span>Audio silenciado · Toca para activar</span>
          </button>
        </div>
      )}

      {/* Top gradient */}
      <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 via-black/30 to-transparent transition-opacity duration-300 pointer-events-none ${visible ? "opacity-100" : "opacity-0"}`} />

      {/* Top bar in Fullscreen: Back/Minimize button + Channel Name */}
      {isFullscreen && (
        <div 
          className={`absolute top-3 left-4 flex items-center gap-3 transition-opacity duration-300 z-50 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`} 
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleFullscreen}
            className="p-2 rounded-full bg-black/70 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all active:scale-95 cursor-pointer shadow-lg"
            title="Salir de Pantalla Completa"
          >
            <Minimize className="w-4 h-4" />
          </button>
          <div className="flex flex-col min-w-0">
            <span className="text-white text-xs sm:text-sm font-black uppercase tracking-tight truncate max-w-[180px] sm:max-w-xs drop-shadow-md">
              {channel?.displayName || channel?.name}
            </span>
            <span className="text-rose-500 text-[9px] font-black uppercase tracking-widest">
              {channel?.category}
            </span>
          </div>
        </div>
      )}

      {/* Top badges (server, live, quality) */}
      <div className={`absolute top-3 right-4 flex items-center gap-2 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`} onClick={(e) => e.stopPropagation()}>
        {levels.length > 0 && (
          <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-black text-white/70 uppercase tracking-widest">
            {qualityLabel}
          </span>
        )}
        {channel?.streamId && (
          <span className="px-2 py-0.5 bg-rose-600/20 backdrop-blur-md border border-rose-500/20 rounded-full text-[9px] font-black text-rose-400 uppercase tracking-widest">
            {serverLabel}
          </span>
        )}
        {!channel?.isVOD && (
          <span className="flex items-center gap-1 px-2.5 py-0.5 bg-rose-600/90 rounded-full text-[9px] font-black text-white uppercase tracking-widest shadow-lg shadow-rose-600/30">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            En Vivo
          </span>
        )}
      </div>

      {/* Bottom gradient + Controls Panel */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        
        {/* Progress bar */}
        <div className="px-4 pt-6 pb-1 group/prog" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between text-[10px] font-black text-white/60 mb-1.5 px-0.5 select-none">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : (channel?.isVOD ? "--:--" : "EN VIVO")}</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            step="0.5"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => { setIsDragging(false); showControls(); }}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => { setIsDragging(false); showControls(); }}
            onChange={handleSeek}
            className="video-seek-bar w-full h-1 group-hover/prog:h-1.5 rounded-full transition-all cursor-pointer"
            style={{
              background: `linear-gradient(to right, #e11d48 0%, #e11d48 ${progress}%, rgba(255,255,255,0.2) ${progress}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between px-4 py-3" onClick={(e) => e.stopPropagation()}>

          {/* Left: Play/Pause + Skip 10s + Volume Slider */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-rose-600/80 hover:bg-rose-600 border border-white/10 text-white transition-all active:scale-90 shadow-md cursor-pointer"
              title={isPlaying ? "Pausar (Espacio)" : "Reproducir (Espacio)"}
            >
              {isPlaying
                ? <Pause className="w-4 h-4 text-white fill-current" />
                : <Play className="w-4 h-4 text-white fill-current ml-0.5" />
              }
            </button>

            <button
              onClick={() => handleSkip(-10)}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 hover:text-white text-[10px] font-black transition-all active:scale-90 cursor-pointer"
              title="Retroceder 10s (←)"
            >
              <SkipBack className="w-3 h-3" />
              10
            </button>

            <button
              onClick={() => handleSkip(10)}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 hover:text-white text-[10px] font-black transition-all active:scale-90 cursor-pointer"
              title="Avanzar 10s (→)"
            >
              10
              <SkipForward className="w-3 h-3" />
            </button>

            {/* Volume control */}
            <div
              className="flex items-center gap-2"
              onMouseEnter={() => { clearTimeout(volumeTimerRef.current); setShowVolumeSlider(true); }}
              onMouseLeave={() => { volumeTimerRef.current = setTimeout(() => setShowVolumeSlider(false), 1200); }}
            >
              <button 
                onClick={handleMuteToggle} 
                className="p-1.5 text-white/80 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? "Activar audio (M)" : "Silenciar (M)"}
              >
                {isMuted || effectiveVolume === 0
                  ? <VolumeX className="w-4 h-4 text-rose-400" />
                  : <Volume2 className="w-4 h-4" />
                }
              </button>
              <div className={`overflow-hidden transition-all duration-200 ${showVolumeSlider ? "w-20 opacity-100" : "w-0 opacity-0"}`}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={effectiveVolume}
                  onChange={handleVolume}
                  className="volume-slider w-20 h-1 rounded-full cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #fff 0%, #fff ${effectiveVolume * 100}%, rgba(255,255,255,0.2) ${effectiveVolume * 100}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right: Speed + Quality + PiP + Fullscreen */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSpeed}
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                playbackRate !== 1
                  ? "bg-rose-600/30 border-rose-500/40 text-rose-300"
                  : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
              }`}
              title="Velocidad de reproducción"
            >
              {playbackRate === 1 ? "1x" : `${playbackRate}x`}
            </button>

            {levels.length > 1 && (
              <div className="relative interactive-panel">
                <button
                  onClick={() => setShowQuality(v => !v)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase transition-all cursor-pointer ${
                    currentLevel !== -1
                      ? "bg-rose-600/30 border-rose-500/40 text-rose-300"
                      : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                  title="Calidad de video"
                >
                  <Settings className="w-2.5 h-2.5" />
                  {qualityLabel}
                </button>
                {showQuality && (
                  <div className="absolute bottom-full right-0 mb-2 bg-[#111]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-1.5 min-w-[100px] z-50" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { onLevelChange?.(-1); setShowQuality(false); }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${currentLevel === -1 ? "bg-rose-600 text-white" : "text-gray-300 hover:bg-white/10"}`}
                    >
                      Auto
                    </button>
                    {levels.map((lv) => (
                      <button
                        key={lv.index}
                        onClick={() => { onLevelChange?.(lv.index); setShowQuality(false); }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${currentLevel === lv.index ? "bg-rose-600 text-white" : "text-gray-300 hover:bg-white/10"}`}
                      >
                        {lv.height}p
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Chromecast / Smart TV / AirPlay Button */}
            {canCast && (
              <button
                onClick={handleCast}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer relative ${
                  isCasting
                    ? "bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/50"
                    : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
                }`}
                title={isCasting ? "Transmitiendo a TV / Chromecast" : "Transmitir a Chromecast / Smart TV (C)"}
              >
                <Cast className={`w-3.5 h-3.5 ${isCasting ? "animate-pulse" : ""}`} />
                {isCasting && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                )}
              </button>
            )}

            {document.pictureInPictureEnabled && (
              <button
                onClick={handlePiP}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isPiP
                    ? "bg-rose-600/30 border-rose-500/40 text-rose-300"
                    : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
                }`}
                title="Pantalla en pantalla (I)"
              >
                <PictureInPicture className="w-3.5 h-3.5" />
              </button>
            )}

            {isFullscreen && onToggleVideoFit && (
              <button
                onClick={onToggleVideoFit}
                className={`px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  videoFit === 'cover'
                    ? "bg-rose-600/30 border-rose-500/40 text-rose-300"
                    : "bg-white/5 border-white/10 text-white/70 hover:text-white"
                }`}
                title={videoFit === 'cover' ? "Ajustar al centro (Contain)" : "Llenar pantalla completa (Cover)"}
              >
                {videoFit === 'cover' ? "Llenar" : "Ajustar"}
              </button>
            )}

                        {onToggleLock && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock();
                }}
                className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer active:scale-95"
                title="Bloquear pantalla táctil"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={handleFullscreen}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer active:scale-95"
              title={isFullscreen ? "Salir de pantalla completa (F)" : "Pantalla completa (F)"}
            >
              {isFullscreen
                ? <Minimize className="w-3.5 h-3.5" />
                : <Maximize className="w-3.5 h-3.5" />
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
