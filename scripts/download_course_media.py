import os
import re
import urllib.request
import concurrent.futures
import shutil

# Configuration
COURSE_DATA_FILE = os.path.join("js", "data", "courseData.js")
COURSE_DATA_BACKUP = os.path.join("js", "data", "courseData.backup.js")
MEDIA_DIR = os.path.join("assets", "media")

def download_file(url, target_path):
    if os.path.exists(target_path):
        return True # Already downloaded
    try:
        # Add a realistic User-Agent to avoid 403 Forbidden
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(target_path, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False

def main():
    if not os.path.exists(COURSE_DATA_FILE):
        print(f"Error: {COURSE_DATA_FILE} not found.")
        return

    # Create backup
    if not os.path.exists(COURSE_DATA_BACKUP):
        shutil.copy2(COURSE_DATA_FILE, COURSE_DATA_BACKUP)
        print(f"Created backup at {COURSE_DATA_BACKUP}")

    os.makedirs(MEDIA_DIR, exist_ok=True)

    with open(COURSE_DATA_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all mediaUrls matching the remote domain
    pattern = r'"mediaUrl":\s*"(https://www\.prawo-jazdy-360\.pl/[^"]+?/([^"/]+\.(jpg|mp4|jpeg|png)))"'
    matches = re.findall(pattern, content)

    downloads = []
    # matches will be tuples: (full_url, filename, extension)
    
    new_content = content
    for match in matches:
        full_url = match[0]
        filename = match[1]
        target_path = os.path.join(MEDIA_DIR, filename)
        
        downloads.append((full_url, target_path))
        
        # Replace in content
        new_content = new_content.replace(full_url, f"assets/media/{filename}")

    # Deduplicate downloads
    downloads = list(set(downloads))
    print(f"Found {len(downloads)} unique media files to download.")

    # Download in parallel
    max_workers = 10
    completed = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_url = {executor.submit(download_file, url, path): url for url, path in downloads}
        for future in concurrent.futures.as_completed(future_to_url):
            url = future_to_url[future]
            try:
                success = future.result()
                if success:
                    completed += 1
                    if completed % 100 == 0:
                        print(f"Downloaded {completed}/{len(downloads)} files...")
            except Exception as exc:
                print(f'{url} generated an exception: {exc}')

    print(f"Finished downloading {completed}/{len(downloads)} files.")

    # Save the updated course data
    with open(COURSE_DATA_FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Updated {COURSE_DATA_FILE} to use local media paths.")

if __name__ == "__main__":
    main()
