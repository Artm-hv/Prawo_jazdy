import json, re

f=open('js/data/courseData.js', encoding='utf-8')
data=json.loads(re.search(r'window\.COURSE_DATA\s*=\s*(\[.*\]);', f.read(), re.DOTALL).group(1))
known=0
missing=0

for m in data:
  for q in m['questions']:
    if q.get('explanation') and q['explanation'].strip(): 
        known += 1
    else: 
        missing += 1

print(f'Known: {known}, Missing: {missing}')
