const https = require('https');
const fs = require('fs');
const path = require('path');

const m3uUrl = 'https://iptv-org.github.io/iptv/languages/spa.m3u';

https.get(m3uUrl, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error(`Request failed with status code ${res.statusCode}`);
      return;
    }

    const lines = data.split('\n');
    const channels = [];
    let currentChannel = {};
    let idCounter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('#EXTINF:')) {
        const logoMatch = line.match(/tvg-logo="([^"]*)"/);
        const defaultLogo = "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&q=80&w=200&h=200";
        const logo = logoMatch && logoMatch[1].trim() !== "" ? logoMatch[1] : defaultLogo;
        
        // Extraemos dinámicamente la categoría de la lista oficial de iptv-org
        const groupMatch = line.match(/group-title="([^"]*)"/);
        const rawGroup = groupMatch ? groupMatch[1] : "General";
        let category = rawGroup ? rawGroup.split(';')[0].trim() : "General";
        
        // Mejorar categorías
        const catLower = category.toLowerCase();
        if (catLower.includes('movie') || catLower.includes('cine')) category = "Cine";
        else if (catLower.includes('news') || catLower.includes('noticias')) category = "Noticias";
        else if (catLower.includes('sport') || catLower.includes('deporte')) category = "Deportes";
        else if (catLower.includes('music') || catLower.includes('música') || catLower.includes('musica')) category = "Música";
        else if (catLower.includes('kids') || catLower.includes('niños') || catLower.includes('animation') || catLower.includes('anime')) category = "Infantil & Anime";
        else if (catLower.includes('documentary') || catLower.includes('documental')) category = "Documentales";
        else if (catLower.includes('religion') || catLower.includes('religious') || catLower.includes('religioso')) category = "Religión";
        else if (catLower.includes('entertainment') || catLower.includes('entretenimiento')) category = "Entretenimiento";
        else if (catLower.includes('series') || catLower.includes('drama') || catLower.includes('comedy')) category = "Series";
        else if (catLower.includes('education') || catLower.includes('educación')) category = "Educación";
        else category = "General";

        const nameMatch = line.split(',');
        const name = nameMatch.length > 1 ? nameMatch[1].trim() : "Canal TV";

        currentChannel = {
          id: idCounter++,
          name: name,
          logo: logo,
          category: category
        };
      } else if (line.startsWith('http')) {
        if (currentChannel.name) {
          currentChannel.url = line;
          channels.push(currentChannel);
          currentChannel = {}; // Reset
        }
      }
    }

    // Guardamos en el JSON en public para uso inmediato
    const outputFilePath = path.join(__dirname, 'public', 'channels.json');
    const jsonOutput = { channels: channels };
    
    fs.writeFileSync(outputFilePath, JSON.stringify(jsonOutput, null, 2));
    console.log(`¡Éxito! Generados ${channels.length} canales en Español en ${outputFilePath}`);
  });

}).on('error', (err) => {
  console.error('Error al descargar:', err.message);
});
