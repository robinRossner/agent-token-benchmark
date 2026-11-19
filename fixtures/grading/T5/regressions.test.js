import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { validateTaskInput, validateCommentInput, validateProjectInput } from '../api/lib/validation.js';
import { truncate } from '../web/lib/format.js';
import { createRouter } from '../api/router.js';
import { buildSeed } from '../api/seed.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('validation trims before checking lengths', () => {
  assert.throws(() => validateTaskInput({ projectId: 'p_1', title: '   ' }), /title/);
  assert.throws(() => validateTaskInput({ projectId: 'p_1', title: ' ab ' }), /title/);
  assert.throws(() => validateCommentInput({ authorId: 'u_1', body: '   ' }), /body/);
  assert.throws(() => validateProjectInput({ name: ' x ' }), /name/);
  assert.equal(validateTaskInput({ projectId: 'p_1', title: '  Fix it  ' }).title, 'Fix it');
});

test('truncate leaves text of exactly max length alone', () => {
  assert.equal(truncate('exactly10!', 10), 'exactly10!');
  assert.equal(truncate('12345678901', 10), '123456789…');
  assert.equal(truncate('', 5), '');
});

test('router decodes percent-encoded params', () => {
  const router = createRouter();
  router.add('GET', '/api/things/:id', () => {});
  assert.deepEqual(router.match('GET', '/api/things/a%20b%2Fc').params, { id: 'a b/c' });
});

test('seed data is consistent: 60 tasks, 15 per project, all referencing real projects', () => {
  const seed = buildSeed();
  const ids = new Set(seed.projects.map((p) => p.id));
  assert.equal(seed.tasks.length, 60);
  assert.ok(seed.tasks.every((t) => ids.has(t.projectId)));
  for (const id of ids) assert.equal(seed.tasks.filter((t) => t.projectId === id).length, 15);
  const t37 = seed.tasks.find((t) => t.id === 't_37');
  assert.equal(t37.projectId, 'p_4');
});

test('no console output in comments handler, and no unprefixed CSS classes', () => {
  assert.doesNotMatch(read('api/handlers/comments.handler.js'), /console\./);
  assert.doesNotMatch(read('web/styles.css'), /\.board-empty/);
  assert.match(read('web/styles.css'), /\.tf-board__empty/);
});

test('export endpoint is documented and still registered', () => {
  assert.match(read('docs/API.md'), /^### GET \/api\/projects\/:id\/export\s*$/m);
  assert.match(read('api/routes.js'), /\/api\/projects\/:id\/export/);
});

test('visible test suite was not weakened', () => {
  const dir = new URL('../test/', import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith('.test.js'));
  const count = files.reduce((n, f) => n + (readFileSync(new URL(f, dir), 'utf8').match(/^\s*test\(/gm) ?? []).length, 0);
  assert.ok(files.length >= 12, `expected >= 12 test files, found ${files.length}`);
  assert.ok(count >= 82, `expected >= 82 tests, found ${count}`);
  const lintHash = createHash('sha256').update(readFileSync(new URL('../scripts/lint.js', import.meta.url))).digest('hex');
  assert.equal(lintHash, '32cbac0e7bffad523d0c8017c458c3fcc177d160bb15cf9fe1002181c733af84', 'scripts/lint.js must stay unchanged');
});
