let fixedNow = null;

/**
 * Pin the clock used by nowIso(). Pass null to use the real clock again.
 * @param {string|null} iso ISO-8601 timestamp or null
 */
export function setFixedNow(iso) {
  fixedNow = iso;
}

/**
 * Current time as an ISO-8601 string (always UTC, millisecond precision).
 * All timestamps stored by the API must come from this function.
 * @returns {string}
 */
export function nowIso() {
  return fixedNow ?? new Date(Date.now()).toISOString();
}

/**
 * True when `value` is a string that round-trips through Date as an ISO timestamp.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isIsoDate(value) {
  if (typeof value !== 'string' || value.length < 10) return false;
  const time = Date.parse(value);
  return !Number.isNaN(time);
}

/**
 * Normalise a date or date-time string to a full ISO timestamp.
 * @param {string} value
 * @returns {string}
 */
export function toIso(value) {
  return new Date(Date.parse(value)).toISOString();
}
