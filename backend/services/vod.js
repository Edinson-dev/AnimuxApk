const axios = require('axios');

const SPANISH_COLLECTIONS = [
    { title: 'Dragon Ball Z', id: 'DBZ-Cloverway-Episodes', category: 'Series' },
    { title: 'Los Simpsons', id: 'los-simpsons-latino-temporadas-1-10', category: 'Series' },
    { title: 'Malcolm el de en Medio', id: 'malcolm-latino-completo', category: 'Series' },
    { title: 'iCarly', id: 'icarlyespaniollatino_202010', category: 'Series' },
    { title: 'Aqua Teen Latino', id: 'athf-latino-t1', category: 'Series' },
    { title: 'Fenomenoide', id: 'Fenomenoide-1', category: 'Series' },
    { title: 'Garfield y sus Amigos', id: 'Garfield_And_Friends_Latino', category: 'Series' },
    { title: 'Coraje el Perro Cobarde', id: 'coraje-perro-cobarde-latino', category: 'Series' }
];

const getVODFromArchive = async () => {
    console.log(`[VOD-Service] RESTAURANDO SERIES CLÁSICAS (DBZ, Simpsons)...`);
    
    const results = await Promise.allSettled(SPANISH_COLLECTIONS.map(async (col) => {
        const vodChannels = [];
        try {
            const res = await axios.get(`https://archive.org/metadata/${col.id}`, { timeout: 20000 });
            if (!res.data.files) return [];
            
            // Filtro para capturar más formatos y evitar basura
            const videoFiles = res.data.files.filter(f => 
                (f.name.toLowerCase().endsWith('.mp4') || f.name.toLowerCase().endsWith('.mkv') || f.name.toLowerCase().endsWith('.avi')) &&
                !f.name.includes('_archive.torrent')
            ).slice(0, 300); // Límite por serie para no saturar
            
            videoFiles.forEach((f, i) => {
                const item = {
                    id: `vod-${col.id}-${i}`,
                    // Nombre forzado para que el buscador SIEMPRE lo encuentre
                    name: `${col.title} - Cap ${i + 1}`,
                    logo: `https://archive.org/services/img/${col.id}`,
                    url: `https://archive.org/download/${col.id}/${encodeURIComponent(f.name)}`,
                    category: col.category,
                    isVOD: true,
                    quality: 'HD',
                    embedUrl: `https://archive.org/embed/${col.id}/${encodeURIComponent(f.name)}`,
                    groupId: col.id
                };
                vodChannels.push(item);
            });
        } catch (error) {
            console.log(`[VOD] Error restaurando ${col.title}: ${error.message}`);
        }
        return vodChannels;
    }));

    const allVod = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value);

    return allVod;
};

module.exports = { getVODFromArchive };
