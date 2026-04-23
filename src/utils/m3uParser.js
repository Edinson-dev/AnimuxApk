import { PREMIUM_M3U_SOURCES } from '../config/servers';

const MOVIE_PLAYLISTS = [
  'https://iptv-org.github.io/iptv/categories/movies.m3u',
  ...PREMIUM_M3U_SOURCES
];

export const fetchAndFilterMovies = async () => {
  const fetchPromises = MOVIE_PLAYLISTS.map(async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) return [];
      const text = await response.text();
      return parseM3U(text);
    } catch (error) {
      console.error(`Error fetching M3U from ${url}:`, error);
      return [];
    }
  });

  const allResults = await Promise.all(fetchPromises);
  const flattened = allResults.flat();

  // Deduplicate by clean name
  const uniqueMovies = new Map();
  flattened.forEach(movie => {
    const cleanName = movie.name.toLowerCase()
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/hd|4k|fhd|sd|latino|esp/g, '')
      .trim();
    
    if (!uniqueMovies.has(cleanName)) {
      uniqueMovies.set(cleanName, movie);
    }
  });

  return Array.from(uniqueMovies.values()).slice(0, 1000); // Limit for performance
};

function parseM3U(content) {
  const lines = content.split('\n');
  const items = [];
  let currentItem = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.*)$/);
      const logoMatch = line.match(/tvg-logo="(.*?)"/);
      const groupMatch = line.match(/group-title="(.*?)"/);
      
      const rawName = nameMatch ? nameMatch[1] : 'Unknown';
      const category = groupMatch ? groupMatch[1] : 'General';
      
      // Broader Filter: Movies, Music, and more
      const isRelevant = /cine|pelicula|movie|vod|film|estreno|cinema|musica|music|clip|pop|rock/i.test(category) || 
                         /hbo|amc|tnt|star|warner|golden|axn|space|mtv|htv/i.test(rawName.toLowerCase());
      
      const isLiveTVNews = /noticias|news/i.test(category);

      if (isRelevant && !isLiveTVNews) {
        currentItem = {
          id: 'ext-' + Math.random().toString(36).substr(2, 7),
          name: rawName,
          logo: logoMatch ? logoMatch[1] : null,
          category: category,
          isVOD: /vod|pelicula|cine/i.test(category) || /hls|mp4/i.test(line),
          isExternal: true
        };
      } else {
        currentItem = null;
      }
    } else if (line.startsWith('http') && currentItem) {
      currentItem.url = line;
      items.push(currentItem);
      currentItem = null;
    }
  }
  return items;
}
