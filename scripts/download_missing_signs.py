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

missing_images = set()

for m in course_data:
    for q in m['questions']:
        if q.get('explanation'):
            # Find all <img src="...">
            imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', q['explanation'])
            # Find all <source srcset="...">
            srcsets = re.findall(r'<source[^>]+srcset=["\']([^"\']+)["\']', q['explanation'])
            
            for img in imgs + srcsets:
                if img.startswith('assets/'):
                    local_path = os.path.join(BASE_DIR, img.replace('/', os.sep))
                    if not os.path.exists(local_path):
                        missing_images.add(img)

print(f"Total missing images in explanations: {len(missing_images)}")

def worker(img_path):
    # Try to reconstruct the original URL
    if img_path.startswith('assets/Znaki_Drogowe/'):
        remote_path = img_path.replace('assets/Znaki_Drogowe/', 'https://www.prawo-jazdy-360.pl/images/')
    else:
        return False
        
    local_path = os.path.join(BASE_DIR, img_path.replace('/', os.sep))
    if os.path.exists(local_path):
        return True
        
    headers = {'User-Agent': 'Mozilla/5.0'}
    req = urllib.request.Request(remote_path, headers=headers)
    try:
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with urllib.request.urlopen(req, timeout=10) as response, open(local_path, 'wb') as out_file:
            out_file.write(response.read())
        return True
    except Exception as e:
        print(f"Failed to download {remote_path}: {e}")
        return False

success = 0
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
    results = ex.map(worker, missing_images)
    for r in results:
        if r: success += 1
print(f"Downloaded {success} missing images.")
