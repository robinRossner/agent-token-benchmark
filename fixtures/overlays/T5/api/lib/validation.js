import { validationError } from './errors.js';
import { isIsoDate, toIso } from './dates.js';

export const TASK_STATUSES = ['todo', 'in_progress', 'done'];
export const TASK_PRIORITIES = ['low', 'medium', 'high'];

/**
 * Require a non-empty string field of bounded length.
 * @param {object} body
 * @param {string} field
 * @param {{min?: number, max?: number}} [limits]
 * @returns {string} the trimmed value
 */
export function requireString(body, field, { min = 1, max = 200 } = {}) {
  const value = body[field];
  if (typeof value !== 'string') throw validationError(`${field} is required and must be a string`);
  const trimmed = value.trim();
  if (value.length < min) throw validationError(`${field} must be at least ${min} character(s) long`);
  if (value.length > max) throw validationError(`${field} must be at most ${max} characters long`);
  return trimmed;
}

/**
 * Validate an optional string field; undefined passes through.
 * @param {object} body
 * @param {string} field
 * @param {{max?: number}} [limits]
 * @returns {string|undefined}
 */
export function optionalString(body, field, { max = 2000 } = {}) {
  if (body[field] === undefined) return undefined;
  if (typeof body[field] !== 'string') throw validationError(`${field} must be a string`);
  if (body[field].length > max) throw validationError(`${field} must be at most ${max} characters long`);
  return body[field].trim();
}

/**
 * Validate an optional enum field; undefined passes through.
 * @param {object} body
 * @param {string} field
 * @param {readonly string[]} allowed
 * @returns {string|undefined}
 */
export function optionalEnum(body, field, allowed) {
  if (body[field] === undefined) return undefined;
  if (!allowed.includes(body[field])) {
    throw validationError(`${field} must be one of: ${allowed.join(', ')}`);
  }
  return body[field];
}

/**
 * Validate an optional nullable ISO date field. null clears the value.
 * @param {object} body
 * @param {string} field
 * @returns {string|null|undefined}
 */
export function optionalDate(body, field) {
  const value = body[field];
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!isIsoDate(value)) throw validationError(`${field} must be an ISO-8601 date string or null`);
  return toIso(value);
}

/**
 * Validate the body of POST/PATCH /api/projects.
 * @param {object} body
 * @param {{partial?: boolean}} [options] partial = PATCH semantics
 * @returns {object} cleaned fields
 */
export function validateProjectInput(body, { partial = false } = {}) {
  const out = {};
  if (!partial || body.name !== undefined) out.name = requireString(body, 'name', { min: 2, max: 80 });
  const description = optionalString(body, 'description');
  if (description !== undefined) out.description = description;
  else if (!partial) out.description = '';
  if (body.archived !== undefined) {
    if (typeof body.archived !== 'boolean') throw validationError('archived must be a boolean');
    out.archived = body.archived;
  }
  return out;
}

/**
 * Validate the body of POST/PATCH /api/tasks.
 * @param {object} body
 * @param {{partial?: boolean}} [options] partial = PATCH semantics
 * @returns {object} cleaned fields
 */
export function validateTaskInput(body, { partial = false } = {}) {
  const out = {};
  if (!partial || body.title !== undefined) out.title = requireString(body, 'title', { min: 3, max: 120 });
  if (!partial) out.projectId = requireString(body, 'projectId', { max: 40 });
  const description = optionalString(body, 'description');
  if (description !== undefined) out.description = description;
  else if (!partial) out.description = '';
  const status = optionalEnum(body, 'status', TASK_STATUSES);
  if (status !== undefined) out.status = status;
  else if (!partial) out.status = 'todo';
  const priority = optionalEnum(body, 'priority', TASK_PRIORITIES);
  if (priority !== undefined) out.priority = priority;
  else if (!partial) out.priority = 'medium';
  const dueDate = optionalDate(body, 'dueDate');
  if (dueDate !== undefined) out.dueDate = dueDate;
  else if (!partial) out.dueDate = null;
  if (body.assigneeId !== undefined) {
    if (body.assigneeId !== null && typeof body.assigneeId !== 'string') {
      throw validationError('assigneeId must be a string or null');
    }
    out.assigneeId = body.assigneeId;
  } else if (!partial) {
    out.assigneeId = null;
  }
  return out;
}

/**
 * Validate the body of POST /api/tasks/:id/comments.
 * @param {object} body
 * @returns {{authorId: string, body: string}}
 */
export function validateCommentInput(body) {
  return {
    authorId: requireString(body, 'authorId', { max: 40 }),
    body: requireString(body, 'body', { min: 1, max: 1000 }),
  };
}
