export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send('URL is required');

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': new URL(url).origin
      }
    });

    if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);

    // Set headers
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    
    // Stream back
    const reader = response.body.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    
    res.end();
  } catch (err) {
    console.error('[Vercel Proxy Error]:', err.message);
    res.status(500).send(`Proxy error: ${err.message}`);
  }
}
