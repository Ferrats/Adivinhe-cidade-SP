"""Generate the SP catalog from the pinned CSV and an official IBGE JSON snapshot.
Usage: python scripts/import-municipalities.py MUNICIPIOS.csv IBGE-SP.json
See README for source URLs, pinned revision and license.
"""
import csv
import gzip
import json
from pathlib import Path
import sys

raw = Path(sys.argv[2]).read_bytes()
if raw[:2] == b'\x1f\x8b':
    raw = gzip.decompress(raw)
official = {row['id']: row['nome'] for row in json.loads(raw)}
rows = [
    {'id': int(row['codigo_ibge']), 'name': official[int(row['codigo_ibge'])],
     'center': [float(row['longitude']), float(row['latitude'])]}
    for row in csv.DictReader(Path(sys.argv[1]).open(encoding='utf-8'))
    if row['codigo_uf'] == '35'
]
assert len(rows) == 645 and {row['id'] for row in rows} == official.keys()
rows.sort(key=lambda row: row['id'])
output = Path(__file__).resolve().parents[1] / 'src' / 'municipalities.json'
output.write_text('[\n' + ',\n'.join('  ' + json.dumps(row, ensure_ascii=False, separators=(',', ':')) for row in rows) + '\n]\n', encoding='utf-8')
print(f'Generated {len(rows)} municipalities; IDs checked against IBGE.')
