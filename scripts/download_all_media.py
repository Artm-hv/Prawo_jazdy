import os
import re
import json
import urllib.request
import urllib.error
from urllib.parse import urlparse
import time
import concurrent.futures

# Configuration for paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'js', 'data')
ASSETS_DIR = os.path.join(BASE_DIR, 'assets')

# Directories to create
DIRS = {
    'kurs_wyjasnienia_wideo': os.path.join(ASSETS_DIR, 'Kurs', 'wyjasnienia-wideo'),
    'kurs_wyjasnienia_postery': os.path.join(ASSETS_DIR, 'Kurs', 'wyjasnienia-postery'),
    'znaki_drogowe': os.path.join(ASSETS_DIR, 'Znaki_Drogowe'),
    'wyklady_slajdy': os.path.join(ASSETS_DIR, 'Wyklady', 'slajdy'),
    'podrecznik_audio': os.path.join(ASSETS_DIR, 'Podrecznik', 'audio'),
    'podrecznik_img': os.path.join(ASSETS_DIR, 'Podrecznik', 'img'),
}

for d in DIRS.values():
    os.makedirs(d, exist_ok=True)

# Helper to download with retry
def download_file(url, local_path):
    if os.path.exists(local_path):
        return True # already downloaded
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://www.prawo-jazdy-360.pl/'
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as response, open(local_path, 'wb') as out_file:
            data = response.read()
            out_file.write(data)
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False

# We will collect tasks: (url, local_path, replacement_string_in_code)
# Then download concurrently.
download_tasks = []

def add_task(url, local_folder, filename_prefix=""):
    parsed = urlparse(url)
    filename = os.path.basename(parsed.path)
    if filename_prefix:
        filename = f"{filename_prefix}_{filename}"
    local_path = os.path.join(local_folder, filename)
    
    # Calculate relative path for HTML/JS
    rel_path = os.path.relpath(local_path, BASE_DIR).replace('\\', '/')
    
    download_tasks.append((url, local_path))
    return rel_path


# --- 1. Process courseData.js ---
course_file = os.path.join(DATA_DIR, 'courseData.js')
print("Parsing courseData.js...")
with open(course_file, 'r', encoding='utf-8') as f:
    course_content = f.read()

# Replace assets/media with assets/Kurs/pytania
course_content = course_content.replace('assets/media/', 'assets/Kurs/pytania/')

# Find external URLs in courseData.js
# 1. MP4 explanations
mp4_pattern = r'https://assets\.prawo-jazdy-360\.pl/wyjasnienia-do-pytan-egzaminacyjnych/\d+/mp4/std/\d+\.mp4'
for match in re.findall(mp4_pattern, course_content):
    rel_path = add_task(match, DIRS['kurs_wyjasnienia_wideo'])
    course_content = course_content.replace(match, rel_path)

# 2. JPG posters
poster_pattern = r'https://assets\.prawo-jazdy-360\.pl/wyjasnienia-do-pytan-egzaminacyjnych/\d+/\d+\.jpg'
for match in re.findall(poster_pattern, course_content):
    rel_path = add_task(match, DIRS['kurs_wyjasnienia_postery'])
    course_content = course_content.replace(match, rel_path)

# 3. Znaki drogowe PNG/WEBP
znaki_pattern = r'https://www\.prawo-jazdy-360\.pl/images?/znaki-drogowe/[a-zA-Z0-9_-]+\.(png|webp)'
for match in re.finditer(znaki_pattern, course_content):
    url = match.group(0)
    rel_path = add_task(url, DIRS['znaki_drogowe'])
    course_content = course_content.replace(url, rel_path)


# --- 2. Process lecturesData.js ---
lectures_file = os.path.join(DATA_DIR, 'lecturesData.js')
if os.path.exists(lectures_file):
    print("Parsing lecturesData.js...")
    with open(lectures_file, 'r', encoding='utf-8') as f:
        lectures_content = f.read()
    
    slide_pattern = r'https://www\.prawo-jazdy-360\.pl/static/lecture/images/[a-zA-Z0-9_\.]+\.jpg'
    for match in set(re.findall(slide_pattern, lectures_content)):
        rel_path = add_task(match, DIRS['wyklady_slajdy'])
        lectures_content = lectures_content.replace(match, rel_path)

# --- 3. Process textbookData.js ---
textbook_file = os.path.join(DATA_DIR, 'textbookData.js')
if os.path.exists(textbook_file):
    print("Parsing textbookData.js...")
    with open(textbook_file, 'r', encoding='utf-8') as f:
        textbook_content = f.read()
    
    audio_pattern = r'https://www\.prawo-jazdy-360\.pl/static/audio/[0-9\.]+\.mp3'
    for match in set(re.findall(audio_pattern, textbook_content)):
        rel_path = add_task(match, DIRS['podrecznik_audio'])
        textbook_content = textbook_content.replace(match, rel_path)
        
    elearn_pattern = r'https://www\.prawo-jazdy-360\.pl/images/elearning/[a-zA-Z0-9_-]+\.jpg'
    for match in set(re.findall(elearn_pattern, textbook_content)):
        rel_path = add_task(match, DIRS['podrecznik_img'])
        textbook_content = textbook_content.replace(match, rel_path)
        
    static_img_pattern = r'https://www\.prawo-jazdy-360\.pl/static/images/\d+\.jpg'
    for match in set(re.findall(static_img_pattern, textbook_content)):
        rel_path = add_task(match, DIRS['podrecznik_img'])
        textbook_content = textbook_content.replace(match, rel_path)

# --- 4. Process trafficSignsData.js ---
traffic_file = os.path.join(DATA_DIR, 'trafficSignsData.js')
if os.path.exists(traffic_file):
    print("Parsing trafficSignsData.js...")
    with open(traffic_file, 'r', encoding='utf-8') as f:
        traffic_content = f.read()
        
    ts_pattern = r'https://www\.prawo-jazdy-360\.pl/images/znaki-drogowe/[a-zA-Z0-9_-]+\.png'
    for match in set(re.findall(ts_pattern, traffic_content)):
        rel_path = add_task(match, DIRS['znaki_drogowe'])
        traffic_content = traffic_content.replace(match, rel_path)


# Deduplicate tasks
download_tasks = list(set(download_tasks))
print(f"Total unique files to download: {len(download_tasks)}")

# Execute downloads concurrently
success_count = 0
fail_count = 0

def process_task(task):
    url, local_path = task
    success = download_file(url, local_path)
    return success

print("Starting downloads...")
start_time = time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
    results = executor.map(process_task, download_tasks)
    for res in results:
        if res:
            success_count += 1
        else:
            fail_count += 1
            
end_time = time.time()
print(f"Download complete in {end_time - start_time:.2f}s. Success: {success_count}, Failed: {fail_count}")

# Save updated files
print("Saving updated JS data files...")
with open(course_file, 'w', encoding='utf-8') as f:
    f.write(course_content)
    
if os.path.exists(lectures_file):
    with open(lectures_file, 'w', encoding='utf-8') as f:
        f.write(lectures_content)

if os.path.exists(textbook_file):
    with open(textbook_file, 'w', encoding='utf-8') as f:
        f.write(textbook_content)

if os.path.exists(traffic_file):
    with open(traffic_file, 'w', encoding='utf-8') as f:
        f.write(traffic_content)

print("All done!")
