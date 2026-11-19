import { STATUSES } from '../lib/constants.js';
import { pluralize } from '../lib/format.js';
import { selectTasksByStatus } from '../state/selectors.js';
import { renderTaskCard } from './task-card.js';

/**
 * Kanban-style board with one column per status.
 * @param {{tasks: object[]}} state
 * @param {{usersById?: Record<string, object>, now?: number}} [options]
 * @returns {string} HTML
 */
export function renderTaskBoard(state, options = {}) {
  const groups = selectTasksByStatus(state);
  const columns = STATUSES.map(({ value, label }) => {
    const cards = groups[value]
      .map((task) => renderTaskCard(task, { assignee: options.usersById?.[task.assigneeId], now: options.now }))
      .join('');
    return [
      `<section class="tf-board__column" data-status="${value}">`,
      `<h2 class="tf-board__heading">${label} <small>${pluralize(groups[value].length, 'task')}</small></h2>`,
      cards || '<p class="tf-board__empty">Nothing here yet.</p>',
      `</section>`,
    ].join('');
  });
  return `<div class="tf-board">${columns.join('')}</div>`;
}
