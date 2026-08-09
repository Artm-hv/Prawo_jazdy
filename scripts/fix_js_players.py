import json
import re
import os
import urllib.request
import concurrent.futures

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COURSE_FILE = os.path.join(BASE_DIR, 'js', 'data', 'courseData.js')

with open(COURSE_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

json_str = re.search(r'window\.COURSE_DATA\s*=\s*(\[.*\]);', content, re.DOTALL).group(1)
course_data = json.loads(json_str)

videos_to_download = set()
posters_to_download = set()

def fix_explanation(exp):
    if not exp:
        return exp
    
    # Check if it has the JS player
    match = re.search(r'const questionId\s*=\s*[\'"](\d+)[\'"]', exp)
    if match:
        qid = match.group(1)
        videos_to_download.add(qid)
        posters_to_download.add(qid)
        
        # Replace the complex script/button stuff with a clean HTML5 player
        # We need to find the whole video wrapper and replace it
        # Actually, it's easier to just find the <video> tag and replace its contents and the <script>
        
        # Replace the <script> block completely
        exp = re.sub(r'<script>[\s\S]*?</script>', '', exp)
        
        # Replace the <button id="play-..."> block
        exp = re.sub(r'<button[^>]*id="play-[^>]*>[\s\S]*?</button>', '', exp)
        
        # Add the correct src to the <video> tag if it doesn't have it
        def replace_video_tag(m):
            vid_tag = m.group(0)
            if 'src=' not in vid_tag and '<source' not in vid_tag:
                # Give it a src and controls
                vid_tag = vid_tag.replace('<video', f'<video controls src="assets/Kurs/wyjasnienia-wideo/{qid}.mp4" poster="assets/Kurs/wyjasnienia-postery/{qid}.jpg"')
                # Remove custom id just in case
                vid_tag = re.sub(r'id="video-[^"]+"', '', vid_tag)
            return vid_tag
            
        exp = re.sub(r'<video[^>]*>', replace_video_tag, exp)
        
    return exp

fixed_count = 0
for m in course_data:
    for q in m['questions']:
        old_exp = q.get('explanation', '')
        new_exp = fix_explanation(old_exp)
        if old_exp != new_exp:
            q['explanation'] = new_exp
            fixed_count += 1

print(f"Fixed JS players in {fixed_count} explanations.")

new_content = '/* ==========================================================================\n'
new_content += '   Prawo Jazdy LMS - Course Dataset (Scraped 2185 questions)\n'
new_content += '   ========================================================================== */\n\n'
new_content += 'window.COURSE_DATA = ' + json.dumps(course_data, indent=2, ensure_ascii=False) + ';\n'

with open(COURSE_FILE, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Videos to download: {len(videos_to_download)}")

def download_file(url, local_path):
    if os.path.exists(local_path):
        return True
    headers = {'User-Agent': 'Mozilla/5.0'}
    req = urllib.request.Request(url, headers=headers)
    try:
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with urllib.request.urlopen(req, timeout=15) as response, open(local_path, 'wb') as out_file:
            out_file.write(response.read())
        return True
    except Exception as e:
        return False

def worker_vid(qid):
    url = f'https://assets.prawo-jazdy-360.pl/wyjasnienia-do-pytan-egzaminacyjnych/{qid}/mp4/std/{qid}.mp4'
    local_path = os.path.join(BASE_DIR, 'assets', 'Kurs', 'wyjasnienia-wideo', f'{qid}.mp4')
    return download_file(url, local_path)

def worker_poster(qid):
    url = f'https://assets.prawo-jazdy-360.pl/wyjasnienia-do-pytan-egzaminacyjnych/{qid}/{qid}.jpg'
    local_path = os.path.join(BASE_DIR, 'assets', 'Kurs', 'wyjasnienia-postery', f'{qid}.jpg')
    return download_file(url, local_path)

print("Downloading missing JS videos...")
success = 0
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
    results = ex.map(worker_vid, videos_to_download)
    for r in results:
        if r: success += 1
print(f"Downloaded {success} videos.")

print("Downloading missing JS posters...")
success = 0
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
    results = ex.map(worker_poster, posters_to_download)
    for r in results:
        if r: success += 1
print(f"Downloaded {success} posters.")
