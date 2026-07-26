import sys, io, re, json
from bs4 import BeautifulSoup

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('backend/lectures_sample.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

# Search for links or lists inside the chapters container
accordion = soup.find(class_=re.compile(r'wyklady|accordion|chapters|sidebar|content', re.I))

print("=== Looking for anchors and lecture links in sample HTML ===")
anchors = soup.find_all('a', href=re.compile(r'wyklady|link='))
print(f"Found {len(anchors)} lecture anchors with links. Sample:")
for a in anchors[:15]:
    print(f"   href: {a['href']} -> text: {a.get_text().strip()}")

# Look for JavaScript objects or JSON in scripts containing slide/lecture info
print("\n=== Searching scripts for JSON/JS objects ===")
scripts = soup.find_all('script')
for idx, s in enumerate(scripts):
    text = s.string or s.text
    if text and ('dzial' in text.lower() or 'wyklady' in text.lower() or 'slajd' in text.lower()):
        print(f"Script #{idx} (len {len(text)}):")
        # Print lines that look like data
        for line in text.split('\n'):
            if any(k in line.lower() for k in ['link', 'dzial', 'slajd', 'lekcja', 'title', 'images']):
                print("   ", line.strip()[:120])
