import requests
from bs4 import BeautifulSoup
import json
import os
import re
import urllib.request
import concurrent.futures

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIGNS_FILE = os.path.join(BASE_DIR, 'js', 'data', 'signsData.js')

def main():
    print("Fetching categories...")
    r = requests.get('https://www.prawo-jazdy-360.pl/znaki-drogowe')
    soup = BeautifulSoup(r.text, 'html.parser')
    
    # Extract links
    cat_links = []
    for a in soup.find_all('a', href=True):
        if '/znaki-drogowe/' in a['href'] and a['href'] != '/znaki-drogowe':
            if a['href'] not in [c['url'] for c in cat_links]:
                cat_links.append({
                    'title': a.text.strip() if a.text.strip() else a['href'].split('/')[-1].replace('-', ' ').title(),
                    'url': a['href']
                })
    
    print(f"Found {len(cat_links)} categories.")
    
    all_signs_data = []
    images_to_download = set()
    
    for cat in cat_links:
        cat_url = f"https://www.prawo-jazdy-360.pl{cat['url']}"
        cat_slug = cat['url'].split('/')[-1]
        
        safe_title = cat['title'].encode('ascii', 'replace').decode('ascii')
        print(f"Processing category: {safe_title} ({cat_slug})")
        
        cr = requests.get(cat_url)
        csoup = BeautifulSoup(cr.text, 'html.parser')
        
        signs_in_cat = []
        
        # We strictly find the table rows that contain signs to avoid mockups
        table_rows = csoup.find_all('div', class_='table-row')
        for row in table_rows:
            img = row.find('img')
            if not img:
                continue
                
            src = img.get('src')
            if not src:
                continue
                
            symbol_div = row.find('div', class_='symbol')
            sign_id = symbol_div.text.strip() if symbol_div else img.get('title', '').split(' ')[-1]
            
            name_div = row.find('div', class_='name')
            sign_name = name_div.text.strip() if name_div else ''
            
            desc_div = row.find('div', class_='desc')
            desc = desc_div.text.strip() if desc_div else ''
            # Clean up desc
            desc = re.sub(r'\s+', ' ', desc)
            
            filename = src.split('/')[-1]
            local_png = f"assets/Znaki_Drogowe/{cat_slug}/{filename}"
            local_webp = local_png.replace('.png', '.webp')
            
            signs_in_cat.append({
                'id': sign_id,
                'name': sign_name,
                'description': desc,
                'imageUrl': local_webp,
                'fallbackUrl': local_png
            })
            
            images_to_download.add((src, local_png))
            
            pic = row.find('picture')
            if pic:
                source = pic.find('source')
                if source and source.get('srcset'):
                    images_to_download.add((source.get('srcset'), local_webp))
                
        if signs_in_cat:
            all_signs_data.append({
                'categoryName': cat_slug.replace('-', ' ').title(),
                'categorySlug': cat_slug,
                'signs': signs_in_cat
            })
            
    print(f"Extracted {sum(len(c['signs']) for c in all_signs_data)} signs across {len(all_signs_data)} categories.")
    
    # Save JS file
    js_content = '/* ==========================================================================\n'
    js_content += '   Prawo Jazdy LMS - Full Road Signs Database\n'
    js_content += '   ========================================================================== */\n\n'
    js_content += 'window.SIGNS_DATA = ' + json.dumps(all_signs_data, indent=2, ensure_ascii=False) + ';\n'
    
    os.makedirs(os.path.dirname(SIGNS_FILE), exist_ok=True)
    with open(SIGNS_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)
    print("Saved signsData.js")
    
    # Download images
    def download_img(item):
        remote_url, local_path = item
        if not remote_url.startswith('http'):
            remote_url = f"https://www.prawo-jazdy-360.pl{remote_url}"
            
        full_local = os.path.join(BASE_DIR, local_path.replace('/', os.sep))
        if os.path.exists(full_local) and os.path.getsize(full_local) > 0:
            return True
            
        os.makedirs(os.path.dirname(full_local), exist_ok=True)
        headers = {'User-Agent': 'Mozilla/5.0'}
        req = urllib.request.Request(remote_url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=10) as response, open(full_local, 'wb') as out:
                out.write(response.read())
            return True
        except Exception:
            return False

    print(f"Downloading {len(images_to_download)} images...")
    success = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
        results = ex.map(download_img, images_to_download)
        for r in results:
            if r: success += 1
            
    print(f"Downloaded {success} images.")

if __name__ == '__main__':
    main()
