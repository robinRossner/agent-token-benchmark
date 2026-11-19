import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouter } from '../api/router.js';

test('matches static and param routes', () => {
  const router = createRouter();
  const handler = () => {};
  router.add('GET', '/api/things/:id', handler);
  const found = router.match('GET', '/api/things/abc');
  assert.equal(found.handler, handler);
  assert.deepEqual(found.params, { id: 'abc' });
});

test('decodes percent-encoded params', () => {
  const router = createRouter();
  router.add('GET', '/api/things/:id', () => {});
  assert.deepEqual(router.match('GET', '/api/things/a%20b%2Fc').params, { id: 'a b/c' });
});

test('static segments win over params', () => {
  const router = createRouter();
  const byId = () => 'id';
  const search = () => 'search';
  router.add('GET', '/api/things/:id', byId);
  router.add('GET', '/api/things/search', search);
  assert.equal(router.match('GET', '/api/things/search').handler, search);
});

test('reports allowed methods for known paths', () => {
  const router = createRouter();
  router.add('GET', '/api/things', () => {});
  router.add('POST', '/api/things', () => {});
  assert.deepEqual(router.match('DELETE', '/api/things').allowed.sort(), ['GET', 'POST']);
});

test('returns null for unknown paths', () => {
  assert.equal(createRouter().match('GET', '/nope'), null);
});

test('lists registered routes', () => {
  const router = createRouter();
  router.add('GET', '/a/:id', () => {});
  assert.deepEqual(router.routes(), ['GET /a/:id']);
});
