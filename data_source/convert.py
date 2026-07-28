import pandas as pd
import re
import json
import os

SRC = os.path.dirname(__file__)
OUT = os.path.join(SRC, '..', 'data', 's2b-top100.json')

files = [f for f in os.listdir(SRC) if f.endswith('.xls')]

all_months = {}
region_cols = ['강원','경기','경남','경북','광주','대구','대전','부산','서울','세종','울산','인천','전남','전북','제주','충남','충북']

for fname in files:
    m = re.match(r'(\d{4})년(\d{1,2})월', fname)
    if not m:
        continue
    year, month = int(m.group(1)), int(m.group(2))
    key = f'{year}-{month:02d}'
    df = pd.read_html(os.path.join(SRC, fname), encoding='euc-kr')[0]
    rows = []
    for _, r in df.iterrows():
        rows.append({
            'rank': int(r['순번']),
            'name': str(r['상품명']),
            'cat1': str(r['1차카테고리']),
            'cat2': str(r['2차카테고리']),
            'cat3': str(r['3차카테고리']),
            'contracts': int(r['계약건수']),
            'qty': int(r['판매수량']),
        })
    all_months[key] = rows

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(all_months, f, ensure_ascii=False, indent=0)

print('months:', sorted(all_months.keys()))
print('total rows:', sum(len(v) for v in all_months.values()))
print('output size bytes:', os.path.getsize(OUT))
