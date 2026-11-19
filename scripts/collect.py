"""Build results/runs.csv: per run usage (summed from transcript), hidden-test grade, diff size."""
import csv, json, subprocess, sys, os
# Needs results/agents.tsv (arm, task, rep, agent id) and a dir of raw agent transcripts (<id>.output); neither is published.
TASKS = sys.argv[1]; root = os.getcwd()
P = {'input': 3, 'cache_write': 3.75, 'cache_read': 0.30, 'output': 15}
def usage(path):
    seen, t = set(), dict(turns=0, input=0, cache_write=0, cache_read=0, output=0)
    for line in open(path):
        try: e = json.loads(line)
        except ValueError: continue
        m = e.get('message') or {}; u = m.get('usage')
        if e.get('type') != 'assistant' or not u: continue
        k = m.get('id') or e.get('uuid')
        if k in seen: continue
        seen.add(k); t['turns'] += 1
        t['input'] += u.get('input_tokens', 0); t['output'] += u.get('output_tokens', 0)
        t['cache_write'] += u.get('cache_creation_input_tokens', 0); t['cache_read'] += u.get('cache_read_input_tokens', 0)
    t['total'] = sum(t[k] for k in P); t['cost'] = round(sum(t[k] * P[k] for k in P) / 1e6, 4)
    return t
rows = []
for arm, task, rep, aid in csv.reader(open('results/agents.tsv'), delimiter='\t'):
    d = f'runs/{arm}/{task}/{rep}'
    u = usage(f'{TASKS}/{aid}.output')
    g = json.loads(subprocess.run(['bash', 'fixtures/grading/grade.sh', task, d], capture_output=True, text=True).stdout.strip().splitlines()[-1])
    base = 'fixtures/base'
    diff = subprocess.run(['diff', '-ruN', base, d, '-x', 'TASK.md', '-x', '.arm', '-x', 'node_modules'], capture_output=True, text=True).stdout
    added = sum(1 for l in diff.splitlines() if l.startswith('+') and not l.startswith('+++'))
    rows.append(dict(arm=arm, task=task, rep=rep, **u, hidden_pass=g.get('hidden_pass', ''), hidden_total=g.get('hidden_total', ''),
                     visible_ok=g.get('visible_ok', ''), lint_ok=g.get('lint_ok', ''), lines_added=added))
with open('results/runs.csv', 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
print(len(rows), 'rows')
