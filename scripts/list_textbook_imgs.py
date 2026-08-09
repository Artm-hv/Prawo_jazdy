import json, re

f = open('js/data/textbookData.js', encoding='utf-8')
content = f.read()
data = json.loads(re.search(r'\[.*\]', content, re.DOTALL).group(0))

imgs = []
for chap in data:
    for t in chap.get('topics', []):
        matches = re.findall(r'<img[^>]+src=[\'"]([^\'"]+)[\'"]', str(t.get('content', '')))
        imgs.extend(matches)

print("\n".join(list(set(imgs))[:20]))
