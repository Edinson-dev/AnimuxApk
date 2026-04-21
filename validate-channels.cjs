const fs = require('fs');

async function validateChannels() {
  const data = JSON.parse(fs.readFileSync('public/channels.json', 'utf8'));
  const channels = data.channels;
  console.log(`Iniciando limpieza de ${channels.length} canales... (Esto comprobará todos pidiendo un PING)`);
  
  const validChannels = [];
  const MAX_CONCURRENT = 100; // 100 a la vez para ir rápido
  
  async function checkUrl(channel) {
    try {
      const controller = new AbortController();
      // 3 segundos de tolerancia máxima. Si demora más, a la basura.
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      
      const response = await fetch(channel.url, { 
        method: 'HEAD', // Solo pedir las cabeceras para ir muchísimo más rápido
        signal: controller.signal,
        headers: {
            "User-Agent": "VLC/3.0.9 LibVLC/3.0.9"
        }
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        validChannels.push(channel);
      }
    } catch (e) {
      // Si falla tratar con GET por si el server no soporta HEAD
      try {
         const controller = new AbortController();
         const timeoutId = setTimeout(() => controller.abort(), 3000);
         const res2 = await fetch(channel.url, { method: 'GET', signal: controller.signal });
         clearTimeout(timeoutId);
         if (res2.ok) validChannels.push(channel);
      } catch (err) {
         // Completamente caído
      }
    }
  }

  for (let i = 0; i < channels.length; i += MAX_CONCURRENT) {
    const chunk = channels.slice(i, i + MAX_CONCURRENT);
    await Promise.all(chunk.map(checkUrl));
    console.log(`Progreso: ${Math.min(i + MAX_CONCURRENT, channels.length)} / ${channels.length}. Vivos encontrados: ${validChannels.length}`);
  }

  fs.writeFileSync('public/channels.json', JSON.stringify({ channels: validChannels }, null, 2));
  console.log(`\n¡Limpieza completa! Te quedaron ${validChannels.length} canales 100% súper rápidos y vivos.`);
}

validateChannels();
