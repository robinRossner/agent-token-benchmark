/** Error carrying an HTTP status and a stable machine-readable code. */
export class ApiError extends Error {
  /**
   * @param {number} status HTTP status code
   * @param {string} code machine-readable code, e.g. NOT_FOUND
   * @param {string} message human-readable message
   */
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * 400 for malformed requests that are not field validation problems.
 * @param {string} message
 * @returns {ApiError}
 */
export function badRequest(message) {
  return new ApiError(400, 'BAD_REQUEST', message);
}

/**
 * 400 for invalid field values.
 * @param {string} message
 * @returns {ApiError}
 */
export function validationError(message) {
  return new ApiError(400, 'VALIDATION_ERROR', message);
}

/**
 * 404 for a missing resource.
 * @param {string} resource human name, e.g. "Task"
 * @param {string} id
 * @returns {ApiError}
 */
export function notFound(resource, id) {
  return new ApiError(404, 'NOT_FOUND', `${resource} ${id} not found`);
}

/**
 * 409 for conflicts with existing state.
 * @param {string} message
 * @returns {ApiError}
 */
export function conflict(message) {
  return new ApiError(409, 'CONFLICT', message);
}

/**
 * Build the JSON body for an error: { error: { code, message } }.
 * @param {ApiError} err
 * @returns {{error: {code: string, message: string}}}
 */
export function toErrorBody(err) {
  return { error: { code: err.code, message: err.message } };
}
