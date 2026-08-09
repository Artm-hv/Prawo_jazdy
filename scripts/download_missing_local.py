import os
import json
import re
import urllib.request
import concurrent.futures

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COURSE_FILE = os.path.join(BASE_DIR, 'js', 'data', 'courseData.js')

with open(COURSE_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all local assets that were inserted
local_assets = re.findall(r'assets/[a-zA-Z0-9_/-]+\.(?:mp4|jpg|png|webp)', content)
local_assets = list(set(local_assets))

missing_on_disk = []
for asset in local_assets:
    path = os.path.join(BASE_DIR, asset.replace('/', os.sep))
    if not os.path.exists(path):
        missing_on_disk.append(asset)

print(f"Total local references: {len(local_assets)}")
print(f"Missing on disk: {len(missing_on_disk)}")

# Re-construct original URLs
def get_original_url(asset):
    filename = os.path.basename(asset)
    if 'wyjasnienia-wideo' in asset:
        id = filename.split('.')[0]
        return f'https://assets.prawo-jazdy-360.pl/wyjasnienia-do-pytan-egzaminacyjnych/{id}/mp4/std/{id}.mp4'
    elif 'wyjasnienia-postery' in asset:
        id = filename.split('.')[0]
        return f'https://assets.prawo-jazdy-360.pl/wyjasnienia-do-pytan-egzaminacyjnych/{id}/{id}.jpg'
    elif 'Znaki_Drogowe' in asset:
        return f'https://www.prawo-jazdy-360.pl/images/znaki-drogowe/{filename}'
    return None

def download_file(url, local_path):
    headers = {'User-Agent': 'Mozilla/5.0'}
    req = urllib.request.Request(url, headers=headers)
    try:
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with urllib.request.urlopen(req, timeout=10) as response, open(local_path, 'wb') as out_file:
            out_file.write(response.read())
        return True
    except Exception as e:
        print(f"Failed {url}: {e}")
        return False

def worker(asset):
    url = get_original_url(asset)
    if not url: return False
    local_path = os.path.join(BASE_DIR, asset.replace('/', os.sep))
    return download_file(url, local_path)

if missing_on_disk:
    print("Downloading missing files...")
    success = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        results = ex.map(worker, missing_on_disk)
        for r in results:
            if r: success += 1
    print(f"Downloaded {success} of {len(missing_on_disk)}")
