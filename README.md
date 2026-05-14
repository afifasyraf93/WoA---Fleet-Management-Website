# ✈ WoA Fleet Manager

A local web app to manage your World of Airports fleet — inspired by blue-utils.me.
Pure HTML/CSS/JS. No frameworks. No build tools. One Python command to run.

---

## Quick Start

```bash
# 1. Enter the project folder
cd woa-fleet-manager

# 2. Start the local server (Python 3 only, no installs needed)
python server.py

# 3. Open your browser
# http://localhost:8080
```

That's it. Your data is saved to `data/data.json` automatically.

---

## Loading Game CSV Data

Drop the community CSV files into `data/csv/` and rename them:

| Rename to              | Original file                                        |
|------------------------|------------------------------------------------------|
| `data/csv/aircraft.csv`     | `WoA_3_5_0_-_..._Aircraft_Data.csv`            |
| `data/csv/destinations.csv` | `WoA_3_5_0_-_..._Destination_List.csv`         |
| `data/csv/layout.csv`       | `WoA_3_5_0_-_..._Airport_Layout.csv`           |

The **Aircraft Reference** tab will automatically load and display all aircraft from the CSV,
with filtering by manufacturer, size, and type.

---

## Project Structure

```
woa-fleet-manager/
├── index.html              ← Open this in browser (via server)
├── server.py               ← Local server (python server.py)
├── css/
│   └── style.css           ← All styles
├── js/
│   ├── csv.js              ← CSV parser & loader
│   ├── store.js            ← Read/write data.json
│   ├── app.js              ← Router & init
│   └── pages/
│       ├── fleet.js        ← My Fleet page
│       ├── wishlist.js     ← Wishlist page
│       └── other-pages.js  ← Airports, Routes, Reference
└── data/
    ├── data.json           ← YOUR personal data (auto-saved)
    ├── data.json.bak       ← Auto-backup before each save
    └── csv/
        ├── aircraft.csv         ← Drop game CSV here
        ├── destinations.csv     ← Drop game CSV here
        └── layout.csv           ← Drop game CSV here
```

---

## Features

| Page | What you can do |
|------|----------------|
| **My Fleet** | Add, view, edit, delete aircraft. Filter by manufacturer, size, type, status. Cards show ICAO, route, status badges. |
| **Wishlist** | Track aircraft to unlock. Priority (High/Medium/Low). One-click "Move to Fleet" when unlocked. |
| **Airports** | Manage your hub + destination airports. Track unlock status, stands, slots, distances. |
| **Route Assignments** | Map which aircraft flies which route. Track Active/Planned/Paused routes with stand types. |
| **Aircraft Reference** | Full game data loaded from your CSV. Search and filter all aircraft stats. |

---

## Data Backup

Every time data is saved, `data.json.bak` is created automatically.
To restore: `copy data/data.json.bak data/data.json` (Windows) or `cp data/data.json.bak data/data.json` (Mac/Linux).

You can also just open `data/data.json` in any text editor — it's plain JSON.

---

## Customising

- **Colors & theme**: edit CSS variables at the top of `css/style.css`
- **Add a new field**: add the input to the `formHTML()` function in the relevant page file, then add it to `collectForm()`
- **Change hub airport**: edit the sidebar subtitle in `app.js` → `sidebarHTML()`
- **Add a new page**: create a module in `js/pages/`, register it in the `pages` object in `app.js`
