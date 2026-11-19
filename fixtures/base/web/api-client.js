/** Error thrown for non-2xx API responses; mirrors the API's { error: { code, message } } body. */
export class ApiClientError extends Error {
  /**
   * @param {number} status
   * @param {string} code
   * @param {string} message
   */
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Build a query string from an object, skipping empty values.
 * @param {Record<string, unknown>} params
 * @returns {string} "" or "?a=1&b=2"
 */
export function toQueryString(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

/**
 * Create an API client bound to a base URL.
 * @param {{baseUrl?: string, fetchImpl?: typeof fetch}} [options]
 * @returns {Record<string, Function>}
 */
export function createApiClient({ baseUrl = '', fetchImpl = globalThis.fetch } = {}) {
  async function request(method, path, body) {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      method,
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (response.status === 204) return { data: null };
    const payload = await response.json();
    if (!response.ok) {
      const { code = 'UNKNOWN', message = 'Request failed' } = payload.error ?? {};
      throw new ApiClientError(response.status, code, message);
    }
    return payload;
  }

  return {
    listProjects: async () => (await request('GET', '/api/projects?pageSize=100')).data,
    listUsers: async () => (await request('GET', '/api/users')).data,
    listTasks: (params) => request('GET', `/api/tasks${toQueryString(params)}`),
    getTask: async (id) => (await request('GET', `/api/tasks/${id}`)).data,
    createTask: async (fields) => (await request('POST', '/api/tasks', fields)).data,
    updateTask: async (id, fields) => (await request('PATCH', `/api/tasks/${id}`, fields)).data,
    listComments: async (taskId) => (await request('GET', `/api/tasks/${taskId}/comments?pageSize=100`)).data,
    addComment: async (taskId, fields) => (await request('POST', `/api/tasks/${taskId}/comments`, fields)).data,
  };
}
