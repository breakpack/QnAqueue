import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const distDir = join(rootDir, 'dist');
const dataFile = process.env.QNA_DATA_FILE || join(rootDir, 'data', 'qna-state.json');
const port = Number(process.env.PORT || 8200);

const initialData = {
  sessions: [],
  questions: [],
  selectedSessionId: null,
  currentQuestionIdBySession: {},
};

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const readState = async () => {
  try {
    return JSON.parse(await readFile(dataFile, 'utf8'));
  } catch {
    return initialData;
  }
};

const writeState = async (state) => {
  await mkdir(dirname(dataFile), { recursive: true });
  await writeFile(dataFile, JSON.stringify(state, null, 2));
};

const sendJson = (response, status, body) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify({ ...body, serverNow: new Date().toISOString() }));
};

const readRequestBody = (request) =>
  new Promise((resolveBody, rejectBody) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 25 * 1024 * 1024) {
        rejectBody(new Error('payload_too_large'));
        request.destroy();
      }
    });
    request.on('end', () => resolveBody(body));
    request.on('error', rejectBody);
  });

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

    if (url.pathname === '/api/state' && request.method === 'GET') {
      sendJson(response, 200, { data: await readState() });
      return;
    }

    if (url.pathname === '/api/state' && request.method === 'PUT') {
      const parsed = JSON.parse(await readRequestBody(request));
      await writeState(parsed.data ?? initialData);
      broadcastState(await readState());
      sendJson(response, 200, { ok: true });
      return;
    }

    const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = resolve(join(distDir, requestedPath));
    const safePath = filePath.startsWith(distDir) && existsSync(filePath) ? filePath : join(distDir, 'index.html');
    response.writeHead(200, { 'Content-Type': contentTypes[extname(safePath)] || 'application/octet-stream' });
    createReadStream(safePath).pipe(response);
  } catch (error) {
    sendJson(response, error.message === 'payload_too_large' ? 413 : 500, { error: error.message || 'server_error' });
  }
});

const wss = new WebSocketServer({ server, path: '/ws' });

const broadcastState = (data) => {
  const message = JSON.stringify({ type: 'state', data, serverNow: new Date().toISOString() });
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(message);
  }
};

wss.on('connection', async (socket) => {
  socket.send(JSON.stringify({ type: 'state', data: await readState(), serverNow: new Date().toISOString() }));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Q&A Queue server listening on http://0.0.0.0:${port}`);
});
