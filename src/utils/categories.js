// ── Traductor de categorías (inglés → español) ───────────────
export const CATEGORY_TRANSLATIONS = {
  'sports': 'Deportes',
  'sport': 'Deportes',
  'news': 'Noticias',
  'entertainment': 'Entretenimiento',
  'movies': 'Películas',
  'movie': 'Películas',
  'music': 'Música',
  'kids': 'Infantil',
  'children': 'Infantil',
  'documentary': 'Documentales',
  'documentaries': 'Documentales',
  'religious': 'Religioso',
  'religion': 'Religioso',
  'education': 'Educación',
  'educational': 'Educación',
  'comedy': 'Comedia',
  'drama': 'Drama',
  'classic': 'Clásicos',
  'classics': 'Clásicos',
  'lifestyle': 'Estilo de Vida',
  'food': 'Cocina',
  'cooking': 'Cocina',
  'travel': 'Viajes',
  'nature': 'Naturaleza',
  'science': 'Ciencia',
  'business': 'Negocios',
  'weather': 'Clima',
  'animation': 'Animación',
  'family': 'Familia',
  'general': 'General',
  'culture': 'Cultura',
  'outdoor': 'Naturaleza',
  'shop': 'Tienda',
  'shopping': 'Tienda',
  'series': 'Series',
  'auto': 'Autos',
  'undefined': 'Otros',
  'xxx': null, // Ocultar esta categoría
  'adult': null,
};

/**
 * Traduce una categoría de inglés a español según el mapa de traducción.
 * @param {string} cat - Categoría original.
 * @returns {string|null} Categoría traducida, original, u 'Otros'. Retorna null si debe ser oculta.
 */
export const translateCat = (cat) => {
  if (!cat) return 'Otros';
  const key = cat.toLowerCase().trim();
  if (CATEGORY_TRANSLATIONS[key] === null) return null; // Ocultar
  return CATEGORY_TRANSLATIONS[key] || cat; // Traducir o dejar original
};

/**
 * Verifica si un canal coincide con la categoría objetivo considerando normalización.
 * @param {object} c - Objeto de canal.
 * @param {string} target - Categoría objetivo en minúsculas y normalizada.
 * @returns {boolean} True si coincide.
 */
export const matchesCat = (c, target) => {
  const chCat = (c.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const normalizedChCat = chCat.includes('documentary') ? 'documentales' : chCat.includes('religious') ? 'religioso' : chCat;

  if (target === 'cine (vod)') return c.isVOD && !c.groupId; // Películas VOD
  if (target === 'series (vod)') return c.isVOD && !!c.groupId; // Series VOD
  if (target === 'maratones 24/7' || target === 'maratones') return !c.isVOD && (normalizedChCat.includes('serie') || normalizedChCat.includes('pelicula') || normalizedChCat.includes('cine'));
  if (target === 'tv abierta') return !c.isVOD && (normalizedChCat.includes('nacional') || normalizedChCat.includes('noticia') || normalizedChCat.includes('general'));

  if (target === 'deportes') return normalizedChCat.includes('deporte') || normalizedChCat.includes('sport');
  
  return normalizedChCat === target || normalizedChCat.includes(target);
};
