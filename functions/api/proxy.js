export async function onRequest(context) {
  const { request } = context;
  const urlParams = new URL(request.url);
  const target = urlParams.searchParams.get('url');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    const targetUrl = new URL(target);
    const targetOrigin = targetUrl.origin;
    const isVideoSegment = target.includes('.ts') || target.includes('.mp4') || target.includes('.m4s') || target.includes('.aac');
    const isM3U8Request = target.toLowerCase().includes('.m3u8') || target.toLowerCase().includes('/play/');

    // AbortController para timeout de 12s (evita que Cloudflare cuelgue con IPs inaccesibles)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    let response;
    try {
      response = await fetch(target, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, video/mp4, */*',
          'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
          'Referer': targetOrigin + '/',
          'Origin': targetOrigin,
          'Range': request.headers.get('Range') || '',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        redirect: 'follow',
        signal: controller.signal,
        cf: { cacheTtl: isVideoSegment ? 600 : 0, cacheEverything: isVideoSegment }
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const contentType = response.headers.get('content-type') || '';
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    
    // Pasar Set-Cookie solo si el servidor lo envía
    const setCookie = response.headers.get('Set-Cookie');
    if (setCookie) headers.set('Set-Cookie', setCookie);
    
    // Soporte para streaming y rangos
    const contentRange = response.headers.get('Content-Range');
    const acceptRanges = response.headers.get('Accept-Ranges');
    if (contentRange) headers.set('Content-Range', contentRange);
    if (acceptRanges) headers.set('Accept-Ranges', acceptRanges);
    
    // CORS TOTALMENTE ABIERTO
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
    headers.set('Access-Control-Allow-Headers', '*');
    headers.set('Access-Control-Expose-Headers', '*');
    headers.set('Access-Control-Allow-Credentials', 'true');

    // CACHE DINÁMICA: Video se cachea, Listas no.
    if (isVideoSegment) {
      headers.set('Cache-Control', 'public, max-age=600');
    } else {
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
    }

    // Si el servidor de IPTV devuelve un error, lo pasamos tal cual al reproductor
    if (!response.ok) {
      return new Response(response.body, {
        status: response.status,
        headers: headers
      });
    }

    // ── REESCRIBIR M3U8 (Forzar proxy en todos los fragmentos) ──
    if (contentType.includes('mpegurl') || contentType.includes('m3u8') || isM3U8Request) {
      const text = await response.text();
      
      // Usar la URL ORIGINAL del target (no la URL de respuesta del proxy) como base
      // Esto evita que los segmentos relativos se resuelvan incorrectamente
      const baseForResolution = response.url && response.url !== target ? response.url : target;
      const baseUrlObj = new URL(baseForResolution);
      const basePath = baseForResolution.substring(0, baseForResolution.lastIndexOf('/') + 1);

      const proxyBase = `${urlParams.origin}/api/proxy?url=`;

      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 1. Reescribir sub-playlists y fragmentos de video/audio directos
        if (line && !line.startsWith('#')) {
          let absoluteUrl;
          if (line.startsWith('http://') || line.startsWith('https://')) {
            absoluteUrl = line;
          } else if (line.startsWith('//')) {
            absoluteUrl = 'http:' + line;
          } else if (line.startsWith('/')) {
            absoluteUrl = baseUrlObj.origin + line;
          } else {
            absoluteUrl = basePath + line;
          }
          lines[i] = proxyBase + encodeURIComponent(absoluteUrl);
        }
        // 2. Reescribir sub-playlists en EXT-X-STREAM-INF (multi-bitrate)
        else if (line.startsWith('#EXT-X-STREAM-INF')) {
          // la línea siguiente es la URL del stream, se procesa en la siguiente iteración
        }
        // 3. Reescribir pistas de audio separadas (EXT-X-MEDIA)
        else if (line.startsWith('#EXT-X-MEDIA')) {
          const uriMatch = line.match(/URI="([^"]+)"/);
          if (uriMatch && uriMatch[1]) {
            let mediaUrl = uriMatch[1];
            let absoluteMedia = mediaUrl.startsWith('http') ? mediaUrl : (mediaUrl.startsWith('/') ? baseUrlObj.origin + mediaUrl : basePath + mediaUrl);
            lines[i] = line.replace(`URI="${uriMatch[1]}"`, `URI="${proxyBase + encodeURIComponent(absoluteMedia)}"`);
          }
        }
        // 4. Reescribir llaves de encriptación (.key)
        else if (line.startsWith('#EXT-X-KEY')) {
          const uriMatch = line.match(/URI="([^"]+)"/);
          if (uriMatch && uriMatch[1]) {
            let keyUrl = uriMatch[1];
            let absoluteKey = keyUrl.startsWith('http') ? keyUrl : (keyUrl.startsWith('/') ? baseUrlObj.origin + keyUrl : basePath + keyUrl);
            lines[i] = line.replace(`URI="${uriMatch[1]}"`, `URI="${proxyBase + encodeURIComponent(absoluteKey)}"`);
          }
        }
        // 5. Reescribir mapas de inicialización (EXT-X-MAP)
        else if (line.startsWith('#EXT-X-MAP')) {
          const uriMatch = line.match(/URI="([^"]+)"/);
          if (uriMatch && uriMatch[1]) {
            let mapUrl = uriMatch[1];
            let absoluteMap = mapUrl.startsWith('http') ? mapUrl : (mapUrl.startsWith('/') ? baseUrlObj.origin + mapUrl : basePath + mapUrl);
            lines[i] = line.replace(`URI="${uriMatch[1]}"`, `URI="${proxyBase + encodeURIComponent(absoluteMap)}"`);
          }
        }
      }
      return new Response(lines.join('\n'), {
        status: response.status,
        headers: headers
      });
    }

    // ── STREAMING DE BINARIOS (.TS, .MP4) ──
    return new Response(response.body, {
      status: response.status,
      headers: headers
    });

  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    const statusCode = isTimeout ? 504 : 502;
    const message = isTimeout
      ? 'Gateway Timeout: El servidor de stream no respondió en 12s'
      : `Proxy failed: ${error.message}`;
    
    return new Response(JSON.stringify({ error: message, url: target }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
