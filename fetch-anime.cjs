const https = require('https');
const fs = require('fs');
const path = require('path');

const m3uUrl = 'https://iptv-org.github.io/iptv/categories/animation.m3u';

https.get(m3uUrl, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error(`Request failed with status code ${res.statusCode}`);
      return;
    }

    const lines = data.split('\n');
    const channels = [];
    let currentChannel = {};
    let idCounter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('#EXTINF:')) {
        // Parse metadata
        // Example: #EXTINF:-1 tvg-id="" tvg-logo="https://...png" group-title="Animation",Channel Name
        const logoMatch = line.match(/tvg-logo="([^"]*)"/);
        const logo = logoMatch ? logoMatch[1] : "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=200&h=200";
        
        const nameMatch = line.split(',');
        const name = nameMatch.length > 1 ? nameMatch[1].trim() : "Anime Channel";

        currentChannel = {
          id: idCounter++,
          name: name,
          logo: logo || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=200&h=200",
          category: "Animation"
        };
      } else if (line.startsWith('http')) {
        // This is the URL
        if (currentChannel.name) {
          currentChannel.url = line;
          channels.push(currentChannel);
          currentChannel = {}; // Reset
        }
      }
    }

    // Since many streams might just be generic animation, we'll try to find more anime ones or just use them all.
    // Also we will append a few pluto tv anime links manually just in case the Github ones are mostly western cartoons.
    const customAnimes = [
      {
        id: idCounter++,
        name: "Pluto TV Anime (Latino)",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Pluto_TV_Logo.svg/1024px-Pluto_TV_Logo.svg.png",
        url: "http://samsung.pluto.tv/channel/anime-latino/master.m3u8",
        category: "Clásicos"
      },
      {
        id: idCounter++,
        name: "Naruto 24/7 (Latino)",
        logo: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=200&h=200",
        url: "http://samsung.pluto.tv/channel/naruto-latino/master.m3u8",
        category: "Shonen"
      },
      {
        id: idCounter++,
        name: "One Piece 24/7",
        logo: "https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&w=200&h=200",
        url: "http://samsung.pluto.tv/channel/one-piece-latino/master.m3u8",
        category: "Shonen"
      }
    ];

    const finalChannels = [...customAnimes, ...channels.filter(c => c.url.includes('m3u8'))];
    
    // Save to file
    const outputFilePath = path.join(__dirname, 'src', 'data', 'channels.json');
    const jsonOutput = { channels: finalChannels };
    
    fs.writeFileSync(outputFilePath, JSON.stringify(jsonOutput, null, 2));
    console.log(`Successfully generated ${finalChannels.length} channels to ${outputFilePath}`);
  });

}).on('error', (err) => {
  console.error('Error fetching list:', err.message);
});
