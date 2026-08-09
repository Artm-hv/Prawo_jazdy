import re
import json

with open('js/data/courseData.js', 'r', encoding='utf-8') as f:
    content = f.read()

json_str = re.search(r'window\.COURSE_DATA\s*=\s*(\[.*\]);', content, re.DOTALL).group(1)
course_data = json.loads(json_str)

total = 0
has_exp = 0
missing = []

for m in course_data:
    for q in m['questions']:
        total += 1
        if q.get('explanation'):
            has_exp += 1
        else:
            missing.append(q['title'])

print(f"Total: {total}, Has explanation: {has_exp}, Missing: {len(missing)}")

with open('scripts/missing.txt', 'w', encoding='utf-8') as f:
    for t in missing:
        f.write(t + '\n')
