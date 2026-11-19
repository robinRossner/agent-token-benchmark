"""Sum per-turn API usage from a subagent transcript (JSONL). Usage: usage.py label=path ..."""
import json, sys
for arg in sys.argv[1:]:
    label, path = arg.split('=', 1)
    seen, t = set(), dict(turns=0, input=0, cache_write=0, cache_read=0, output=0)
    for line in open(path):
        try: e = json.loads(line)
        except ValueError: continue
        m = e.get('message') or {}
        u = m.get('usage')
        if e.get('type') != 'assistant' or not u: continue
        key = m.get('id') or e.get('uuid')
        if key in seen: continue
        seen.add(key); t['turns'] += 1
        t['input'] += u.get('input_tokens', 0); t['output'] += u.get('output_tokens', 0)
        t['cache_write'] += u.get('cache_creation_input_tokens', 0); t['cache_read'] += u.get('cache_read_input_tokens', 0)
    t['total'] = t['input'] + t['cache_write'] + t['cache_read'] + t['output']
    print(label, json.dumps(t))
