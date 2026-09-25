/**
 * Animux Unified Cast & AirPlay Manager
 * Soporta:
 * 1. HTML5 Remote Playback API (Chromecast nativo en Chrome/Android/Smart TVs)
 * 2. Apple AirPlay (Safari iOS / macOS)
 * 3. Google Cast Web Sender SDK (Framework oficial de Google Cast)
 */

let isCastFrameworkReady = false;

if (typeof window !== 'undefined') {
  window.__onGCastApiAvailable = function (isAvailable) {
    if (isAvailable && window.cast && window.chrome && window.chrome.cast) {
      try {
        const castContext = window.cast.framework.CastContext.getInstance();
        castContext.setOptions({
          receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
        });
        isCastFrameworkReady = true;
        console.log('✅ Google Cast SDK inicializado con éxito');
      } catch (err) {
        console.warn('Google Cast Context init error:', err);
      }
    }
  };
}

/**
 * Comprueba si el dispositivo o navegador soporta transmisión (Cast / AirPlay / RemotePlayback)
 */
export function checkCastSupport(videoElement) {
  if (typeof window === 'undefined') return false;

  const hasRemotePlayback = videoElement && 'remote' in videoElement && typeof videoElement.remote?.prompt === 'function';
  const hasAirPlay = videoElement && (typeof videoElement.webkitShowPlaybackTargetPicker === 'function' || 'WebKitPlaybackTargetAvailabilityEvent' in window);
  const hasGoogleCast = Boolean(window.chrome?.cast || isCastFrameworkReady);
  const hasPresentation = 'presentation' in navigator;

  return Boolean(hasRemotePlayback || hasAirPlay || hasGoogleCast || hasPresentation);
}

/**
 * Dispara el diálogo de transmisión nativo para enviar a Chromecast, Smart TV o Apple TV
 */
export async function triggerCasting(videoElement, mediaDetails = {}) {
  if (!videoElement) return { success: false, reason: 'No video element' };

  // 1. Intentar con HTML5 Remote Playback API (Chromecast nativo en Android y Chrome PC)
  if (videoElement.remote && typeof videoElement.remote.prompt === 'function') {
    try {
      await videoElement.remote.prompt();
      return { success: true, method: 'remote_playback' };
    } catch (e) {
      console.warn('RemotePlayback prompt cancelado o rechazado:', e);
      if (e.name !== 'NotAllowedError') {
        // Fallback a otros métodos si no fue cancelación de usuario
      } else {
        return { success: false, reason: e.message };
      }
    }
  }

  // 2. Intentar con Apple AirPlay (Safari iOS / iPadOS / macOS)
  if (typeof videoElement.webkitShowPlaybackTargetPicker === 'function') {
    try {
      videoElement.webkitShowPlaybackTargetPicker();
      return { success: true, method: 'airplay' };
    } catch (e) {
      console.warn('AirPlay target picker error:', e);
    }
  }

  // 3. Intentar con Google Cast Web Sender SDK si está cargado
  if (window.cast && window.cast.framework) {
    try {
      const castContext = window.cast.framework.CastContext.getInstance();
      await castContext.requestSession();
      const session = castContext.getCurrentSession();
      if (session) {
        const streamUrl = mediaDetails.url || videoElement.src || videoElement.currentSrc;
        const mediaInfo = new window.chrome.cast.media.MediaInfo(streamUrl, 'application/x-mpegURL');
        mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata();
        mediaInfo.metadata.title = mediaDetails.title || 'Animux TV';
        mediaInfo.metadata.subtitle = mediaDetails.category || 'Transmisión en vivo';
        if (mediaDetails.logo) {
          mediaInfo.metadata.images = [new window.chrome.cast.Image(mediaDetails.logo)];
        }

        const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
        await session.loadMedia(request);
        return { success: true, method: 'google_cast_sdk' };
      }
    } catch (e) {
      console.warn('Google Cast SDK session error:', e);
    }
  }

  return { success: false, reason: 'No se detectaron dispositivos de transmisión disponibles' };
}
