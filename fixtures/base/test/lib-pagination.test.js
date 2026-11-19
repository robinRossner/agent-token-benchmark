import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMeta, paginate, parsePagination } from '../api/lib/pagination.js';
import { pageCount, pageOffset } from '../api/lib/page-math.js';

const range = (n) => Array.from({ length: n }, (_, i) => i + 1);

test('parsePagination applies defaults', () => {
  assert.deepEqual(parsePagination(new URLSearchParams('')), { page: 1, pageSize: 20 });
});

test('parsePagination reads camelCase params', () => {
  assert.deepEqual(parsePagination(new URLSearchParams('page=3&pageSize=5')), { page: 3, pageSize: 5 });
});

test('parsePagination rejects page 0 and non-numbers', () => {
  assert.throws(() => parsePagination(new URLSearchParams('page=0')), /page/);
  assert.throws(() => parsePagination(new URLSearchParams('pageSize=abc')), /pageSize/);
});

test('pageCount is at least 1 and exact for whole pages', () => {
  assert.equal(pageCount(0, 10), 1);
  assert.equal(pageCount(5, 10), 1);
  assert.equal(pageCount(30, 10), 3);
  assert.equal(pageCount(16, 10), 2);
});

test('pageOffset is zero-based', () => {
  assert.equal(pageOffset(1, 10), 0);
  assert.equal(pageOffset(4, 25), 75);
});

test('buildMeta reports totals', () => {
  const meta = buildMeta({ total: 40, page: 2, pageSize: 20 });
  assert.deepEqual(meta, { page: 2, pageSize: 20, total: 40, totalPages: 2 });
});

test('paginate slices the requested page', () => {
  const { items, meta } = paginate(range(30), { page: 2, pageSize: 10 });
  assert.deepEqual(items, range(30).slice(10, 20));
  assert.equal(meta.totalPages, 3);
});

test('paginate clamps pages past the end to the last page', () => {
  const { items, meta } = paginate(range(30), { page: 9, pageSize: 10 });
  assert.equal(meta.page, 3);
  assert.deepEqual(items, range(30).slice(20));
});

test('paginate handles empty lists', () => {
  const { items, meta } = paginate([], { page: 1, pageSize: 10 });
  assert.deepEqual(items, []);
  assert.equal(meta.totalPages, 1);
});
