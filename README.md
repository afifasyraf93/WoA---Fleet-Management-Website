<div align="center">

# ✈ WoA Fleet Manager

**A local web app for managing your World of Airports empire**

![Python](https://img.shields.io/badge/Python-3.8+-blue?logo=python&logoColor=white)
![HTML](https://img.shields.io/badge/HTML%2FCSS%2FJS-Vanilla-orange?logo=html5&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

[Features](#features) · [Quick Start](#quick-start) · [Setup](#setup) · [Project Structure](#project-structure)

</div>

---

## Overview

WoA Fleet Manager is a local web application that helps you track and plan your **World of Airports** Empire across multiple airports. It pulls real game data from the community CSV files and your extracted game assets to give you a rich management dashboard.

Built with plain HTML/CSS/JavaScript — no framework, no build step, no internet required (after setup).

---

## Features

### Fleet Management
- **Multi-airport fleet** — each playable airport has its own independent fleet and wishlist
- **ICAO auto-fill** — type an ICAO code and the form auto-fills name, manufacturer, size, type, generation from the game CSV
- **Stand type auto-suggest** — dropdown filters to only show stand types available at the active airport, compatible with the aircraft's size
- **Export to CSV** — download your fleet as a spreadsheet

### Planning Tools
- **Stand Planner** — real stand counts from `layout.csv`, shows occupancy bars per stand type, warns about unassigned aircraft
- **SP/XP Calculator** — estimate earnings for any aircraft + route, with range validation and top routes by SP/hr
- **Route Optimizer** — rank all reachable destinations by SP/hr, XP/hr, SP/flight, or daily SP. Filter by destination size and minimum PAX slots

### Airport Info
- **Full airport profiles** — merged from `layout.csv` + `characteristics.csv`: stand breakdown, equipment, costs, contract capacity, crew
- **Level progress tracker** — manually track your current level vs max, with estimated contracts/crew at current progress
- **Destination distances** — nearest destinations sorted by distance from each playable airport

### Game Data Reference
- **Destinations** — all 1,030 destination airports with PAX/cargo size, slots, runway, route cost, and distance from active hub
- **Aircraft Data** — full specs table with filter by manufacturer, size, type

### UI
- **Airport switcher** — navbar buttons to switch active airport context, all pages update instantly
- **Dark mode** — toggle with 🌙 button, preference saved across sessions
- **Aircraft images** — uses real game textures extracted from the APK
- **Airport images** — aerial renders from game assets
- **Breadcrumb navigation** — always know where you are

---

## Quick Start

```powershell
# 1. Clone or download the repository
git clone https://github.com/afifasyraf93/woa-fleet-manager.git
cd woa-fleet-manager

# 2. Start the local server
py server.py

# 3. Open your browser
# http://localhost:7000
```

> **Requirements:** Python 3.8+ (standard library only, no pip installs needed)

---

## Setup

### 1. Game CSV Files

Download the WoA community spreadsheet and export the sheets as CSV files. Place them in `data/csv/` renamed as follows:

| Filename | Source sheet |
|---|---|
| `data/csv/aircraft.csv` | Aircraft Data |
| `data/csv/destinations.csv` | Destination List |
| `data/csv/layout.csv` | Airport Layout |
| `data/csv/characteristics.csv` | Airport Characteristics |

### 2. Aircraft & Airport Images (optional but recommended)

**Option A — Extract from game APK (best quality)**

1. Download the WoA XAPK from APKPure and extract it
2. Use [AssetStudio](https://github.com/aelurum/AssetStudio/releases) to extract `Texture2D` assets from `UnityStreamingAssetsPack.apk`
3. Export textures to `data/asset/Texture2D/aircraft/` and `data/asset/Texture2D/airport/`
4. Run the organizer script:
   ```powershell
   py organize_images.py
   ```
   This automatically matches texture filenames to ICAO/IATA codes and copies them to `images/`.

**Option B — Manual download**

Place images directly in the folders:
```
images/
├── aircraft/   ← A333.png, A359.png, A388.png ...
└── airports/   ← IAD.png, BKK.png, PRG.png ...
```
Filename must match the WoA ICAO/IATA code exactly (uppercase). Supports `.png`, `.jpg`, `.webp` — set the extension in `js/images.js`.

---

## Project Structure

```
woa-fleet-manager/
├── index.html                    ← Main app entry point
├── server.py                     ← Local HTTP server (port 7000)
├── organize_images.py            ← Auto-organizes extracted game textures
├── README.md
│
├── css/
│   └── style.css                 ← All styles + dark mode
│
├── js/
│   ├── csv.js                    ← CSV parser (aircraft, destinations, layout, characteristics)
│   ├── store.js                  ← Data layer — multi-airport CRUD, auto-save
│   ├── autocomplete.js           ← ICAO auto-fill + stand type auto-suggest
│   ├── images.js                 ← Aircraft & airport image loader
│   ├── app.js                    ← Router, navbar, airport switcher, dark mode
│   └── pages/
│       ├── fleet.js              ← Fleet management
│       ├── wishlist.js           ← Wishlist with promote-to-fleet
│       ├── standplanner.js       ← Stand occupancy planner
│       ├── airportinfo.js        ← Airport profiles + level tracker
│       ├── other-pages.js        ← Destinations + Aircraft Data reference
│       ├── calculator.js         ← SP/XP earnings calculator
│       └── routeoptimizer.js     ← Route ranking optimizer
│
├── data/
│   ├── data.json                 ← Your personal data (auto-saved)
│   ├── data.json.bak             ← Auto-backup on every save
│   └── csv/
│       ├── aircraft.csv
│       ├── destinations.csv
│       ├── layout.csv
│       └── characteristics.csv
│
└── images/
    ├── aircraft/                 ← [ICAO].png  e.g. A333.png
    └── airports/                 ← [IATA].png  e.g. IAD.png
```

---

## Data Format

Your data is stored in `data/data.json` as plain JSON — fully readable and editable in any text editor.

```json
{
  "activeAirport": "IAD",
  "airports": [
    {
      "iata": "IAD",
      "name": "Washington Dulles",
      "country": "USA",
      "status": "Unlocked",
      "currentLevel": 47,
      "notes": "Main hub. Empire base.",
      "fleet": [
        {
          "id": "f_abc123",
          "icao": "A333",
          "name": "A330-300",
          "manufacturer": "Airbus",
          "size": "E",
          "type": "Passenger",
          "gen": "3",
          "airport": "IAD",
          "route": "IAD-BKK",
          "standType": "D-F PAX",
          "status": "Active",
          "notes": "",
          "addedDate": "2026-05-14"
        }
      ],
      "wishlist": [...]
    }
  ]
}
```

**Backup & restore:**
```powershell
# Restore from backup (Windows)
copy data\data.json.bak data\data.json
```

---

## Customising

| What | Where |
|---|---|
| Server port | `PORT = 7000` in `server.py` |
| Image file extension | `AIRCRAFT_EXT` / `AIRPORT_EXT` in `js/images.js` |
| Color theme | CSS variables at top of `css/style.css` |
| Asset extraction path | `BASE_DIR` in `organize_images.py` |

---

## Credits

- Game data CSV — [WoA community spreadsheet](https://sites.google.com/view/woainfo)
- Game assets — extracted from World of Airports APK using [AssetStudio](https://github.com/aelurum/AssetStudio)
- World of Airports — developed by [Jiri Haugland](https://play.google.com/store/apps/details?id=com.haugland.woa)

---

## License

MIT — free to use, modify, and share. Not affiliated with or endorsed by the World of Airports developers.
