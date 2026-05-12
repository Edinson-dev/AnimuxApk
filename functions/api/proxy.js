export async function onRequest(context) {
  const { request } = context;
  const urlParams = new URL(request.url);
  const target = urlParams.searchParams.get('url');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Expose-Headers': '*',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  if (!target) {
    return new Response(JSON.stringify({ error: 'Falta url' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const targetLower = target.toLowerCase();
    const isVideoSegment = targetLower.includes('.ts') || targetLower.includes('.mp4') || targetLower.includes('.m4s') || targetLower.includes('.aac');
    const isM3U8 = targetLower.includes('.m3u8') || targetLower.includes('/play/');

    // ── Servidores de Relevo (Render con IP Colombiana) ──
    const RELAY_SERVERS = [
      'https://animux-relay-w3of.onrender.com',
    
    ];
    const BLOCKED_IPS = ['181.78.', '181.114.'];
    const needsRelay = BLOCKED_IPS.some(ip => target.includes(ip));

    // Timeout 12s — evita que Cloudflare se cuelgue con IPs inaccesibles
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    let response;
    try {
      // Headers idénticos al proxy de Vercel que funcionaba — sin extras
      const fetchHeaders = {
        'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
        'Accept': '*/*',
      };
      // Solo enviar Range si el browser lo envía (range requests de video)
      const rangeHeader = request.headers.get('Range');
      if (rangeHeader) fetchHeaders['Range'] = rangeHeader;

      if (needsRelay) {
        // Intenta con los servidores de la lista uno por uno (SALTO AUTOMÁTICO)
        for (let i = 0; i < RELAY_SERVERS.length; i++) {
          const relay = RELAY_SERVERS[i];
          try {
            const fetchUrl = `${relay}/proxy?url=${encodeURIComponent(target)}`;
            response = await fetch(fetchUrl, {
              headers: fetchHeaders,
              redirect: 'follow',
              signal: controller.signal
            });
            
            // Si la respuesta es exitosa (200-299), salimos del bucle
            if (response.ok) break;
            
            // Si es el último servidor y falló, nos quedamos con esta respuesta aunque sea error
            if (i === RELAY_SERVERS.length - 1) break;
          } catch (e) {
            if (i === RELAY_SERVERS.length - 1) throw e;
            // Si no es el último, ignoramos el error e intentamos el siguiente
          }
        }
      } else {
        // Petición directa si no necesita Relay
        response = await fetch(target, {
          headers: fetchHeaders,
          redirect: 'follow',
          signal: controller.signal
        });
      }
    } finally {
      clearTimeout(timeoutId);
    }

    // ── Determinar Content-Type correcto ──
    // Forzar el Content-Type basado en extensión si el servidor no lo envía bien
    let contentType = response.headers.get('content-type') || '';
    if (isVideoSegment) {
      if (targetLower.includes('.ts'))  contentType = 'video/mp2t';
      else if (targetLower.includes('.mp4') || targetLower.includes('.m4s')) contentType = 'video/mp4';
      else if (targetLower.includes('.aac')) contentType = 'audio/aac';
    } else if (isM3U8 && !contentType.includes('mpegurl') && !contentType.includes('m3u')) {
      contentType = 'application/x-mpegURL';
    }

    const headers = new Headers();
    headers.set('Content-Type', contentType);

    // Soporte para streaming y rangos
    const contentRange = response.headers.get('Content-Range');
    const acceptRanges = response.headers.get('Accept-Ranges');
    const contentLength = response.headers.get('Content-Length');
    if (contentRange)  headers.set('Content-Range', contentRange);
    if (acceptRanges)  headers.set('Accept-Ranges', acceptRanges);
    if (contentLength && isVideoSegment) headers.set('Content-Length', contentLength);

    // CORS abierto
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
    headers.set('Access-Control-Allow-Headers', '*');
    headers.set('Access-Control-Expose-Headers', '*');

    // Cache: segmentos cortos (vivo), playlists nunca
    if (isVideoSegment) {
      headers.set('Cache-Control', 'public, max-age=30');
    } else {
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
    }

    // Si el servidor IPTV devuelve error, lo pasamos directamente
    if (!response.ok) {
      return new Response(response.body, {
        status: response.status,
        headers: headers
      });
    }

    // ── REESCRIBIR M3U8 ──
    // CRÍTICO: verificar isVideoSegment PRIMERO — nunca reescribir binarios .ts como texto
    if (!isVideoSegment && (contentType.includes('mpegurl') || contentType.includes('m3u') || isM3U8)) {
      const text = await response.text();

      // Base para resolver URLs relativas — usar URL final tras redirects
      const baseForResolution = response.url && response.url !== target ? response.url : target;
      const baseUrlObj = new URL(baseForResolution);
      const basePath = baseForResolution.substring(0, baseForResolution.lastIndexOf('/') + 1);
      const proxyBase = `${urlParams.origin}/api/proxy?url=`;

      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Segmentos y sub-playlists (líneas sin #)
        if (line && !line.startsWith('#')) {
          let abs;
          if (line.startsWith('http://') || line.startsWith('https://')) {
            abs = line;
          } else if (line.startsWith('//')) {
            abs = 'http:' + line;
          } else if (line.startsWith('/')) {
            abs = baseUrlObj.origin + line;
          } else {
            abs = basePath + line;
          }
          lines[i] = proxyBase + encodeURIComponent(abs);
        }
        // EXT-X-MEDIA (pistas de audio separadas)
        else if (line.startsWith('#EXT-X-MEDIA')) {
          const m = line.match(/URI="([^"]+)"/);
          if (m) {
            const abs = m[1].startsWith('http') ? m[1] : (m[1].startsWith('/') ? baseUrlObj.origin + m[1] : basePath + m[1]);
            lines[i] = line.replace(`URI="${m[1]}"`, `URI="${proxyBase + encodeURIComponent(abs)}"`);
          }
        }
        // EXT-X-KEY (cifrado)
        else if (line.startsWith('#EXT-X-KEY')) {
          const m = line.match(/URI="([^"]+)"/);
          if (m) {
            const abs = m[1].startsWith('http') ? m[1] : (m[1].startsWith('/') ? baseUrlObj.origin + m[1] : basePath + m[1]);
            lines[i] = line.replace(`URI="${m[1]}"`, `URI="${proxyBase + encodeURIComponent(abs)}"`);
          }
        }
        // EXT-X-MAP (init segment CMAF)
        else if (line.startsWith('#EXT-X-MAP')) {
          const m = line.match(/URI="([^"]+)"/);
          if (m) {
            const abs = m[1].startsWith('http') ? m[1] : (m[1].startsWith('/') ? baseUrlObj.origin + m[1] : basePath + m[1]);
            lines[i] = line.replace(`URI="${m[1]}"`, `URI="${proxyBase + encodeURIComponent(abs)}"`);
          }
        }
      }

      return new Response(lines.join('\n'), { status: 200, headers });
    }

    // ── BINARIOS: .ts, .mp4, etc. ──
    return new Response(response.body, { status: response.status, headers });

  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    return new Response(JSON.stringify({
      error: isTimeout ? 'Timeout: servidor no respondió en 12s' : `Proxy error: ${error.message}`,
      url: target
    }), {
      status: isTimeout ? 504 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
