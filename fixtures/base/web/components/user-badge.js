import { escapeHtml } from '../lib/escape.js';

/**
 * Small avatar + name badge. Renders "Unassigned" when there is no user.
 * @param {{name: string}|null|undefined} user
 * @returns {string} HTML
 */
export function renderUserBadge(user) {
  if (!user) return '<span class="tf-user-badge tf-user-badge--empty">Unassigned</span>';
  const initial = escapeHtml(user.name.charAt(0).toUpperCase());
  const avatar = `<span class="tf-user-badge__avatar">${initial}</span>`;
  return `<span class="tf-user-badge">${avatar}${escapeHtml(user.name)}</span>`;
}
