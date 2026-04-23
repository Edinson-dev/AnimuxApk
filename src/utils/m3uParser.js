export const fetchAndFilterMovies = async () => {
  const M3U_URL = 'https://iptv-org.github.io/iptv/categories/movies.m3u';
  
  try {
    const response = await fetch(M3U_URL);
    if (!response.ok) return [];
    const text = await response.text();
    
    const lines = text.split('\n');
    const channels = [];
    const seenNames = new Set();
    
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

          // 1. DUPLICATE CHECK
          if (seenNames.has(cleanNameLower)) continue;

          // 2. LANGUAGE FILTER (LATIN / SPANISH ONLY)
          // Keywords that indicate it's a Spanish/Latin channel
          const isSpanish = nameLower.includes('latino') || 
                            nameLower.includes('esp') || 
                            nameLower.includes('mexico') || 
                            nameLower.includes('argentina') || 
                            nameLower.includes('colombia') ||
                            nameLower.includes('chile') ||
                            nameLower.includes('peru') ||
                            nameLower.includes('cine.ar') ||
                            nameLower.includes('atrescine') ||
                            nameLower.includes('cinecanal') ||
                            nameLower.includes('axn latin') ||
                            nameLower.includes('amc latin') ||
                            nameLower.includes('tnt') ||
                            nameLower.includes('space') ||
                            nameLower.includes('warner');

          // Explicitly block other languages
          const isBlocked = nameLower.includes('brazil') || 
                            nameLower.includes('br@') ||
                            nameLower.includes('portugal') ||
                            nameLower.includes('russia') ||
                            nameLower.includes('germany') ||
                            nameLower.includes('italy') ||
                            nameLower.includes('france') ||
                            nameLower.includes('india') ||
                            nameLower.includes('china') ||
                            nameLower.includes('japan') ||
                            nameLower.includes('turkey');

          // 3. AGE FILTER (NO OLD CINEMA)
          const isOld = nameLower.includes('70s') || 
                        nameLower.includes('80s') || 
                        nameLower.includes('classic') || 
                        nameLower.includes('retro');

          if (!isBlocked && isSpanish && !isOld) {
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
    
    return channels;
  } catch (error) {
    console.error('Error parsing M3U:', error);
    return [];
  }
};
