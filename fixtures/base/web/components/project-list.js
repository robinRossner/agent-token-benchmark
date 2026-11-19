import { escapeHtml } from '../lib/escape.js';

/**
 * Sidebar list of projects; the selected one is highlighted.
 * @param {{projects: object[], selectedProjectId: string|null}} state
 * @returns {string} HTML
 */
export function renderProjectList({ projects, selectedProjectId }) {
  if (projects.length === 0) return '<p class="tf-project-list__empty">No projects yet.</p>';
  const items = projects.map((project) => {
    const active = project.id === selectedProjectId ? ' tf-project-list__item--active' : '';
    return [
      `<li><button type="button" class="tf-project-list__item${active}"`,
      ` data-action="select-project" data-project-id="${escapeHtml(project.id)}">`,
      `${escapeHtml(project.name)}</button></li>`,
    ].join('');
  });
  return `<ul class="tf-project-list">${items.join('')}</ul>`;
}
