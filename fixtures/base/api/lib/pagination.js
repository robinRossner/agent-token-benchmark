import { getInt } from './query.js';
import { pageCount, pageOffset } from './page-math.js';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Read `page` and `pageSize` from the query string, applying defaults and bounds.
 * @param {URLSearchParams} query
 * @returns {{page: number, pageSize: number}}
 */
export function parsePagination(query) {
  return {
    page: getInt(query, 'page', { min: 1, fallback: 1 }),
    pageSize: getInt(query, 'pageSize', { min: 1, max: MAX_PAGE_SIZE, fallback: DEFAULT_PAGE_SIZE }),
  };
}

/**
 * Build the `meta` block returned with every list response.
 * @param {{total: number, page: number, pageSize: number}} input
 * @returns {{page: number, pageSize: number, total: number, totalPages: number}}
 */
export function buildMeta({ total, page, pageSize }) {
  return { page, pageSize, total, totalPages: pageCount(total, pageSize) };
}

/**
 * Slice `items` for the requested page. A page beyond the last one is clamped
 * to the last page so clients always receive a non-empty page when data exists.
 * @param {unknown[]} items the full (already filtered and sorted) list
 * @param {{page: number, pageSize: number}} pagination
 * @returns {{items: unknown[], meta: ReturnType<typeof buildMeta>}}
 */
export function paginate(items, { page, pageSize }) {
  const totalPages = pageCount(items.length, pageSize);
  const current = Math.min(page, totalPages);
  const start = pageOffset(current, pageSize);
  return {
    items: items.slice(start, start + pageSize),
    meta: buildMeta({ total: items.length, page: current, pageSize }),
  };
}
