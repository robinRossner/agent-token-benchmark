import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, allIds } from './_lib/app.js';

let app;
before(async () => { app = await startApp(); });
after(async () => { await app.close(); });

async function walk(query, pageSize) {
  const first = await app.request('GET', `/api/tasks?${query}&pageSize=${pageSize}&page=1`);
  const seen = [];
  for (let page = 1; page <= first.body.meta.totalPages; page += 1) {
    const { body } = await app.request('GET', `/api/tasks?${query}&pageSize=${pageSize}&page=${page}`);
    seen.push(...body.data.map((task) => task.id));
  }
  return { seen, meta: first.body.meta };
}

test('paging through a filtered list (status=done, 21 tasks) reaches every task', async () => {
  const expected = await allIds(app, 'status=done');
  assert.equal(expected.length, 21);
  const { seen, meta } = await walk('status=done', 10);
  assert.equal(meta.totalPages, 3);
  assert.deepEqual(seen, expected);
});

test('the last page of a filtered list contains the remaining task', async () => {
  const { body } = await app.request('GET', '/api/tasks?status=done&pageSize=10&page=3');
  assert.equal(body.meta.page, 3);
  assert.equal(body.data.length, 1);
});

test('default page size: 21 filtered tasks need two pages', async () => {
  const { body } = await app.request('GET', '/api/tasks?status=done');
  assert.equal(body.meta.totalPages, 2);
  assert.equal(body.meta.total, 21);
  const page2 = await app.request('GET', '/api/tasks?status=done&page=2');
  assert.equal(page2.body.data.length, 1);
});

test('project-scoped list (15 tasks, pageSize 12) has a second page', async () => {
  const { body } = await app.request('GET', '/api/projects/p_1/tasks?pageSize=12&page=2');
  assert.equal(body.meta.totalPages, 2);
  assert.equal(body.data.length, 3);
});

test('totalPages is the ceiling of total / pageSize for many combinations', async () => {
  for (const [query, size] of [['priority=high', 4], ['priority=low', 7], ['assigneeId=u_1', 3], ['status=todo', 6]]) {
    const total = (await allIds(app, query)).length;
    const { seen, meta } = await walk(query, size);
    assert.equal(meta.totalPages, Math.ceil(total / size), `${query} size ${size}`);
    assert.equal(seen.length, total, `${query} size ${size} reached every task`);
    assert.equal(new Set(seen).size, total);
  }
});

test('unfiltered pagination and empty results still behave', async () => {
  const { seen, meta } = await walk('', 20);
  assert.equal(meta.totalPages, 3);
  assert.equal(seen.length, 60);
  const empty = await app.request('GET', '/api/tasks?projectId=p_404');
  assert.equal(empty.body.meta.totalPages, 1);
  assert.deepEqual(empty.body.data, []);
});
