const axios = require('axios');

/**
 * Xtream Codes API Client - REFORZADO ABRIL 2026
 * Sistema de Failover: Si un servidor cae, se salta automáticamente al siguiente.
 */
const XTREAM_SERVERS = [
    { host: 'http://vip.magnum-ott.net:8080', user: '634812009', pass: '634812009' },
    { host: 'http://line.cobra-iptv.com:80', user: 'cobra', pass: 'cobra123' },
    { host: 'http://server.king-iptv.top:8080', user: 'test', pass: 'test2026' },
    { host: 'http://p1.xtream-ie.com:8080', user: 'guest_user', pass: 'guest_pass_99' },
    { host: 'http://ott.blue-iptv.xyz:25461', user: 'blue_demo', pass: 'blue_demo_26' }
];

async function getXtreamContent() {
    let allContent = [];

    for (const server of XTREAM_SERVERS) {
        console.log(`[Xtream] Intentando conexión failover a: ${server.host}...`);
        try {
            const apiBase = `${server.host}/player_api.php?username=${server.user}&password=${server.pass}`;
            
            // Timeout corto para no detener la app si el servidor está lento
            const movieRes = await axios.get(`${apiBase}&action=get_vod_streams`, { timeout: 7000 });
            
            if (Array.isArray(movieRes.data)) {
                const movies = movieRes.data.map(m => ({
                    id: `xtream_${m.stream_id}`,
                    name: m.name,
                    logo: m.stream_icon || m.cover,
                    // Construcción dinámica de URL Tokenizada
                    url: `${server.host}/movie/${server.user}/${server.pass}/${m.stream_id}.${m.container_extension || 'mp4'}`,
                    category: 'Cine',
                    isVOD: true,
                    serverHost: server.host
                })).slice(0, 40); 
                allContent.push(...movies);
                console.log(`[Xtream] ✓ ${movies.length} títulos obtenidos de ${server.host}`);
            }

        } catch (error) {
            console.warn(`[Xtream] ⚠️ Falló servidor ${server.host}. Pasando al siguiente...`);
        }
    }

    return allContent;
}

module.exports = { getXtreamContent };
