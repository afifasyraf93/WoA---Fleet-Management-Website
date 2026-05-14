# ✈ WoA Fleet Manager

A local web app to manage your World of Airports Airbus Empire — fleet, wishlist, airports, stand planning, route optimizing, and SP/XP calculations.

---

## Quick Start

```powershell
# 1. Enter the project folder
cd woa-fleet-manager

# 2. Start the server
py server.py

# 3. Open your browser
# http://localhost:7000
```

Your data saves automatically to `data/data.json`.

---

## Aircraft & Airport Images

Place your own images in the `images/` folder:

```
images/
├── aircraft/
│   ├── A333.jpg      ← named by WoA ICAO code
│   ├── A359.jpg
│   ├── A388.jpg
│   └── ...
└── airports/
    ├── IAD.jpg       ← named by IATA code
    ├── BKK.jpg
    ├── PRG.jpg
    └── ...
```

**Naming rules:**
- Must match the WoA ICAO / IATA code exactly (uppercase)
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`
- If using a different extension, update `AIRCRAFT_EXT` / `AIRPORT_EXT` in `js/images.js`
- Missing images show a clean placeholder automatically — no errors

**Recommended sources:**
- Aircraft: [Planespotters.net](https://www.planespotters.net) — search by aircraft type
- Aircraft: [Airliners.net](https://www.airliners.net) — search by aircraft type
- Airports: Wikipedia — search "[airport name]", go to Commons tab
- Airports: Google Images — search "[IATA] airport aerial"

**Tips for best results:**
- Landscape orientation (16:9 or wider) fits the cards best
- Side-on or 3/4 angle shots look cleanest for aircraft
- Aerial or terminal exterior shots work best for airports
- Aim for at least 400px wide

---

## Features

| Page | Description |
|---|---|
| **Home** | Overview stats, quick navigation cards |
| **Fleet** | Add/edit/delete aircraft per airport. ICAO auto-fill from CSV. Export to CSV. |
| **Wishlist** | Track aircraft to unlock with priority. One-click promote to fleet. |
| **Stand Planner** | Real stand counts from layout.csv. Shows occupancy bars + unassigned aircraft warnings. |
| **Airport Info** | Full profiles from layout + characteristics CSV. Level progress tracker. |
| **Destinations** | All game airports with distances from active hub. Filter by size and slots. |
| **SP/XP Calculator** | Estimate earnings for any aircraft + route. Top routes by SP/hr. |
| **Route Optimizer** | Rank all reachable destinations by SP/hr, XP/hr, or daily SP. |
| **Aircraft Data** | Full aircraft specs from game CSV. Filter by manufacturer, size, type. |

---

## Project Structure

```
woa-fleet-manager/
├── index.html                  ← Main app
├── server.py                   ← Local server (py server.py)
├── download_images.py          ← Optional: auto-download images script
├── css/
│   └── style.css
├── js/
│   ├── csv.js                  ← CSV parser
│   ├── store.js                ← Data read/write (data.json)
│   ├── autocomplete.js         ← ICAO auto-fill + stand type suggest
│   ├── images.js               ← Aircraft & airport image mapping
│   ├── app.js                  ← Router & navigation
│   └── pages/
│       ├── fleet.js
│       ├── wishlist.js
│       ├── standplanner.js
│       ├── airportinfo.js
│       ├── other-pages.js      ← Destinations, Aircraft Data
│       ├── calculator.js
│       └── routeoptimizer.js
├── data/
│   ├── data.json               ← Your personal data (auto-saved)
│   ├── data.json.bak           ← Auto-backup before each save
│   └── csv/
│       ├── aircraft.csv
│       ├── destinations.csv
│       ├── layout.csv
│       └── characteristics.csv
└── images/
    ├── aircraft/               ← [ICAO].jpg
    └── airports/               ← [IATA].jpg
```

---

## Multi-Airport Support

Each playable airport has its own independent fleet and wishlist. Switch between airports using the **Airport switcher** in the top-right navbar. Adding an aircraft with a different airport in the Airport field automatically moves it to that airport's fleet.

---

## Data Backup

Every save creates `data/data.json.bak` automatically. To restore:

```powershell
# Windows
copy data\data.json.bak data\data.json

# Mac/Linux
cp data/data.json.bak data/data.json
```

`data.json` is plain JSON — you can open and edit it in any text editor.

---

## Customising

| What | Where |
|---|---|
| Colors & theme | CSS variables at top of `css/style.css` |
| Server port | `PORT = 7000` in `server.py` |
| Image file extension | `AIRCRAFT_EXT` / `AIRPORT_EXT` in `js/images.js` |
| Add new aircraft ICAO | Add to `AIRCRAFT` map in `js/images.js` |
| Add new airport image | Add to `AIRPORT_WIKI` map in `js/images.js` |