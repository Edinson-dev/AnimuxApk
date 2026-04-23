export const fetchAndFilterMovies = async () => {
  const M3U_URL = 'https://iptv-org.github.io/iptv/categories/movies.m3u';
  
  try {
    const response = await fetch(M3U_URL);
    if (!response.ok) return [];
    const text = await response.text();
    
    const lines = text.split('\n');
    const channels = [];
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF:')) {
        const info = lines[i];
        const url = lines[i + 1]?.trim();
        
        if (url && url.startsWith('http')) {
          // Extract attributes
          const nameMatch = info.match(/,(.*)$/);
          const logoMatch = info.match(/tvg-logo="(.*?)"/);
          const name = nameMatch ? nameMatch[1].trim() : 'Canal de Cine';
          const logo = logoMatch ? logoMatch[1] : '';
          
          const nameLower = name.toLowerCase();
          
          // FILTER: Skip old movies (70s, 80s, Classic, Noir, etc.)
          const isOld = nameLower.includes('70s') || 
                        nameLower.includes('80s') || 
                        nameLower.includes('classic') || 
                        nameLower.includes('noir') || 
                        nameLower.includes('vintage') ||
                        nameLower.includes('retro');
                        
          // FILTER: Prioritize Spanish, Action, Modern, or major brands
          const isRelevant = nameLower.includes('cine') || 
                            nameLower.includes('movie') || 
                            nameLower.includes('action') || 
                            nameLower.includes('premium') || 
                            nameLower.includes('canal') ||
                            nameLower.includes('esp') ||
                            nameLower.includes('latino');

          if (!isOld && isRelevant) {
            channels.push({
              id: `ext-${name.replace(/\s+/g, '-')}-${i}`,
              name: name,
              displayName: name.split(' [')[0].split(' (')[0],
              logo: logo || 'https://i.imgur.com/Pvid2iH.png',
              category: 'Filmes',
              url: url,
              isExternal: true
            });
          }
        }
      }
    }
    
    // Return only top 100 relevant results to keep it clean
    return channels.slice(0, 100);
  } catch (error) {
    console.error('Error parsing M3U:', error);
    return [];
  }
};
