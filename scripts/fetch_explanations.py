import urllib.request
import json
import re
import sys
import os
import concurrent.futures
from html.parser import HTMLParser

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

URL = 'https://www.prawo-jazdy-360.pl/learn/find-question'
HEADERS = {
    'accept': '*/*',
    'accept-language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
    'content-type': 'application/json; charset=UTF-8',
    'cookie': 'cookies_accepted=T; _ga=GA1.1.990641337.1784592065; _360_ts=B; _ga_F6M9MMSWMG=GS2.1.s1785773916$o4$g0$t1785773920$j56$l0$h0; .360.Antiforgery=CfDJ8L8lUAJRcPlNsAEEGYb_Po9__3wCvOTRVZFG_biwR-Npl1jE_XdNG0BxlLToT1UF82uGHPoNgui1Nzdzawsyexgbbh8LrgaLMhs_pmZHDFAklwNNl4P12-2KhVH0fScBlJbs6k6Dty1mruUIvI36u2Y; _360_category=B; _gcl_au=1.1.1542883073.1784592073.2090424386.1786231969.1786232065.405618721.1786231969.1786232065; .AspNetCore._360Auth=CfDJ8L8lUAJRcPlNsAEEGYb_Po92vLRqp0fTIIsDgH8F2FiGB5SetT4AsILjDi98agbO8pm253J7JF5kN2bGohZVB5K_mpW_BgBTsKa_II7U9YUoJ67mfo4m9tPtkzNI8nQPjSZyQ4SgsP0Sqy1Nj5fWrfRMPi_V43795-prqE-6fF3wWr1bqVmosk1kKNZ6yyhw3KBCi1y-_Nq3mCzMh2QIRwAaeLQB9X79PYtT76_m_5doWdwknvPX1akb___cPbLfk4lFBYdEViLSUNVeo0NXbRX5pUlpyNHh_rvPfVxTp1YYzROGLwDa-Cx15GwLecxeb-9XxDEDYabgrfC_CBDhoUiZnDmpeLYzdLXjtHvwQzsX0vXB4-yBFJWfmHHQiRQ1flpujWpEM5QAU_VJBCKf2E-_RZNk55w2z_2bZoOgNTbL_YblwuEl7SnqcL7XiR9zdvEKYGMLARU8BEuqj9S91xA67BL1l0fDJ7DyyIoX1DnR5PAT-rvl3ayNcL1s5gXCw4ijqohlMKSDS-6PJ5Qg-a3XYHSNBh58RceSeCMfRxso77lO-eKfoPCnUU7nL6jqNfxS03lWLbKA0ZlPyFQ4eKPMi4a0WAdXWcYD9O6fc-sTTfjzxOAQoBAeDPtMk-omH_3wcDUizyPF9e4QHK7lwDIEbHhdP62_YB4fBcYcVwN6; _ga_FTJK47GX8H=GS2.1.s1786229462$o63$g1$t1786236053$j38$l0$h323634356',
    'origin': 'https://www.prawo-jazdy-360.pl',
    'referer': 'https://www.prawo-jazdy-360.pl/kurs',
    'requestverificationtoken': 'CfDJ8L8lUAJRcPlNsAEEGYb_Po9GirsGKBvdDUHlADHNiaYkWsG_1WV0SbF1F0fJwQhkHd8P2K0WxXLmmHQh-kwLBgEkV6feW-G0pqhNdbhrroYZb2HYz-SMvybxu9e6dFvqHkh3oM3t_2LUuqfCKfXzSWFQSSnq6PUUXpETpIC7uku_TFIyqn93RDjG9EpXTKnmOQ',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
    'x-requested-with': 'FetchRequest'
}

class Stripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.strict = False
        self.convert_charrefs= True
        self.text = []
    def handle_data(self, d):
        self.text.append(d)
    def get_data(self):
        return "".join(self.text).strip()

def strip_tags(html):
    s = Stripper()
    s.feed(html)
    return s.get_data()

def fetch_question(qid):
    p = {"draw":0,"type":0,"group":0,"search":"","sessionId":"810da702-7441-4bc2-955c-f1fe6c37eac5","id": qid,"filter":False}
    data = json.dumps(p).encode('utf-8')
    req = urllib.request.Request(URL, headers=HEADERS, data=data, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode('utf-8')
            return body
    except Exception as e:
        return None

def extract_data(html):
    if not html: return None
    # Extract title
    title_match = re.search(r'<div class="name fx-c">\s*(.*?)\s*</div>', html, re.IGNORECASE | re.DOTALL)
    if not title_match:
        return None
    title = strip_tags(title_match.group(1)).replace('\n', ' ').replace('\r', ' ').strip()
    
    # Extract explanation block
    exp_match = re.search(r'<div class="explanation fx-c g-30">(.*?)<div class="f-group">', html, re.IGNORECASE | re.DOTALL)
    explanation_html = ""
    if exp_match:
        explanation_html = '<div class="explanation-content">' + exp_match.group(1).strip() + '</div>'
        # clean up image paths in explanation
        explanation_html = explanation_html.replace('src="/images/', 'src="https://www.prawo-jazdy-360.pl/images/')
        explanation_html = explanation_html.replace('srcset="/image/', 'srcset="https://www.prawo-jazdy-360.pl/image/')
        
    return title, explanation_html

def main():
    print("Loading courseData.js...")
    file_path = os.path.join('js', 'data', 'courseData.js')
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Parse JSON
    json_str = re.search(r'window\.COURSE_DATA\s*=\s*(\[.*\]);', content, re.DOTALL).group(1)
    course_data = json.loads(json_str)

    # 1. Collect all known IDs from mediaUrl
    known_ids = {}
    missing_titles = set()
    total_questions = 0

    for module in course_data:
        for q in module['questions']:
            total_questions += 1
            if q.get('mediaUrl') and 'assets/media/' in q['mediaUrl']:
                match = re.search(r'assets/media/(\d+)\.', q['mediaUrl'])
                if match:
                    qid = int(match.group(1))
                    known_ids[qid] = q
                else:
                    missing_titles.add(q['title'].strip())
            else:
                missing_titles.add(q['title'].strip())

    print(f"Total questions: {total_questions}")
    print(f"Questions with known IDs: {len(known_ids)}")
    print(f"Questions missing IDs: {len(missing_titles)}")

    fetched_explanations = {} # title -> html

    print("Fetching known IDs...")
    def process_known(qid):
        html = fetch_question(qid)
        if html:
            res = extract_data(html)
            if res:
                title, exp = res
                fetched_explanations[title] = exp
                return True
        return False

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(process_known, qid): qid for qid in known_ids.keys()}
        done_count = 0
        for future in concurrent.futures.as_completed(futures):
            if future.result():
                done_count += 1
            if done_count % 100 == 0:
                print(f"Fetched {done_count}/{len(known_ids)}")

    print(f"Successfully fetched {len(fetched_explanations)} explanations from known IDs.")

    # Check how many missing are still missing
    still_missing = missing_titles - set(fetched_explanations.keys())
    print(f"Still missing explanations for {len(still_missing)} questions.")

    if len(still_missing) > 0:
        print("Brute-forcing remaining IDs from 1 to 20000...")
        def check_id(i):
            html = fetch_question(i)
            res = extract_data(html)
            if res:
                title, exp = res
                return i, title, exp
            return i, None, None

        # To avoid overloading, we'll only do it until we find all missing
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(check_id, i) for i in range(1, 20000) if i not in known_ids]
            checked = 0
            for future in concurrent.futures.as_completed(futures):
                checked += 1
                i, title, exp = future.result()
                if title and title in still_missing:
                    fetched_explanations[title] = exp
                    still_missing.remove(title)
                    print(f"Found missing! ID {i}: {title[:30]}... ({len(still_missing)} left)")
                    if len(still_missing) == 0:
                        print("All missing questions found! Stopping brute-force.")
                        break
                if checked % 500 == 0:
                    print(f"Brute-forced {checked} IDs...")

    # Now update the courseData
    print("Updating courseData.js...")
    updated_count = 0
    for module in course_data:
        for q in module['questions']:
            title = q['title'].strip()
            if title in fetched_explanations:
                q['explanation'] = fetched_explanations[title]
                updated_count += 1

    print(f"Updated {updated_count} questions.")

    # Save backup
    import shutil
    shutil.copyfile(file_path, file_path + '.bak')

    # Write new JSON
    new_content = '/* ==========================================================================\n'
    new_content += '   Prawo Jazdy LMS - Course Dataset (Scraped 2185 questions)\n'
    new_content += '   ========================================================================== */\n\n'
    new_content += 'window.COURSE_DATA = ' + json.dumps(course_data, indent=2, ensure_ascii=False) + ';\n'

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print("Done!")

if __name__ == '__main__':
    main()
