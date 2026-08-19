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
  enabled: true,                    // Master switch para activar/desactivar TODOS los anuncios
  socialBarEnabled: true,           // ✅ Social Bar (Notificación flotante pequeña y cerrable de Adsterra)
  nativeBannerEnabled: true,       // ❌ Banner nativo grande (desactivado por estética)
  binanceEnabled: false,            // Activar/desactivar Binance
  prerollEnabled: false,            // Pre-roll antes de reproducir
  prerollDuration: 5,               // Segundos de cuenta regresiva
  bannerEnabled: false,             // Banners en la página principal
  inGridEnabled: false,             // Anuncios nativos entre tarjetas
  inGridInterval: 8,                // Cada cuántas tarjetas mostrar un ad
  showCloseButton: true,            // Permitir cerrar banners
  cooldownMinutes: 15,              // Minutos antes de repetir un pre-roll
};

export const ADSTERRA_CONFIG = {
  socialBarScript: 'https://pl30917896.effectivecpmnetwork.com/2d/26/84/2d26847b33449690e173376ac3e962f7.js',
  containerId: 'container-ecba476cd36a6e24f33e920849cb4ad0',
  scriptSrc: 'https://pl30917774.effectivecpmnetwork.com/ecba476cd36a6e24f33e920849cb4ad0/invoke.js',
};

export const BINANCE_REFERRAL = {
  code: 'CPA_00RBS3MYJC',
  link: 'https://www.binance.com/activity/referral-entry/CPA?ref=CPA_00RBS3MYJC',
  title: 'Gana hasta $1,000 USD en Binance',
  description: 'Obtén hasta 1,000 USD de descuento en comisiones al registrarte y operar en Binance.',
  cta: 'Reclamar Bono',
  badge: 'REFERIDOS LITE',
};

// ── Banners de demostración ─────────────────────────────────────────
// Reemplazar con scripts reales de tu red de ads
export const DEMO_BANNERS = [
  {
    id: 'binance-referral',
    title: '🟡 Gana hasta $1,000 USD en Binance',
    description: 'Regístrate con el código CPA_00RBS3MYJC y obtén reembolsos en comisiones',
    cta: 'Registrarse en Binance',
    link: 'https://www.binance.com/activity/referral-entry/CPA?ref=CPA_00RBS3MYJC',
    gradient: 'from-amber-600 via-yellow-600 to-amber-700',
    icon: '🪙',
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
    id: 'native-binance',
    name: 'Binance — Bono hasta $1,000 USD',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Binance_Logo.svg/512px-Binance_Logo.svg.png',
    badge: 'BENEFICIO',
    link: 'https://www.binance.com/activity/referral-entry/CPA?ref=CPA_00RBS3MYJC',
    gradient: 'from-amber-600 to-stone-900',
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
