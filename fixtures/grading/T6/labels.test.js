import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { startApp } from './_lib/app.js';

let app;
before(async () => { app = await startApp(); });
after(async () => { await app.close(); });

const post = (projectId, body) => app.request('POST', `/api/projects/${projectId}/labels`, body);
const isIso = (value) => typeof value === 'string' && new Date(value).toISOString() === value;

test('step 1: tasks carry labelIds [] by default (seeded and new)', async () => {
  const seeded = await app.request('GET', '/api/tasks/t_1');
  assert.deepEqual(seeded.body.data.labelIds, []);
  const created = await app.request('POST', '/api/tasks', { projectId: 'p_1', title: 'Plain task' });
  assert.deepEqual(created.body.data.labelIds, []);
  const list = await app.request('GET', '/api/tasks?pageSize=20');
  assert.ok(list.body.data.every((task) => Array.isArray(task.labelIds)));
});

test('step 3: create and list labels', async () => {
  const empty = await app.request('GET', '/api/projects/p_1/labels');
  assert.equal(empty.status, 200);
  assert.deepEqual(empty.body.data, []);
  assert.deepEqual(empty.body.meta, { page: 1, pageSize: 20, total: 0, totalPages: 1 });

  const bug = await post('p_1', { name: '  Bug ', color: '#FF0000' });
  assert.equal(bug.status, 201);
  assert.equal(bug.body.data.id, 'l_1');
  assert.equal(bug.body.data.name, 'Bug');
  assert.equal(bug.body.data.color, '#FF0000');
  assert.equal(bug.body.data.projectId, 'p_1');
  assert.ok(isIso(bug.body.data.createdAt));

  const feature = await post('p_1', { name: 'Feature' });
  assert.equal(feature.status, 201);
  assert.equal(feature.body.data.id, 'l_2');
  assert.equal(feature.body.data.color, '#888888');

  const other = await post('p_2', { name: 'Bug', color: '#00ff00' });
  assert.equal(other.status, 201, 'same name allowed in a different project');

  const list = await app.request('GET', '/api/projects/p_1/labels');
  assert.deepEqual(list.body.data.map((l) => l.id), ['l_1', 'l_2']);
  assert.equal(list.body.meta.total, 2);
});

test('step 2: validation and conflicts use the standard error shape', async () => {
  for (const body of [{}, { name: '' }, { name: '   ' }, { name: 'x'.repeat(31) }, { name: 5 },
    { name: 'Ok', color: 'red' }, { name: 'Ok', color: '#12345' }, { name: 'Ok', color: '#12345g' }]) {
    const { status, body: res } = await post('p_1', body);
    assert.equal(status, 400, JSON.stringify(body));
    assert.equal(res.error.code, 'VALIDATION_ERROR', JSON.stringify(body));
    assert.deepEqual(Object.keys(res.error).sort(), ['code', 'message']);
  }
  assert.equal((await post('p_1', { name: 'x'.repeat(30) })).status, 201);
  const dup = await post('p_1', { name: 'BUG' });
  assert.equal(dup.status, 409);
  assert.equal(dup.body.error.code, 'CONFLICT');
  assert.equal((await post('p_404', { name: 'Nope' })).status, 404);
  assert.equal((await app.request('GET', '/api/projects/p_404/labels')).body.error.code, 'NOT_FOUND');
});

test('step 3: patch and delete labels', async () => {
  const made = await post('p_3', { name: 'Docs', color: '#0000ff' });
  const id = made.body.data.id;
  const renamed = await app.request('PATCH', `/api/labels/${id}`, { name: 'Documentation' });
  assert.equal(renamed.status, 200);
  assert.equal(renamed.body.data.name, 'Documentation');
  assert.equal(renamed.body.data.color, '#0000ff');
  const recolored = await app.request('PATCH', `/api/labels/${id}`, { color: '#123abc', name: 'Documentation' });
  assert.equal(recolored.status, 200, 'keeping its own name is not a conflict');
  assert.equal(recolored.body.data.color, '#123abc');
  await post('p_3', { name: 'Other' });
  const clash = await app.request('PATCH', `/api/labels/${id}`, { name: 'other' });
  assert.equal(clash.status, 409);
  const invalid = await app.request('PATCH', `/api/labels/${id}`, { color: 'nope' });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.error.code, 'VALIDATION_ERROR');
  assert.equal((await app.request('PATCH', '/api/labels/l_999', { name: 'x1' })).status, 404);

  assert.equal((await app.request('DELETE', `/api/labels/${id}`)).status, 204);
  assert.equal((await app.request('DELETE', `/api/labels/${id}`)).status, 404);
});

test('step 4: assigning labels to tasks', async () => {
  const a = (await post('p_4', { name: 'Alpha' })).body.data;
  const b = (await post('p_4', { name: 'Beta' })).body.data;
  const foreign = (await post('p_1', { name: 'Foreign' })).body.data;

  const created = await app.request('POST', '/api/tasks', {
    projectId: 'p_4', title: 'Labelled task', labelIds: [a.id, b.id, a.id],
  });
  assert.equal(created.status, 201);
  assert.deepEqual(created.body.data.labelIds, [a.id, b.id]);

  const patched = await app.request('PATCH', `/api/tasks/${created.body.data.id}`, { labelIds: [b.id] });
  assert.deepEqual(patched.body.data.labelIds, [b.id]);
  const cleared = await app.request('PATCH', `/api/tasks/${created.body.data.id}`, { labelIds: [] });
  assert.deepEqual(cleared.body.data.labelIds, []);

  for (const labelIds of [[foreign.id], ['l_999'], 'l_1', [5], null]) {
    const bad = await app.request('PATCH', `/api/tasks/${created.body.data.id}`, { labelIds });
    assert.equal(bad.status, 400, JSON.stringify(labelIds));
    assert.equal(bad.body.error.code, 'VALIDATION_ERROR');
  }
  const badCreate = await app.request('POST', '/api/tasks', { projectId: 'p_4', title: 'Bad labels', labelIds: [foreign.id] });
  assert.equal(badCreate.status, 400);
});

test('step 5: filtering by labelId, combined with other filters and pagination', async () => {
  const label = (await post('p_2', { name: 'Filterable' })).body.data;
  const other = (await post('p_2', { name: 'Unused' })).body.data;
  const tasks = (await app.request('GET', '/api/projects/p_2/tasks?pageSize=100')).body.data;
  const tagged = tasks.slice(0, 7);
  for (const task of tagged) {
    await app.request('PATCH', `/api/tasks/${task.id}`, { labelIds: [label.id] });
  }

  const all = await app.request('GET', `/api/tasks?labelId=${label.id}&pageSize=100`);
  assert.deepEqual(all.body.data.map((t) => t.id).sort(), tagged.map((t) => t.id).sort());
  assert.equal(all.body.meta.total, 7);

  const pageOne = await app.request('GET', `/api/tasks?labelId=${label.id}&pageSize=4&page=1`);
  const pageTwo = await app.request('GET', `/api/tasks?labelId=${label.id}&pageSize=4&page=2`);
  assert.equal(pageOne.body.data.length, 4);
  assert.equal(pageTwo.body.data.length, 3);
  assert.equal(pageOne.body.meta.totalPages, 2);

  const scoped = await app.request('GET', `/api/projects/p_2/tasks?labelId=${label.id}&pageSize=100`);
  assert.equal(scoped.body.data.length, 7);
  const wrongProject = await app.request('GET', `/api/projects/p_1/tasks?labelId=${label.id}&pageSize=100`);
  assert.equal(wrongProject.body.data.length, 0);

  const status = tagged[0].status;
  const expected = tagged.filter((t) => t.status === status).length;
  const combo = await app.request('GET', `/api/tasks?labelId=${label.id}&status=${status}&pageSize=100`);
  assert.equal(combo.body.data.length, expected);

  const unused = await app.request('GET', `/api/tasks?labelId=${other.id}`);
  assert.deepEqual(unused.body.data, []);
  const unknown = await app.request('GET', '/api/tasks?labelId=l_9999');
  assert.equal(unknown.status, 200);
  assert.deepEqual(unknown.body.data, []);
  assert.equal(unknown.body.meta.total, 0);
});

test('deleting a label removes it from tasks; deleting a project removes its labels', async () => {
  const label = (await post('p_3', { name: 'Temporary' })).body.data;
  const task = (await app.request('POST', '/api/tasks', { projectId: 'p_3', title: 'Has temp', labelIds: [label.id] })).body.data;
  assert.deepEqual(task.labelIds, [label.id]);
  await app.request('DELETE', `/api/labels/${label.id}`);
  assert.deepEqual((await app.request('GET', `/api/tasks/${task.id}`)).body.data.labelIds, []);
  assert.equal((await app.request('GET', `/api/tasks?labelId=${label.id}`)).body.data.length, 0);

  const doomed = (await post('p_4', { name: 'Doomed' })).body.data;
  await app.request('DELETE', '/api/projects/p_4');
  assert.equal((await app.request('PATCH', `/api/labels/${doomed.id}`, { name: 'still here' })).status, 404);
});

test('step 6: renderLabelChip', async () => {
  const { renderLabelChip } = await import('../web/components/label-chip.js');
  const html = renderLabelChip({ id: 'l_1', name: 'Bug <b>', color: '#aabbcc' });
  assert.match(html, /<span class="tf-label-chip"/);
  assert.match(html, /data-label-id="l_1"/);
  assert.match(html, /background-color:#aabbcc/);
  assert.match(html, />Bug &lt;b&gt;<\/span>/);
  assert.doesNotMatch(html, /<b>/);
  const fallback = renderLabelChip({ id: 'l_2', name: 'X', color: 'url(javascript:alert(1))' });
  assert.match(fallback, /background-color:#888888/);
  assert.doesNotMatch(fallback, /javascript/);
});

test('step 6: renderTaskCard shows label chips in task order', async () => {
  const { renderTaskCard } = await import('../web/components/task-card.js');
  const task = {
    id: 't_1', title: 'Card', status: 'todo', priority: 'low', dueDate: null, assigneeId: null,
    labelIds: ['l_2', 'l_missing', 'l_1'],
  };
  const labelsById = {
    l_1: { id: 'l_1', name: 'First', color: '#111111' },
    l_2: { id: 'l_2', name: 'Second', color: '#222222' },
  };
  const html = renderTaskCard(task, { labelsById });
  assert.match(html, /<div class="tf-task-card__labels">/);
  assert.ok(html.indexOf('Second') > -1 && html.indexOf('Second') < html.indexOf('First'));
  assert.doesNotMatch(html, /l_missing/);
  assert.doesNotMatch(renderTaskCard({ ...task, labelIds: [] }, { labelsById }), /tf-task-card__labels/);
  assert.doesNotMatch(renderTaskCard(task), /tf-task-card__labels/);
  assert.doesNotMatch(renderTaskCard({ ...task, labelIds: ['l_nope'] }, { labelsById }), /tf-task-card__labels/);
  assert.match(renderTaskCard({ id: 't_9', title: 'No ids', status: 'todo', priority: 'low' }, { labelsById }), /tf-task-card/);
});

test('step 7: API client label methods', async () => {
  const { createApiClient } = await import('../web/api-client.js');
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, method: init.method, body: init.body });
    const data = init.method === 'POST' ? { id: 'l_1', name: 'Bug' } : [{ id: 'l_1' }];
    return { ok: true, status: init.method === 'POST' ? 201 : 200, json: async () => ({ data }) };
  };
  const client = createApiClient({ baseUrl: 'http://api.test', fetchImpl });
  assert.deepEqual(await client.listLabels('p_1'), [{ id: 'l_1' }]);
  assert.match(calls[0].url, /^http:\/\/api\.test\/api\/projects\/p_1\/labels/);
  assert.equal(calls[0].method, 'GET');
  assert.deepEqual(await client.createLabel('p_1', { name: 'Bug', color: '#ff0000' }), { id: 'l_1', name: 'Bug' });
  assert.equal(calls[1].method, 'POST');
  assert.deepEqual(JSON.parse(calls[1].body), { name: 'Bug', color: '#ff0000' });
});

test('step 8: docs, styles and test files exist', () => {
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
  const docs = read('docs/API.md');
  for (const heading of ['GET /api/projects/:id/labels', 'POST /api/projects/:id/labels',
    'PATCH /api/labels/:id', 'DELETE /api/labels/:id']) {
    assert.ok(docs.includes(`### ${heading}`), heading);
  }
  assert.ok(docs.includes('labelIds'), 'docs mention labelIds');
  assert.ok(docs.includes('labelId'), 'docs mention the labelId filter');
  assert.match(read('web/styles.css'), /\.tf-label-chip/);
  const tests = read('test/labels.handler.test.js');
  assert.ok((tests.match(/^\s*test\(/gm) ?? []).length >= 8, 'at least 8 label API tests');
  const otherTests = readdirSync(new URL('../test/', import.meta.url))
    .filter((f) => f.endsWith('.test.js') && f !== 'labels.handler.test.js')
    .map((f) => read(`test/${f}`))
    .join('\n');
  assert.match(otherTests, /renderLabelChip/);
  assert.match(otherTests, /listLabels/);
});
