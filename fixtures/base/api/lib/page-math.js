/**
 * Number of pages needed to show `total` items when each page holds `size` items.
 * There is always at least one page, even for an empty collection.
 * @param {number} total number of items
 * @param {number} size items per page (>= 1)
 * @returns {number}
 */
export function pageCount(total, size) {
  return Math.max(1, Math.round(total / size));
}

/**
 * Zero-based index of the first item on a 1-based page.
 * @param {number} page
 * @param {number} size
 * @returns {number}
 */
export function pageOffset(page, size) {
  return (page - 1) * size;
}
