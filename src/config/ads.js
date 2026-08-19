/**
 * ═══════════════════════════════════════════════════════════════════
 * Animux Ads Configuration
 * ═══════════════════════════════════════════════════════════════════
 * Archivo centralizado para gestionar toda la publicidad.
 * Cuando tengas tu cuenta de Monetag/Adsterra/AdSense,
 * solo cambia los valores aquí.
 * ═══════════════════════════════════════════════════════════════════
 */

// ── Configuración Global ────────────────────────────────────────────
export const ADS_CONFIG = {
  enabled: true,                    // Master switch para desactivar TODO
  prerollEnabled: true,             // Pre-roll antes de reproducir
  prerollDuration: 5,               // Segundos de cuenta regresiva
  bannerEnabled: true,              // Banners en la página principal
  inGridEnabled: true,              // Anuncios nativos entre tarjetas
  inGridInterval: 8,                // Cada cuántas tarjetas mostrar un ad
  showCloseButton: true,            // Permitir cerrar banners
  cooldownMinutes: 15,              // Minutos antes de repetir un pre-roll
};

// ── Banners de demostración ─────────────────────────────────────────
// Reemplazar con scripts reales de tu red de ads
export const DEMO_BANNERS = [
  {
    id: 'vpn-promo',
    title: '🔒 Protege tu Privacidad',
    description: 'Navega sin restricciones con velocidad ultra-rápida',
    cta: 'Obtener VPN',
    link: 'https://go.nordvpn.net/aff_c?offer_id=15&aff_id=TUAFILIADO',
    gradient: 'from-indigo-600 via-blue-600 to-cyan-500',
    icon: '🛡️',
  },
  {
    id: 'app-promo',
    title: '📱 Descarga Animux App',
    description: 'Instala nuestra app para una experiencia sin interrupciones',
    cta: 'Instalar Gratis',
    link: '#install',
    gradient: 'from-rose-600 via-pink-600 to-purple-600',
    icon: '📲',
  },
  {
    id: 'premium-promo',
    title: '⭐ Animux Premium',
    description: 'Sin anuncios, calidad máxima y acceso anticipado',
    cta: 'Suscríbete',
    link: '#premium',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    icon: '👑',
  },
];

// ── Anuncios nativos para el grid ───────────────────────────────────
export const NATIVE_ADS = [
  {
    id: 'native-vpn',
    name: 'NordVPN — Navega Seguro',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/NordVPN_logo_icon.svg/120px-NordVPN_logo_icon.svg.png',
    badge: 'PATROCINADO',
    link: 'https://go.nordvpn.net/aff_c?offer_id=15&aff_id=TUAFILIADO',
    gradient: 'from-blue-700 to-indigo-900',
  },
  {
    id: 'native-vlc',
    name: 'VLC Media Player',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/VLC_Icon.svg/120px-VLC_Icon.svg.png',
    badge: 'RECOMENDADO',
    link: 'https://www.videolan.org/vlc/',
    gradient: 'from-orange-600 to-amber-700',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────

/** Verifica si el pre-roll debe mostrarse (respeta el cooldown) */
export function shouldShowPreroll() {
  if (!ADS_CONFIG.enabled || !ADS_CONFIG.prerollEnabled) return false;
  const lastShown = localStorage.getItem('animux_last_preroll');
  if (!lastShown) return true;
  const elapsed = (Date.now() - parseInt(lastShown, 10)) / 1000 / 60;
  return elapsed >= ADS_CONFIG.cooldownMinutes;
}

/** Marca que se mostró un pre-roll */
export function markPrerollShown() {
  localStorage.setItem('animux_last_preroll', Date.now().toString());
}

/** Obtiene un banner aleatorio */
export function getRandomBanner() {
  return DEMO_BANNERS[Math.floor(Math.random() * DEMO_BANNERS.length)];
}

/** Obtiene un anuncio nativo aleatorio */
export function getRandomNativeAd() {
  return NATIVE_ADS[Math.floor(Math.random() * NATIVE_ADS.length)];
}
