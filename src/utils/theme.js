/**
 * Animux Theme System
 * Paletas de color dinámicas con persistencia local y variables CSS RGB
 */

export const THEMES = [
  {
    id: 'crimson',
    name: 'Crimson Cinema',
    primary: '#e11d48',
    glow: 'rgba(225, 29, 72, 0.45)',
    colorHex: '#e11d48',
    shades: {
      50: '255 241 242',
      100: '255 228 230',
      200: '254 205 211',
      300: '253 164 175',
      400: '251 113 133',
      500: '244 63 94',
      600: '225 29 72',
      700: '190 18 60',
      800: '159 18 57',
      900: '136 19 55',
      950: '76 5 25'
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    primary: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.45)',
    colorHex: '#a855f7',
    shades: {
      50: '250 245 255',
      100: '243 232 255',
      200: '233 213 255',
      300: '216 180 254',
      400: '192 132 252',
      500: '168 85 247',
      600: '147 51 234',
      700: '126 34 206',
      800: '107 33 168',
      900: '88 28 135',
      950: '59 7 100'
    }
  },
  {
    id: 'sapphire',
    name: 'Sapphire Live',
    primary: '#0284c7',
    glow: 'rgba(2, 132, 199, 0.45)',
    colorHex: '#0284c7',
    shades: {
      50: '240 249 255',
      100: '224 242 254',
      200: '186 230 253',
      300: '125 211 252',
      400: '56 189 248',
      500: '14 165 233',
      600: '2 132 199',
      700: '3 105 161',
      800: '7 89 133',
      900: '12 74 110',
      950: '8 47 73'
    }
  },
  {
    id: 'emerald',
    name: 'Emerald Matrix',
    primary: '#059669',
    glow: 'rgba(5, 150, 105, 0.45)',
    colorHex: '#059669',
    shades: {
      50: '236 253 245',
      100: '209 250 229',
      200: '167 243 208',
      300: '110 231 183',
      400: '52 211 153',
      500: '16 185 129',
      600: '5 150 105',
      700: '4 120 87',
      800: '6 95 70',
      900: '6 78 59',
      950: '2 44 34'
    }
  },
  {
    id: 'amber',
    name: 'Sunset Gold',
    primary: '#d97706',
    glow: 'rgba(217, 119, 6, 0.45)',
    colorHex: '#d97706',
    shades: {
      50: '255 251 235',
      100: '254 243 199',
      200: '253 230 138',
      300: '252 211 77',
      400: '251 191 36',
      500: '245 158 11',
      600: '217 119 6',
      700: '180 83 9',
      800: '146 64 14',
      900: '120 53 15',
      950: '69 26 3'
    }
  },
  {
    id: 'oled',
    name: 'Pure Platinum',
    primary: '#f3f4f6',
    glow: 'rgba(255, 255, 255, 0.35)',
    colorHex: '#f3f4f6',
    shades: {
      50: '255 255 255',
      100: '249 250 251',
      200: '243 244 246',
      300: '229 231 235',
      400: '209 213 219',
      500: '156 163 175',
      600: '107 114 128',
      700: '75 85 99',
      800: '55 65 81',
      900: '31 41 55',
      950: '17 24 39'
    }
  }
];

export function getActiveTheme() {
  if (typeof window === 'undefined') return THEMES[0];
  const savedId = localStorage.getItem('animux_theme_id') || 'crimson';
  return THEMES.find(t => t.id === savedId) || THEMES[0];
}

export function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--accent-primary', theme.primary);
    root.style.setProperty('--accent-glow', theme.glow);
    root.setAttribute('data-theme', theme.id);

    if (theme.shades) {
      Object.entries(theme.shades).forEach(([shade, val]) => {
        root.style.setProperty(`--brand-${shade}`, val);
      });
    }
  }
  try {
    localStorage.setItem('animux_theme_id', theme.id);
  } catch (e) {
    console.warn('LocalStorage not accessible:', e);
  }
  return theme;
}

// Inicialización automática inmediata
if (typeof window !== 'undefined') {
  try {
    const current = getActiveTheme();
    applyTheme(current.id);
  } catch (_) {}
}
