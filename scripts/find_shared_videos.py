import json
import re
from collections import defaultdict

with open('js/data/courseData.js', encoding='utf-8') as f:
    s = f.read()
    match = re.search(r'window\.COURSE_DATA\s*=\s*(\[.*\]);', s, re.DOTALL)
    data = json.loads(match.group(1))

mp4_to_qs = defaultdict(list)

for m in data:
    for q in m['questions']:
        if q.get('explanation') and '.mp4' in q['explanation']:
            # Find the actual MP4 file name using a broad regex
            mp4_match = re.search(r'(\d+)\.mp4', q['explanation'])
            if mp4_match:
                mp4_to_qs[mp4_match.group(1)].append(q['title'])

shared_found = 0
for mp4, qs in mp4_to_qs.items():
    if len(qs) >= 2:
        print(f"Shared video file: {mp4}.mp4")
        for q in qs:
            print(f"  - {q.encode('ascii', 'replace').decode('ascii')}")
        shared_found += 1
        if shared_found >= 3:
            break
