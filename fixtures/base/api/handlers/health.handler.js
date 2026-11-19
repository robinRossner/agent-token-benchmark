import { sendData } from '../lib/http.js';

/**
 * GET /api/health - liveness probe.
 * @param {{res: import('node:http').ServerResponse}} ctx
 */
export function getHealth({ res }) {
  sendData(res, { status: 'ok', service: 'taskflow', version: '0.4.0' });
}
