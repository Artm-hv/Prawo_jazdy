import json
import re

with open('js/data/courseData.js', 'r', encoding='utf-8') as f:
    content = f.read()

json_str = re.search(r'window\.COURSE_DATA\s*=\s*(\[.*\]);', content, re.DOTALL).group(1)
course_data = json.loads(json_str)

for module in course_data:
    for q in module['questions']:
        # Fix mediaUrl if it exists and points to original site
        if q.get('mediaUrl') and 'prawo-jazdy-360.pl' in q['mediaUrl']:
            url = q['mediaUrl']
            filename = url.split('/')[-1]
            # remove query params if any
            filename = filename.split('?')[0]
            # rename .webm to .mp4 as per previous script
            filename = filename.replace('.webm', '.mp4')
            q['mediaUrl'] = f"assets/media/{filename}"
        
        # Make sure explanation field exists
        if 'explanation' not in q:
            q['explanation'] = ""

new_content = '/* ==========================================================================\n'
new_content += '   Prawo Jazdy LMS - Course Dataset (Scraped 2185 questions)\n'
new_content += '   ========================================================================== */\n\n'
new_content += 'window.COURSE_DATA = ' + json.dumps(course_data, indent=2, ensure_ascii=False) + ';\n'

with open('js/data/courseData.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated media URLs in uncorrupted courseData.js")
