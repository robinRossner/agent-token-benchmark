/**
 * Previous / next controls with a "Page x of y" label.
 * @param {{page: number, totalPages: number}} input
 * @returns {string} HTML
 */
export function renderPager({ page, totalPages }) {
  const prev = page <= 1 ? ' disabled' : '';
  const next = page >= totalPages ? ' disabled' : '';
  return [
    '<nav class="tf-pager">',
    `<button type="button" class="tf-pager__button" data-action="prev-page"${prev}>Previous</button>`,
    `<span class="tf-pager__label">Page ${page} of ${totalPages}</span>`,
    `<button type="button" class="tf-pager__button" data-action="next-page"${next}>Next</button>`,
    '</nav>',
  ].join('');
}
