const https = require('https');
const fs = require('fs');
const path = require('path');

const m3uUrl = 'https://iptv-org.github.io/iptv/categories/animation.m3u';
const channelsFile = path.join(__dirname, 'public', 'channels.json');

console.log('Reading existing channels...');
let existingData = { channels: [] };
if (fs.existsSync(channelsFile)) {
  const content = fs.readFileSync(channelsFile, 'utf8');
  try {
    existingData = JSON.parse(content);
  } catch (e) {
    console.error('Error parsing channels.json:', e.message);
  }
}

// Ensure there is an array
if (!Array.isArray(existingData.channels)) {
  existingData.channels = [];
}

let maxId = 0;
const existingUrls = new Set();
existingData.channels.forEach(ch => {
  if (ch.id > maxId) maxId = ch.id;
  if (ch.url) existingUrls.add(ch.url.trim());
});

console.log(`Currently there are ${existingData.channels.length} channels. Max ID: ${maxId}`);
console.log('Downloading latest animation channels from github...');

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
    let currentChannel = {};
    let newChannelsAdded = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('#EXTINF:')) {
        const logoMatch = line.match(/tvg-logo="([^"]*)"/);
        const logo = logoMatch ? logoMatch[1] : "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=200&h=200";
        
        const nameMatch = line.split(',');
        const name = nameMatch.length > 1 ? nameMatch[1].trim() : "Anime Channel";

        currentChannel = {
          name: name,
          logo: logo || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=200&h=200",
          category: "Anime Internacional"
        };
      } else if (line.startsWith('http')) {
        if (currentChannel.name) {
          const url = line;
          if (url.includes('m3u8') && !existingUrls.has(url)) {
            maxId++;
            currentChannel.id = maxId;
            currentChannel.url = url;
            
            existingData.channels.push(currentChannel);
            existingUrls.add(url);
            newChannelsAdded++;
          }
          currentChannel = {}; // Reset
        }
      }
    }

    fs.writeFileSync(channelsFile, JSON.stringify(existingData, null, 2));
    console.log(`Successfully appended ${newChannelsAdded} NEW anime channels to ${channelsFile}`);
    console.log(`Total channels now: ${existingData.channels.length}`);
  });

}).on('error', (err) => {
  console.error('Error fetching list:', err.message);
});
