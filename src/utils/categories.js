// ── Traductor y Normalizador de Categorías para Animux ───────────────
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
  'religious': 'TV Abierta',
  'religion': 'TV Abierta',
  'education': 'Documentales',
  'educational': 'Documentales',
  'comedy': 'Entretenimiento',
  'drama': 'Entretenimiento',
  'classic': 'Entretenimiento',
  'classics': 'Entretenimiento',
  'lifestyle': 'Entretenimiento',
  'food': 'Entretenimiento',
  'cooking': 'Entretenimiento',
  'travel': 'Documentales',
  'nature': 'Documentales',
  'science': 'Documentales',
  'business': 'Noticias',
  'weather': 'Noticias',
  'animation': 'Anime',
  'family': 'Infantil',
  'general': 'TV Abierta',
  'culture': 'Documentales',
  'outdoor': 'Documentales',
  'shop': 'TV Abierta',
  'shopping': 'TV Abierta',
  'series': 'Entretenimiento',
  'auto': 'Entretenimiento',
  'podcasts': 'Podcasts',
  'podcast': 'Podcasts',
  'undefined': 'TV Abierta',
  'xxx': null,
  'adult': null,
};

/**
 * Traduce una categoría de inglés a español según el mapa de traducción.
 */
export const translateCat = (cat) => {
  if (!cat) return 'TV Abierta';
  const key = cat.toLowerCase().trim();
  if (CATEGORY_TRANSLATIONS[key] === null) return null;
  return CATEGORY_TRANSLATIONS[key] || cat;
};

/**
 * Verifica si un canal coincide con la categoría objetivo considerando normalización y nombres clave.
 */
export const matchesCat = (c, target) => {
  if (!c) return false;
  const normTarget = (target || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const chCat = (c.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const chName = (c.name || c.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // 1. VOD y Podcasts
  if (normTarget === 'cine (vod)') return Boolean(c.isVOD && !c.groupId && !c.isPodcast && c.category !== 'Podcasts');
  if (normTarget === 'series (vod)') return Boolean(c.isVOD && !!c.groupId && !c.isPodcast && c.category !== 'Podcasts');
  if (normTarget === 'podcasts') return Boolean(c.isPodcast || chCat.includes('podcast') || chName.includes('podcast'));

  // 2. Maratones 24/7
  if (normTarget === 'maratones 24/7' || normTarget === 'maratones') {
    return !c.isVOD && (
      chName.includes('24/7') || 
      chName.includes('maraton') || 
      chCat.includes('maraton') ||
      (chCat.includes('serie') && !c.isVOD) ||
      (chCat.includes('pelicula') && !c.isVOD)
    );
  }

  // 3. Deportes
  if (normTarget === 'deportes') {
    return !c.isVOD && (
      chCat.includes('deporte') || 
      chCat.includes('sport') ||
      chName.includes('espn') || 
      chName.includes('fox') || 
      chName.includes('win') || 
      chName.includes('sports') || 
      chName.includes('dsports') || 
      chName.includes('tyc') || 
      chName.includes('tnt sports') || 
      chName.includes('gol') || 
      chName.includes('bein') || 
      chName.includes('claro sports') ||
      chName.includes('directv sports') ||
      chName.includes('nba') ||
      chName.includes('ufc') ||
      chName.includes('tudn')
    );
  }

  // 4. Noticias & Mundo
  if (normTarget === 'noticias') {
    return !c.isVOD && (
      chCat.includes('noticia') || 
      chCat.includes('news') || 
      chName.includes('noticia') || 
      chName.includes('cnn') || 
      chName.includes('rt en') || 
      chName.includes('dw') || 
      chName.includes('france 24') || 
      chName.includes('c5n') || 
      chName.includes('tn ') || 
      chName.includes('euronews') ||
      chName.includes('ntn24') ||
      chName.includes('telefe noticias') ||
      chName.includes('cablenoticias')
    );
  }

  // 5. Infantil & Familia
  if (normTarget === 'infantil') {
    return !c.isVOD && (
      chCat.includes('infantil') || 
      chCat.includes('kid') || 
      chCat.includes('child') || 
      chName.includes('cartoon') || 
      chName.includes('disney') || 
      chName.includes('nick') || 
      chName.includes('discovery kids') || 
      chName.includes('toons') || 
      chName.includes('boomerang') || 
      chName.includes('junior') ||
      chName.includes('baby') ||
      chName.includes('clan') ||
      chName.includes('nat geo kids')
    );
  }

  // 6. Anime & Gaming
  if (normTarget === 'anime') {
    return !c.isVOD && (
      chCat.includes('anime') || 
      chCat.includes('animacion') || 
      chName.includes('anime') || 
      chName.includes('dragon ball') || 
      chName.includes('naruto') || 
      chName.includes('one piece') || 
      chName.includes('pokemon') || 
      chName.includes('crunchyroll') ||
      chName.includes('otaku')
    );
  }

  // 7. Documentales
  if (normTarget === 'documentales') {
    return !c.isVOD && (
      chCat.includes('documental') || 
      chCat.includes('documentary') || 
      chCat.includes('ciencia') || 
      chCat.includes('cultura') || 
      chCat.includes('nature') || 
      chCat.includes('viajes') ||
      chName.includes('discovery') || 
      chName.includes('history') || 
      chName.includes('nat geo') || 
      chName.includes('national geographic') ||
      chName.includes('animal planet') || 
      chName.includes('investigation') || 
      chName.includes('h&h')
    );
  }

  // 8. Música
  if (normTarget === 'musica') {
    return !c.isVOD && (
      chCat.includes('musica') || 
      chCat.includes('music') || 
      chName.includes('mtv') || 
      chName.includes('htv') || 
      chName.includes('vh1') || 
      chName.includes('radio') || 
      chName.includes('tnt novela') || 
      chName.includes('telehit') || 
      chName.includes('exatv') || 
      chName.includes('bandamax') ||
      chName.includes('los 40') ||
      chName.includes('fm')
    );
  }

  // 9. Entretenimiento
  if (normTarget === 'entretenimiento') {
    return !c.isVOD && (
      chCat.includes('entretenimiento') || 
      chCat.includes('entertainment') || 
      chCat.includes('comedy') || 
      chCat.includes('comedia') || 
      chCat.includes('drama') || 
      chCat.includes('lifestyle') || 
      chCat.includes('cocina') ||
      chName.includes('warner') || 
      chName.includes('sony') || 
      chName.includes('universal') || 
      chName.includes('star channel') || 
      chName.includes('tnt') || 
      chName.includes('axn') || 
      chName.includes('fx') || 
      chName.includes('a&e') || 
      chName.includes('e!') ||
      chName.includes('hbo') ||
      chName.includes('cinemax') ||
      chName.includes('space') ||
      chName.includes('tvc') ||
      chName.includes('paramount')
    );
  }

  // 10. TV Abierta / Nacionales (resto de canales en vivo)
  if (normTarget === 'tv abierta' || normTarget === 'canales nacionales' || normTarget === 'nacionales') {
    if (c.isVOD || c.isPodcast) return false;
    // Si no cayó en deportes, música, infantil, anime, documentales o noticias especializadas, pertenece a la red de TV Abierta
    return true;
  }

  return chCat === normTarget || chCat.includes(normTarget);
};
