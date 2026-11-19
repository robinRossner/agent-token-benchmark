import { validationError } from './errors.js';

/**
 * Read an optional string query parameter (trimmed; empty counts as missing).
 * @param {URLSearchParams} query
 * @param {string} name camelCase parameter name
 * @returns {string|undefined}
 */
export function getString(query, name) {
  const value = query.get(name);
  if (value === null) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * Read an optional enum query parameter and reject values outside `allowed`.
 * @param {URLSearchParams} query
 * @param {string} name
 * @param {readonly string[]} allowed
 * @returns {string|undefined}
 */
export function getEnum(query, name, allowed) {
  const value = getString(query, name);
  if (value === undefined) return undefined;
  if (!allowed.includes(value)) {
    throw validationError(`Query parameter "${name}" must be one of: ${allowed.join(', ')}`);
  }
  return value;
}

/**
 * Read an optional integer query parameter with bounds.
 * @param {URLSearchParams} query
 * @param {string} name
 * @param {{min?: number, max?: number, fallback?: number}} [options]
 * @returns {number|undefined}
 */
export function getInt(query, name, { min = 1, max = Number.MAX_SAFE_INTEGER, fallback } = {}) {
  const raw = getString(query, name);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw validationError(`Query parameter "${name}" must be an integer between ${min} and ${max}`);
  }
  return value;
}

/**
 * Read an optional boolean query parameter ("true" / "false").
 * @param {URLSearchParams} query
 * @param {string} name
 * @param {boolean} [fallback]
 * @returns {boolean}
 */
export function getBool(query, name, fallback = false) {
  const raw = getString(query, name);
  if (raw === undefined) return fallback;
  if (raw !== 'true' && raw !== 'false') {
    throw validationError(`Query parameter "${name}" must be "true" or "false"`);
  }
  return raw === 'true';
}
