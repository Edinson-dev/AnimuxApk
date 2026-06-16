export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  const urlParams = new URL(req.url, `http://${req.headers.host}`);
  const target = req.query?.url || urlParams.searchParams.get('url');
  const isRaw = req.query?.raw === 'true' || urlParams.searchParams.get('raw') === 'true';

  // Headers CORS obligatorios
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!target) return res.status(400).json({ error: 'Falta url' });

  try {
    const targetLower = target.toLowerCase();
    const originUrl = new URL(target).origin;
    
    // FETCH AL IPTV (Simulando un reproductor nativo para EVITAR BLOQUEOS)
    const fetchHeaders = {
      'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
      'Accept': '*/*',
      'Connection': 'keep-alive'
    };

    if (targetLower.includes('fubo18.com') || targetLower.includes('latamvidzfy.org') || targetLower.includes('vivolatamz.org')) {
      fetchHeaders['Referer'] = 'https://futbol-libres.su/';
      fetchHeaders['Origin'] = 'https://futbol-libres.su/';
    }

    const response = await fetch(target, {
      method: 'GET',
      headers: fetchHeaders,
      redirect: 'follow'
    });

    const contentType = response.headers.get('content-type') || '';
    res.setHeader('Content-Type', contentType);

    // ── REESCRIBIR M3U8 (Solo si no es modo RAW) ──
    if (!isRaw && (contentType.includes('mpegurl') || contentType.includes('m3u8') || target.toLowerCase().includes('.m3u8'))) {
      const text = await response.text();
      const finalUrl = response.url; 
      const baseUrlObj = new URL(finalUrl);
      const basePath = baseUrlObj.origin + baseUrlObj.pathname.substring(0, baseUrlObj.pathname.lastIndexOf('/') + 1);

      const proto = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host;
      const proxyBase = `${proto}://${host}/api/proxy?url=`;

      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Reescribir .ts y .aac
        if (line && !line.startsWith('#')) {
          let absoluteUrl = line.startsWith('http') ? line : (line.startsWith('/') ? baseUrlObj.origin + line : basePath + line);
          lines[i] = proxyBase + encodeURIComponent(absoluteUrl);
        }
        // Reescribir llaves de encriptación (.key)
        else if (line.startsWith('#EXT-X-KEY')) {
          const uriMatch = line.match(/URI="([^"]+)"/);
          if (uriMatch && uriMatch[1]) {
            let keyUrl = uriMatch[1];
            let absoluteKey = keyUrl.startsWith('http') ? keyUrl : (keyUrl.startsWith('/') ? baseUrlObj.origin + keyUrl : basePath + keyUrl);
            lines[i] = line.replace(`URI="${uriMatch[1]}"`, `URI="${proxyBase + encodeURIComponent(absoluteKey)}"`);
          }
        }
      }
      return res.status(200).send(lines.join('\n'));
    }

    // ── STREAMING DE BINARIOS (.TS, .MP4) ──
    if (!response.body) return res.status(200).end();
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    return res.end();

  } catch (error) {
    return res.status(500).json({ error: 'Proxy failed', details: error.message });
  }
}
