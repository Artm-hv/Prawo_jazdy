import urllib.request
import json
import sys

url = 'https://www.prawo-jazdy-360.pl/learn/find-question'
headers = {
    'accept': '*/*',
    'accept-language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
    'content-type': 'application/json; charset=UTF-8',
    'cookie': 'cookies_accepted=T; _ga=GA1.1.990641337.1784592065; _360_ts=B; _ga_F6M9MMSWMG=GS2.1.s1785773916$o4$g0$t1785773920$j56$l0$h0; .360.Antiforgery=CfDJ8L8lUAJRcPlNsAEEGYb_Po9__3wCvOTRVZFG_biwR-Npl1jE_XdNG0BxlLToT1UF82uGHPoNgui1Nzdzawsyexgbbh8LrgaLMhs_pmZHDFAklwNNl4P12-2KhVH0fScBlJbs6k6Dty1mruUIvI36u2Y; _360_category=B; _gcl_au=1.1.1542883073.1784592073.2090424386.1786231969.1786232065.405618721.1786231969.1786232065; .AspNetCore._360Auth=CfDJ8L8lUAJRcPlNsAEEGYb_Po92vLRqp0fTIIsDgH8F2FiGB5SetT4AsILjDi98agbO8pm253J7JF5kN2bGohZVB5K_mpW_BgBTsKa_II7U9YUoJ67mfo4m9tPtkzNI8nQPjSZyQ4SgsP0Sqy1Nj5fWrfRMPi_V43795-prqE-6fF3wWr1bqVmosk1kKNZ6yyhw3KBCi1y-_Nq3mCzMh2QIRwAaeLQB9X79PYtT76_m_5doWdwknvPX1akb___cPbLfk4lFBYdEViLSUNVeo0NXbRX5pUlpyNHh_rvPfVxTp1YYzROGLwDa-Cx15GwLecxeb-9XxDEDYabgrfC_CBDhoUiZnDmpeLYzdLXjtHvwQzsX0vXB4-yBFJWfmHHQiRQ1flpujWpEM5QAU_VJBCKf2E-_RZNk55w2z_2bZoOgNTbL_YblwuEl7SnqcL7XiR9zdvEKYGMLARU8BEuqj9S91xA67BL1l0fDJ7DyyIoX1DnR5PAT-rvl3ayNcL1s5gXCw4ijqohlMKSDS-6PJ5Qg-a3XYHSNBh58RceSeCMfRxso77lO-eKfoPCnUU7nL6jqNfxS03lWLbKA0ZlPyFQ4eKPMi4a0WAdXWcYD9O6fc-sTTfjzxOAQoBAeDPtMk-omH_3wcDUizyPF9e4QHK7lwDIEbHhdP62_YB4fBcYcVwN6; _ga_FTJK47GX8H=GS2.1.s1786229462$o63$g1$t1786236053$j38$l0$h323634356',
    'origin': 'https://www.prawo-jazdy-360.pl',
    'referer': 'https://www.prawo-jazdy-360.pl/kurs',
    'requestverificationtoken': 'CfDJ8L8lUAJRcPlNsAEEGYb_Po9GirsGKBvdDUHlADHNiaYkWsG_1WV0SbF1F0fJwQhkHd8P2K0WxXLmmHQh-kwLBgEkV6feW-G0pqhNdbhrroYZb2HYz-SMvybxu9e6dFvqHkh3oM3t_2LUuqfCKfXzSWFQSSnq6PUUXpETpIC7uku_TFIyqn93RDjG9EpXTKnmOQ',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
    'x-requested-with': 'FetchRequest'
}
# search filter test
p = {"draw":0,"type":0,"group":0,"search":"osoba kierująca ruchem ma większą ważność","sessionId":"810da702-7441-4bc2-955c-f1fe6c37eac5","id": None,"filter":False}
data = json.dumps(p).encode('utf-8')
req = urllib.request.Request(url, headers=headers, data=data, method='POST')
try:
    with urllib.request.urlopen(req) as resp:
        body = resp.read().decode('utf-8')
        if "osoba kierująca ruchem" in body:
            print("Found via search!")
        else:
            print("Not found via search. Returning random:")
            if "id pytania" in body:
                print(body.split("id pytania:")[1].split("<")[0].strip())
except Exception as e:
    print(f"Failed - {e}")
