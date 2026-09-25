$path = 'src\components\core\Player.jsx'
$content = Get-Content -Path $path -Encoding UTF8 -Raw
$search = '    // .*? Saltar al siguiente servidor .*?\r?\n\s*const isM3U8 = !isPodcast && \('
$replace = '    // ── Saltar al siguiente servidor ──────────────────────
    const tryNextServer = useCallback(() => {
      if (!channel || channel.isVOD || isEmbed) {
        setError(true);
        setLoading(false);
        return;
      }
      
      let urls = [];
      if (typeof channel.url === "string") {
        urls = channel.url.split(",").map(u => u.trim()).filter(Boolean);
      } else if (Array.isArray(channel.url)) {
        urls = channel.url;
      }
      
      if (serverIndexRef.current < urls.length - 1) {
        console.warn(`🔄 Falló el servidor ${serverIndexRef.current + 1}. Intentando el siguiente...`);
        serverIndexRef.current += 1;
        setServerIndex(serverIndexRef.current);
        const nextUrl = urls[serverIndexRef.current];
        setCurrentUrl(nextUrl ? decodeCamouflage(nextUrl) : "");
      } else {
        console.error("❌ Todos los servidores fallaron.");
        setError(true);
        setLoading(false);
      }
    }, [channel, isEmbed]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !currentUrl) return;

      const urlLower = currentUrl.toLowerCase();
      const isExternal = currentUrl.startsWith("http");
      const isProd = import.meta.env.PROD;

      // Detección de tipo de stream
      const isM3U8 = !isPodcast && ('

$content = [System.Text.RegularExpressions.Regex]::Replace($content, $search, $replace, [System.Text.RegularExpressions.RegexOptions]::Singleline)
Set-Content -Path $path -Value $content -NoNewline -Encoding UTF8
