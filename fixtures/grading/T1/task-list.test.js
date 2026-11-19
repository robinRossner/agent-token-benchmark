import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderTaskList, filterTasks, sortTasks } from '../web/components/task-list.js';

const mk = (id, over = {}) => ({
  id, title: `Task ${id}`, status: 'todo', priority: 'medium', assigneeId: null,
  dueDate: '2026-03-10T00:00:00.000Z', ...over,
});
const sample = [
  mk('t_1', { status: 'done', priority: 'low', dueDate: '2026-03-20T00:00:00.000Z' }),
  mk('t_2', { status: 'todo', priority: 'high', dueDate: null }),
  mk('t_3', { status: 'in_progress', priority: 'high', dueDate: '2026-03-01T00:00:00.000Z' }),
  mk('t_4', { status: 'todo', priority: 'medium', dueDate: '2026-03-05T00:00:00.000Z' }),
  mk('t_5', { status: 'todo', priority: 'low', dueDate: '2026-03-05T00:00:00.000Z' }),
];
const idsAnyOrder = (html) => [...html.matchAll(/<li[^>]*class="tf-task-list__item"[^>]*>/g)]
  .map((m) => /data-task-id="([^"]+)"/.exec(m[0])?.[1]);

test('filterTasks filters by status and returns a new array', () => {
  assert.deepEqual(filterTasks(sample, 'todo').map((t) => t.id), ['t_2', 't_4', 't_5']);
  assert.deepEqual(filterTasks(sample, 'done').map((t) => t.id), ['t_1']);
  const all = filterTasks(sample, 'all');
  assert.equal(all.length, 5);
  assert.notEqual(all, sample);
});

test('sortTasks by dueDate puts earliest first, nulls last, stable on ties', () => {
  assert.deepEqual(sortTasks(sample, 'dueDate').map((t) => t.id), ['t_3', 't_4', 't_5', 't_1', 't_2']);
});

test('sortTasks by priority is high, medium, low and stable', () => {
  // high: t_2, t_3 ; medium: t_4 ; low: t_1, t_5 (original order inside each group)
  assert.deepEqual(sortTasks(sample, 'priority').map((t) => t.id), ['t_2', 't_3', 't_4', 't_1', 't_5']);
});

test('sortTasks does not mutate its input', () => {
  const copy = JSON.stringify(sample);
  sortTasks(sample, 'priority');
  sortTasks(sample, 'dueDate');
  assert.equal(JSON.stringify(sample), copy);
});

test('renderTaskList renders filtered and sorted items inside the required markup', () => {
  const html = renderTaskList({ tasks: sample, status: 'todo', sortBy: 'dueDate' });
  assert.match(html, /<section class="tf-task-list[ "]/);
  assert.match(html, /<ul class="tf-task-list__items">/);
  assert.deepEqual(idsAnyOrder(html), ['t_4', 't_5', 't_2']);
  assert.match(html, /tf-task-card/);
});

test('renderTaskList defaults to status all, sorted by due date', () => {
  const html = renderTaskList({ tasks: sample });
  assert.deepEqual(idsAnyOrder(html), ['t_3', 't_4', 't_5', 't_1', 't_2']);
});

test('filter and sort controls reflect the current selection', () => {
  const html = renderTaskList({ tasks: sample, status: 'in_progress', sortBy: 'priority' });
  assert.match(html, /<select[^>]*class="tf-task-list__filter"[^>]*data-action="filter-status"|<select[^>]*data-action="filter-status"[^>]*class="tf-task-list__filter"/);
  assert.match(html, /<select[^>]*class="tf-task-list__sort"[^>]*data-action="sort-tasks"|<select[^>]*data-action="sort-tasks"[^>]*class="tf-task-list__sort"/);
  for (const value of ['all', 'todo', 'in_progress', 'done', 'dueDate', 'priority']) {
    assert.match(html, new RegExp(`<option[^>]*value="${value}"`), `option ${value}`);
  }
  assert.match(html, /<option[^>]*value="in_progress"[^>]*selected|<option[^>]*selected[^>]*value="in_progress"/);
  assert.match(html, /<option[^>]*value="priority"[^>]*selected|<option[^>]*selected[^>]*value="priority"/);
  assert.doesNotMatch(html, /<option[^>]*value="todo"[^>]*selected/);
});

test('loading state', () => {
  const html = renderTaskList({ tasks: [], loading: true });
  assert.match(html, /tf-task-list--loading/);
  assert.match(html, /<p class="tf-task-list__loading">Loading tasks\.\.\.<\/p>/);
  assert.doesNotMatch(html, /tf-task-list__item/);
  const withTasks = renderTaskList({ tasks: sample, loading: true });
  assert.doesNotMatch(withTasks, /tf-task-list__item/);
});

test('empty states', () => {
  const filtered = renderTaskList({ tasks: [mk('t_1', { status: 'done' })], status: 'todo' });
  assert.match(filtered, /<p class="tf-task-list__empty">No tasks match this filter\.<\/p>/);
  assert.doesNotMatch(filtered, /<ul/);
  const none = renderTaskList({ tasks: [], status: 'all' });
  assert.match(none, /<p class="tf-task-list__empty">No tasks yet\.<\/p>/);
  assert.doesNotMatch(none, /<ul/);
});

test('user text is escaped', () => {
  const html = renderTaskList({ tasks: [mk('t_9', { title: '<img src=x onerror=alert(1)>' })] });
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img/);
});

test('page is wired up: main.js renders the list and styles exist', () => {
  const main = readFileSync(new URL('../web/main.js', import.meta.url), 'utf8');
  assert.match(main, /task-list\.js/);
  assert.match(main, /renderTaskList\(/);
  const css = readFileSync(new URL('../web/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.tf-task-list/);
});
