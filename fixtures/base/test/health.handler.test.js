import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp } from './helpers/app.js';

let app;
before(async () => { app = await startTestApp(); });
after(async () => { await app.close(); });

test('GET /api/health reports ok', async () => {
  const { status, body } = await app.request('GET', '/api/health');
  assert.equal(status, 200);
  assert.equal(body.data.status, 'ok');
});

test('unknown routes return the standard error shape', async () => {
  const { status, body } = await app.request('GET', '/api/does-not-exist');
  assert.equal(status, 404);
  assert.deepEqual(Object.keys(body.error).sort(), ['code', 'message']);
  assert.equal(body.error.code, 'NOT_FOUND');
});

test('wrong method on a known path returns 405', async () => {
  const { status, body } = await app.request('PUT', '/api/health');
  assert.equal(status, 405);
  assert.equal(body.error.code, 'METHOD_NOT_ALLOWED');
});

test('invalid JSON bodies are rejected with INVALID_JSON', async () => {
  const response = await fetch(`${app.baseUrl}/api/projects`, { method: 'POST', body: '{nope' });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'INVALID_JSON');
});
