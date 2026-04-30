const https = require('https');
const fs = require('fs');
const path = require('path');

const channelsFile = path.join(__dirname, 'public', 'channels.json');

function fetchM3u(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseM3u(data, overrideCategory = null) {
  const lines = data.split('\n');
  const channels = [];
  let currentChannel = {};
  
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);
      
      const logo = logoMatch ? logoMatch[1] : 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=200&h=200';
      
      const categoryMap = {
        'news': 'Noticias', 'noticias': 'Noticias', 'informativos': 'Noticias',
        'sports': 'Deportes', 'deportes': 'Deportes', 'sport': 'Deportes',
        'movies': 'Cine', 'cine': 'Cine', 'películas': 'Cine', 'peliculas': 'Cine',
        'kids': 'Infantil', 'infantil': 'Infantil', 'animation': 'Infantil', 'ninos': 'Infantil', 'niños': 'Infantil',
        'anime': 'Anime',
        'music': 'Música', 'musica': 'Música',
        'documentary': 'Documentales', 'documentaries': 'Documentales', 'documentales': 'Documentales',
        'series': 'Series',
        'religious': 'Religioso', 'religion': 'Religioso', 'espiritual': 'Religioso',
        'general': 'Entretenimiento', 'entertainment': 'Entretenimiento', 'entretenimiento': 'Entretenimiento'
      };

      let category = groupMatch ? groupMatch[1].toLowerCase() : 'entretenimiento';
      let finalCategory = 'Entretenimiento';

      for (let key in categoryMap) {
        if (category.includes(key)) {
          finalCategory = categoryMap[key];
          break;
        }
      }

      if (overrideCategory) finalCategory = overrideCategory;
      
      const nameMatch = line.split(',');
      const name = nameMatch.length > 1 ? nameMatch[1].trim() : 'Canal';
      
      currentChannel = {
        name,
        logo,
        category: finalCategory
      };
    } else if (line.startsWith('http')) {
      // Filtrar m3u8 o similares (algunos streams válidos no acaban en m3u8, pero nos aseguramos)
      if (currentChannel.name) {
        currentChannel.url = line;
        channels.push(currentChannel);
      }
      currentChannel = {};
    }
  }
  return channels;
}

async function buildList() {
  console.log('Descargando canales estables (TDTChannels)...');
  const tdtM3u = await fetchM3u('https://raw.githubusercontent.com/LaQuay/TDTChannels/master/lists/tv.m3u');
  const tdtChannels = parseM3u(tdtM3u);

  console.log('Descargando canales internacionales en español...');
  const spaM3u = await fetchM3u('https://iptv-org.github.io/iptv/languages/spa.m3u');
  const spaChannels = parseM3u(spaM3u);
  
  console.log('Descargando canales de Anime...');
  const animeM3u = await fetchM3u('https://iptv-org.github.io/iptv/categories/animation.m3u');
  const animeChannels = parseM3u(animeM3u, 'Anime');
  
  const allChannels = [...tdtChannels, ...spaChannels, ...animeChannels];
  
  // Limpiar duplicados por URL de stream
  const urls = new Set();
  const uniqueChannels = [];
  let idCounter = 1;
  
  for (const ch of allChannels) {
    if (!urls.has(ch.url)) {
      urls.add(ch.url);
      uniqueChannels.push({
        id: idCounter++,
        name: ch.name,
        logo: ch.logo,
        category: ch.category,
        url: ch.url
      });
    }
  }
  
  console.log(`Guardando el listado definitivo de ${uniqueChannels.length} canales (Español + Anime)...`);
  fs.writeFileSync(channelsFile, JSON.stringify({ channels: uniqueChannels }, null, 2));
  console.log('OK! Listo para validar y limpiar streams caídos.');
}

buildList().catch(console.error);
