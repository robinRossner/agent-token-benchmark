import { ApiError, badRequest, toErrorBody } from './errors.js';
import { logger } from './logger.js';

const MAX_BODY_BYTES = 1_000_000;

/**
 * Write a JSON response.
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} payload
 */
export function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

/**
 * Send a single resource: { data }.
 * @param {import('node:http').ServerResponse} res
 * @param {unknown} data
 * @param {number} [status]
 */
export function sendData(res, data, status = 200) {
  sendJson(res, status, { data });
}

/**
 * Send a paginated list: { data, meta }.
 * @param {import('node:http').ServerResponse} res
 * @param {unknown[]} items
 * @param {object} meta pagination metadata from buildMeta()
 */
export function sendList(res, items, meta) {
  sendJson(res, 200, { data: items, meta });
}

/**
 * Send 204 No Content.
 * @param {import('node:http').ServerResponse} res
 */
export function sendNoContent(res) {
  res.writeHead(204);
  res.end();
}

/**
 * Send any thrown value as an error response in the standard shape.
 * @param {import('node:http').ServerResponse} res
 * @param {unknown} err
 */
export function sendError(res, err) {
  if (err instanceof ApiError) {
    sendJson(res, err.status, toErrorBody(err));
    return;
  }
  logger.error('unhandled error', { message: String(err?.message ?? err) });
  sendJson(res, 500, { error: { code: 'INTERNAL', message: 'Internal server error' } });
}

/**
 * Read and parse a JSON request body. Empty bodies parse to {}.
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<object>}
 */
export async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body too large');
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8').trim();
  if (text === '') return {};
  try {
    const parsed = JSON.parse(text);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw badRequest('Request body must be a JSON object');
    }
    return parsed;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(400, 'INVALID_JSON', 'Request body is not valid JSON');
  }
}
