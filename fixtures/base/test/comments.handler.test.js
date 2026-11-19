import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp } from './helpers/app.js';

let app;
before(async () => { app = await startTestApp(); });
after(async () => { await app.close(); });

test('lists comments for a task', async () => {
  const { body } = await app.request('GET', '/api/tasks/t_3/comments');
  assert.ok(body.data.length >= 1);
  assert.ok(body.data.every((comment) => comment.taskId === 't_3'));
});

test('404 when the task does not exist', async () => {
  const { status } = await app.request('GET', '/api/tasks/t_404/comments');
  assert.equal(status, 404);
});

test('creates a comment', async () => {
  const { status, body } = await app.request('POST', '/api/tasks/t_1/comments', { authorId: 'u_2', body: 'Hello' });
  assert.equal(status, 201);
  assert.equal(body.data.taskId, 't_1');
});

test('rejects empty comment bodies and unknown authors', async () => {
  const empty = await app.request('POST', '/api/tasks/t_1/comments', { authorId: 'u_2', body: '  ' });
  assert.equal(empty.status, 400);
  const unknown = await app.request('POST', '/api/tasks/t_1/comments', { authorId: 'u_99', body: 'Hi' });
  assert.equal(unknown.status, 400);
});

test('deletes a comment', async () => {
  assert.equal((await app.request('DELETE', '/api/comments/c_1')).status, 204);
  assert.equal((await app.request('DELETE', '/api/comments/c_1')).status, 404);
});
