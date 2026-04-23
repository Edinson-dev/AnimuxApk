export const XTREAM_SERVERS = [
  { host: 'http://vip.magnum-ott.net:8080', user: '634812009', pass: '634812009' },
  { host: 'http://line.cobra-iptv.com:80', user: 'cobra', pass: 'cobra123' },
  { host: 'http://server.king-iptv.top:8080', user: 'test', pass: 'test2026' },
  { host: 'http://p1.xtream-ie.com:8080', user: 'guest_user', pass: 'guest_pass_99' },
  { host: 'http://ott.blue-iptv.xyz:25461', user: 'blue_demo', pass: 'blue_demo_26' }
];

export const buildStreamURL = (server, channelId) => {
  if (!server || !channelId) return null;
  // Dynamic URL construction for Xtream Codes
  return `${server.host}/live/${server.user}/${server.pass}/${channelId}.m3u8`;
};
