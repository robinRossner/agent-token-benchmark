// TaskFlow house-rule linter. Enforces the mechanically checkable subset of CONVENTIONS.md.
// Usage: npm run lint     (exit code 1 when any rule is violated)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'runs', 'fixtures']);

/**
 * Recursively list files under a directory (relative paths, sorted).
 * @param {string} dir absolute directory
 * @returns {string[]}
 */
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(path.relative(ROOT, full));
  }
  return out;
}

const allFiles = walk(ROOT);
const read = (file) => readFileSync(path.join(ROOT, file), 'utf8');
const inDir = (prefix, ext) => allFiles.filter((f) => f.startsWith(prefix) && (!ext || f.endsWith(ext)));
const sourceFiles = [...inDir('api/', '.js'), ...inDir('web/', '.js')];
const handlerFiles = inDir('api/handlers/');

/**
 * Find regex matches line by line.
 * @param {string} file
 * @param {RegExp} regex applied per line
 * @param {(match: RegExpExecArray, line: string) => string|null} [message] return a message to report
 * @returns {object[]} violations
 */
function scanLines(file, regex, message) {
  const found = [];
  read(file).split('\n').forEach((line, index) => {
    const match = regex.exec(line);
    if (!match) return;
    const text = message ? message(match, line) : 'matches a forbidden pattern';
    if (text) found.push({ file, line: index + 1, text, source: line.trim() });
  });
  return found;
}

const camelCase = /^[a-z][a-zA-Z0-9]*$/;
const kebabFile = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z]+)*\.(js|css|html|md|json)$/;

const RULES = [
  {
    id: 'C1', name: 'file-naming',
    summary: 'File names are kebab-case; api/handlers/ files are named <resource>.handler.js.',
    hint: 'Rename the file (and update imports). Handlers live in api/handlers/ and end in .handler.js.',
    files: () => [...sourceFiles, ...inDir('test/', '.js'), ...inDir('scripts/', '.js')],
    check(file) {
      const base = path.basename(file);
      const out = [];
      if (!kebabFile.test(base)) out.push({ file, line: 1, text: `"${base}" is not kebab-case` });
      if (file.startsWith('api/handlers/') && !base.endsWith('.handler.js')) {
        out.push({ file, line: 1, text: 'files in api/handlers/ must be named <resource>.handler.js' });
      }
      if (base.endsWith('.handler.js') && !file.startsWith('api/handlers/')) {
        out.push({ file, line: 1, text: '*.handler.js files must live in api/handlers/' });
      }
      return out;
    },
  },
  {
    id: 'C2', name: 'no-console',
    summary: 'No console.* in api/ or web/. Use api/lib/logger.js on the server.',
    hint: 'Replace with logger.info/warn/error({ ... }) from api/lib/logger.js, or remove the debug output.',
    files: () => sourceFiles,
    check: (file) => scanLines(file, /\bconsole\.\w+/, (m) => `forbidden call ${m[0]}`),
  },
  {
    id: 'C3', name: 'jsdoc-exports',
    summary: 'Every exported function, class and arrow-function constant has a JSDoc block directly above it.',
    hint: 'Add a /** ... */ comment immediately above the export describing what it does.',
    files: () => sourceFiles,
    check(file) {
      const lines = read(file).split('\n');
      const out = [];
      lines.forEach((line, index) => {
        const exported = /^export (async function|function|class)\s+(\w+)/.exec(line)
          ?? /^export const (\w+) = (async )?\(/.exec(line);
        if (!exported) return;
        if (!(index > 0 && lines[index - 1].trim().endsWith('*/'))) {
          out.push({ file, line: index + 1, text: `exported "${exported[2] ?? exported[1]}" has no JSDoc`, source: line });
        }
      });
      return out;
    },
  },
  {
    id: 'C4', name: 'error-shape',
    summary: 'Handlers signal errors by throwing ApiError helpers; they never write 4xx/5xx responses themselves.',
    hint: 'Throw notFound()/validationError()/conflict() from api/lib/errors.js. The server turns them into { error: { code, message } }.',
    files: () => handlerFiles,
    check: (file) => scanLines(file, /(writeHead\(\s*[45]\d\d|statusCode\s*=\s*[45]\d\d|sendJson\(\s*res\s*,\s*[45]\d\d|\{\s*error\s*:)/,
      (m) => `hand-written error response (${m[1].trim()})`),
  },
  {
    id: 'C5', name: 'response-helpers',
    summary: 'Success responses use sendData / sendList / sendNoContent; no hand-rolled JSON bodies.',
    hint: 'Use sendData(res, data, status?) for one resource and sendList(res, items, meta) for lists.',
    files: () => handlerFiles,
    check: (file) => scanLines(file, /(res\.end\(\s*JSON\.stringify|sendJson\()/, (m) => `uses ${m[1]} directly`),
  },
  {
    id: 'C6', name: 'query-camelcase',
    summary: 'Query parameter names are camelCase and are read through api/lib/query.js helpers.',
    hint: 'Rename the parameter to camelCase (e.g. page_size -> pageSize) and read it with getString/getInt/getEnum/getBool.',
    files: () => inDir('api/', '.js'),
    check(file) {
      const out = [];
      const regex = /(?:getString|getInt|getEnum|getBool)\(\s*query\s*,\s*['"]([^'"]+)['"]|query\.(?:get|has)\(\s*['"]([^'"]+)['"]/g;
      read(file).split('\n').forEach((line, index) => {
        for (const m of line.matchAll(regex)) {
          const name = m[1] ?? m[2];
          if (!camelCase.test(name)) out.push({ file, line: index + 1, text: `query parameter "${name}" is not camelCase`, source: line.trim() });
        }
      });
      return out;
    },
  },
  {
    id: 'C7', name: 'iso-dates',
    summary: 'Timestamps are ISO-8601 strings created with nowIso(); no Date.now() or new Date() in api/.',
    hint: 'Import { nowIso } from api/lib/dates.js. Date arithmetic belongs in api/lib/dates.js only.',
    files: () => inDir('api/', '.js').filter((f) => f !== 'api/lib/dates.js'),
    check: (file) => scanLines(file, /(Date\.now\(\)|new Date\(\s*\))/, (m) => `raw clock access ${m[1]}`),
  },
  {
    id: 'C8', name: 'css-prefix',
    summary: 'Every CSS class (styles.css, class="..." in JS/HTML) starts with tf-.',
    hint: 'Prefix the class with tf- and use BEM naming: tf-block__element--modifier.',
    files: () => [...inDir('web/', '.css'), ...inDir('web/', '.js'), ...inDir('web/', '.html')],
    check(file) {
      const out = [];
      const text = read(file);
      const report = (name, index) => {
        const line = text.slice(0, index).split('\n').length;
        out.push({ file, line, text: `class "${name}" is missing the tf- prefix` });
      };
      if (file.endsWith('.css')) {
        for (const m of text.matchAll(/\.([a-zA-Z_][\w-]*)(?=[\s,{:.>[+~])/g)) {
          if (!m[1].startsWith('tf-') && !/^\d/.test(m[1])) report(m[1], m.index);
        }
      } else {
        for (const m of text.matchAll(/class=["']([^"']*)["']/g)) {
          for (const name of m[1].split(/\s+/).filter((n) => n && !n.startsWith('$'))) {
            if (!name.startsWith('tf-')) report(name, m.index);
          }
        }
      }
      return out;
    },
  },
  {
    id: 'C9', name: 'component-exports',
    summary: 'web/components/*.js are pure: they export render<Name> functions and never touch document/window.',
    hint: 'Name the exported function render<Name> (e.g. renderTaskCard) and return an HTML string; do DOM work in web/main.js.',
    files: () => inDir('web/components/', '.js'),
    check(file) {
      const out = [];
      if (!/^export (async )?function render[A-Z]\w*/m.test(read(file))) {
        out.push({ file, line: 1, text: 'module exports no render<Name> function' });
      }
      return [...out, ...scanLines(file, /\b(document|window)\./, (m) => `component touches ${m[1]}`)];
    },
  },
  {
    id: 'C10', name: 'routes-documented',
    summary: 'Every route in api/routes.js has a "### METHOD /path" heading in docs/API.md (and vice versa).',
    hint: 'Add a section to docs/API.md titled exactly like "### GET /api/things/:id", or remove the stale section.',
    files: () => ['api/routes.js'],
    check(file) {
      const routes = [...read(file).matchAll(/router\.add\(\s*'([A-Z]+)'\s*,\s*'([^']+)'/g)].map((m) => `${m[1]} ${m[2]}`);
      const documented = [...read('docs/API.md').matchAll(/^### ([A-Z]+ \/\S+)\s*$/gm)].map((m) => m[1]);
      return [
        ...routes.filter((r) => !documented.includes(r)).map((r) => ({ file, line: 1, text: `route "${r}" is not documented in docs/API.md` })),
        ...documented.filter((d) => !routes.includes(d)).map((d) => ({ file: 'docs/API.md', line: 1, text: `"${d}" is documented but not registered in api/routes.js` })),
      ];
    },
  },
  {
    id: 'C11', name: 'named-exports-and-line-length',
    summary: 'Named exports only (no export default); lines in api/, web/ and test/ are at most 120 characters.',
    hint: 'Use "export function name" / "export const name"; wrap long lines.',
    files: () => [...sourceFiles, ...inDir('test/', '.js')],
    check(file) {
      const out = scanLines(file, /^export default\b/, () => 'default exports are not allowed');
      read(file).split('\n').forEach((line, index) => {
        if (line.length > 120) out.push({ file, line: index + 1, text: `line is ${line.length} characters (max 120)` });
      });
      return out;
    },
  },
  {
    id: 'C12', name: 'handler-tests',
    summary: 'Every api/handlers/<name>.handler.js has a matching test/<name>.handler.test.js.',
    hint: 'Create test/<name>.handler.test.js using startTestApp() from test/helpers/app.js.',
    files: () => handlerFiles.filter((f) => f.endsWith('.handler.js')),
    check(file) {
      const expected = `test/${path.basename(file, '.js')}.test.js`;
      return allFiles.includes(expected) ? [] : [{ file, line: 1, text: `missing test file ${expected}` }];
    },
  },
];

console.log('TaskFlow lint - checking house rules from CONVENTIONS.md');
console.log(`Scanning ${allFiles.length} files under ${path.basename(ROOT)}/\n`);

let failedRules = 0;
let totalViolations = 0;
for (const rule of RULES) {
  const files = rule.files();
  const violations = files.flatMap((file) => rule.check(file));
  const status = violations.length === 0 ? 'PASS' : 'FAIL';
  console.log(`[${rule.id}] ${rule.name}: ${status}`);
  console.log(`      rule:    ${rule.summary}`);
  console.log(`      checked: ${files.length} file(s)`);
  if (violations.length > 0) {
    failedRules += 1;
    totalViolations += violations.length;
    for (const v of violations) {
      console.log(`      ERROR ${v.file}:${v.line}  ${v.text}`);
      if (v.source) console.log(`            > ${v.source}`);
    }
    console.log(`      how to fix: ${rule.hint}`);
  }
  console.log('');
}

console.log('----------------------------------------');
console.log(`Rules checked:   ${RULES.length}`);
console.log(`Rules failed:    ${failedRules}`);
console.log(`Total problems:  ${totalViolations}`);
console.log(totalViolations === 0 ? 'Lint passed.' : 'Lint FAILED.');
process.exit(totalViolations === 0 ? 0 : 1);
