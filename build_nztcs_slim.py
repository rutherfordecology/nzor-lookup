"""
Build nztcs_slim.json from the full nztcs.json.

Output: nztcs_slim.json — maps lowercase-normalised name to
        {s: status, c: category, y: year}
All 43k entries (including aliases) are preserved for matching.
"""

import json, os, sys
sys.stdout.reconfigure(encoding='utf-8')

SRC = r'C:\Users\User\Occurd\nztcs.json'
OUT = r'C:\Users\User\GBIF-Record-Finder\.claude\worktrees\objective-bose-704ec8\nztcs_slim.json'

print(f'Reading {SRC}…')
with open(SRC, encoding='utf-8') as f:
    data = json.load(f)

slim = {}
for key, val in data.items():
    entry = {
        's': val.get('status'),
        'c': val.get('category'),
        'y': val.get('year'),
    }
    cn = val.get('common')
    mn = val.get('maori')
    if cn: entry['cn'] = cn
    if mn: entry['mn'] = mn
    slim[key] = entry

print(f'Entries: {len(slim)}')
print(f'Writing {OUT}…')
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(slim, f, ensure_ascii=False, separators=(',', ':'))

size_kb = os.path.getsize(OUT) / 1024
print(f'Done. {size_kb:.0f} KB')
