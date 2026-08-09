import requests
from bs4 import BeautifulSoup
import json
import re

email = 'artemgizovskij@gmail.com'
password = 'No9n464gahog'

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
})

# 1. Get login page
print("Getting login page...")
r = session.get('https://www.prawo-jazdy-360.pl/logowanie')
soup = BeautifulSoup(r.text, 'html.parser')
token = soup.find('input', {'name': '__RequestVerificationToken'})['value']

# 2. Login
print("Logging in...")
login_data = {
    '__RequestVerificationToken': token,
    'Email': email,
    'Password': password,
    'RememberMe': 'false'
}
r = session.post('https://www.prawo-jazdy-360.pl/logowanie', data=login_data)

if 'Wyloguj' in r.text or '/wyloguj' in r.text:
    print("Login successful!")
else:
    print("Login failed!")
    exit(1)

# 3. Get /kurs to find the API verification token
r = session.get('https://www.prawo-jazdy-360.pl/kurs')
soup = BeautifulSoup(r.text, 'html.parser')
api_token = soup.find('input', {'name': '__RequestVerificationToken'})['value']
print(f"API Token: {api_token[:20]}...")

# 4. Try fetching a question (e.g. ID 2091)
url = 'https://www.prawo-jazdy-360.pl/learn/find-question'
headers = {
    'accept': '*/*',
    'content-type': 'application/json; charset=UTF-8',
    'origin': 'https://www.prawo-jazdy-360.pl',
    'referer': 'https://www.prawo-jazdy-360.pl/kurs',
    'requestverificationtoken': api_token,
    'x-requested-with': 'FetchRequest'
}
payload = {"draw":0,"type":0,"group":0,"search":"","sessionId":"810da702-7441-4bc2-955c-f1fe6c37eac5","id": 2091,"filter":False}

r = session.post(url, json=payload, headers=headers)
print(f"Status: {r.status_code}")
if r.status_code == 200:
    print("Success! Response size:", len(r.text))
    if 'explanation' in r.text.lower():
        print("Explanation found in response!")
else:
    print(r.text)
