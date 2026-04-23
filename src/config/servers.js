export const XTREAM_SERVERS = [
  { host: 'http://vip.magnum-ott.net:8080', user: '634812009', pass: '634812009' },
  { host: 'http://line.cobra-iptv.com:80', user: 'cobra', pass: 'cobra123' },
  { host: 'http://server.king-iptv.top:8080', user: 'test', pass: 'test2026' },
  { host: 'http://p1.xtream-ie.com:8080', user: 'guest_user', pass: 'guest_pass_99' },
  { host: 'http://ott.blue-iptv.xyz:25461', user: 'blue_demo', pass: 'blue_demo_26' }
];

export const buildStreamURL = (server, channelId) => {
  if (!server || !channelId) return null;
  return `${server.host}/live/${server.user}/${server.pass}/${channelId}.m3u8`;
};

export const fetchShortEPG = async (server, channelId) => {
  if (!server || !channelId) return null;
  
  try {
    const url = `${server.host}/player_api.php?username=${server.user}&password=${server.pass}&action=get_short_epg&stream_id=${channelId}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data && data.epg_listings && data.epg_listings.length > 0) {
      return data.epg_listings.map(item => ({
        title: atob(item.title),
        start: item.start,
        end: item.end,
        description: atob(item.description || ''),
        start_timestamp: item.start_timestamp,
        stop_timestamp: item.stop_timestamp
      }));
    }
  } catch (error) {
    console.error('EPG Fetch Error:', error);
  }
  return null;
};
