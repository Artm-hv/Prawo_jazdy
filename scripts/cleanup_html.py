import re
import os
import json

file_path = os.path.join('js', 'data', 'courseData.js')

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract JSON
json_str_match = re.search(r'window\.COURSE_DATA\s*=\s*(\[.*\]);', content, re.DOTALL)
if not json_str_match:
    print("Could not find window.COURSE_DATA")
    exit(1)

course_data = json.loads(json_str_match.group(1))

# Cleanup function
def clean_explanation(html):
    if not html:
        return html
    
    # 1. Remove script tags
    html = re.sub(r'<script.*?>.*?</script>', '', html, flags=re.IGNORECASE | re.DOTALL)
    
    # 2. Remove the duplicate headers and "Pokaż wyjaśnienie" buttons
    html = re.sub(r'<div class="h3">\s*<h2>.*?</h2>\s*</div>', '', html, flags=re.IGNORECASE | re.DOTALL)
    html = re.sub(r'<button id="btn-show-explanation".*?</button>', '', html, flags=re.IGNORECASE | re.DOTALL)
    
    # 3. Fix video tags
    # Find all videos with a poster
    def video_replacer(match):
        video_tag = match.group(0)
        # find poster URL
        poster_match = re.search(r'poster="(.*?)"', video_tag)
        if poster_match:
            poster_url = poster_match.group(1)
            # extract question ID from poster, e.g. .../2091/2091.jpg -> 2091
            id_match = re.search(r'/(\d+)/(\d+)\.jpg', poster_url)
            if id_match:
                qid = id_match.group(1)
                mp4_url = f"https://assets.prawo-jazdy-360.pl/wyjasnienia-do-pytan-egzaminacyjnych/{qid}/mp4/std/{qid}.mp4"
                
                # replace inside the video tag
                # add source tag inside video
                # also ensure video has controls and no custom play button
                # we'll just reconstruct the video tag cleanly
                new_video = f'<video controls preload="metadata" poster="{poster_url}" style="width: 100%; border-radius: 8px;"><source src="{mp4_url}" type="video/mp4"></video>'
                return new_video
        return video_tag
    
    html = re.sub(r'<video.*?>\s*</video>', video_replacer, html, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove their custom play button
    html = re.sub(r'<div class="play-container.*?</button>\s*</div>', '', html, flags=re.IGNORECASE | re.DOTALL)
    
    # Some cleaning up of extra whitespaces
    html = re.sub(r'\n\s*\n', '\n', html)
    
    return html

updated = 0
for module in course_data:
    for q in module['questions']:
        if q.get('explanation'):
            old_html = q['explanation']
            new_html = clean_explanation(old_html)
            if old_html != new_html:
                q['explanation'] = new_html
                updated += 1

print(f"Cleaned {updated} explanations.")

new_content = '/* ==========================================================================\n'
new_content += '   Prawo Jazdy LMS - Course Dataset (Scraped 2185 questions)\n'
new_content += '   ========================================================================== */\n\n'
new_content += 'window.COURSE_DATA = ' + json.dumps(course_data, indent=2, ensure_ascii=False) + ';\n'

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Saved.")
