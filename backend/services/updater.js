const axios = require('axios');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Configuración para permitir certificados expirados (muy común en IPTV) y forzar timeouts
const axiosInstance = axios.create({
  timeout: 3500, // 3.5 segundos máximo por petición HTTP GET
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  httpAgent: new http.Agent()
});

const normalizeCategory = (groupTitle) => {
  const categoriesMap = {
    'news': 'Noticias', 'noticias': 'Noticias', 'informativos': 'Noticias',
    'sports': 'Deportes', 'deportes': 'Deportes', 'sport': 'Deportes',
    'movies': 'Cine', 'cine': 'Cine', 'películas': 'Cine', 'peliculas': 'Cine',
    'kids': 'Infantil & Anime', 'infantil': 'Infantil & Anime', 'anime': 'Infantil & Anime', 'ninos': 'Infantil & Anime', 'niños': 'Infantil & Anime',
    'music': 'Música', 'musica': 'Música', 'música': 'Música',
    'documentary': 'Documentales', 'documentales': 'Documentales', 'science': 'Educación', 'educacion': 'Educación',
    'religion': 'Religión', 'religioso': 'Religión',
    'series': 'Series',
    'general': 'General', 'entertainment': 'Entretenimiento', 'entretenimiento': 'Entretenimiento'
  };

  if (!groupTitle) return 'General';
  
  const tags = groupTitle.split(';').map(t => t.trim().toLowerCase());
  for (let tag of tags) {
    if (categoriesMap[tag]) return categoriesMap[tag];
    for (let key in categoriesMap) {
      if (tag.includes(key)) return categoriesMap[key];
    }
  }
  return 'General';
};

const validateChannel = async (channel) => {
  try {
    // Intentamos hacer un GET solo pidiendo el inicio del archivo de video
    const response = await axiosInstance.get(channel.url, {
      headers: {
        'Range': 'bytes=0-1000'
      }
    });
    
    return response.status >= 200 && response.status < 400;
  } catch (error) {
    return false;
  }
};

const parseM3U = (data) => {
  const lines = data.split('\n');
  const channels = [];
  let currentChannel = {};

  lines.forEach((line) => {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupTitleMatch = line.match(/group-title="([^"]*)"/);
      const commaIndex = line.lastIndexOf(',');
      const name = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Canal Desconocido';

      currentChannel = {
        tvgId: tvgIdMatch ? tvgIdMatch[1] : '',
        name: name.replace(/\"/g, ''),
        logo: tvgLogoMatch ? tvgLogoMatch[1] : '',
        category: normalizeCategory(groupTitleMatch ? groupTitleMatch[1] : '')
      };
    } else if (line.startsWith('http') && line.includes('.m3u8')) {
      if (currentChannel.name) {
        channels.push({
          ...currentChannel,
          url: line
        });
        currentChannel = {};
      }
    }
  });
  return channels;
};

const fetchAndValidateChannels = async () => {
    console.log('[Updater] Descargando lista mundial en español desde iptv-org...');
    try {
        const response = await axios.get('https://iptv-org.github.io/iptv/languages/spa.m3u');
        let channels = parseM3U(response.data);
        console.log(`[Updater] Detectados ${channels.length} canales. Evaluando estabilidad y velocidad...`);

        // We process in chunks to survive Rate Limits
        const batchSize = 100;
        const validChannels = [];
        
        for (let i = 0; i < channels.length; i += batchSize) {
           const batch = channels.slice(i, i + batchSize);
           process.stdout.write(`\r[Updater] Analizando bloque ${Math.floor(i/batchSize) + 1}/${Math.ceil(channels.length/batchSize)}... `);
           
           const results = await Promise.all(
              batch.map(async (c) => {
                 const isValid = await validateChannel(c);
                 return isValid ? c : null;
              })
           );
           
           validChannels.push(...results.filter(c => c !== null));
        }
        
        console.log(`\n[Updater] Purga terminada.`);

        // Inyectar el ID secuencial final
        const finalizedChannels = validChannels.map((c, index) => ({
            id: index + 1,
            ...c
        }));
        
        console.log(`[Updater] 🟢 Total Canales Finales Estables: ${finalizedChannels.length}`);
        
        // Guardar la fuente de la verdad en backend/data
        const dataPath = path.join(__dirname, '..', 'data', 'channels.json');
        fs.writeFileSync(dataPath, JSON.stringify({ channels: finalizedChannels }, null, 2));

        // Por conveniencia histórica y retro-compatibilidad, guardar también en frontend public/channels.json
        const frontendPath = path.join(__dirname, '..', '..', 'public', 'channels.json');
        try {
            fs.writeFileSync(frontendPath, JSON.stringify({ channels: finalizedChannels }, null, 2));
            console.log('[Updater] ✓ Copiado sincronizado al ecosistema del Frontend (public/)');
        } catch(e) {
            console.log('[Updater] ~ No se copió al frontend automáticamente (Omitido).');
        }

        return finalizedChannels;
    } catch (err) {
        console.error('\n[Updater] ❌ FATAL ERROR al descargar repositorios:', err.message);
        return null;
    }
}

module.exports = {
    fetchAndValidateChannels
};
