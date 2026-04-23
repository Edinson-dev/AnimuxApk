export const fetchAndFilterMovies = async () => {
  const SOURCES = [
    'https://iptv-org.github.io/iptv/categories/movies.m3u',
    'https://iptv-org.github.io/iptv/countries/mx.m3u', // México
    'https://iptv-org.github.io/iptv/countries/ar.m3u', // Argentina
    'https://iptv-org.github.io/iptv/countries/co.m3u', // Colombia
    'https://iptv-org.github.io/iptv/countries/es.m3u'  // España
  ];
  
  const channels = [];
  const seenNames = new Set();

  for (const source of SOURCES) {
    try {
      const response = await fetch(source);
      if (!response.ok) continue;
      const text = await response.text();
      const lines = text.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF:')) {
          const info = lines[i];
          const url = lines[i + 1]?.trim();
          
          if (url && url.startsWith('http')) {
            const nameMatch = info.match(/,(.*)$/);
            const logoMatch = info.match(/tvg-logo="(.*?)"/);
            const name = nameMatch ? nameMatch[1].trim() : 'Canal de Cine';
            const logo = logoMatch ? logoMatch[1] : '';
            
            const nameLower = name.toLowerCase();
            const cleanName = name.split(' [')[0].split(' (')[0].trim();
            const cleanNameLower = cleanName.toLowerCase();

            if (seenNames.has(cleanNameLower)) continue;

            // Strict Filter for "Movies" in country lists
            const isMovieCategory = nameLower.includes('cine') || 
                                    nameLower.includes('movie') || 
                                    nameLower.includes('film') ||
                                    nameLower.includes('action') ||
                                    nameLower.includes('tnt') ||
                                    nameLower.includes('space') ||
                                    nameLower.includes('warner') ||
                                    nameLower.includes('axn') ||
                                    nameLower.includes('amc') ||
                                    nameLower.includes('golden') ||
                                    nameLower.includes('star');

            const isOld = nameLower.includes('70s') || nameLower.includes('80s') || nameLower.includes('classic') || nameLower.includes('retro');
            const isBlocked = nameLower.includes('brazil') || nameLower.includes('russia') || nameLower.includes('india');

            if (isMovieCategory && !isOld && !isBlocked) {
              seenNames.add(cleanNameLower);
              channels.push({
                id: `ext-${cleanName.replace(/\s+/g, '-')}`,
                name: cleanName,
                displayName: cleanName,
                logo: logo || 'https://i.imgur.com/Pvid2iH.png',
                category: 'Filmes',
                url: url,
                isExternal: true
              });
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error with ${source}:`, error);
    }
  }
  
  return channels;
};
