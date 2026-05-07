const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');
const { fetchAndValidateChannels } = require('./services/updater.js');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Load channels in memory
let channelsConfig = { channels: [] };

const loadChannelsFromDisk = () => {
    try {
        const dataPath = path.join(__dirname, 'data', 'channels.json');
        if (fs.existsSync(dataPath)) {
            const data = fs.readFileSync(dataPath, 'utf8');
            channelsConfig = JSON.parse(data);
            console.log(`[Backend] Cargados ${channelsConfig.channels.length} canales desde el disco.`);
        } else {
            console.log('[Backend] No existe channels.json guardado. Iniciando vacío.');
        }
    } catch (err) {
        console.error('[Backend] Error leyendo canales locales:', err.message);
    }
};

// --- Routes --- //

// 1. Obtener todos los canales validados
app.get('/api/channels', (req, res) => {
    res.json(channelsConfig);
});

// 2. Refresco manual de Canales
app.post('/api/refresh', async (req, res) => {
    try {
        console.log('[Backend] Refresco manual de canales iniciado por endpoint...');
        res.json({ message: 'Refresh started. This will take a few minutes in the background.' });
        const newChannels = await fetchAndValidateChannels();
        if (newChannels && newChannels.length > 0) {
            channelsConfig = { channels: newChannels };
        }
    } catch (err) {
        console.error('[Backend] Error en refresh:', err);
    }
});

// 3. Proxy para saltar bloqueos de Mixed Content (HTTP en HTTPS)
app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL requerida');

    let streamRequest;
    try {
        const urlObj = new URL(targetUrl);
        streamRequest = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': urlObj.origin
            },
            timeout: 15000
        });

        // Pasar los headers de contenido originales
        res.set('Content-Type', streamRequest.headers['content-type'] || 'video/mp2t');
        if (streamRequest.headers['content-length']) {
            res.set('Content-Length', streamRequest.headers['content-length']);
        }
        
        // Pipe the stream
        streamRequest.data.pipe(res);

        // Limpieza si el cliente cierra la conexión
        req.on('close', () => {
            if (streamRequest.data) streamRequest.data.destroy();
        });

        streamRequest.data.on('error', (err) => {
            console.error('[Proxy Stream Error]:', err.message);
            if (!res.headersSent) res.status(500).send('Error en el flujo de datos');
            streamRequest.data.destroy();
        });

    } catch (err) {
        console.error('[Proxy Fatal Error]:', err.message);
        if (!res.headersSent) res.status(500).send('Error al conectar con el stream');
        if (streamRequest && streamRequest.data) streamRequest.data.destroy();
    }
});

// 4. EPG (Futuro)
app.get('/api/epg/:id', (req, res) => {
    res.status(501).json({ message: 'El sistema de Guía EPG está en desarrollo y vendrá en futuras actualizaciones.', epg: null });
});

// --- Tareas Programadas (CRON) --- //
// Ejecutarse todos los días a las 3:00 AM
cron.schedule('0 3 * * *', async () => {
    console.log('[Backend-Cron] Iniciando limpieza y escaneo automático a las 3:00 AM...');
    try {
        const newChannels = await fetchAndValidateChannels();
        if (newChannels && newChannels.length > 0) {
            channelsConfig = { channels: newChannels };
            console.log(`[Backend-Cron] Actualización finalizada exitosamente. Canales funcionales hoy: ${channelsConfig.channels.length}`);
        }
    } catch (err) {
        console.error('[Backend-Cron] Error durante el cron:', err.message);
    }
});

// --- Iniciador --- //
const init = async () => {
    // Asegurar directorio data/
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }
    
    // Cargar del disco
    loadChannelsFromDisk();
    
    // Primer Arranque si no hay datos consolidados
    if (channelsConfig.channels.length === 0) {
        console.log('[Backend] Detectada base de datos nueva o vacía. Iniciando escaneo de canales por primera vez...');
        console.log('[Backend] Por favor, ten paciencia, escanear 1500+ urls a través de internet tomará unos minutos.');
        
        // Peticion asíncrona (el server enciende de todas maneras)
        fetchAndValidateChannels().then(newChannels => {
            if (newChannels) channelsConfig = { channels: newChannels };
        });
    }

    app.listen(PORT, () => {
        console.log(`===============================================`);
        console.log(`🚀 [Backend] Animux Server Node.js ENCENDIDO`);
        console.log(`🎧 API Listen at http://localhost:${PORT}`);
        console.log(`📅 Sistema experto Cron programado (3:00 AM Diario)`);
        console.log(`===============================================`);
    });
};

init();
