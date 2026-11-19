import { sendData, sendList } from '../lib/http.js';
import { notFound } from '../lib/errors.js';
import { paginate, parsePagination } from '../lib/pagination.js';

/**
 * GET /api/users - paginated list of users.
 * @param {{res: object, query: URLSearchParams, store: object}} ctx
 */
export function listUsers({ res, query, store }) {
  const { items, meta } = paginate(store.listUsers(), parsePagination(query));
  sendList(res, items, meta);
}

/**
 * GET /api/users/:id - a single user.
 * @param {{res: object, params: {id: string}, store: object}} ctx
 */
export function getUser({ res, params, store }) {
  const user = store.getUser(params.id);
  if (!user) throw notFound('User', params.id);
  sendData(res, user);
}
