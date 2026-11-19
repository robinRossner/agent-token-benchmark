import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCommentInput, validateProjectInput, validateTaskInput } from '../api/lib/validation.js';
import { getBool, getEnum, getInt, getString } from '../api/lib/query.js';
import { ApiError, toErrorBody, validationError } from '../api/lib/errors.js';
import { csvCell, toCsv } from '../api/lib/csv.js';
import { isIsoDate, nowIso, setFixedNow } from '../api/lib/dates.js';

test('task titles are trimmed and length checked', () => {
  assert.equal(validateTaskInput({ projectId: 'p_1', title: '  Fix it  ' }).title, 'Fix it');
  assert.throws(() => validateTaskInput({ projectId: 'p_1', title: 'ab' }), /title/);
  assert.throws(() => validateTaskInput({ projectId: 'p_1', title: '   ' }), /title/);
});

test('task enums are validated', () => {
  assert.throws(() => validateTaskInput({ projectId: 'p_1', title: 'Valid', status: 'blocked' }), /status/);
  assert.throws(() => validateTaskInput({ projectId: 'p_1', title: 'Valid', priority: 'urgent' }), /priority/);
});

test('partial task validation only checks provided fields', () => {
  assert.deepEqual(validateTaskInput({ status: 'done' }, { partial: true }), { status: 'done' });
});

test('dueDate is normalised to an ISO timestamp', () => {
  const out = validateTaskInput({ projectId: 'p_1', title: 'Dated', dueDate: '2026-04-01' });
  assert.equal(out.dueDate, '2026-04-01T00:00:00.000Z');
  assert.throws(() => validateTaskInput({ projectId: 'p_1', title: 'Dated', dueDate: 'tomorrow' }), /dueDate/);
});

test('project and comment validation', () => {
  assert.deepEqual(validateProjectInput({ name: 'Alpha' }), { name: 'Alpha', description: '' });
  assert.throws(() => validateProjectInput({ archived: 'yes', name: 'Alpha' }), /archived/);
  assert.throws(() => validateCommentInput({ authorId: 'u_1', body: '' }), /body/);
});

test('query helpers', () => {
  const query = new URLSearchParams('name=%20Bob%20&n=7&flag=true&kind=a');
  assert.equal(getString(query, 'name'), 'Bob');
  assert.equal(getString(query, 'missing'), undefined);
  assert.equal(getInt(query, 'n', { max: 10 }), 7);
  assert.throws(() => getInt(query, 'n', { max: 5 }), /between/);
  assert.equal(getBool(query, 'flag'), true);
  assert.equal(getEnum(query, 'kind', ['a', 'b']), 'a');
  assert.throws(() => getEnum(query, 'kind', ['x']), /one of/);
});

test('error helpers build the standard body', () => {
  const err = validationError('bad');
  assert.ok(err instanceof ApiError);
  assert.deepEqual(toErrorBody(err), { error: { code: 'VALIDATION_ERROR', message: 'bad' } });
});

test('csv quoting', () => {
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(toCsv([{ a: 1, b: null }], ['a', 'b']), 'a,b\n1,\n');
});

test('dates', () => {
  setFixedNow('2026-01-01T00:00:00.000Z');
  assert.equal(nowIso(), '2026-01-01T00:00:00.000Z');
  setFixedNow(null);
  assert.equal(isIsoDate(nowIso()), true);
  assert.equal(isIsoDate('nope'), false);
});
