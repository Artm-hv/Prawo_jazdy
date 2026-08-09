import json
import os
import re
import urllib.request
import concurrent.futures

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LECTURES_FILE = os.path.join(BASE_DIR, 'js', 'data', 'lecturesData.js')
SLAJDY_DIR = os.path.join(BASE_DIR, 'assets', 'Wyklady', 'slajdy')

def main():
    print("Reading lecturesData.js...")
    with open(LECTURES_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
        
    match = re.search(r'\[.*\]', content, re.DOTALL)
    data = json.loads(match.group(0))
    
    downloads = []
    
    for m in data:
        for l in m.get('lessons', []):
            for s in l.get('slides', []):
                media = s.get('mediaUrl')
                if media and media.startswith('http'):
                    filename = media.split('/')[-1]
                    local_path = f"assets/Wyklady/slajdy/{filename}"
                    downloads.append((media, local_path))
                    s['mediaUrl'] = local_path
                    
    print(f"Found {len(downloads)} missing media files to download.")
    
    if downloads:
        import shutil
        shutil.copy2(LECTURES_FILE, LECTURES_FILE + '.bak')
        
        # Save updated JSON
        new_js_content = '/* ==========================================================================\n'
        new_js_content += '   Prawo Jazdy LMS - Lectures Data\n'
        new_js_content += '   ========================================================================== */\n\n'
        new_js_content += 'window.LECTURES_DATA = ' + json.dumps(data, indent=2, ensure_ascii=False) + ';\n'
        with open(LECTURES_FILE, 'w', encoding='utf-8') as f:
            f.write(new_js_content)
            
        # Download files
        def download_file(item):
            remote_url, local_path = item
            full_local = os.path.join(BASE_DIR, local_path.replace('/', os.sep))
            if os.path.exists(full_local) and os.path.getsize(full_local) > 0:
                return True
                
            os.makedirs(os.path.dirname(full_local), exist_ok=True)
            headers = {'User-Agent': 'Mozilla/5.0'}
            req = urllib.request.Request(remote_url, headers=headers)
            try:
                with urllib.request.urlopen(req, timeout=15) as response, open(full_local, 'wb') as out:
                    out.write(response.read())
                return True
            except Exception as e:
                print(f"Failed {remote_url}: {e}")
                return False
                
        success = 0
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
            results = ex.map(download_file, downloads)
            for r in results:
                if r: success += 1
        print(f"Downloaded {success}/{len(downloads)} files.")
    else:
        print("Everything is already local!")

if __name__ == '__main__':
    main()
