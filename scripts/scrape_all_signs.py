import os
import json
import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
import sys

# Set stdout encoding for Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

CATEGORIES_MAP = [
    ("Znaki nakazu", "https://www.prawo-jazdy-360.pl/znaki-drogowe/znaki-drogowe-nakazu"),
    ("Znaki zakazu", "https://www.prawo-jazdy-360.pl/znaki-drogowe/znaki-drogowe-zakazu"),
    ("Znaki poziome", "https://www.prawo-jazdy-360.pl/znaki-drogowe/znaki-poziome"),
    ("Znaki dodatkowe", "https://www.prawo-jazdy-360.pl/znaki-drogowe/znaki-drogowe-dodatkowe"),
    ("Kontrolki pojazdu", "https://www.prawo-jazdy-360.pl/znaki-drogowe/kontrolki-pojazdu"),
    ("Znaki informacyjne", "https://www.prawo-jazdy-360.pl/znaki-drogowe/znaki-drogowe-informacyjne"),
    ("Znaki ostrzegawcze", "https://www.prawo-jazdy-360.pl/znaki-drogowe/znaki-drogowe-ostrzegawcze"),
    ("Znaki uzupełniające", "https://www.prawo-jazdy-360.pl/znaki-drogowe/znaki-drogowe-uzupelniajace"),
    ("Sygnalizacja świetlna", "https://www.prawo-jazdy-360.pl/znaki-drogowe/znaki-drogowe-sygnalizatory-swietlne"),
    ("Osoba kierująca ruchem", "https://www.prawo-jazdy-360.pl/znaki-drogowe/osoba-kierujaca-ruchem"),
    ("Tabliczki do znaków drogowych", "https://www.prawo-jazdy-360.pl/znaki-drogowe/tabliczki-do-znakow-drogowych"),
    ("Znaki kierunku i miejscowości", "https://www.prawo-jazdy-360.pl/znaki-drogowe/znaki-drogowe-kierunku-i-miejscowosci")
]

def scrape_signs():
    all_signs = []
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    for cat_name, url in CATEGORIES_MAP:
        print(f"Scraping category: {cat_name} -> {url}")
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req) as resp:
                html = resp.read().decode("utf-8")
                
            soup = BeautifulSoup(html, "html.parser")
            rows = soup.find_all("div", class_="table-row")
            
            cat_count = 0
            for r in rows:
                code_el = r.find("h5", class_="clear")
                img_el = r.find("img")
                divs = r.find_all("div", recursive=False)
                
                code = code_el.get_text(strip=True) if code_el else ""
                if not code and len(divs) > 0:
                    code = divs[0].get_text(strip=True)
                    
                img_src = ""
                if img_el:
                    img_src = img_el.get("src") or img_el.get("srcset") or ""
                    if img_src and not img_src.startswith("http"):
                        img_src = f"https://www.prawo-jazdy-360.pl{img_src}"
                        
                name = divs[1].get_text(strip=True) if len(divs) > 1 else ""
                explanation = divs[2].get_text(strip=True) if len(divs) > 2 else name

                if code or name:
                    all_signs.append({
                        "code": code if code else f"{cat_name[:3]}-{cat_count+1}",
                        "name": name if name else code,
                        "category": cat_name,
                        "description": explanation,
                        "image_url": img_src,
                        "svg_icon": None
                    })
                    cat_count += 1
            print(f" -> Extracted {cat_count} signs for category {cat_name}")
        except Exception as e:
            print(f"Error scraping {cat_name}: {e}")

    output_path = os.path.join(os.path.dirname(__file__), "data", "traffic_signs.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_signs, f, ensure_ascii=False, indent=2)

    print(f"\n[SUCCESS] Successfully scraped and saved {len(all_signs)} traffic signs to {output_path}")
    return all_signs

if __name__ == "__main__":
    scrape_signs()
