import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../api/lib/logger.js';

const WEB_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'web');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

/**
 * Create a static file server for the web/ directory.
 * @returns {import('node:http').Server}
 */
export function createStaticServer() {
  return http.createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const file = path.normalize(path.join(WEB_ROOT, relative));
    if (!file.startsWith(WEB_ROOT)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    try {
      const content = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
}

const port = Number(process.env.WEB_PORT ?? 5173);
createStaticServer().listen(port, () => logger.info('TaskFlow web listening', { port }));
