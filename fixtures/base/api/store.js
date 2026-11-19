import { createIdGenerator, idNumber } from './lib/ids.js';
import { nowIso } from './lib/dates.js';

const PRIORITY_RANK = { low: 1, medium: 2, high: 3 };

/**
 * Decide whether a task passes a filter. Unset filter fields match everything.
 * @param {object} task
 * @param {{projectId?: string, status?: string, assigneeId?: string, priority?: string}} filter
 * @returns {boolean}
 */
function matchesFilter(task, filter) {
  if (filter.projectId && task.projectId !== filter.projectId) return false;
  if (filter.status && task.status !== filter.status) return false;
  if (filter.priority && task.priority !== filter.priority) return false;
  if (filter.assigneeId) {
    if (filter.assigneeId === 'none') return task.assigneeId === null;
    if (task.assigneeId !== filter.assigneeId) return false;
  }
  return true;
}

/**
 * Compare two tasks for the given sort field. Missing due dates sort last.
 * @param {object} a
 * @param {object} b
 * @param {string} sortBy
 * @returns {number}
 */
function compareTasks(a, b, sortBy) {
  if (sortBy === 'priority') return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
  if (sortBy === 'title') return a.title.localeCompare(b.title);
  if (sortBy === 'dueDate') {
    if (a.dueDate === b.dueDate) return 0;
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}

/**
 * Create an in-memory store from seed data. Every call returns an independent store.
 * @param {{users: object[], projects: object[], tasks: object[], comments: object[]}} seed
 * @returns {object} store API
 */
export function createStore(seed) {
  const data = structuredClone(seed);
  const maxOf = (rows) => rows.reduce((max, row) => Math.max(max, idNumber(row.id)), 0);
  const nextProjectId = createIdGenerator('p', maxOf(data.projects));
  const nextTaskId = createIdGenerator('t', maxOf(data.tasks));
  const nextCommentId = createIdGenerator('c', maxOf(data.comments));

  return {
    listUsers: () => [...data.users],
    getUser: (id) => data.users.find((user) => user.id === id) ?? null,

    listProjects({ includeArchived = false } = {}) {
      return data.projects.filter((project) => includeArchived || !project.archived);
    },
    getProject: (id) => data.projects.find((project) => project.id === id) ?? null,
    createProject(fields) {
      const project = { id: nextProjectId(), ownerId: null, archived: false, ...fields, createdAt: nowIso() };
      data.projects.push(project);
      return project;
    },
    updateProject(id, fields) {
      const project = data.projects.find((row) => row.id === id);
      if (!project) return null;
      Object.assign(project, fields);
      return project;
    },
    /** Removes the project together with its tasks and their comments. */
    deleteProject(id) {
      const index = data.projects.findIndex((project) => project.id === id);
      if (index === -1) return false;
      const taskIds = new Set(data.tasks.filter((task) => task.projectId === id).map((task) => task.id));
      data.tasks = data.tasks.filter((task) => !taskIds.has(task.id));
      data.comments = data.comments.filter((comment) => !taskIds.has(comment.taskId));
      data.projects.splice(index, 1);
      return true;
    },

    listTasks(filter = {}, { sortBy = 'createdAt', sortDir = 'asc' } = {}) {
      const rows = data.tasks.filter((task) => matchesFilter(task, filter));
      const sign = sortDir === 'desc' ? -1 : 1;
      return rows.sort((a, b) => sign * compareTasks(a, b, sortBy) || idNumber(a.id) - idNumber(b.id));
    },
    getTask: (id) => data.tasks.find((task) => task.id === id) ?? null,
    createTask(fields) {
      const stamp = nowIso();
      const task = { id: nextTaskId(), ...fields, createdAt: stamp, updatedAt: stamp };
      data.tasks.push(task);
      return task;
    },
    updateTask(id, fields) {
      const task = data.tasks.find((row) => row.id === id);
      if (!task) return null;
      Object.assign(task, fields, { updatedAt: nowIso() });
      return task;
    },
    deleteTask(id) {
      const index = data.tasks.findIndex((task) => task.id === id);
      if (index === -1) return false;
      data.tasks.splice(index, 1);
      data.comments = data.comments.filter((comment) => comment.taskId !== id);
      return true;
    },

    listComments: (taskId) => data.comments.filter((comment) => comment.taskId === taskId),
    getComment: (id) => data.comments.find((comment) => comment.id === id) ?? null,
    createComment(fields) {
      const comment = { id: nextCommentId(), ...fields, createdAt: nowIso() };
      data.comments.push(comment);
      return comment;
    },
    deleteComment(id) {
      const index = data.comments.findIndex((comment) => comment.id === id);
      if (index === -1) return false;
      data.comments.splice(index, 1);
      return true;
    },
  };
}
