import { sendData, sendList, sendNoContent } from '../lib/http.js';
import { notFound } from '../lib/errors.js';
import { getBool } from '../lib/query.js';
import { paginate, parsePagination } from '../lib/pagination.js';
import { validateProjectInput } from '../lib/validation.js';
import { toCsv } from '../lib/csv.js';
import { logger } from '../lib/logger.js';

/**
 * Look up a project or throw a 404.
 * @param {object} store
 * @param {string} id
 * @returns {object}
 */
function requireProject(store, id) {
  const project = store.getProject(id);
  if (!project) throw notFound('Project', id);
  return project;
}

/**
 * GET /api/projects - paginated list; archived projects only with includeArchived=true.
 * @param {{res: object, query: URLSearchParams, store: object}} ctx
 */
export function listProjects({ res, query, store }) {
  const includeArchived = getBool(query, 'includeArchived');
  const { items, meta } = paginate(store.listProjects({ includeArchived }), parsePagination(query));
  sendList(res, items, meta);
}

/**
 * POST /api/projects - create a project.
 * @param {{res: object, body: object, store: object}} ctx
 */
export function createProject({ res, body, store }) {
  const project = store.createProject(validateProjectInput(body));
  logger.info('project created', { id: project.id });
  sendData(res, project, 201);
}

/**
 * GET /api/projects/:id - a single project.
 * @param {{res: object, params: {id: string}, store: object}} ctx
 */
export function getProject({ res, params, store }) {
  sendData(res, requireProject(store, params.id));
}

/**
 * PATCH /api/projects/:id - partial update.
 * @param {{res: object, params: {id: string}, body: object, store: object}} ctx
 */
export function updateProject({ res, params, body, store }) {
  requireProject(store, params.id);
  sendData(res, store.updateProject(params.id, validateProjectInput(body, { partial: true })));
}

/**
 * DELETE /api/projects/:id - removes the project, its tasks and their comments.
 * @param {{res: object, params: {id: string}, store: object}} ctx
 */
export function deleteProject({ res, params, store }) {
  requireProject(store, params.id);
  store.deleteProject(params.id);
  logger.info('project deleted', { id: params.id });
  sendNoContent(res);
}

/**
 * GET /api/projects/:id/export - CSV export of the project's tasks.
 * @param {{res: import('node:http').ServerResponse, params: {id: string}, store: object}} ctx
 */
export function exportProject({ res, params, store }) {
  requireProject(store, params.id);
  const rows = store.listTasks({ projectId: params.id });
  const csv = toCsv(rows, ['id', 'title', 'status', 'priority', 'assigneeId', 'dueDate']);
  res.writeHead(200, { 'content-type': 'text/csv; charset=utf-8' });
  res.end(csv);
}
