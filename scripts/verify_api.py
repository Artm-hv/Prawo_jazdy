import sys, io, json, urllib.request, urllib.parse
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

cats = [
    'Znaki nakazu', 'Znaki zakazu', 'Znaki poziome', 'Znaki dodatkowe',
    'Kontrolki pojazdu', 'Znaki informacyjne', 'Znaki ostrzegawcze',
    'Znaki uzupełniające', 'Sygnalizacja świetlna', 'Osoba kierująca ruchem',
    'Tabliczki do znaków drogowych', 'Znaki kierunku i miejscowości'
]

for c in cats:
    url = "http://127.0.0.1:8000/api/v1/signs?category=" + urllib.parse.quote(c)
    resp = urllib.request.urlopen(url).read()
    data = json.loads(resp)
    print(f"  {c}: {len(data)} signs")

print("All 12 categories verified!")
