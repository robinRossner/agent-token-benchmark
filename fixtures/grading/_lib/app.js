// Hidden-test helper: starts the API from the run directory on an ephemeral port.
import { createApp } from '../../api/server.js';
import { createStore } from '../../api/store.js';
import { buildSeed } from '../../api/seed.js';
import { setLogLevel } from '../../api/lib/logger.js';

setLogLevel('silent');

export async function startApp() {
  const store = createStore(buildSeed());
  const server = createApp({ store });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  async function request(method, path, payload) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: payload ? { 'content-type': 'application/json' } : {},
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    return { status: response.status, body };
  }
  return { store, request, close: () => new Promise((resolve) => server.close(resolve)) };
}

/** Fetch every task id for a query by requesting one big page. */
export async function allIds(app, query) {
  const { body } = await app.request('GET', `/api/tasks?${query}&pageSize=100`);
  return body.data.map((task) => task.id);
}
