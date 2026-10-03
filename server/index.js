// Jarvis local API server.
// Serves live system telemetry today; agents, workflows and the voice MCP bridge plug in here next.
import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.JARVIS_API_PORT ?? 4317);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const startedAt = Date.now();

// CPU usage is a delta between two samples of os.cpus() times.
let lastCpu = sampleCpu();
function sampleCpu() {
  let idle = 0;
  let total = 0;
  for (const cpu of os.cpus()) {
    for (const [kind, t] of Object.entries(cpu.times)) {
      total += t;
      if (kind === 'idle') idle += t;
    }
  }
  return { idle, total };
}
function cpuPercent() {
  const now = sampleCpu();
  const idle = now.idle - lastCpu.idle;
  const total = now.total - lastCpu.total;
  lastCpu = now;
  return total > 0 ? Math.round((1 - idle / total) * 100) : 0;
}

function diskPercent() {
  try {
    const s = fs.statfsSync(os.platform() === 'win32' ? ROOT.slice(0, 3) : '/');
    const total = s.blocks * s.bsize;
    const free = s.bavail * s.bsize;
    return total > 0 ? Math.round((1 - free / total) * 100) : null;
  } catch {
    return null;
  }
}

function systemStats() {
  const totalMem = os.totalmem();
  return {
    cpu: cpuPercent(),
    ram: Math.round((1 - os.freemem() / totalMem) * 100),
    disk: diskPercent(),
    cores: os.cpus().length,
    totalMemGb: +(totalMem / 1024 ** 3).toFixed(1),
    hostname: os.hostname(),
    platform: `${os.type()} ${os.release()}`,
    uptimeSec: Math.round(os.uptime()),
    jarvisUptimeSec: Math.round((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
  };
}

const routes = {
  'GET /api/health': () => ({ ok: true, name: 'JARVIS', version: '0.1.0' }),
  'GET /api/system': systemStats,
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

function serveStatic(req, res) {
  if (!fs.existsSync(DIST)) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('UI not built. Run `npm run dev` for development or `npm start` to build and serve.');
    return;
  }
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.normalize(path.join(DIST, urlPath));
  if (!file.startsWith(DIST)) {
    res.writeHead(403).end();
    return;
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  const key = `${req.method} ${new URL(req.url, 'http://x').pathname}`;
  const handler = routes[key];
  if (handler) {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify(handler(req)));
    return;
  }
  if (key.startsWith('GET /api/')) {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`JARVIS API online → http://localhost:${PORT}`);
});
