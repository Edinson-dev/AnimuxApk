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
      
      // Mapeo básico de categorías al español si vienen en inglés
      let category = groupMatch ? groupMatch[1] : 'General';
      if (category === 'News') category = 'Noticias';
      else if (category === 'Movies') category = 'Cine';
      else if (category === 'Sports') category = 'Deportes';
      else if (category === 'Music') category = 'Música';
      else if (category === 'Documentaries') category = 'Documentales';
      else if (category === 'Kids') category = 'Infantil';
      else if (category === 'Religious') category = 'Religioso';
      
      if (overrideCategory) category = overrideCategory;
      
      const nameMatch = line.split(',');
      const name = nameMatch.length > 1 ? nameMatch[1].trim() : 'Canal';
      
      currentChannel = {
        name,
        logo,
        category
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
  console.log('Descargando TODOS los canales en español del mundo (iptv-org)...');
  const spanishM3u = await fetchM3u('https://iptv-org.github.io/iptv/languages/spa.m3u');
  const spanishChannels = parseM3u(spanishM3u);
  
  console.log('Descargando TODOS los canales de Anime (iptv-org)...');
  const animeM3u = await fetchM3u('https://iptv-org.github.io/iptv/categories/animation.m3u');
  const animeChannels = parseM3u(animeM3u, 'Anime');
  
  const allChannels = [...spanishChannels, ...animeChannels];
  
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
