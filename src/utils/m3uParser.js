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
      
      const rawNameLower = rawName.toLowerCase();
      const catLower = category.toLowerCase();

      // Inclusive Filter: Keep almost everything from premium servers but prioritize organization
      const isTrash = /test|prueba|adulto|xxx|adults/i.test(catLower);

      if (!isTrash) {
        currentItem = {
          id: 'ext-' + Math.random().toString(36).substr(2, 7),
          name: rawName,
          logo: logoMatch ? logoMatch[1] : null,
          category: category,
          isVOD: /vod|pelicula|cine|series|estreno/i.test(catLower) || /hls|mp4|mkv/i.test(line),
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
