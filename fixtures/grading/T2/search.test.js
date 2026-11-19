import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { startApp } from './_lib/app.js';

let app;
before(async () => { app = await startApp(); });
after(async () => { await app.close(); });

const search = (query) => app.request('GET', `/api/tasks/search?${query}`);

/** Reference implementation computed from the plain list endpoint. */
async function expectedIds(q, filter = (task) => true) {
  const { body } = await app.request('GET', '/api/tasks?pageSize=100&sortBy=createdAt');
  const needle = q.trim().toLowerCase();
  const rows = body.data.filter(filter);
  const title = rows.filter((t) => t.title.toLowerCase().includes(needle));
  const descOnly = rows.filter((t) => !t.title.toLowerCase().includes(needle)
    && t.description.toLowerCase().includes(needle));
  return [...title, ...descOnly].map((t) => t.id);
}

test('matches titles case-insensitively with the list envelope', async () => {
  const { status, body } = await search('q=LOGIN&pageSize=100');
  assert.equal(status, 200);
  const expected = await expectedIds('login');
  assert.ok(expected.length > 3);
  assert.deepEqual(body.data.map((t) => t.id), expected);
  assert.deepEqual(body.meta, { page: 1, pageSize: 100, total: expected.length, totalPages: 1 });
  assert.equal(typeof body.data[0].projectId, 'string');
});

test('descriptions are searched too', async () => {
  const { body } = await search('q=number%207&pageSize=100');
  assert.deepEqual(body.data.map((t) => t.id), await expectedIds('number 7'));
  assert.ok(body.data.some((t) => t.id === 't_7'));
});

test('title matches come before description-only matches', async () => {
  const created = await app.request('POST', '/api/tasks', { projectId: 'p_1', title: 'Hunt number 5 bug' });
  assert.equal(created.status, 201);
  const { body } = await search('q=number%205&pageSize=100');
  assert.equal(body.data[0].id, created.body.data.id);
  assert.deepEqual(body.data.map((t) => t.id), await expectedIds('number 5'));
  await app.request('DELETE', `/api/tasks/${created.body.data.id}`);
});

test('q is trimmed', async () => {
  const a = await search('q=%20%20cache%20&pageSize=100');
  const b = await search('q=cache&pageSize=100');
  assert.deepEqual(a.body.data.map((t) => t.id), b.body.data.map((t) => t.id));
  assert.ok(b.body.data.length > 0);
});

test('pagination over 60 matches', async () => {
  const first = await search('q=number&pageSize=10');
  assert.deepEqual(first.body.meta, { page: 1, pageSize: 10, total: 60, totalPages: 6 });
  const seen = [];
  for (let page = 1; page <= 6; page += 1) {
    const { body } = await search(`q=number&pageSize=10&page=${page}`);
    assert.equal(body.data.length, 10);
    seen.push(...body.data.map((t) => t.id));
  }
  assert.deepEqual(seen, await expectedIds('number'));
  const def = await search('q=number');
  assert.equal(def.body.data.length, 20);
  assert.equal(def.body.meta.totalPages, 3);
});

test('projectId and status narrow the search', async () => {
  const { body } = await search('q=number&projectId=p_2&pageSize=100');
  assert.deepEqual(body.data.map((t) => t.id), await expectedIds('number', (t) => t.projectId === 'p_2'));
  assert.equal(body.meta.total, 15);
  const done = await search('q=number&status=done&pageSize=100');
  assert.deepEqual(done.body.data.map((t) => t.id), await expectedIds('number', (t) => t.status === 'done'));
  const both = await search('q=number&status=todo&projectId=p_1&pageSize=100');
  assert.deepEqual(
    both.body.data.map((t) => t.id),
    await expectedIds('number', (t) => t.status === 'todo' && t.projectId === 'p_1'),
  );
});

test('unknown projectId gives an empty result, not an error', async () => {
  const { status, body } = await search('q=number&projectId=p_404');
  assert.equal(status, 200);
  assert.deepEqual(body.data, []);
  assert.equal(body.meta.total, 0);
  assert.equal(body.meta.totalPages, 1);
});

test('q is a literal substring, not a regular expression', async () => {
  for (const q of ['(', '.*', '%5B', '%2B', '%25']) {
    const { status, body } = await search(`q=${q}`);
    assert.equal(status, 200, q);
    assert.deepEqual(body.data, [], q);
  }
});

test('missing, blank or oversized q is a VALIDATION_ERROR mentioning q', async () => {
  for (const query of ['', 'q=', 'q=%20%20%20', `q=${'a'.repeat(101)}`]) {
    const { status, body } = await search(query);
    assert.equal(status, 400, query);
    assert.equal(body.error.code, 'VALIDATION_ERROR', query);
    assert.match(body.error.message, /\bq\b/, query);
    assert.deepEqual(Object.keys(body.error).sort(), ['code', 'message']);
  }
  assert.equal((await search(`q=${'a'.repeat(100)}`)).status, 200);
});

test('invalid status or pagination values are rejected', async () => {
  for (const query of ['q=a&status=blocked', 'q=a&pageSize=0', 'q=a&pageSize=101', 'q=a&page=0', 'q=a&page=x']) {
    const { status, body } = await search(query);
    assert.equal(status, 400, query);
    assert.equal(body.error.code, 'VALIDATION_ERROR', query);
  }
});

test('existing routes keep working', async () => {
  const one = await app.request('GET', '/api/tasks/t_1');
  assert.equal(one.status, 200);
  assert.equal(one.body.data.id, 't_1');
  assert.equal((await app.request('GET', '/api/tasks/t_404')).status, 404);
  assert.equal((await app.request('GET', '/api/tasks?pageSize=5')).body.data.length, 5);
});

test('conventions: handler file, route table, docs, test file', () => {
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
  assert.ok(read('api/handlers/search.handler.js').length > 0);
  assert.match(read('api/routes.js'), /router\.add\('GET', '\/api\/tasks\/search'/);
  assert.match(read('docs/API.md'), /^### GET \/api\/tasks\/search\s*$/m);
  assert.ok(read('test/search.handler.test.js').includes('test('));
});
