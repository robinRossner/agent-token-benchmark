import { PRIORITIES, STATUSES } from './constants.js';

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
});

/**
 * Format an ISO timestamp as "Mar 5, 2026" (UTC). Returns "No date" for empty values.
 * @param {string|null|undefined} iso
 * @returns {string}
 */
export function formatDate(iso) {
  if (!iso) return 'No date';
  const time = Date.parse(iso);
  return Number.isNaN(time) ? 'Invalid date' : DATE_FORMAT.format(time);
}

/**
 * Human label for a task status value.
 * @param {string} status
 * @returns {string}
 */
export function formatStatus(status) {
  return STATUSES.find((entry) => entry.value === status)?.label ?? status;
}

/**
 * Human label for a task priority value.
 * @param {string} priority
 * @returns {string}
 */
export function formatPriority(priority) {
  return PRIORITIES.find((entry) => entry.value === priority)?.label ?? priority;
}

/**
 * Shorten text to at most `max` characters, adding an ellipsis when cut.
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
export function truncate(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

/**
 * "1 task" / "3 tasks".
 * @param {number} count
 * @param {string} singular
 * @returns {string}
 */
export function pluralize(count, singular) {
  return `${count} ${singular}${count === 1 ? '' : 's'}`;
}

/**
 * True when a due date lies before `now` and the task is not done.
 * @param {{dueDate: string|null, status: string}} task
 * @param {number} now epoch milliseconds
 * @returns {boolean}
 */
export function isOverdue(task, now) {
  if (!task.dueDate || task.status === 'done') return false;
  return Date.parse(task.dueDate) < now;
}
