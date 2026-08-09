import urllib.request
import json
import re
import sys
import os
import concurrent.futures
from html.parser import HTMLParser

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
    # Remove all non-alphanumeric chars, lowercased, for robust matching
    t = strip_tags(title).lower()
    return re.sub(r'[^a-z0-9ąćęłńóśźż]', '', t)

def fetch_question(qid):
    p = {"draw":0,"type":0,"group":0,"search":"","sessionId":"810da702-7441-4bc2-955c-f1fe6c37eac5","id": qid,"filter":False}
    data = json.dumps(p).encode('utf-8')
    req = urllib.request.Request(URL, headers=HEADERS, data=data, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.read().decode('utf-8')
    except Exception:
        return None

def extract_data(html):
    if not html: return None
    title_match = re.search(r'<div class="name fx-c">\s*(.*?)\s*</div>', html, re.IGNORECASE | re.DOTALL)
    if not title_match: return None
    title = strip_tags(title_match.group(1)).replace('\n', ' ').strip()
    
    exp_match = re.search(r'<div class="explanation fx-c g-30">(.*?)<div class="f-group">', html, re.IGNORECASE | re.DOTALL)
    explanation_html = ""
    if exp_match:
        explanation_html = '<div class="explanation-content">' + exp_match.group(1).strip() + '</div>'
        explanation_html = explanation_html.replace('src="/images/', 'src="https://www.prawo-jazdy-360.pl/images/')
        explanation_html = explanation_html.replace('srcset="/image/', 'srcset="https://www.prawo-jazdy-360.pl/image/')
        
    return title, explanation_html

def main():
    print("Loading courseData.js...")
    file_path = os.path.join('js', 'data', 'courseData.js')
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    json_str = re.search(r'window\.COURSE_DATA\s*=\s*(\[.*\]);', content, re.DOTALL).group(1)
    course_data = json.loads(json_str)

    # 1. Map questions by known IDs and normalize titles for missing ones
    known_qs = {} # qid -> question_obj
    missing_qs = {} # normalized_title -> question_obj
    
    for module in course_data:
        for q in module['questions']:
            q['explanation'] = "" # reset
            norm_title = normalize_title(q['title'])
            if q.get('mediaUrl') and 'assets/media/' in q['mediaUrl']:
                match = re.search(r'assets/media/(\d+)\.', q['mediaUrl'])
                if match:
                    qid = int(match.group(1))
                    known_qs[qid] = q
                else:
                    missing_qs[norm_title] = q
            else:
                missing_qs[norm_title] = q

    print(f"Total questions: {sum(len(m['questions']) for m in course_data)}")
    print(f"Known IDs: {len(known_qs)}, Missing IDs: {len(missing_qs)}")

    # 2. Fetch known IDs and update the question objects directly
    def process_known(qid):
        if known_qs[qid].get('explanation'):
            return True
        html = fetch_question(qid)
        res = extract_data(html)
        if res:
            title, exp = res
            if exp:
                known_qs[qid]['explanation'] = exp
                return True
        return False

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(process_known, qid): qid for qid in known_qs.keys()}
        fetched_known = 0
        for future in concurrent.futures.as_completed(futures):
            if future.result():
                fetched_known += 1

    print(f"Successfully fetched {fetched_known} explanations from {len(known_qs)} known IDs.")

    # 3. Brute force missing IDs and match by normalized title
    if missing_qs:
        print(f"Brute-forcing {len(missing_qs)} missing questions...")
        def check_id(i):
            html = fetch_question(i)
            res = extract_data(html)
            if res:
                title, exp = res
                if not exp: return i, None, None
                norm = normalize_title(title)
                
                # Fuzzy matching against all missing titles
                best_match = None
                best_ratio = 0
                for missing_title in missing_qs.keys():
                    import difflib
                    ratio = difflib.SequenceMatcher(None, norm, missing_title).ratio()
                    if ratio > best_ratio:
                        best_ratio = ratio
                        best_match = missing_title
                
                if best_ratio > 0.8:
                    return i, best_match, exp, title # Return the correct title too so we can fix it!
            return i, None, None, None

        missing_found = 0
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(check_id, i) for i in range(1, 15000) if i not in known_qs]
            for future in concurrent.futures.as_completed(futures):
                i, matched_norm, exp, correct_title = future.result()
                if matched_norm and exp:
                    if not missing_qs[matched_norm].get('explanation'):
                        missing_qs[matched_norm]['explanation'] = exp
                        # Fix the corrupted title while we're at it!
                        if correct_title:
                            missing_qs[matched_norm]['title'] = correct_title
                        missing_found += 1
                        print(f"Found missing! ID {i} -> {missing_found}/{len(missing_qs)}")
                        if missing_found == len(missing_qs):
                            print("All missing questions found! Stopping.")
                            break

    # Save
    import shutil
    shutil.copyfile(file_path, file_path + '.bak2')
    
    new_content = '/* ==========================================================================\n'
    new_content += '   Prawo Jazdy LMS - Course Dataset (Scraped 2185 questions)\n'
    new_content += '   ========================================================================== */\n\n'
    new_content += 'window.COURSE_DATA = ' + json.dumps(course_data, indent=2, ensure_ascii=False) + ';\n'

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print("Done!")

if __name__ == '__main__':
    main()
