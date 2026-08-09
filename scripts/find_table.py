import requests
from bs4 import BeautifulSoup
import re

r = requests.get('https://www.prawo-jazdy-360.pl/znaki-drogowe/znaki-drogowe-nakazu')
soup = BeautifulSoup(r.text, 'html.parser')
el = soup.find(string=re.compile('WYGL', re.I))
parent = el.parent
while parent and parent.name != 'body':
    if parent.get('class'):
        print(parent.name, parent.get('class'))
    parent = parent.parent
