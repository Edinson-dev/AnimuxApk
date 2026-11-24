import { useState, useEffect, useCallback, useRef } from 'react';
import { UPDATE_NOTICE_CONFIG } from '../config/updateNotice';

// Si Vite inyectó __APP_BUILD_TIME__, lo usamos; si no, timestamp actual
const CURRENT_BUILD_TIME = typeof __APP_BUILD_TIME__ !== 'undefined' ? Number(__APP_BUILD_TIME__) : Date.now();

export function usePlatformUpdate({ needRefresh = false, updateServiceWorker = null } = {}) {
  const [showNotice, setShowNotice] = useState(false);
  const [noticeData, setNoticeData] = useState(null);
  const isCheckingRef = useRef(false);

  // Comprobar si hay una actualización en el servidor (/version.json)
  const checkForRemoteUpdate = useCallback(async () => {
    if (!UPDATE_NOTICE_CONFIG.enabled || isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      const res = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });

      if (!res.ok) return;
      const data = await res.json();
      const remoteBuildTime = Number(data.buildTime);

      // Si el servidor tiene un buildTime mayor que el que corre actualmente en la app
      if (remoteBuildTime && remoteBuildTime > CURRENT_BUILD_TIME) {
        const dismissedSessionKey = `animux_dismissed_update_${remoteBuildTime}`;
        if (!sessionStorage.getItem(dismissedSessionKey)) {
          setNoticeData({
            type: 'live',
            title: data.title || UPDATE_NOTICE_CONFIG.title,
            badge: UPDATE_NOTICE_CONFIG.statusBadge,
            message: data.message || UPDATE_NOTICE_CONFIG.liveMessage,
            version: data.version || 'Nueva',
            highlights: UPDATE_NOTICE_CONFIG.highlights,
            remoteBuildTime
          });
          setShowNotice(true);
        }
      }
    } catch (err) {
      // Si falla la red, ignoramos silenciosamente
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  // 1. Detección en el inicio: Modo Forzado / Primera apertura tras compilar
  useEffect(() => {
    if (!UPDATE_NOTICE_CONFIG.enabled) return;

    // Modo Forzado (para pruebas o avisos manuales)
    if (UPDATE_NOTICE_CONFIG.forceNotice) {
      setNoticeData({
        type: 'maintenance',
        title: UPDATE_NOTICE_CONFIG.title,
        badge: 'AVISO IMPORTANTE',
        message: UPDATE_NOTICE_CONFIG.liveMessage,
        version: '1.6',
        highlights: UPDATE_NOTICE_CONFIG.highlights
      });
      setShowNotice(true);
      return;
    }

    // Comprobar si es una nueva compilación que el usuario aún no ha reconocido
    if (UPDATE_NOTICE_CONFIG.notifyOnFirstOpen) {
      const lastAck = localStorage.getItem('animux_last_build_ack');
      if (lastAck && Number(lastAck) < CURRENT_BUILD_TIME) {
        setNoticeData({
          type: 'installed',
          title: '¡Plataforma Actualizada!',
          badge: 'VERSIÓN AL DÍA',
          message: UPDATE_NOTICE_CONFIG.welcomeMessage,
          version: '1.6',
          highlights: UPDATE_NOTICE_CONFIG.highlights,
          remoteBuildTime: CURRENT_BUILD_TIME
        });
        setShowNotice(true);
        return;
      }
    }

    // Comprobación inicial de versión remota
    checkForRemoteUpdate();
  }, [checkForRemoteUpdate]);

  // 2. Escuchar cambios de Service Worker PWA (needRefresh)
  useEffect(() => {
    if (needRefresh) {
      setNoticeData({
        type: 'sw_refresh',
        title: UPDATE_NOTICE_CONFIG.title,
        badge: 'EN ESTOS MOMENTOS',
        message: UPDATE_NOTICE_CONFIG.liveMessage,
        version: '1.6',
        highlights: UPDATE_NOTICE_CONFIG.highlights
      });
      setShowNotice(true);
    }
  }, [needRefresh]);

  // 3. Polling en vivo para detectar cuando se compila/despliega mientras la app está abierta
  useEffect(() => {
    if (!UPDATE_NOTICE_CONFIG.enabled || !UPDATE_NOTICE_CONFIG.notifyOnLiveDeploy) return;

    const intervalMs = Math.max(10, UPDATE_NOTICE_CONFIG.checkIntervalSeconds || 30) * 1000;
    const interval = setInterval(() => {
      checkForRemoteUpdate();
    }, intervalMs);

    // Comprobar también al volver a la pestaña
    const handleFocus = () => checkForRemoteUpdate();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForRemoteUpdate();
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkForRemoteUpdate]);

  // Acción para aplicar la actualización y recargar
  const applyUpdate = useCallback(async () => {
    try {
      localStorage.setItem('animux_last_build_ack', String(noticeData?.remoteBuildTime || CURRENT_BUILD_TIME));

      // Si la versión ya está instalada y el usuario pulsa "Entendido / A disfrutar", cerramos sin recargar
      if (noticeData?.type === 'installed') {
        setShowNotice(false);
        return;
      }

      if (updateServiceWorker) {
        await updateServiceWorker(true);
      }
    } catch (e) {
      console.error('Error aplicando actualización:', e);
    } finally {
      if (noticeData?.type !== 'installed') {
        localStorage.removeItem('animux_last_fetch');
        window.location.reload(true);
      }
    }
  }, [updateServiceWorker, noticeData]);

  // Acción para descartar / posponer aviso
  const dismissNotice = useCallback(() => {
    setShowNotice(false);
    if (noticeData?.remoteBuildTime) {
      sessionStorage.setItem(`animux_dismissed_update_${noticeData.remoteBuildTime}`, 'true');
    }
    localStorage.setItem('animux_last_build_ack', String(CURRENT_BUILD_TIME));
  }, [noticeData]);

  return {
    showNotice,
    noticeData,
    applyUpdate,
    dismissNotice
  };
}
