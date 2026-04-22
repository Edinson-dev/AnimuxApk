const axios = require('axios');

const SPANISH_COLLECTIONS = [
    { title: 'Series de Televisión Españolas', id: 'spanish-tv-series', category: 'Series' },
    { title: 'Series Animadas en Español', id: 'classic-cartoons-spanish', category: 'Infantil' },
    { title: 'Documentales Planeta', id: 'documentales-espanol', category: 'Documental' },
    { id: 'athf-latino-t1', category: 'Series', name: 'Aqua Teen Latino' },
    { id: 'Fenomenoide-1', category: 'Series', name: 'Fenomenoide Latino' },
    { id: 'DBZ-Cloverway-Episodes', category: 'Series', name: 'Dragon Ball Z Latino' },
    { id: 'slayers-next-latino', category: 'Series', name: 'Justicieros (Slayers)' },
    { id: 'PobrePabloEpisodios', category: 'Series', name: 'Pobre Pablo (Telenovela)' },
    { id: 'Garfield_And_Friends_Latino', category: 'Infantil & Anime', name: 'Garfield y sus Amigos' },
    { id: 'coraje-perro-cobarde-latino', category: 'Infantil', name: 'Coraje el Perro Cobarde' },
    { id: 'icarlyespaniollatino_202010', category: 'Series', name: 'iCarly (Latino)' }
];

const getVODFromArchive = async () => {
    console.log(`[VOD-Service] Buscando contenido Premium masivo en ESPAÑOL...`);
    
    // Parallel fetching for speed
    const results = await Promise.allSettled(SPANISH_COLLECTIONS.map(async (col) => {
        const vodChannels = [];
        try {
            const res = await axios.get(`https://archive.org/metadata/${col.id}`, { timeout: 15000 });
            if (!res.data.files) return [];
            
            // Filter restricted files right away
            if (res.data.metadata?.access_restricted || res.data.metadata?.is_dark) {
                console.warn(`[VOD] Saltando colección restringida: ${col.id}`);
                return [];
            }

            const videoFiles = res.data.files.filter(f => 
                f.name.endsWith('.mp4') || f.name.endsWith('.mkv')
            );
            
            for (let i = 0; i < videoFiles.length; i++) {
                const f = videoFiles[i];
                const item = {
                    id: `vod-${col.id}-${i}`,
                    name: f.title || `${col.name || col.title || 'Capítulo'} - Part ${i+1}`,
                    logo: collectionImg(col.id),
                    url: `https://archive.org/download/${col.id}/${f.name}`,
                    category: col.category,
                    isVOD: true,
                    quality: 'HD',
                    embedUrl: `https://archive.org/embed/${col.id}/${f.name}`,
                    groupId: col.id
                };
                vodChannels.push(item);
            }
        } catch (error) {
            // Silently fail for individual collections
        }
        return vodChannels;
    }));

    const allVod = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value);

    console.log(`[VOD-Service] ✓ Inyectados ${allVod.length} títulos en total.`);
    return allVod;
};

const collectionImg = (id) => `https://archive.org/services/img/${id}`;

module.exports = { getVODFromArchive };
