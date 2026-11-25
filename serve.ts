// Copper Ladle — a tiny static server for local play-testing.
// Serves this directory's game/ folder at http://localhost:8080 and
// opens it in the default browser. Node 22, standard library only.
// Run from the repository root: `node serve.ts`

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = join(here, 'game');
const port = 8080;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let path = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = join(root, path);
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch (err) {
    res.writeHead(404);
    res.end('not found');
  }
});

server.listen(port, () => {
  console.log('Copper Ladle at http://localhost:' + port);
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(opener + ' http://localhost:' + port);
});
