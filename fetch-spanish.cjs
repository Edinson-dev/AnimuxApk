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
        const category = rawGroup ? rawGroup.split(';')[0].trim() : "General";

        const nameMatch = line.split(',');
        const name = nameMatch.length > 1 ? nameMatch[1].trim() : "Canal TV";

        currentChannel = {
          id: idCounter++,
          name: name,
          logo: logo,
          category: category !== "" ? category : "General"
        };
      } else if (line.startsWith('http')) {
        if (currentChannel.name) {
          currentChannel.url = line;
          channels.push(currentChannel);
          currentChannel = {}; // Reset
        }
      }
    }

    // Guardamos en el JSON
    const outputFilePath = path.join(__dirname, 'src', 'data', 'channels.json');
    const jsonOutput = { channels: channels };
    
    fs.writeFileSync(outputFilePath, JSON.stringify(jsonOutput, null, 2));
    console.log(`¡Éxito! Generados ${channels.length} canales en Español en ${outputFilePath}`);
  });

}).on('error', (err) => {
  console.error('Error al descargar:', err.message);
});
