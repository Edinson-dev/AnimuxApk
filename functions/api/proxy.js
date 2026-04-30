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

    const response = await fetch(target, {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': targetOrigin + '/',
        'Origin': targetOrigin,
        'Cookie': request.headers.get('Cookie') || '',
        'Connection': 'keep-alive'
      },
      redirect: 'follow',
      cf: { cacheTtl: isVideoSegment ? 600 : 0 }
    });

    const contentType = response.headers.get('content-type') || '';
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    
    // Pasar cookies del servidor al navegador
    const setCookie = response.headers.get('Set-Cookie');
    if (setCookie) headers.set('Set-Cookie', setCookie);
    
    // Aplicar CORS
    Object.keys(corsHeaders).forEach(key => headers.set(key, corsHeaders[key]));

    // CACHE DINÁMICA: Video se cachea, Listas no.
    if (isVideoSegment) {
      headers.set('Cache-Control', 'public, max-age=600');
    } else {
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
    }

    // ── REESCRIBIR M3U8 (Forzar proxy en todos los fragmentos) ──
    if (contentType.includes('mpegurl') || contentType.includes('m3u8') || target.toLowerCase().includes('.m3u8')) {
      const text = await response.text();
      const finalUrl = response.url; 
      const baseUrlObj = new URL(finalUrl);
      const basePath = baseUrlObj.origin + baseUrlObj.pathname.substring(0, baseUrlObj.pathname.lastIndexOf('/') + 1);

      const proxyBase = `${urlParams.origin}/api/proxy?url=`;

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
    return new Response(JSON.stringify({ error: 'Proxy failed', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
