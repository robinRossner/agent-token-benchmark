import { sendData, sendList, sendNoContent } from '../lib/http.js';
import { notFound, validationError } from '../lib/errors.js';
import { paginate, parsePagination } from '../lib/pagination.js';
import { validateCommentInput } from '../lib/validation.js';

/**
 * GET /api/tasks/:id/comments - paginated comments for a task, oldest first.
 * @param {{res: object, params: {id: string}, query: URLSearchParams, store: object}} ctx
 */
export function listComments({ res, params, query, store }) {
  if (!store.getTask(params.id)) throw notFound('Task', params.id);
  const { items, meta } = paginate(store.listComments(params.id), parsePagination(query));
  sendList(res, items, meta);
}

/**
 * POST /api/tasks/:id/comments - add a comment.
 * @param {{res: object, params: {id: string}, body: object, store: object}} ctx
 */
export function createComment({ res, params, body, store }) {
  if (!store.getTask(params.id)) throw notFound('Task', params.id);
  const fields = validateCommentInput(body);
  if (!store.getUser(fields.authorId)) throw validationError(`authorId ${fields.authorId} does not exist`);
  sendData(res, store.createComment({ taskId: params.id, ...fields }), 201);
}

/**
 * DELETE /api/comments/:id - delete a comment.
 * @param {{res: object, params: {id: string}, store: object}} ctx
 */
export function deleteComment({ res, params, store }) {
  if (!store.deleteComment(params.id)) throw notFound('Comment', params.id);
  sendNoContent(res);
}
