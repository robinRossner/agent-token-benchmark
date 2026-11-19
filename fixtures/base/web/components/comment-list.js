import { escapeHtml } from '../lib/escape.js';
import { formatDate } from '../lib/format.js';

/**
 * Comments for a task, oldest first.
 * @param {{comments: object[], usersById: Record<string, object>}} input
 * @returns {string} HTML
 */
export function renderCommentList({ comments, usersById }) {
  if (comments.length === 0) return '<p class="tf-comments__empty">No comments yet.</p>';
  const items = comments.map((comment) => {
    const author = usersById[comment.authorId]?.name ?? 'Unknown';
    return [
      `<li class="tf-comments__item" data-comment-id="${escapeHtml(comment.id)}">`,
      `<strong>${escapeHtml(author)}</strong> <time>${formatDate(comment.createdAt)}</time>`,
      `<p>${escapeHtml(comment.body)}</p></li>`,
    ].join('');
  });
  return `<ul class="tf-comments">${items.join('')}</ul>`;
}
