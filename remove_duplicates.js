import fs from 'fs';
import https from 'https';

const firestoreUrl = 'https://firestore.googleapis.com/v1/projects/barbers-9b523/databases/(default)/documents/channels';

https.get(firestoreUrl, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      const firebaseChannels = response.documents ? response.documents.map(doc => {
        return {
          name: doc.fields.name?.stringValue || '',
          url: doc.fields.url?.stringValue || ''
        };
      }) : [];

      console.log(`✅ Canales en Firebase: ${firebaseChannels.length}`);

      // Procesar channels.json
      const publicChannelsStr = fs.readFileSync('public/channels.json', 'utf-8');
      let publicChannels = JSON.parse(publicChannelsStr).channels || [];
      const initialPublicCount = publicChannels.length;

      // Filtrar los que no están en Firebase
      publicChannels = publicChannels.filter(local => {
        const isDuplicate = firebaseChannels.some(fb => 
          (local.name && local.name.toLowerCase() === fb.name.toLowerCase()) || 
          (local.url && local.url === fb.url)
        );
        return !isDuplicate; // Retornar solo los que NO son duplicados
      });

      const removedPublic = initialPublicCount - publicChannels.length;
      fs.writeFileSync('public/channels.json', JSON.stringify({ channels: publicChannels }, null, 2));
      console.log(`🗑️ Eliminados de public/channels.json: ${removedPublic} canales.`);

      // Procesar m3u_channels.json
      const m3uChannelsStr = fs.readFileSync('public/m3u_channels.json', 'utf-8');
      let m3uChannels = JSON.parse(m3uChannelsStr).channels || [];
      const initialM3uCount = m3uChannels.length;

      m3uChannels = m3uChannels.filter(local => {
        const isDuplicate = firebaseChannels.some(fb => 
          (local.name && local.name.toLowerCase() === fb.name.toLowerCase()) || 
          (local.url && local.url === fb.url)
        );
        return !isDuplicate;
      });

      const removedM3u = initialM3uCount - m3uChannels.length;
      fs.writeFileSync('public/m3u_channels.json', JSON.stringify({ channels: m3uChannels }, null, 2));
      console.log(`🗑️ Eliminados de public/m3u_channels.json: ${removedM3u} canales.`);

      console.log(`\n🎉 ¡Listo! ${removedPublic + removedM3u} canales duplicados han sido eliminados del código. Ahora solo viven en Firebase.`);
      
    } catch (err) {
      console.error('Error parseando JSON de Firestore', err);
    }
  });
}).on('error', err => {
  console.error('Error de red:', err.message);
});
