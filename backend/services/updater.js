const axios = require('axios');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Configuración para permitir certificados expirados (muy común en IPTV) y forzar timeouts
const axiosInstance = axios.create({
  timeout: 10000, 
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  httpAgent: new http.Agent()
});

const normalizeCategory = (groupTitle) => {
  const categoriesMap = {
    'news': 'Noticias', 'noticias': 'Noticias', 'informativos': 'Noticias',
    'sports': 'Deportes', 'deportes': 'Deportes', 'sport': 'Deportes',
    'movies': 'Cine', 'cine': 'Cine', 'películas': 'Cine', 'peliculas': 'Cine',
    'kids': 'Infantil & Anime', 'infantil': 'Infantil & Anime', 'anime': 'Infantil & Anime', 'ninos': 'Infantil & Anime', 'niños': 'Infantil & Anime',
    'music': 'Música', 'musica': 'Música',
    'documentary': 'Documentales', 'documentales': 'Documentales',
    'series': 'Series',
    'general': 'Entretenimiento', 'entertainment': 'Entretenimiento', 'entretenimiento': 'Entretenimiento'
  };

  if (!groupTitle) return 'Entretenimiento';
  
  const tags = groupTitle.split(';').map(t => t.trim().toLowerCase());
  for (let tag of tags) {
    // Si es religión o educación, lo catalogamos como Entretenimiento o lo ignoramos (opcional)
    if (tag.includes('religion') || tag.includes('education') || tag.includes('espiritual')) return null; 

    if (categoriesMap[tag]) return categoriesMap[tag];
    for (let key in categoriesMap) {
      if (tag.includes(key)) return categoriesMap[key];
    }
  }
  return 'Entretenimiento';
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

  const BLACKLIST = ['geo-blocked', 'offline', 'pasword', 'trial', 'test', 'local', 'restricted', 'adult', 'trial', 'hace un momento'];

  lines.forEach((line) => {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupTitleMatch = line.match(/group-title="([^"]*)"/);
      const commaIndex = line.lastIndexOf(',');
      const name = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Canal Desconocido';

      // Depuración de nombres ruidosos o bloqueados
      const cleanName = name.replace(/\"/g, '');
      if (BLACKLIST.some(word => cleanName.toLowerCase().includes(word))) {
          currentChannel = null;
          return;
      }

      currentChannel = {
        tvgId: tvgIdMatch ? tvgIdMatch[1] : '',
        name: cleanName,
        logo: tvgLogoMatch ? tvgLogoMatch[1] : '',
        category: normalizeCategory(groupTitleMatch ? groupTitleMatch[1] : '')
      };
    } else if (line.startsWith('http') && currentChannel) {
      if (currentChannel.name && currentChannel.category !== null) {
        channels.push({
          ...currentChannel,
          url: line,
          isVOD: line.toLowerCase().includes('.mp4') || line.toLowerCase().includes('.mkv')
        });
        currentChannel = {};
      }
    }
  });
  return channels;
};

const { getVODFromArchive } = require('./vod.js');

const EXTRA_M3U_SOURCES = [
  'https://iptv-org.github.io/iptv/countries/es.m3u',
  'https://iptv-org.github.io/iptv/countries/ar.m3u',
  'https://iptv-org.github.io/iptv/countries/co.m3u',
  'https://iptv-org.github.io/iptv/categories/movies.m3u',
  'https://iptv-org.github.io/iptv/categories/animation.m3u'
];

const KEYWORD_BLACKLIST = [
  'geo-blocked', 'offline', 'trial', 'test', 'demo', 'restricted', 
  'adult', 'XXX', 'sex', 'porn', '18+', 'bunny', 'playboy',
  'mexico', 'mex', 'latino-mex', 'error de emisión'
];

const fetchAndValidateChannels = async () => {
    console.log('[Updater] Descargando fuentes de contenido...');
    try {
        // 1. Descargar lista principal
        const mainRes = await axiosInstance.get('https://iptv-org.github.io/iptv/languages/spa.m3u');
        let channels = parseM3U(mainRes.data);
        
        // 2. Descargar fuentes extra (Películas y Series Pro)
        for (const url of EXTRA_M3U_SOURCES) {
           try {
             const res = await axiosInstance.get(url);
             const extraChannels = parseM3U(res.data);
             // Forzar categoría por URL si el M3U no la trae clara
             const forcedCat = url.includes('series') ? 'Series' : 'Cine';
             channels.push(...extraChannels.map(c => ({ ...c, category: c.category || forcedCat })));
           } catch(e) {
             console.log(`[Updater] Error con extra source: ${url.split('/').pop()}`);
           }
        }

        console.log(`[Updater] Detectados ${channels.length} canales en total. Evaluando estabilidad...`);

        // We process in chunks to survive Rate Limits
        const validChannels = channels; // OMITIENDO VALIDACION PARA CARGA RAPIDA
        
        console.log(`\n[Updater] Purga IPTV OMITIDA para desarrollo.`);

        // --- Nueva Integración VOD (Archive.org) ---
        const vodItems = await getVODFromArchive();

        // --- Nueva Integración Xtream (Premium) ---
        const { getXtreamContent } = require('./xtream.js');
        const xtreamItems = await getXtreamContent();
        
        // Unir todos los mundos
        const allContent = [...xtreamItems, ...vodItems, ...validChannels];

        // Inyectar el ID secuencial final (FORZAR numérico para App.jsx)
        const finalizedChannels = allContent.map((c, index) => {
            const { id, ...rest } = c; // Quitar ID previo si existe
            return {
                id: index + 1,
                ...rest
            };
        });
        
        console.log(`[Updater] 🟢 Total Contenido Final (IPTV + VOD): ${finalizedChannels.length}`);
        
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

// Si se ejecuta directamente desde consola
if (require.main === module) {
    fetchAndValidateChannels();
}
