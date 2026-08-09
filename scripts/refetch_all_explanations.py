import requests
from bs4 import BeautifulSoup
import json
import re
import concurrent.futures
import time
from html.parser import HTMLParser
import difflib
import os
import sys
import urllib.request

email = 'artemgizovskij@gmail.com'
password = 'No9n464gahog'
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COURSE_FILE = os.path.join(BASE_DIR, 'js', 'data', 'courseData.js')

class Stripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.strict = False
        self.convert_charrefs = True
        self.text = []
    def handle_data(self, d):
        self.text.append(d)
    def get_data(self):
        return "".join(self.text).strip()

def strip_tags(html):
    s = Stripper()
    s.feed(html)
    return s.get_data()

def normalize_title(title):
    t = strip_tags(title).lower()
    return re.sub(r'[^a-z0-9]', '', t)

def main():
    print("Loading courseData.js...")
    with open(COURSE_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    json_str = re.search(r'window\.COURSE_DATA\s*=\s*(\[.*\]);', content, re.DOTALL).group(1)
    course_data = json.loads(json_str)

    all_titles = {}
    for module in course_data:
        for q in module['questions']:
            norm = normalize_title(q['title'])
            all_titles[norm] = q

    print("Authenticating...")
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pl,en-US;q=0.7,en;q=0.3',
    })
    
    r = session.get('https://www.prawo-jazdy-360.pl/logowanie')
    soup = BeautifulSoup(r.text, 'html.parser')
    token_input = soup.find('input', {'name': '__RequestVerificationToken'})
    if not token_input:
        print("Failed to find login token")
        return
        
    login_data = {
        '__RequestVerificationToken': token_input['value'],
        'Email': email,
        'Password': password,
        'RememberMe': 'false'
    }
    r = session.post('https://www.prawo-jazdy-360.pl/logowanie', data=login_data)
    
    r = session.get('https://www.prawo-jazdy-360.pl/kurs')
    soup = BeautifulSoup(r.text, 'html.parser')
    api_token_input = soup.find('input', {'name': '__RequestVerificationToken'})
    if not api_token_input:
        print("Failed to find API token")
        return
    api_token = api_token_input['value']

    api_url = 'https://www.prawo-jazdy-360.pl/learn/find-question'
    
    videos_to_download = set()
    posters_to_download = set()

    def check_id(i):
        payload = {"draw":0,"type":0,"group":0,"search":"","sessionId":"810da702-7441-4bc2-955c-f1fe6c37eac5","id": i,"filter":False}
        headers = {
            'accept': '*/*',
            'content-type': 'application/json; charset=UTF-8',
            'origin': 'https://www.prawo-jazdy-360.pl',
            'referer': 'https://www.prawo-jazdy-360.pl/kurs',
            'requestverificationtoken': api_token,
            'x-requested-with': 'FetchRequest'
        }
        
        try:
            r = session.post(api_url, json=payload, headers=headers, timeout=10)
            if r.status_code == 200 and r.text:
                html = r.text
                title_match = re.search(r'<div class="name fx-c">\s*(.*?)\s*</div>', html, re.IGNORECASE | re.DOTALL)
                exp_match = re.search(r'<div class="explanation fx-c g-30">(.*?)<div class="f-group">', html, re.IGNORECASE | re.DOTALL)
                
                if title_match and exp_match:
                    title = strip_tags(title_match.group(1)).replace('\n', ' ').strip()
                    exp = '<div class="explanation-content">' + exp_match.group(1).strip() + '</div>'
                    
                    # Clean paths
                    exp = exp.replace('src="/images/', 'src="assets/Znaki_Drogowe/')
                    exp = exp.replace('srcset="/image/', 'srcset="assets/Znaki_Drogowe/')
                    exp = exp.replace('https://www.prawo-jazdy-360.pl/images/znaki-drogowe/', 'assets/Znaki_Drogowe/')
                    exp = exp.replace('https://www.prawo-jazdy-360.pl/image/znaki-drogowe/', 'assets/Znaki_Drogowe/')
                    
                    # Fix JS Player
                    js_match = re.search(r'const questionId\s*=\s*[\'"](\d+)[\'"]', exp)
                    if js_match:
                        qid = js_match.group(1)
                        videos_to_download.add(qid)
                        posters_to_download.add(qid)
                        exp = re.sub(r'<script>[\s\S]*?</script>', '', exp)
                        exp = re.sub(r'<button[^>]*id="play-[^>]*>[\s\S]*?</button>', '', exp)
                        def replace_video_tag(m):
                            return f'<video controls src="assets/Kurs/wyjasnienia-wideo/{qid}.mp4" poster="assets/Kurs/wyjasnienia-postery/{qid}.jpg" style="width: 100%; border-radius: 8px;"></video>'
                        exp = re.sub(r'<video[^>]*>[\s\S]*?</video>', replace_video_tag, exp)
                    
                    # Also fallback for older standard mp4 tags if they exist
                    exp = re.sub(r'https://assets\.prawo-jazdy-360\.pl/wyjasnienia-do-pytan-egzaminacyjnych/\d+/mp4/std/(\d+)\.mp4', r'assets/Kurs/wyjasnienia-wideo/\1.mp4', exp)
                    exp = re.sub(r'https://assets\.prawo-jazdy-360\.pl/wyjasnienia-do-pytan-egzaminacyjnych/\d+/(\d+)\.jpg', r'assets/Kurs/wyjasnienia-postery/\1.jpg', exp)
                    
                    norm = normalize_title(title)
                    return i, norm, exp, title
        except Exception as e:
            pass
        return i, None, None, None

    print("Brute forcing ALL IDs to refresh explanations...")
    found_count = 0
    start_time = time.time()
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=30) as executor:
        futures = [executor.submit(check_id, i) for i in range(1, 15000)]
        for future in concurrent.futures.as_completed(futures):
            i, norm, exp, title = future.result()
            if norm and exp:
                best_match = None
                if norm in all_titles:
                    best_match = norm
                else:
                    for missing_title in all_titles.keys():
                        if difflib.SequenceMatcher(None, norm, missing_title).ratio() > 0.95:
                            best_match = missing_title
                            break
                
                if best_match:
                    all_titles[best_match]['explanation'] = exp
                    found_count += 1
                    if found_count % 100 == 0:
                        print(f"Updated {found_count}/{len(all_titles)} explanations...")
                        
    print(f"Done in {time.time() - start_time:.2f}s")
    print(f"Total explanations updated: {found_count}")
    
    new_content = '/* ==========================================================================\n'
    new_content += '   Prawo Jazdy LMS - Course Dataset (Scraped 2185 questions)\n'
    new_content += '   ========================================================================== */\n\n'
    new_content += 'window.COURSE_DATA = ' + json.dumps(course_data, indent=2, ensure_ascii=False) + ';\n'

    with open(COURSE_FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print("Saved to courseData.js")
    
    # Download logic
    def download_file(url, local_path):
        if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
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

    print(f"Downloading {len(videos_to_download)} videos...")
    success = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        results = ex.map(worker_vid, videos_to_download)
        for r in results:
            if r: success += 1
    print(f"Downloaded {success} videos.")

    print(f"Downloading {len(posters_to_download)} posters...")
    success = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        results = ex.map(worker_poster, posters_to_download)
        for r in results:
            if r: success += 1
    print(f"Downloaded {success} posters.")

if __name__ == '__main__':
    main()
