export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);
  const target = url.searchParams.get('url');

  // Habilitar CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      },
    });
  }

  if (!target) {
    return new Response(JSON.stringify({ error: 'Falta el parámetro url' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const response = await fetch(target, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': '*/*',
        // Referer falso para eludir protecciones de algunos servidores Xtream
        'Referer': new URL(target).origin + '/'
      },
      redirect: 'follow' // CRÍTICO: Seguir redirecciones 302 de Xtream
    });

    const newHeaders = new Headers();
    newHeaders.set('Access-Control-Allow-Origin', '*');
    
    const contentType = response.headers.get('content-type') || '';
    newHeaders.set('Content-Type', contentType);

    // ── MAGIA PRO: RESOLVER REDIRECCIONES 302 EN M3U8 ──
    // Si el servidor IPTV redirige a otro nodo, los paths relativos fallarían.
    // Nosotros interceptamos el m3u8 y convertimos todo a absoluto.
    if (contentType.includes('mpegurl') || contentType.includes('m3u8') || target.toLowerCase().includes('.m3u8')) {
      const text = await response.text();
      const finalUrl = response.url; // URL real después del 302
      const baseUrlObj = new URL(finalUrl);
      const basePath = baseUrlObj.origin + baseUrlObj.pathname.substring(0, baseUrlObj.pathname.lastIndexOf('/') + 1);

      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith('#') && !line.startsWith('http')) {
          if (line.startsWith('/')) {
            lines[i] = baseUrlObj.origin + line; // Rutas absolutas a la raíz
          } else {
            lines[i] = basePath + line; // Rutas relativas al manifest
          }
        }
      }
      return new Response(lines.join('\n'), {
        status: 200,
        headers: newHeaders
      });
    }

    // Para segmentos de video (.ts) u otros archivos, Edge Functions lo manda como Stream.
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Proxy failed', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
