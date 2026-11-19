import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, formatPriority, formatStatus, isOverdue, pluralize, truncate } from '../web/lib/format.js';
import { escapeHtml } from '../web/lib/escape.js';
import { loadPreference, savePreference } from '../web/lib/utils.js';

test('formatDate renders UTC dates', () => {
  assert.equal(formatDate('2026-03-05T23:30:00.000Z'), 'Mar 5, 2026');
  assert.equal(formatDate(null), 'No date');
  assert.equal(formatDate('garbage'), 'Invalid date');
});

test('status and priority labels', () => {
  assert.equal(formatStatus('in_progress'), 'In progress');
  assert.equal(formatPriority('high'), 'High');
  assert.equal(formatStatus('weird'), 'weird');
});

test('truncate adds an ellipsis only when needed', () => {
  assert.equal(truncate('short', 10), 'short');
  assert.equal(truncate('exactly10!', 10), 'exactly10!');
  assert.equal(truncate('this is far too long', 10), 'this is f…');
});

test('pluralize', () => {
  assert.equal(pluralize(1, 'task'), '1 task');
  assert.equal(pluralize(0, 'task'), '0 tasks');
});

test('isOverdue ignores done tasks and missing dates', () => {
  const now = Date.parse('2026-03-01T00:00:00.000Z');
  assert.equal(isOverdue({ dueDate: '2026-02-01T00:00:00.000Z', status: 'todo' }, now), true);
  assert.equal(isOverdue({ dueDate: '2026-02-01T00:00:00.000Z', status: 'done' }, now), false);
  assert.equal(isOverdue({ dueDate: null, status: 'todo' }, now), false);
});

test('escapeHtml escapes all five characters', () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  assert.equal(escapeHtml(null), '');
});

test('preferences fall back when storage is unavailable', () => {
  assert.equal(loadPreference('missing', 'fallback'), 'fallback');
  savePreference('anything', 1);
});
