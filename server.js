const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const sessions = new Map();
const users = new Map([
  ['mira', { username: 'mira', passwordHash: hash('veilroom'), display: 'Mira Chen', privateNumber: 'VR-1048', role: 'member' }],
  ['noah', { username: 'noah', passwordHash: hash('nightgarden'), display: 'Noah Williams', privateNumber: 'VR-2716', role: 'member' }],
  ['admin', { username: 'admin', passwordHash: hash('admin123'), display: 'Site Administrator', privateNumber: 'VR-0001', role: 'admin' }]
]);
const requests = [];
const messages = new Map([
  ['mira:noah', [{ id: crypto.randomUUID(), from: 'noah', text: 'That was a good call. No call metadata is retained in this session.', createdAt: Date.now() - 7200000 }]]
]);

function hash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function json(response, status, body) { response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS' }); response.end(JSON.stringify(body)); }
function body(request) { return new Promise((resolve, reject) => { let data = ''; request.on('data', (chunk) => { data += chunk; }); request.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (error) { reject(error); } }); }); }
function auth(request) { const token = request.headers.authorization?.replace('Bearer ', ''); return sessions.get(token); }
function publicUser(user) { return { username: user.username, display: user.display, privateNumber: user.privateNumber, role: user.role }; }
function conversationKey(first, second) { return [first, second].sort().join(':'); }

async function handler(request, response) {
  if (request.method === 'OPTIONS') return json(response, 204, {});
  const url = new URL(request.url, `http://${request.headers.host}`);
  try {
    if (request.method === 'GET' && url.pathname === '/') return serveFile(response, 'index.html');
    if (request.method === 'GET' && /^\/(style\.css|app\.js)$/.test(url.pathname)) return serveFile(response, url.pathname.slice(1));
    if (request.method === 'POST' && url.pathname === '/api/login') {
      const input = await body(request); const user = users.get(String(input.username || '').toLowerCase());
      if (!user || user.passwordHash !== hash(String(input.password || ''))) return json(response, 401, { error: 'Invalid credentials.' });
      const token = crypto.randomBytes(32).toString('hex'); sessions.set(token, user.username); return json(response, 200, { token, user: publicUser(user) });
    }
    const username = auth(request); if (!username) return json(response, 401, { error: 'Authentication required.' });
    const current = users.get(username);
    if (request.method === 'GET' && url.pathname === '/api/me') return json(response, 200, { user: publicUser(current) });
    if (request.method === 'GET' && url.pathname === '/api/users') return json(response, 200, { users: [...users.values()].filter((user) => user.username !== username).map(publicUser) });
    if (request.method === 'POST' && url.pathname === '/api/requests') {
      const input = await body(request); const target = [...users.values()].find((user) => user.privateNumber === String(input.privateNumber || '').toUpperCase());
      if (!target || target.username === username) return json(response, 404, { error: 'No user was found for that private number.' });
      if (!requests.some((item) => item.from === username && item.to === target.username && item.status === 'pending')) requests.push({ id: crypto.randomUUID(), from: username, to: target.username, status: 'pending' });
      return json(response, 201, { ok: true });
    }
    if (request.method === 'GET' && url.pathname === '/api/requests') return json(response, 200, { requests: requests.filter((item) => item.to === username || item.from === username).map((item) => ({ ...item, fromUser: publicUser(users.get(item.from)), toUser: publicUser(users.get(item.to)) })) });
    if (request.method === 'POST' && url.pathname.startsWith('/api/requests/')) {
      const item = requests.find((candidate) => candidate.id === url.pathname.split('/').pop() && candidate.to === username); if (!item) return json(response, 404, { error: 'Request not found.' });
      const input = await body(request); item.status = input.accept ? 'accepted' : 'declined'; return json(response, 200, { ok: true });
    }
    if (request.method === 'GET' && url.pathname === '/api/messages') { const other = url.searchParams.get('with'); return json(response, 200, { messages: messages.get(conversationKey(username, other)) || [] }); }
    if (request.method === 'POST' && url.pathname === '/api/messages') { const input = await body(request); const key = conversationKey(username, input.to); const list = messages.get(key) || []; const message = { id: crypto.randomUUID(), from: username, text: String(input.text || '').slice(0, 5000), createdAt: Date.now() }; list.push(message); messages.set(key, list); return json(response, 201, { message }); }
    if (request.method === 'DELETE' && url.pathname === '/api/messages') { const other = url.searchParams.get('with'); messages.delete(conversationKey(username, other)); return json(response, 200, { ok: true }); }
    return json(response, 404, { error: 'Not found.' });
  } catch (error) { return json(response, 400, { error: error.message }); }
}

http.createServer(handler).listen(PORT, () => console.log(`Veilroom backend listening on http://localhost:${PORT}`));

function serveFile(response, filename) {
  const filePath = path.join(__dirname, filename);
  if (!fs.existsSync(filePath)) return json(response, 404, { error: 'File not found.' });
  const type = filename.endsWith('.css') ? 'text/css' : filename.endsWith('.js') ? 'text/javascript' : 'text/html';
  response.writeHead(200, { 'Content-Type': type }); response.end(fs.readFileSync(filePath));
}
