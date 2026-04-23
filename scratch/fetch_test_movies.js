import fs from 'fs';

const servers = [
    { host: 'http://server.king-iptv.top:8080', user: 'test', pass: 'test2026' },
    { host: 'http://line.cobra-iptv.com:80', user: 'cobra', pass: 'cobra123' }
];

async function getTestMovies() {
    for (const server of servers) {
        try {
            console.log(`Trying server: ${server.host}...`);
            const url = `${server.host}/player_api.php?username=${server.user}&password=${server.pass}&action=get_vod_streams`;
            const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
            const data = await response.json();
            
            if (!Array.isArray(data) || data.length === 0) continue;

            const targets = ['Deadpool', 'Inside Out', 'Gladiator', 'Moana', 'Joker'];
            let selected = data.filter(m => targets.some(t => m.name.toLowerCase().includes(t.toLowerCase()))).slice(0, 2);
            
            if (selected.length === 0) {
                selected = data.slice(0, 2);
            }

            const movies = selected.map(item => ({
                id: `premium-${item.stream_id}`,
                vodId: item.stream_id,
                title: item.name,
                name: item.name,
                logo: item.stream_icon,
                category: 'Cine Premium',
                rating: item.rating,
                url: `${server.host}/movie/${server.user}/${server.pass}/${item.stream_id}.${item.container_extension || 'mp4'}`,
                isVOD: true,
                isPremium: true
            }));

            fs.writeFileSync('d:/Desarrollos Programas Personales/StreamTv/public/movies.json', JSON.stringify(movies, null, 2));
            console.log(`Successfully created movies.json using ${server.host}`);
            console.log(movies.map(m => m.title));
            return;
        } catch (error) {
            console.error(`Failed server ${server.host}:`, error.message);
        }
    }
}

getTestMovies();
