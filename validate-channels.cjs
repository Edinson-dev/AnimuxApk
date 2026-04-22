const fs = require('fs');

async function validateChannels() {
  const data = JSON.parse(fs.readFileSync('public/channels.json', 'utf8'));
  const channels = data.channels;
  console.log(`Iniciando optimización de ${channels.length} canales...`);
  
  const results = [];
  const MAX_CONCURRENT = 50; 
  
  async function checkUrl(channel) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const response = await fetch(channel.url, { 
        method: 'HEAD',
        signal: controller.signal,
        headers: { "User-Agent": "VLC/3.0.9 LibVLC/3.0.9" }
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        results.push({ ...channel, latency: Date.now() - start });
        return;
      }
    } catch (e) {}

    // Retry with GET if HEAD fails
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res2 = await fetch(channel.url, { method: 'GET', signal: controller.signal });
      clearTimeout(timeoutId);
      if (res2.ok) {
        results.push({ ...channel, latency: Date.now() - start });
      }
    } catch (err) {}
  }

  for (let i = 0; i < channels.length; i += MAX_CONCURRENT) {
    const chunk = channels.slice(i, i + MAX_CONCURRENT);
    await Promise.all(chunk.map(checkUrl));
    console.log(`Progreso: ${Math.min(i + MAX_CONCURRENT, channels.length)} / ${channels.length}. Válidos: ${results.length}`);
  }

  // Optimize: Keep only the best link for each unique channel name
  const optimizedMap = new Map();
  results.forEach(ch => {
    const cleanName = ch.name.toLowerCase().trim();
    if (!optimizedMap.has(cleanName) || optimizedMap.get(cleanName).latency > ch.latency) {
      optimizedMap.set(cleanName, ch);
    }
  });

  const finalChannels = Array.from(optimizedMap.values()).map((ch, index) => ({
    ...ch,
    id: index + 1,
    latency: undefined // Remove latency prop before saving
  }));

  fs.writeFileSync('public/channels.json', JSON.stringify({ channels: finalChannels }, null, 2));
  console.log(`\n¡Optimización completa! Te quedaron ${finalChannels.length} canales únicos, súper rápidos y 100% funcionales.`);
}

validateChannels();
