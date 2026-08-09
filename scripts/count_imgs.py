import json, re

f = open('js/data/textbookData.js', encoding='utf-8')
data = json.loads(re.search(r'\[.*\]', f.read(), re.DOTALL).group(0))

imgs = []
for chap in data:
    for t in chap.get('topics', []):
        imgs.extend(re.findall(r'<img[^>]+src=[\'"]([^\'"]+)[\'"]', str(t.get('content', ''))))

print('Local:', len([i for i in imgs if i.startswith('assets')]))
print('Remote:', len([i for i in imgs if i.startswith('http')]))
