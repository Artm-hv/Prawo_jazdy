import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
data = json.load(open('data/traffic_signs.json', 'r', encoding='utf-8'))
cats = {}
for s in data:
    c = s['category']
    cats[c] = cats.get(c, 0) + 1
print(f"Total signs: {len(data)}")
for c in sorted(cats.keys()):
    print(f"  '{c}' => {cats[c]}")
