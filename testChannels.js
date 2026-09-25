import fs from 'fs';

const CHANNELS_FILE = 'public/channels.json';
const REJECTED_FILE = 'public/canales_rechazados.json';
const TIMEOUT_MS = 10000;

import http from 'http';
import https from 'https';

async function checkUrl(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      // Abort immediately after getting headers to save bandwidth
      res.destroy();
      if (res.statusCode >= 200 && res.statusCode < 400) {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function testChannel(channel) {
  if (!channel.url) return { channel, alive: false };
  
  let urls = [];
  if (typeof channel.url === 'string') {
    urls = channel.url.split(',').map(u => u.trim()).filter(Boolean);
  } else if (Array.isArray(channel.url)) {
    urls = channel.url;
  }
  
  if (urls.length === 0) return { channel, alive: false };

  for (let url of urls) {
     if (!url.startsWith('http')) {
        return { channel, alive: true };
     }
     if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('drive.google.com') || url.includes('iframe') || channel.isEmbed) {
        return { channel, alive: true }; 
     }
     const alive = await checkUrl(url);
     if (alive) {
       return { channel, alive: true };
     }
  }
  return { channel, alive: false };
}

async function run() {
  console.log(`Leyendo ${CHANNELS_FILE}...`);
  const rawData = fs.readFileSync(CHANNELS_FILE, 'utf8');
  let data;
  try {
     data = JSON.parse(rawData);
  } catch (e) {
     console.error('Error parseando JSON', e);
     return;
  }
  
  const channels = Array.isArray(data) ? data : (data.channels || []);
  const isObjectFormat = !Array.isArray(data) && data.channels;
  
  console.log(`Total canales a verificar: ${channels.length}`);
  
  const validChannels = [];
  const rejectedChannels = [];
  
  const BATCH_SIZE = 15;
  for (let i = 0; i < channels.length; i += BATCH_SIZE) {
    const batch = channels.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(c => testChannel(c)));
    
    for (const res of results) {
      if (res.alive) {
        validChannels.push(res.channel);
      } else {
        rejectedChannels.push(res.channel);
      }
    }
    process.stdout.write(`\rVerificados: ${Math.min(i + BATCH_SIZE, channels.length)} / ${channels.length}`);
  }
  
  console.log('\nFinalizado!');
  console.log(`Canales validos: ${validChannels.length}`);
  console.log(`Canales rechazados: ${rejectedChannels.length}`);
  
  const outputData = isObjectFormat ? { ...data, channels: validChannels } : validChannels;
  fs.writeFileSync(CHANNELS_FILE, JSON.stringify(outputData, null, 2));
  fs.writeFileSync(REJECTED_FILE, JSON.stringify(rejectedChannels, null, 2));
  console.log('Archivos guardados.');
}

run();
