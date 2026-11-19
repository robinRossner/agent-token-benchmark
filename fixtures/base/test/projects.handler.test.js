import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp } from './helpers/app.js';

let app;
before(async () => { app = await startTestApp(); });
after(async () => { await app.close(); });

test('GET /api/projects lists seeded projects', async () => {
  const { body } = await app.request('GET', '/api/projects');
  assert.equal(body.data.length, 4);
  assert.deepEqual(body.meta, { page: 1, pageSize: 20, total: 4, totalPages: 1 });
});

test('POST /api/projects creates a project with ISO createdAt', async () => {
  const { status, body } = await app.request('POST', '/api/projects', { name: 'Roadmap', description: 'Q3' });
  assert.equal(status, 201);
  assert.match(body.data.id, /^p_\d+$/);
  assert.equal(new Date(body.data.createdAt).toISOString(), body.data.createdAt);
});

test('POST /api/projects validates the name', async () => {
  const { status, body } = await app.request('POST', '/api/projects', { name: 'x' });
  assert.equal(status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
});

test('PATCH /api/projects/:id archives a project and hides it from the default list', async () => {
  await app.request('PATCH', '/api/projects/p_2', { archived: true });
  const { body } = await app.request('GET', '/api/projects');
  assert.equal(body.data.some((project) => project.id === 'p_2'), false);
  const all = await app.request('GET', '/api/projects?includeArchived=true');
  assert.equal(all.body.data.some((project) => project.id === 'p_2'), true);
});

test('DELETE /api/projects/:id cascades to tasks and comments', async () => {
  const { status } = await app.request('DELETE', '/api/projects/p_1');
  assert.equal(status, 204);
  const tasks = await app.request('GET', '/api/tasks?projectId=p_1');
  assert.equal(tasks.body.data.length, 0);
  assert.equal(app.store.listTasks({ projectId: 'p_1' }).length, 0);
});

test('GET /api/projects/:id/export returns CSV', async () => {
  const response = await fetch(`${app.baseUrl}/api/projects/p_3/export`);
  const text = await response.text();
  assert.match(response.headers.get('content-type'), /text\/csv/);
  assert.equal(text.split('\n')[0], 'id,title,status,priority,assigneeId,dueDate');
});

test('includeArchived must be a boolean', async () => {
  const { status, body } = await app.request('GET', '/api/projects?includeArchived=maybe');
  assert.equal(status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
});
