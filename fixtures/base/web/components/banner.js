import { escapeHtml } from '../lib/escape.js';

/**
 * Error banner shown at the top of the page; empty string when there is no message.
 * @param {string|null} message
 * @returns {string} HTML
 */
export function renderErrorBanner(message) {
  if (!message) return '';
  return `<div class="tf-banner tf-banner--error" role="alert">${escapeHtml(message)}</div>`;
}
