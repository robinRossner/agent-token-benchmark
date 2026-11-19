import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp } from './helpers/app.js';

let app;
before(async () => { app = await startTestApp(); });
after(async () => { await app.close(); });

test('GET /api/tasks returns the first page of the 60 seeded tasks', async () => {
  const { status, body } = await app.request('GET', '/api/tasks');
  assert.equal(status, 200);
  assert.equal(body.data.length, 20);
  assert.deepEqual(body.meta, { page: 1, pageSize: 20, total: 60, totalPages: 3 });
});

test('pagination walks all 60 tasks without duplicates', async () => {
  const seen = new Set();
  for (let page = 1; page <= 6; page += 1) {
    const { body } = await app.request('GET', `/api/tasks?page=${page}&pageSize=10`);
    for (const task of body.data) seen.add(task.id);
  }
  assert.equal(seen.size, 60);
});

test('pageSize above the maximum is rejected', async () => {
  const { status, body } = await app.request('GET', '/api/tasks?pageSize=500');
  assert.equal(status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
});

test('filters by status', async () => {
  const { body } = await app.request('GET', '/api/tasks?status=in_progress&pageSize=50');
  assert.equal(body.data.length, 20);
  assert.ok(body.data.every((task) => task.status === 'in_progress'));
});

test('filters by project and priority together', async () => {
  const { body } = await app.request('GET', '/api/tasks?projectId=p_2&priority=high&pageSize=50');
  assert.ok(body.data.length > 0);
  assert.ok(body.data.every((task) => task.projectId === 'p_2' && task.priority === 'high'));
});

test('unknown status value is rejected', async () => {
  const { status, body } = await app.request('GET', '/api/tasks?status=blocked');
  assert.equal(status, 400);
  assert.match(body.error.message, /status/);
});

test('sorts by priority descending-rank (high first)', async () => {
  const { body } = await app.request('GET', '/api/tasks?sortBy=priority&pageSize=5');
  assert.deepEqual(body.data.map((task) => task.priority), ['high', 'high', 'high', 'high', 'high']);
});

test('sorts by dueDate with missing dates last', async () => {
  const { body } = await app.request('GET', '/api/tasks?sortBy=dueDate&sortDir=desc&pageSize=50');
  const dates = body.data.map((task) => task.dueDate).filter(Boolean);
  assert.deepEqual(dates, [...dates].sort().reverse());
});

test('GET /api/projects/:id/tasks scopes to one project', async () => {
  const { body } = await app.request('GET', '/api/projects/p_3/tasks?pageSize=50');
  assert.equal(body.data.length, 15);
  assert.ok(body.data.every((task) => task.projectId === 'p_3'));
});

test('POST /api/tasks creates a task with defaults', async () => {
  const { status, body } = await app.request('POST', '/api/tasks', { projectId: 'p_1', title: 'Write docs' });
  assert.equal(status, 201);
  assert.equal(body.data.status, 'todo');
  assert.equal(body.data.priority, 'medium');
  assert.equal(body.data.assigneeId, null);
});

test('POST /api/tasks rejects an unknown project', async () => {
  const { status, body } = await app.request('POST', '/api/tasks', { projectId: 'p_77', title: 'Orphan' });
  assert.equal(status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
});

test('PATCH /api/tasks/:id updates fields and bumps updatedAt', async () => {
  const before = await app.request('GET', '/api/tasks/t_5');
  const { body } = await app.request('PATCH', '/api/tasks/t_5', { status: 'done', dueDate: null });
  assert.equal(body.data.status, 'done');
  assert.equal(body.data.dueDate, null);
  assert.notEqual(body.data.updatedAt, before.body.data.updatedAt);
});

test('DELETE /api/tasks/:id removes the task', async () => {
  assert.equal((await app.request('DELETE', '/api/tasks/t_6')).status, 204);
  assert.equal((await app.request('GET', '/api/tasks/t_6')).status, 404);
});
