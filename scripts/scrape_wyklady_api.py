import urllib.request
import json, re, sys, io
from bs4 import BeautifulSoup

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Try fetching specific subpages/links or API endpoints
links_to_test = [
    "https://www.prawo-jazdy-360.pl/wyklady?link=wiadomosci-wstepne/kategoria-a1",
    "https://www.prawo-jazdy-360.pl/wyklady?link=wiadomosci-wstepne/informacje-ogolne",
    "https://www.prawo-jazdy-360.pl/api/wyklady",
    "https://www.prawo-jazdy-360.pl/wyklady/get-data"
]

for url in links_to_test:
    print(f"\n--- Testing URL: {url} ---")
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'X-Requested-With': 'XMLHttpRequest'
    })
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            print(f"Status: {resp.status}, Content Length: {len(content)}")
            if content.startswith('{') or content.startswith('['):
                print("JSON Response:", content[:300])
            else:
                soup = BeautifulSoup(content, 'html.parser')
                print("Title:", soup.title.string if soup.title else "No title")
                # Find all text content or slide images
                imgs = soup.find_all('img')
                print(f"Images count: {len(imgs)}")
                for img in imgs[:5]:
                    print("  Img:", img.get('src'), "| alt:", img.get('alt'))
    except Exception as e:
        print(f"Failed: {e}")
