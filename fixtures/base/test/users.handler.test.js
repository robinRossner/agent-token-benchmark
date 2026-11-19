import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp } from './helpers/app.js';

let app;
before(async () => { app = await startTestApp(); });
after(async () => { await app.close(); });

test('GET /api/users lists the seeded users', async () => {
  const { status, body } = await app.request('GET', '/api/users');
  assert.equal(status, 200);
  assert.equal(body.data.length, 5);
  assert.equal(body.meta.total, 5);
});

test('GET /api/users/:id returns one user', async () => {
  const { body } = await app.request('GET', '/api/users/u_1');
  assert.equal(body.data.name, 'Ada Lovelace');
});

test('GET /api/users/:id returns 404 for unknown ids', async () => {
  const { status, body } = await app.request('GET', '/api/users/u_999');
  assert.equal(status, 404);
  assert.equal(body.error.code, 'NOT_FOUND');
});
