import json
import os
import re
import urllib.request
import concurrent.futures
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEXTBOOK_FILE = os.path.join(BASE_DIR, 'js', 'data', 'textbookData.js')
IMG_DIR = os.path.join(BASE_DIR, 'assets', 'Podrecznik', 'img')
IMG_DIR_WEB = 'assets/Podrecznik/img'

def main():
    print("Reading textbookData.js...")
    with open(TEXTBOOK_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Extract the JSON array
    match = re.search(r'window\.TEXTBOOK_DATA\s*=\s*(\[.*\]);', content, re.DOTALL)
    if not match:
        print("Could not find TEXTBOOK_DATA array.")
        return
        
    data = json.loads(match.group(1))
    
    images_to_download = []
    
    # We will track all valid new files to avoid deleting them during cleanup
    valid_new_files = set()
    
    print("Parsing chapters and topics...")
    for chap in data:
        for idx, topic in enumerate(chap.get('topics', [])):
            html = topic.get('content', '')
            if not html:
                continue
                
            # Find audio track to use as prefix
            audio_match = re.search(r'<source\s+src=[\'"]assets/Podrecznik/audio/([^\'"]+)\.mp3[\'"]', html)
            if audio_match:
                prefix = audio_match.group(1)
            else:
                # Fallback if no audio found
                prefix = f"chap{chap.get('id')}_topic{idx+1}"
                
            # Find all images
            img_tags = re.findall(r'<img[^>]+src=[\'"]([^\'"]+)[\'"][^>]*>', html)
            if not img_tags:
                continue
                
            for img_idx, old_src in enumerate(img_tags):
                ext = '.jpg'
                if '.png' in old_src.lower():
                    ext = '.png'
                elif '.webp' in old_src.lower():
                    ext = '.webp'
                elif '.gif' in old_src.lower():
                    ext = '.gif'
                    
                new_filename = f"{prefix}.jpg" if len(img_tags) == 1 else f"{prefix}-{img_idx+1}.jpg"
                new_filename = new_filename.replace('.jpg', ext)
                
                new_src = f"{IMG_DIR_WEB}/{new_filename}"
                
                # Replace in HTML
                html = html.replace(old_src, new_src)
                
                images_to_download.append((old_src, new_src))
                valid_new_files.add(new_filename)
                
            topic['content'] = html
            
    print(f"Found {len(images_to_download)} images to process.")
    
    # Save the updated JSON
    print("Saving updated textbookData.js...")
    new_js_content = '/* ==========================================================================\n'
    new_js_content += '   Prawo Jazdy LMS - Textbook Data\n'
    new_js_content += '   ========================================================================== */\n\n'
    new_js_content += 'window.TEXTBOOK_DATA = ' + json.dumps(data, indent=2, ensure_ascii=False) + ';\n'
    
    # Create backup first
    import shutil
    shutil.copy2(TEXTBOOK_FILE, TEXTBOOK_FILE + '.imgbak')
    
    with open(TEXTBOOK_FILE, 'w', encoding='utf-8') as f:
        f.write(new_js_content)
        
    # Download images
    def download_img(item):
        remote_url, local_path = item
        if not remote_url.startswith('http'):
            if remote_url.startswith('assets/'):
                # It's an old local file, we can just copy or rename it if it exists
                old_local = os.path.join(BASE_DIR, remote_url.replace('/', os.sep))
                full_local = os.path.join(BASE_DIR, local_path.replace('/', os.sep))
                if os.path.exists(old_local) and old_local != full_local:
                    try:
                        shutil.copy2(old_local, full_local)
                        return True
                    except Exception as e:
                        pass
                
            # If it's missing or relative to root
            remote_url = f"https://www.prawo-jazdy-360.pl/{remote_url.lstrip('/')}"
            
        full_local = os.path.join(BASE_DIR, local_path.replace('/', os.sep))
        if os.path.exists(full_local) and os.path.getsize(full_local) > 0:
            # If already downloaded in this pass, skip
            # But wait, we might have multiple topics using the same image? Yes.
            return True
            
        os.makedirs(os.path.dirname(full_local), exist_ok=True)
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        req = urllib.request.Request(remote_url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=10) as response, open(full_local, 'wb') as out:
                out.write(response.read())
            return True
        except Exception as e:
            print(f"Failed {remote_url}: {e}")
            return False

    print(f"Downloading/copying {len(images_to_download)} images...")
    success = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
        results = ex.map(download_img, images_to_download)
        for r in results:
            if r: success += 1
            
    print(f"Processed {success} images successfully.")

    # Cleanup old randomly named files
    print("Cleaning up old image files...")
    deleted = 0
    if os.path.exists(IMG_DIR):
        for f in os.listdir(IMG_DIR):
            if f not in valid_new_files:
                p = os.path.join(IMG_DIR, f)
                if os.path.isfile(p):
                    os.remove(p)
                    deleted += 1
                    
    print(f"Deleted {deleted} old files.")

if __name__ == '__main__':
    main()
