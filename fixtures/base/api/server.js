import http from 'node:http';
import { createRouter } from './router.js';
import { registerRoutes } from './routes.js';
import { createStore } from './store.js';
import { buildSeed } from './seed.js';
import { ApiError } from './lib/errors.js';
import { readJsonBody, sendError } from './lib/http.js';
import { createRateLimiter } from './lib/rate-limit.js';
import { logger } from './lib/logger.js';

const BODY_METHODS = new Set(['POST', 'PATCH', 'PUT']);
const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': 'content-type',
};

/**
 * Create the HTTP server (not yet listening).
 * @param {{store?: object}} [options] pass a custom store to isolate tests
 * @returns {import('node:http').Server}
 */
export function createApp({ store = createStore(buildSeed()) } = {}) {
  const router = createRouter();
  registerRoutes(router);
  const limiter = createRateLimiter();

  return http.createServer(async (req, res) => {
    for (const [name, value] of Object.entries(CORS_HEADERS)) res.setHeader(name, value);
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }
      if (!limiter(req.socket.remoteAddress ?? 'local').allowed) {
        throw new ApiError(429, 'RATE_LIMITED', 'Too many requests');
      }
      const url = new URL(req.url, 'http://localhost');
      const found = router.match(req.method, url.pathname);
      if (!found) throw new ApiError(404, 'NOT_FOUND', `No route for ${req.method} ${url.pathname}`);
      if (found.allowed) {
        res.setHeader('allow', found.allowed.join(', '));
        throw new ApiError(405, 'METHOD_NOT_ALLOWED', `${req.method} is not allowed on ${url.pathname}`);
      }
      const body = BODY_METHODS.has(req.method) ? await readJsonBody(req) : {};
      await found.handler({ req, res, params: found.params, query: url.searchParams, body, store });
      logger.debug('request handled', { method: req.method, path: url.pathname, status: res.statusCode });
    } catch (err) {
      if (res.headersSent) return;
      sendError(res, err);
    }
  });
}
