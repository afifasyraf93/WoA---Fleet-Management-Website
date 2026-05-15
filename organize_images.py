#!/usr/bin/env python3
"""
organize_images.py — Copy WoA aircraft & airport textures to images/ folder.

Since AssetStudio exports files named like "A333 RR Base render.png",
this script extracts the ICAO/IATA from the filename directly (first word)
and copies to images/aircraft/A333.png etc.

Run: py organize_images.py
"""

import os, shutil, re
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────
BASE_DIR     = Path(r"D:\Projek\WoA---Fleet-Management-Website\data\asset\Texture2D")
AC_SOURCE    = BASE_DIR / "aircraft"
AP_SOURCE    = BASE_DIR / "airport"
SCRIPT_DIR   = Path(__file__).parent
AIRCRAFT_DIR = SCRIPT_DIR / "images" / "aircraft"
AIRPORT_DIR  = SCRIPT_DIR / "images" / "airports"

AIRCRAFT_DIR.mkdir(parents=True, exist_ok=True)
AIRPORT_DIR.mkdir(parents=True, exist_ok=True)

# ── Known WoA ICAO codes (to validate matches) ────────────────
VALID_ICAO = {
    'A124','A19N','A20N','A21N','A21NX','A21NY','A225',
    'A306','A306F','A30BF','A318','A319','A319IAE',
    'A320','A320IAE','A321','A321F','A332','A332F','A332P2F',
    'A333','A333P2F','A338','A339','A343','A346',
    'A359','A35K','A380','A388','A3ST',
    'AN12','AN22',
    'AT43','AT43F','AT45','AT46','AT75','AT75F','AT76',
    'B38M','B462F','B463','B463F','B734','B734F',
    'B738','B738F','B744','B744BCF','B744F','B748','B748F',
    'B752','B752CF','B752F','B753','B762','B762F',
    'B763','B763F','B764','B772','B773','B77L','B77LF',
    'B77W','B77WF','B788','B789','B78X',
    'BCS1','BCS3','C17','C909','C909F','C919','CONC',
    'CRJ2','CRJ2F','CRJ7','CRJ9','CRJX',
    'DH64','DH8A','DH8B','DH8C','DH8D','DHC6',
    'E135','E140','E145','E170','E175','E190','E190F',
    'E195','E195F','E290','E295','E330',
    'F100','F70','MD11','MD11F','SF34','SF34F',
}

# Special renames — game uses different name than WoA ICAO
RENAME = {
    'A380': 'A388',   # game calls it A380, WoA ICAO is A388
    'B744BCF': 'B744BCF',
}

# Airport IATA codes
VALID_IATA = {
    'IAD','INN','BRI','PRG','BKK','NGO','SAN','MCT',
    'LEJ','SXM','LHR','SYD','MSY','GRU','SCL','HKG',
    'DXB','SIN','JFK','CDG','FRA','AMS','NRT','ICN',
}

def extract_code(stem):
    """Extract ICAO/IATA from filename stem — it's always the first word."""
    return stem.strip().split()[0].upper()

def prefer_file(candidates):
    """
    When multiple files map to same ICAO, prefer:
    1. Files without variant suffixes (render1 over render2)
    2. Shorter filenames (less specific)
    """
    def score(p):
        s = p.stem.lower()
        score = 0
        if 'render1' in s or 'render #' in s: score -= 5
        if 'render2' in s: score -= 10
        if 'grey' in s or 'gray' in s: score -= 3
        if 'cust' in s: score -= 8
        if 'usa' in s or 'mil' in s: score -= 5
        score -= len(s) // 10
        return score
    return max(candidates, key=score)

def bar(done, total, width=25):
    f = int(width * done / total) if total else 0
    return f"[{'█'*f}{'░'*(width-f)}] {done}/{total}"

# ── Check source folders ───────────────────────────────────────
for folder in [AC_SOURCE, AP_SOURCE]:
    if not folder.exists():
        print(f"\n❌ Not found: {folder}")
        print("   Update BASE_DIR in this script.")
        exit(1)

ac_files = sorted(AC_SOURCE.glob("*.png"))
ap_files = sorted(AP_SOURCE.glob("*.png"))

print(f"\n✈  WoA Image Organizer")
print(f"   Aircraft: {len(ac_files)} files in {AC_SOURCE.name}/")
print(f"   Airports: {len(ap_files)} files in {AP_SOURCE.name}/\n")

# ── Group aircraft by ICAO ─────────────────────────────────────
ac_buckets = {}
unmatched_ac = []

for f in ac_files:
    code = extract_code(f.stem)
    if code in VALID_ICAO:
        final = RENAME.get(code, code)
        ac_buckets.setdefault(final, []).append(f)
    else:
        unmatched_ac.append(f)

# ── Group airports by IATA ─────────────────────────────────────
ap_buckets = {}
unmatched_ap = []

for f in ap_files:
    code = extract_code(f.stem)
    if code in VALID_IATA:
        ap_buckets.setdefault(code, []).append(f)
    else:
        unmatched_ap.append(f)

# ── Copy aircraft ──────────────────────────────────────────────
print(f"✈  Aircraft ({len(ac_buckets)} types):")
ac_ok = ac_skip = 0

for i, (icao, candidates) in enumerate(sorted(ac_buckets.items()), 1):
    dest = AIRCRAFT_DIR / f"{icao}.png"
    print(f"  {bar(i, len(ac_buckets))} {icao:<10}", end=' ')
    if dest.exists():
        print("skip")
        ac_skip += 1
        continue
    best = prefer_file(candidates)
    shutil.copy2(best, dest)
    print(f"✓  ← {best.name[:45]}")
    ac_ok += 1

# ── Copy airports ──────────────────────────────────────────────
print(f"\n🏢 Airports ({len(ap_buckets)} found):")
ap_ok = ap_skip = 0

for i, (iata, candidates) in enumerate(sorted(ap_buckets.items()), 1):
    dest = AIRPORT_DIR / f"{iata}.png"
    print(f"  {bar(i, len(ap_buckets))} {iata:<6}", end=' ')
    if dest.exists():
        print("skip")
        ap_skip += 1
        continue
    best = prefer_file(candidates)
    shutil.copy2(best, dest)
    print(f"✓  ← {best.name[:45]}")
    ap_ok += 1

# ── Summary ────────────────────────────────────────────────────
print(f"\n{'─'*55}")
print(f"  Aircraft: {ac_ok} copied, {ac_skip} skipped")
print(f"  Airports: {ap_ok} copied, {ap_skip} skipped")
if unmatched_ac:
    print(f"\n  ⚠ Unmatched aircraft ({len(unmatched_ac)}) — check filenames:")
    for f in unmatched_ac[:15]: print(f"    {f.name}")
if unmatched_ap:
    print(f"\n  ⚠ Unmatched airports ({len(unmatched_ap)}):")
    for f in unmatched_ap[:10]: print(f"    {f.name}")
print(f"\n  ✅ Done!\n")