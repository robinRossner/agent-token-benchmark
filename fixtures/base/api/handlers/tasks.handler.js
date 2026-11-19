import { sendData, sendList, sendNoContent } from '../lib/http.js';
import { notFound, validationError } from '../lib/errors.js';
import { getEnum, getString } from '../lib/query.js';
import { paginate, parsePagination } from '../lib/pagination.js';
import { TASK_PRIORITIES, TASK_STATUSES, validateTaskInput } from '../lib/validation.js';
import { logger } from '../lib/logger.js';

const SORT_FIELDS = ['createdAt', 'dueDate', 'priority', 'title'];
const SORT_DIRECTIONS = ['asc', 'desc'];

/**
 * Look up a task or throw a 404.
 * @param {object} store
 * @param {string} id
 * @returns {object}
 */
function requireTask(store, id) {
  const task = store.getTask(id);
  if (!task) throw notFound('Task', id);
  return task;
}

/**
 * Check that referenced project and assignee exist.
 * @param {object} store
 * @param {{projectId?: string, assigneeId?: string|null}} fields
 */
function assertReferences(store, fields) {
  if (fields.projectId !== undefined && !store.getProject(fields.projectId)) {
    throw validationError(`projectId ${fields.projectId} does not exist`);
  }
  if (fields.assigneeId && !store.getUser(fields.assigneeId)) {
    throw validationError(`assigneeId ${fields.assigneeId} does not exist`);
  }
}

/**
 * Build the list filter from the query string.
 * @param {URLSearchParams} query
 * @param {string} [projectId] forced project (for /api/projects/:id/tasks)
 * @returns {object}
 */
function readFilter(query, projectId) {
  return {
    projectId: projectId ?? getString(query, 'projectId'),
    status: getEnum(query, 'status', TASK_STATUSES),
    priority: getEnum(query, 'priority', TASK_PRIORITIES),
    assigneeId: getString(query, 'assigneeId'),
  };
}

/**
 * Shared implementation for the two task list endpoints.
 * @param {{res: object, query: URLSearchParams, store: object}} ctx
 * @param {string} [projectId]
 */
function respondWithTaskList({ res, query, store }, projectId) {
  const filter = readFilter(query, projectId);
  const sort = {
    sortBy: getEnum(query, 'sortBy', SORT_FIELDS) ?? 'createdAt',
    sortDir: getEnum(query, 'sortDir', SORT_DIRECTIONS) ?? 'asc',
  };
  const { items, meta } = paginate(store.listTasks(filter, sort), parsePagination(query));
  sendList(res, items, meta);
}

/**
 * GET /api/tasks - filter by projectId, status, priority, assigneeId; sort; paginate.
 * @param {{res: object, query: URLSearchParams, store: object}} ctx
 */
export function listTasks(ctx) {
  respondWithTaskList(ctx);
}

/**
 * GET /api/projects/:id/tasks - same as listTasks, scoped to one project.
 * @param {{res: object, params: {id: string}, query: URLSearchParams, store: object}} ctx
 */
export function listProjectTasks(ctx) {
  if (!ctx.store.getProject(ctx.params.id)) throw notFound('Project', ctx.params.id);
  respondWithTaskList(ctx, ctx.params.id);
}

/**
 * POST /api/tasks - create a task.
 * @param {{res: object, body: object, store: object}} ctx
 */
export function createTask({ res, body, store }) {
  const fields = validateTaskInput(body);
  assertReferences(store, fields);
  const task = store.createTask(fields);
  logger.info('task created', { id: task.id, projectId: task.projectId });
  sendData(res, task, 201);
}

/**
 * GET /api/tasks/:id - a single task.
 * @param {{res: object, params: {id: string}, store: object}} ctx
 */
export function getTask({ res, params, store }) {
  sendData(res, requireTask(store, params.id));
}

/**
 * PATCH /api/tasks/:id - partial update.
 * @param {{res: object, params: {id: string}, body: object, store: object}} ctx
 */
export function updateTask({ res, params, body, store }) {
  requireTask(store, params.id);
  const fields = validateTaskInput(body, { partial: true });
  assertReferences(store, fields);
  sendData(res, store.updateTask(params.id, fields));
}

/**
 * DELETE /api/tasks/:id - removes the task and its comments.
 * @param {{res: object, params: {id: string}, store: object}} ctx
 */
export function deleteTask({ res, params, store }) {
  requireTask(store, params.id);
  store.deleteTask(params.id);
  sendNoContent(res);
}
