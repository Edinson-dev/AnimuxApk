export const XTREAM_SERVERS = [
  { host: 'http://vip.magnum-ott.net:8080', user: '634812009', pass: '634812009' },
  { host: 'http://line.cobra-iptv.com:80', user: 'cobra', pass: 'cobra123' },
  { host: 'http://server.king-iptv.top:8080', user: 'test', pass: 'test2026' },
  { host: 'http://p1.xtream-ie.com:8080', user: 'guest_user', pass: 'guest_pass_99' },
  { host: 'http://ott.blue-iptv.xyz:25461', user: 'blue_demo', pass: 'blue_demo_26' }
];

export const PREMIUM_M3U_SOURCES = [
  'http://ultra-premium-pro.xyz:8080/get.php?username=96485194&password=yedcu83e9&type=m3u_plus',
  'http://redworld.pro:8880/get.php?username=red39&password=T9R7LvmqAbf9&type=m3u_plus',
  'http://planettvweb.com:8091/get.php?username=victor&password=Forap280&type=m3u_plus'
];

export const buildStreamURL = (server, channelId) => {
  if (!server || !channelId) return null;
  return `${server.host}/live/${server.user}/${server.pass}/${channelId}.m3u8`;
};

export const buildVODURL = (server, vodId, extension = 'mp4') => {
  if (!server || !vodId) return null;
  return `${server.host}/movie/${server.user}/${server.pass}/${vodId}.${extension}`;
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
  } catch (error) { console.error('EPG Fetch Error:', error); }
  return null;
};

// VOD Engine
export const fetchVODCategories = async (server) => {
  try {
    const url = `${server.host}/player_api.php?username=${server.user}&password=${server.pass}&action=get_vod_categories`;
    const response = await fetch(url);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('VOD Categories Error:', error);
    return [];
  }
};

export const fetchVODStreams = async (server, categoryId = '') => {
  try {
    const url = `${server.host}/player_api.php?username=${server.user}&password=${server.pass}&action=get_vod_streams${categoryId ? `&category_id=${categoryId}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    // Normalize VOD data to match our app's channel structure
    return data.map(item => ({
      id: `vod-${item.stream_id}`,
      vodId: item.stream_id,
      name: item.name,
      displayName: item.name,
      logo: item.stream_icon,
      category: 'Cine VOD',
      rating: item.rating,
      container: item.container_extension,
      isVOD: true,
      url: buildVODURL(server, item.stream_id, item.container_extension || 'mp4'),
      serverInfo: server
    }));
  } catch (error) {
    console.error('VOD Streams Error:', error);
    return [];
  }
};
