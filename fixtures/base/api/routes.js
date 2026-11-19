import { getHealth } from './handlers/health.handler.js';
import { listUsers, getUser } from './handlers/users.handler.js';
import {
  listProjects, createProject, getProject, updateProject, deleteProject, exportProject,
} from './handlers/projects.handler.js';
import {
  listTasks, createTask, getTask, updateTask, deleteTask, listProjectTasks,
} from './handlers/tasks.handler.js';
import { listComments, createComment, deleteComment } from './handlers/comments.handler.js';

/**
 * Register every HTTP route. Keep one `router.add(...)` per line: scripts/lint.js
 * parses this file to check that each route is documented in docs/API.md.
 * @param {ReturnType<typeof import('./router.js').createRouter>} router
 */
export function registerRoutes(router) {
  router.add('GET', '/api/health', getHealth);
  router.add('GET', '/api/users', listUsers);
  router.add('GET', '/api/users/:id', getUser);
  router.add('GET', '/api/projects', listProjects);
  router.add('POST', '/api/projects', createProject);
  router.add('GET', '/api/projects/:id', getProject);
  router.add('PATCH', '/api/projects/:id', updateProject);
  router.add('DELETE', '/api/projects/:id', deleteProject);
  router.add('GET', '/api/projects/:id/export', exportProject);
  router.add('GET', '/api/projects/:id/tasks', listProjectTasks);
  router.add('GET', '/api/tasks', listTasks);
  router.add('POST', '/api/tasks', createTask);
  router.add('GET', '/api/tasks/:id', getTask);
  router.add('PATCH', '/api/tasks/:id', updateTask);
  router.add('DELETE', '/api/tasks/:id', deleteTask);
  router.add('GET', '/api/tasks/:id/comments', listComments);
  router.add('POST', '/api/tasks/:id/comments', createComment);
  router.add('DELETE', '/api/comments/:id', deleteComment);
}
