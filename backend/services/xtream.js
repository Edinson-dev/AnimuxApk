const axios = require('axios');

/**
 * Xtream Codes API Client
 * This fetches Live TV, Movies and Series from an Xtream server.
 */
const XTREAM_SERVERS = [
    { host: 'https://starplustv.site:443', user: '69754974281040', pass: '247129511903' },
    { host: 'http://7go.xyz:8080', user: '15junior', pass: 'as1266375' },
    { host: 'http://warez.la:80', user: '15junior', pass: 'as1266375' },
    { host: 'http://iptv.nextnet.krd:25461', user: 'nextnet', pass: '3738' }
];

async function getXtreamContent() {
    let allContent = [];

    for (const server of XTREAM_SERVERS) {
        console.log(`[Xtream] Conectando a ${server.host}...`);
        try {
            const apiBase = `${server.host}/player_api.php?username=${server.user}&password=${server.pass}`;
            
            // 1. Get Live Streams
            // const liveRes = await axios.get(`${apiBase}&action=get_live_streams`, { timeout: 5000 });
            // 2. Get Movies (VOD)
            const movieRes = await axios.get(`${apiBase}&action=get_vod_streams`, { timeout: 10000 });
            
            if (Array.isArray(movieRes.data)) {
                console.log(`[Xtream] Recibidas ${movieRes.data.length} películas de ${server.host}`);
                const movies = movieRes.data.map(m => ({
                    name: m.name,
                    logo: m.stream_icon || m.cover,
                    url: `${server.host}/movie/${server.user}/${server.pass}/${m.stream_id}.${m.container_extension || 'mp4'}`,
                    category: 'Cine',
                    rating: m.rating,
                    isVOD: true
                })).slice(0, 50); // Limit to top 50 to avoid massive payload initially
                allContent.push(...movies);
            }

            // 3. Get Series
            const seriesRes = await axios.get(`${apiBase}&action=get_series`, { timeout: 10000 });
            if (Array.isArray(seriesRes.data)) {
                console.log(`[Xtream] Recibidas ${seriesRes.data.length} series de ${server.host}`);
                const series = seriesRes.data.map(s => ({
                    name: s.name,
                    logo: s.cover,
                    url: '#', // Series need a different logic to fetch episodes
                    category: 'Series',
                    groupId: `xtream_${server.user}_${s.series_id}`,
                    isVOD: true
                })).slice(0, 30);
                allContent.push(...series);
            }

        } catch (error) {
            console.error(`[Xtream] Error conectando a ${server.host}:`, error.message);
        }
    }

    return allContent;
}

module.exports = { getXtreamContent };
