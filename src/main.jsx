import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// ── PWA Service Worker Registration ─────────────────────────────────────────
// updateSW is called to trigger a manual update if needed
const updateSW = registerSW({
  // Activate new SW immediately without waiting
  immediate: true,

  onNeedRefresh() {
    // Silently update — no disruptive popup for streaming app
    updateSW(true);
  },

  onOfflineReady() {
    console.log('[Animux PWA] App lista para uso offline ✓');
  },

  onRegisteredSW(swUrl, r) {
    if (!r) return;
    // Check for updates every 60 minutes
    setInterval(async () => {
      if (!(!r.installing && navigator)) return;
      if ('connection' in navigator && !navigator.onLine) return;
      try {
        const resp = await fetch(swUrl, { cache: 'no-store', headers: { cache: 'no-store', 'cache-control': 'no-cache' } });
        if (resp?.status === 200) await r.update();
      } catch {
        // Offline — skip silently
      }
    }, 60 * 60 * 1000);
  },

  onRegisterError(error) {
    console.warn('[Animux PWA] Service Worker registration failed:', error);
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
