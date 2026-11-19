const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

let threshold = LEVELS[process.env.TF_LOG_LEVEL] ?? LEVELS.info;
let sink = (line) => process.stderr.write(`${line}\n`);

/**
 * Change the minimum level that gets written.
 * @param {'debug'|'info'|'warn'|'error'|'silent'} level
 */
export function setLogLevel(level) {
  if (!(level in LEVELS)) throw new Error(`Unknown log level: ${level}`);
  threshold = LEVELS[level];
}

/**
 * Replace the output sink (used by tests to capture log lines).
 * @param {(line: string) => void} fn
 */
export function setLogSink(fn) {
  sink = fn;
}

/**
 * Create a logger bound to a component name.
 * @param {string} component
 * @returns {{debug: Function, info: Function, warn: Function, error: Function}}
 */
export function createLogger(component) {
  const write = (level) => (message, fields = {}) => {
    if (LEVELS[level] < threshold) return;
    sink(JSON.stringify({ level, component, message, ...fields }));
  };
  return { debug: write('debug'), info: write('info'), warn: write('warn'), error: write('error') };
}

export const logger = createLogger('taskflow');
