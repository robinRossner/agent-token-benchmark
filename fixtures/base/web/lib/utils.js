/**
 * Delay calls to `fn` until `wait` ms have passed without another call.
 * @param {Function} fn
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(fn, wait) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Read a JSON value from localStorage, returning `fallback` on any problem.
 * @param {string} key
 * @param {unknown} fallback
 * @returns {unknown}
 */
export function loadPreference(key, fallback) {
  try {
    const raw = globalThis.localStorage?.getItem(`tf:${key}`);
    return raw === null || raw === undefined ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Persist a JSON value in localStorage (silently ignored when unavailable).
 * @param {string} key
 * @param {unknown} value
 */
export function savePreference(key, value) {
  try {
    globalThis.localStorage?.setItem(`tf:${key}`, JSON.stringify(value));
  } catch {
    // storage unavailable; preferences are optional
  }
}
