import sqlite3, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
conn = sqlite3.connect('prawo_jazdy.db')
cur = conn.cursor()
cur.execute("SELECT category, COUNT(*) FROM traffic_signs GROUP BY category ORDER BY category")
rows = cur.fetchall()
total = 0
for cat, cnt in rows:
    print(f"  '{cat}' => {cnt}")
    total += cnt
print(f"Total in DB: {total}")
conn.close()
