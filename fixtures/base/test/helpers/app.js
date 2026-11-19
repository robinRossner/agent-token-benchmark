import { createApp } from '../../api/server.js';
import { createStore } from '../../api/store.js';
import { buildSeed } from '../../api/seed.js';
import { setLogLevel } from '../../api/lib/logger.js';

setLogLevel('silent');

/**
 * Start the API on an ephemeral port with a fresh seeded store.
 * @returns {Promise<{baseUrl: string, store: object, request: Function, close: () => Promise<void>}>}
 */
export async function startTestApp() {
  const store = createStore(buildSeed());
  const server = createApp({ store });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  /**
   * Perform a request and return { status, body } (body is parsed JSON or null).
   * @param {string} method
   * @param {string} path
   * @param {object} [payload]
   */
  async function request(method, path, payload) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: payload ? { 'content-type': 'application/json' } : {},
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null, headers: response.headers };
  }

  return {
    baseUrl,
    store,
    request,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
