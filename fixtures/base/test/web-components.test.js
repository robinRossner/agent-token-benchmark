import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderTaskCard } from '../web/components/task-card.js';
import { renderTaskBoard } from '../web/components/task-board.js';
import { renderProjectList } from '../web/components/project-list.js';
import { renderCommentList } from '../web/components/comment-list.js';
import { renderPager } from '../web/components/pager.js';
import { renderUserBadge } from '../web/components/user-badge.js';
import { renderErrorBanner } from '../web/components/banner.js';

const task = (overrides = {}) => ({
  id: 't_1', title: 'Write <b>docs</b>', status: 'todo', priority: 'high',
  dueDate: '2026-03-05T00:00:00.000Z', assigneeId: 'u_1', ...overrides,
});

test('task card escapes titles and shows priority and due date', () => {
  const html = renderTaskCard(task());
  assert.match(html, /Write &lt;b&gt;docs&lt;\/b&gt;/);
  assert.match(html, /tf-priority--high/);
  assert.match(html, /Mar 5, 2026/);
  assert.match(html, /data-task-id="t_1"/);
});

test('task card marks overdue tasks when given a clock', () => {
  const html = renderTaskCard(task(), { now: Date.parse('2026-04-01T00:00:00.000Z') });
  assert.match(html, /tf-task-card--overdue/);
  assert.doesNotMatch(renderTaskCard(task()), /tf-task-card--overdue/);
});

test('task board groups by status and shows empty columns', () => {
  const html = renderTaskBoard({ tasks: [task(), task({ id: 't_2', status: 'done' })] });
  assert.equal((html.match(/tf-board__column/g) ?? []).length, 3);
  assert.match(html, /1 task/);
  assert.match(html, /Nothing here yet/);
});

test('project list highlights the selection', () => {
  const projects = [{ id: 'p_1', name: 'A' }, { id: 'p_2', name: 'B' }];
  const html = renderProjectList({ projects, selectedProjectId: 'p_2' });
  assert.equal((html.match(/--active/g) ?? []).length, 1);
  assert.match(renderProjectList({ projects: [], selectedProjectId: null }), /No projects yet/);
});

test('comment list resolves authors', () => {
  const html = renderCommentList({
    comments: [{ id: 'c_1', authorId: 'u_1', body: 'Hi', createdAt: '2026-03-05T00:00:00.000Z' }],
    usersById: { u_1: { name: 'Ada' } },
  });
  assert.match(html, /<strong>Ada<\/strong>/);
});

test('pager disables buttons at the edges', () => {
  assert.match(renderPager({ page: 1, totalPages: 3 }), /prev-page"\s*disabled/);
  assert.match(renderPager({ page: 3, totalPages: 3 }), /next-page"\s*disabled/);
  assert.match(renderPager({ page: 2, totalPages: 3 }), /Page 2 of 3/);
});

test('user badge and banner', () => {
  assert.match(renderUserBadge(null), /Unassigned/);
  assert.match(renderUserBadge({ name: 'ada' }), />A</);
  assert.equal(renderErrorBanner(null), '');
  assert.match(renderErrorBanner('<oops>'), /&lt;oops&gt;/);
});
