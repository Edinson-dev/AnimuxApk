/**
 * Animux - Filter & Sorting Utilities
 * Filters by Year, Genre, and Popularity / Rating
 */

/**
 * Extracts a 4-digit year from an item (from year, release_date, or name/title).
 * @param {object} item
 * @returns {number|null}
 */
export const getItemYear = (item) => {
  if (!item) return null;

  // 1. Direct year attribute
  if (item.year) {
    const parsed = parseInt(String(item.year).trim(), 10);
    if (!isNaN(parsed) && parsed >= 1900 && parsed <= 2099) {
      return parsed;
    }
  }

  // 2. Release date (YYYY-MM-DD)
  if (item.release_date && typeof item.release_date === 'string') {
    const yearMatch = item.release_date.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) return parseInt(yearMatch[1], 10);
  }

  // 3. Fallback: Parse year from title or name e.g. "Avatar (2022)" or "[1999]"
  const title = (item.displayName || item.name || item.title || '');
  const titleYearMatch = title.match(/[([]\s*(19\d{2}|20\d{2})\s*[)\]]?/);
  if (titleYearMatch) {
    const parsed = parseInt(titleYearMatch[1], 10);
    if (!isNaN(parsed) && parsed >= 1900 && parsed <= 2099) {
      return parsed;
    }
  }

  return null;
};

/**
 * Filter Year Options
 */
export const YEAR_OPTIONS = [
  { value: 'all', label: 'Todos los Años' },
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
  { value: '2022', label: '2022' },
  { value: '2021', label: '2021' },
  { value: '2020', label: '2020' },
  { value: '2010s', label: '2010 - 2019' },
  { value: '2000s', label: '2000 - 2009' },
  { value: 'classic', label: 'Clásicos (< 2000)' },
];

/**
 * Filter Genre Options
 */
export const GENRE_OPTIONS = [
  { value: 'all', label: 'Todos los Géneros' },
  { value: 'Acción', label: 'Acción 💥' },
  { value: 'Comedia', label: 'Comedia 😂' },
  { value: 'Drama', label: 'Drama 🎭' },
  { value: 'Terror', label: 'Terror / Suspenso 👻' },
  { value: 'Ciencia Ficción', label: 'Ciencia Ficción 🚀' },
  { value: 'Animación', label: 'Animación & Anime 🎨' },
  { value: 'Aventura', label: 'Aventura 🗺️' },
  { value: 'Romance', label: 'Romance ❤️' },
  { value: 'Fantasía', label: 'Fantasía 🧙' },
  { value: 'Documentales', label: 'Documentales 🌍' },
  { value: 'Infantil', label: 'Infantil & Kids 🧸' },
  { value: 'Deportes', label: 'Deportes ⚽' },
  { value: 'Música', label: 'Música 🎵' },
  { value: 'Noticias', label: 'Noticias 📰' },
];

/**
 * Popularity / Sorting Options
 */
export const POPULARITY_OPTIONS = [
  { value: 'default', label: 'Predeterminado' },
  { value: 'popular', label: 'Más Populares 🔥' },
  { value: 'rating', label: 'Mejor Valorados ⭐' },
  { value: 'year_desc', label: 'Más Recientes (Año) 📅' },
  { value: 'year_asc', label: 'Más Antiguos 🕰️' },
  { value: 'az', label: 'Título (A - Z)' },
  { value: 'za', label: 'Título (Z - A)' },
];

/**
 * Checks if item matches selected year filter
 * @param {object} item
 * @param {string} selectedYear
 * @returns {boolean}
 */
export const matchesYear = (item, selectedYear) => {
  if (!selectedYear || selectedYear === 'all') return true;

  const itemYear = getItemYear(item);
  if (!itemYear) return false;

  if (selectedYear === '2010s') return itemYear >= 2010 && itemYear <= 2019;
  if (selectedYear === '2000s') return itemYear >= 2000 && itemYear <= 2009;
  if (selectedYear === 'classic') return itemYear < 2000;

  const targetYear = parseInt(selectedYear, 10);
  return !isNaN(targetYear) && itemYear === targetYear;
};

/**
 * Checks if item matches selected genre
 * @param {object} item
 * @param {string} selectedGenre
 * @returns {boolean}
 */
export const matchesGenre = (item, selectedGenre) => {
  if (!selectedGenre || selectedGenre === 'all') return true;

  const cat = (item.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const title = (item.displayName || item.name || item.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const desc = (item.description || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const combined = `${cat} ${title} ${desc}`;

  const genre = selectedGenre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  if (genre === 'accion') {
    return combined.includes('accion') || combined.includes('action') || combined.includes('artes marciales') || combined.includes('pelea');
  }
  if (genre === 'comedia') {
    return combined.includes('comedia') || combined.includes('comedy') || combined.includes('humor') || combined.includes('risa');
  }
  if (genre === 'drama') {
    return combined.includes('drama') || combined.includes('melodrama') || combined.includes('telenovela') || combined.includes('novela');
  }
  if (genre === 'terror') {
    return combined.includes('terror') || combined.includes('horror') || combined.includes('miedo') || combined.includes('suspenso') || combined.includes('thriller');
  }
  if (genre === 'ciencia ficcion') {
    return combined.includes('ciencia ficcion') || combined.includes('sci-fi') || combined.includes('scifi') || combined.includes('ficcion') || combined.includes('futur');
  }
  if (genre === 'animacion') {
    return combined.includes('animacion') || combined.includes('animation') || combined.includes('anime') || combined.includes('dibujo') || combined.includes('cartoon') || combined.includes('muñeco');
  }
  if (genre === 'aventura') {
    return combined.includes('aventura') || combined.includes('adventure');
  }
  if (genre === 'romance') {
    return combined.includes('romance') || combined.includes('romantica') || combined.includes('amor');
  }
  if (genre === 'fantasia') {
    return combined.includes('fantasia') || combined.includes('fantasy') || combined.includes('magia');
  }
  if (genre === 'documentales') {
    return combined.includes('documental') || combined.includes('documentary') || combined.includes('biografia') || combined.includes('historia');
  }
  if (genre === 'infantil') {
    return combined.includes('infantil') || combined.includes('kids') || combined.includes('niño') || combined.includes('disney') || combined.includes('nickelodeon') || combined.includes('cartoon') || combined.includes('junior') || combined.includes('boing') || combined.includes('clan');
  }
  if (genre === 'deportes') {
    return combined.includes('deporte') || combined.includes('sport') || combined.includes('futbol') || combined.includes('baloncesto') || combined.includes('wwe') || combined.includes('ufc') || combined.includes('f1');
  }
  if (genre === 'musica') {
    return combined.includes('musica') || combined.includes('music') || combined.includes('concierto') || combined.includes('radio');
  }
  if (genre === 'noticias') {
    return combined.includes('noticia') || combined.includes('news') || combined.includes('informativo');
  }

  return combined.includes(genre);
};

/**
 * Sort items based on popularity / rating / year / title
 * @param {Array} items
 * @param {string} sortKey
 * @returns {Array}
 */
export const applySorting = (items, sortKey) => {
  if (!items || !items.length) return [];
  const list = [...items];

  if (sortKey === 'popular') {
    return list.sort((a, b) => {
      // Score calculation for popularity
      const scoreA = (a.featured ? 1000 : 0) + (a.isNew ? 200 : 0) + (Number(a.rating || 0) * 50) + (a.isVOD ? 30 : 0);
      const scoreB = (b.featured ? 1000 : 0) + (b.isNew ? 200 : 0) + (Number(b.rating || 0) * 50) + (b.isVOD ? 30 : 0);
      return scoreB - scoreA;
    });
  }

  if (sortKey === 'rating') {
    return list.sort((a, b) => {
      const ratingA = Number(a.rating || 0);
      const ratingB = Number(b.rating || 0);
      if (ratingB !== ratingA) return ratingB - ratingA;
      // Secondary sort: featured first
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }

  if (sortKey === 'year_desc') {
    return list.sort((a, b) => {
      const yearA = getItemYear(a) || 0;
      const yearB = getItemYear(b) || 0;
      return yearB - yearA;
    });
  }

  if (sortKey === 'year_asc') {
    return list.sort((a, b) => {
      const yearA = getItemYear(a) || 9999;
      const yearB = getItemYear(b) || 9999;
      return yearA - yearB;
    });
  }

  if (sortKey === 'az') {
    return list.sort((a, b) => {
      const nameA = (a.displayName || a.title || a.name || '').toLowerCase();
      const nameB = (b.displayName || b.title || b.name || '').toLowerCase();
      return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
    });
  }

  if (sortKey === 'za') {
    return list.sort((a, b) => {
      const nameA = (a.displayName || a.title || a.name || '').toLowerCase();
      const nameB = (b.displayName || b.title || b.name || '').toLowerCase();
      return nameB.localeCompare(nameA, 'es', { sensitivity: 'base' });
    });
  }

  return list;
};
