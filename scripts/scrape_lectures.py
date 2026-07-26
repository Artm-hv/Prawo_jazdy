import urllib.request
import re, sys, io
from bs4 import BeautifulSoup

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

url = "https://www.prawo-jazdy-360.pl/wyklady?link=wiadomosci-wstepne/kategoria-a1"
req = urllib.request.Request(url, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
})

try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        # Save HTML snippet to debug file
        with open('backend/lectures_sample.html', 'w', encoding='utf-8') as f:
            f.write(html)
            
        print(f"Saved full HTML ({len(html)} bytes) to backend/lectures_sample.html")
        
        # Find all headings, accordion headers, slide content elements
        for tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'p']:
            els = soup.find_all(tag)
            if els:
                print(f"Tag <{tag}> ({len(els)} found). First 5:")
                for e in els[:5]:
                    text = e.get_text().strip()
                    if text:
                        print(f"   - {text[:80]}")
                        
except Exception as e:
    print(f"Error: {e}")
