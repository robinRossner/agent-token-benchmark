import { escapeHtml } from '../lib/escape.js';
import { formatDate, formatPriority, isOverdue, truncate } from '../lib/format.js';
import { renderUserBadge } from './user-badge.js';

/**
 * Card for one task. `options.assignee` is the resolved user object (or undefined),
 * `options.now` is the epoch ms used for overdue detection.
 * @param {object} task
 * @param {{assignee?: object, now?: number}} [options]
 * @returns {string} HTML
 */
export function renderTaskCard(task, options = {}) {
  const overdue = isOverdue(task, options.now ?? 0) ? ' tf-task-card--overdue' : '';
  return [
    `<article class="tf-task-card${overdue}" data-task-id="${escapeHtml(task.id)}">`,
    `<h3 class="tf-task-card__title">${escapeHtml(truncate(task.title, 60))}</h3>`,
    `<p class="tf-task-card__meta">`,
    `<span class="tf-task-card__priority tf-priority--${escapeHtml(task.priority)}">`,
    `${formatPriority(task.priority)}</span>`,
    `<span class="tf-task-card__due">${formatDate(task.dueDate)}</span>`,
    `</p>`,
    renderUserBadge(options.assignee),
    `</article>`,
  ].join('');
}
