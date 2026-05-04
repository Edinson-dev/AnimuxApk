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

      const publicChannelsStr = fs.readFileSync('public/channels.json', 'utf-8');
      const publicChannels = JSON.parse(publicChannelsStr).channels || [];
      console.log(`✅ Canales en public/channels.json: ${publicChannels.length}`);

      const m3uChannelsStr = fs.readFileSync('public/m3u_channels.json', 'utf-8');
      const m3uChannels = JSON.parse(m3uChannelsStr).channels || [];
      console.log(`✅ Canales en public/m3u_channels.json: ${m3uChannels.length}`);

      const allLocalChannels = [...publicChannels, ...m3uChannels];

      const duplicates = [];

      firebaseChannels.forEach(fbChannel => {
        const match = allLocalChannels.find(local => 
          (local.name && local.name.toLowerCase() === fbChannel.name.toLowerCase()) || 
          (local.url && local.url === fbChannel.url)
        );

        if (match) {
          duplicates.push({
            name: fbChannel.name,
            matchedLocalName: match.name,
            url: fbChannel.url
          });
        }
      });

      console.log(`\n🚨 SE ENCONTRARON ${duplicates.length} CANALES DUPLICADOS:\n`);
      duplicates.forEach(d => {
        console.log(`- ${d.name}`);
      });
      
    } catch (err) {
      console.error('Error parseando JSON de Firestore', err);
    }
  });
}).on('error', err => {
  console.error('Error de red:', err.message);
});
