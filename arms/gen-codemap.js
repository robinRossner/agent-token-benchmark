// Generates a compact file map: path, line count, exports + first JSDoc line.
import fs from 'node:fs'; import path from 'node:path';
const root = process.argv[2]; const out = [];
const walk = d => fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).forEach(e => {
  const p = path.join(d, e.name); if (e.name.startsWith('.') || e.name === 'TASK.md') return;
  if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); return; }
  const rel = path.relative(root, p), src = fs.readFileSync(p, 'utf8'), lines = src.split('\n').length;
  if (!/\.(js|md|html|css|json)$/.test(e.name)) return;
  const head = (src.match(/\/\*\*\s*\n?\s*\*?\s*([^\n*][^\n]*)/) || [])[1]?.trim();
  const exps = [...src.matchAll(/export\s+(?:async\s+)?(?:function|const|class|let)\s+(\w+)/g)].map(m => m[1]);
  out.push(`- ${rel} (${lines}L)${head ? ' — ' + head : ''}${exps.length ? '\n  exports: ' + exps.join(', ') : ''}`);
});
walk(root);
console.log('# CODEMAP (file → purpose → exports)\n\n' + out.join('\n'));
