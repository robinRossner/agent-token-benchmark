import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../api/store.js';
import { buildSeed } from '../api/seed.js';
import { createLogger, setLogLevel, setLogSink } from '../api/lib/logger.js';
import { createRateLimiter } from '../api/lib/rate-limit.js';
import { idNumber } from '../api/lib/ids.js';

test('seed is deterministic and sized as documented', () => {
  const a = buildSeed();
  const b = buildSeed();
  assert.deepEqual(a, b);
  assert.equal(a.tasks.length, 60);
  assert.equal(a.users.length, 5);
  assert.equal(a.projects.length, 4);
});

test('seed tasks reference existing projects and users', () => {
  const seed = buildSeed();
  const projectIds = new Set(seed.projects.map((project) => project.id));
  const userIds = new Set(seed.users.map((user) => user.id));
  for (const task of seed.tasks) {
    assert.ok(projectIds.has(task.projectId), `${task.id} has unknown project`);
    assert.ok(task.assigneeId === null || userIds.has(task.assigneeId), `${task.id} has unknown assignee`);
  }
});

test('stores are independent copies of the seed', () => {
  const seed = buildSeed();
  const one = createStore(seed);
  const two = createStore(seed);
  one.deleteTask('t_1');
  assert.equal(one.listTasks().length, 59);
  assert.equal(two.listTasks().length, 60);
});

test('new ids continue after the seeded ones', () => {
  const store = createStore(buildSeed());
  assert.equal(store.createTask({ projectId: 'p_1', title: 'x' }).id, 't_61');
  assert.equal(idNumber('t_61'), 61);
});

test('listTasks sorts by createdAt by default and breaks ties by id', () => {
  const ids = createStore(buildSeed()).listTasks().map((task) => task.id);
  assert.deepEqual(ids.slice(0, 3), ['t_1', 't_2', 't_3']);
});

test('assigneeId=none matches unassigned tasks', () => {
  const rows = createStore(buildSeed()).listTasks({ assigneeId: 'none' });
  assert.equal(rows.length, 8);
});

test('logger respects level and sink', () => {
  const lines = [];
  setLogSink((line) => lines.push(line));
  setLogLevel('warn');
  const log = createLogger('test');
  log.info('hidden');
  log.warn('shown', { id: 1 });
  setLogLevel('silent');
  assert.equal(lines.length, 1);
  assert.equal(JSON.parse(lines[0]).message, 'shown');
});

test('rate limiter blocks after the limit and resets after the window', () => {
  let time = 0;
  const check = createRateLimiter({ limit: 2, windowMs: 100, now: () => time });
  assert.equal(check('a').allowed, true);
  assert.equal(check('a').allowed, true);
  assert.equal(check('a').allowed, false);
  time = 150;
  assert.equal(check('a').allowed, true);
});
