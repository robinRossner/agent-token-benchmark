import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../web/state/store.js';
import { selectSelectedProject, selectTasksByStatus, selectUsersById } from '../web/state/selectors.js';
import { ApiClientError, createApiClient, toQueryString } from '../web/api-client.js';

test('store notifies subscribers with merged state', () => {
  const store = createStore({ a: 1, b: 2 });
  const seen = [];
  const unsubscribe = store.subscribe((state) => seen.push(state));
  store.setState({ b: 3 });
  unsubscribe();
  store.setState({ a: 9 });
  assert.deepEqual(seen, [{ a: 1, b: 3 }]);
  assert.equal(store.getState().a, 9);
});

test('selectors', () => {
  const state = {
    tasks: [{ id: 1, status: 'todo' }, { id: 2, status: 'done' }, { id: 3, status: 'todo' }],
    users: [{ id: 'u_1', name: 'Ada' }],
    projects: [{ id: 'p_1' }],
    selectedProjectId: 'p_1',
  };
  assert.equal(selectTasksByStatus(state).todo.length, 2);
  assert.equal(selectUsersById(state).u_1.name, 'Ada');
  assert.equal(selectSelectedProject(state).id, 'p_1');
});

test('toQueryString skips empty values', () => {
  assert.equal(toQueryString({ a: 1, b: '', c: undefined, d: 'x y' }), '?a=1&d=x+y');
  assert.equal(toQueryString({}), '');
});

test('api client unwraps data and surfaces API errors', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push([init.method, url]);
    if (url.includes('/boom')) {
      return { ok: false, status: 404, json: async () => ({ error: { code: 'NOT_FOUND', message: 'nope' } }) };
    }
    return { ok: true, status: 200, json: async () => ({ data: [{ id: 'p_1' }] }) };
  };
  const client = createApiClient({ baseUrl: 'http://x', fetchImpl });
  assert.deepEqual(await client.listProjects(), [{ id: 'p_1' }]);
  assert.deepEqual(calls[0], ['GET', 'http://x/api/projects?pageSize=100']);
  const failing = createApiClient({ baseUrl: 'http://x/boom', fetchImpl });
  await assert.rejects(
    () => failing.getTask('t_1'),
    (err) => err instanceof ApiClientError && err.code === 'NOT_FOUND',
  );
});
