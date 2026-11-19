/**
 * Split a path into non-empty segments.
 * @param {string} path
 * @returns {string[]}
 */
function segmentsOf(path) {
  return path.split('/').filter(Boolean);
}

/**
 * Create a tiny router. Static segments win over `:param` segments, so
 * `/api/tasks/search` is never captured by `/api/tasks/:id`.
 * @returns {{add: Function, match: Function, routes: Function}}
 */
export function createRouter() {
  const entries = [];

  return {
    /**
     * Register a handler for a method and path pattern such as /api/tasks/:id.
     * @param {string} method
     * @param {string} pattern
     * @param {(ctx: object) => Promise<void>|void} handler
     */
    add(method, pattern, handler) {
      entries.push({ method, pattern, segments: segmentsOf(pattern), handler });
    },

    /**
     * Find the best route for a request.
     * @param {string} method
     * @param {string} pathname
     * @returns {{handler: Function, params: object}|{allowed: string[]}|null}
     */
    match(method, pathname) {
      const parts = segmentsOf(pathname);
      const allowed = new Set();
      let best = null;
      for (const entry of entries) {
        if (entry.segments.length !== parts.length) continue;
        const params = {};
        let statics = 0;
        const ok = entry.segments.every((segment, index) => {
          if (segment.startsWith(':')) {
            params[segment.slice(1)] = decodeURIComponent(parts[index]);
            return true;
          }
          if (segment === parts[index]) {
            statics += 1;
            return true;
          }
          return false;
        });
        if (!ok) continue;
        allowed.add(entry.method);
        if (entry.method === method && (!best || statics > best.statics)) best = { entry, params, statics };
      }
      if (best) return { handler: best.entry.handler, params: best.params };
      if (allowed.size > 0) return { allowed: [...allowed] };
      return null;
    },

    /**
     * List registered routes as "METHOD pattern" strings.
     * @returns {string[]}
     */
    routes: () => entries.map((entry) => `${entry.method} ${entry.pattern}`),
  };
}
