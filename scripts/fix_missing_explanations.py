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
    return re.sub(r'[^a-z0-9ąćęłńóśźż]', '', t)

def main():
    print("Loading courseData.js...")
    with open(COURSE_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    json_str = re.search(r'window\.COURSE_DATA\s*=\s*(\[.*\]);', content, re.DOTALL).group(1)
    course_data = json.loads(json_str)

    missing_qs = {}
    known_qs = {}
    
    for module in course_data:
        for q in module['questions']:
            norm_title = normalize_title(q['title'])
            if not q.get('explanation') or not q['explanation'].strip():
                missing_qs[norm_title] = q
            else:
                known_qs[norm_title] = q

    print(f"Missing explanations: {len(missing_qs)}")
    if len(missing_qs) == 0:
        print("Nothing to do!")
        return

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
                    
                    # Fix local paths
                    exp = exp.replace('src="/images/', 'src="assets/Znaki_Drogowe/')
                    exp = exp.replace('srcset="/image/', 'srcset="assets/Znaki_Drogowe/')
                    exp = exp.replace('https://www.prawo-jazdy-360.pl/images/znaki-drogowe/', 'assets/Znaki_Drogowe/')
                    exp = exp.replace('https://www.prawo-jazdy-360.pl/image/znaki-drogowe/', 'assets/Znaki_Drogowe/')
                    exp = re.sub(r'https://assets\.prawo-jazdy-360\.pl/wyjasnienia-do-pytan-egzaminacyjnych/\d+/mp4/std/(\d+)\.mp4', r'assets/Kurs/wyjasnienia-wideo/\1.mp4', exp)
                    exp = re.sub(r'https://assets\.prawo-jazdy-360\.pl/wyjasnienia-do-pytan-egzaminacyjnych/\d+/(\d+)\.jpg', r'assets/Kurs/wyjasnienia-postery/\1.jpg', exp)
                    
                    norm = normalize_title(title)
                    return i, norm, exp, title
        except Exception as e:
            pass
        return i, None, None, None

    print("Brute forcing IDs from 1 to 15000...")
    found_count = 0
    start_time = time.time()
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=30) as executor:
        futures = [executor.submit(check_id, i) for i in range(1, 15000)]
        for future in concurrent.futures.as_completed(futures):
            i, norm, exp, title = future.result()
            if norm and exp:
                best_match = None
                
                if norm in missing_qs:
                    best_match = norm
                else:
                    # Fuzzy match if not exact
                    best_ratio = 0
                    for missing_title in missing_qs.keys():
                        ratio = difflib.SequenceMatcher(None, norm, missing_title).ratio()
                        if ratio > 0.90:
                            best_ratio = ratio
                            best_match = missing_title
                
                if best_match:
                    if not missing_qs[best_match].get('explanation'):
                        missing_qs[best_match]['explanation'] = exp
                        missing_qs[best_match]['title'] = title
                        found_count += 1
                        safe_title = title[:40].encode('ascii', 'replace').decode('ascii')
                        print(f"[{found_count}/{len(missing_qs)}] Found match for: {safe_title}... (ID: {i})")
                        
                        if found_count >= len(missing_qs):
                            print("All missing explanations found!")
                            # Cancel remaining futures
                            for f in futures:
                                f.cancel()
                            break

    print(f"Done in {time.time() - start_time:.2f}s")
    print(f"Total found this run: {found_count}")
    
    # Save back
    new_content = '/* ==========================================================================\n'
    new_content += '   Prawo Jazdy LMS - Course Dataset (Scraped 2185 questions)\n'
    new_content += '   ========================================================================== */\n\n'
    new_content += 'window.COURSE_DATA = ' + json.dumps(course_data, indent=2, ensure_ascii=False) + ';\n'

    with open(COURSE_FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print("Saved to courseData.js")

if __name__ == '__main__':
    main()
