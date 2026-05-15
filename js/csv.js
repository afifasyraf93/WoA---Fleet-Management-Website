/**
 * csv.js — CSV file loader and parser
 *
 * Drop your game CSV files into data/csv/:
 *   aircraft.csv      → WoA_3_5_0_..._Aircraft_Data.csv
 *   destinations.csv  → WoA_3_5_0_..._Destination_List.csv
 *   layout.csv        → WoA_3_5_0_..._Airport_Layout.csv
 */

const CSV = (() => {

  // Parse entire CSV text into array-of-arrays, respecting quoted fields
  // that may contain embedded newlines (WoA exports do this for multi-line headers)
  function parseRows(text) {
    const rows = [];
    let row = [], cur = '', inQ = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

      if (c === '"') {
        if (inQ && next === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === ',' && !inQ) {
        row.push(cur); cur = '';
      } else if (!inQ && (c === '\n' || (c === '\r' && next === '\n'))) {
        if (c === '\r') i++;
        row.push(cur); cur = '';
        rows.push(row); row = [];
      } else {
        cur += c;
      }
    }
    if (cur !== '' || row.length > 0) { row.push(cur); rows.push(row); }
    return rows;
  }

  // Flatten cell: collapse embedded newlines/spaces to single space
  function flat(s) { return (s || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim(); }

  // Flexible key lookup — match any header containing the search string
  function findVal(obj, ...keys) {
    for (const k of keys) {
      const kl = k.toLowerCase();
      const found = Object.keys(obj).find(rk => rk.toLowerCase().includes(kl));
      if (found && obj[found] !== undefined && obj[found] !== '') return obj[found];
    }
    return '';
  }

  // ── Aircraft CSV ─────────────────────────────────────────────
  // Row 0: section group labels  → skip
  // Row 1: column headers        → use
  // Row 2+: data
  async function loadAircraft() {
    let text;
    try {
      const res = await fetch('data/csv/aircraft.csv');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      text = await res.text();
    } catch (e) {
      console.warn('loadAircraft:', e.message);
      return null;
    }

    const rows = parseRows(text);
    if (rows.length < 3) return null;

    const headers = rows[1].map(flat);
    const data = [];

    for (let i = 2; i < rows.length; i++) {
      const cols = rows[i];
      const icao = flat(cols[0]);
      if (!icao || icao.length > 8) continue;

      const obj = {};
      headers.forEach((h, j) => { obj[h] = flat(cols[j]); });

      data.push({
        icao,
        manufacturer: findVal(obj, 'manufacturer'),
        name:         findVal(obj, 'aircraft name'),
        size:         findVal(obj, 'icao size'),
        type:         findVal(obj, 'load type'),
        gen:          findVal(obj, 'generation'),
        maxSeats:     findVal(obj, 'maximum seats'),
        cargo_kg:     findVal(obj, 'cargo'),
        price_w:      findVal(obj, 'unit', 'price', 'wollars'),
        unlock_ga:    findVal(obj, 'unlock'),
        maxRange:     findVal(obj, 'actual maximum player', 'maximum  player range', 'maximum player range'),
        maxContract:  findVal(obj, 'maximum contract distance'),
        speed:        findVal(obj, 'cruise  speed', 'cruise speed'),
        maxSP:        findVal(obj, 'estimated maximum sp'),
        xp_lv10:      findVal(obj, 'lv.10'),
        handlingTime: findVal(obj, 'handling time'),
        _headers: headers,
        _raw: obj,
      });
    }

    console.log('CSV aircraft loaded:', data.length, '— first ICAO:', data[0]?.icao);
    return data;
  }

  // ── Destinations CSV ─────────────────────────────────────────
  // Row 0: section group labels → skip
  // Row 1: empty row            → skip
  // Row 2: column headers       → use
  // Row 3+: data
  async function loadDestinations() {
    let text;
    try {
      const res = await fetch('data/csv/destinations.csv');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      text = await res.text();
    } catch (e) {
      console.warn('loadDestinations:', e.message);
      return null;
    }

    const rows = parseRows(text);
    if (rows.length < 4) return null;

    // Find header row: first row whose first cell contains 'iata'
    let headerIdx = 2;
    for (let i = 0; i < Math.min(rows.length, 6); i++) {
      if (flat(rows[i][0]).toLowerCase().includes('iata')) { headerIdx = i; break; }
    }

    const headers = rows[headerIdx].map(flat);
    const data = [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const cols = rows[i];
      const iata = flat(cols[0]);
      if (!/^[A-Z]{3}$/.test(iata)) continue;

      const distances = {};
      headers.forEach((h, j) => {
        if (/^[A-Z]{3}$/.test(h)) {
          const v = parseInt(flat(cols[j]));
          if (!isNaN(v) && v > 0) distances[h] = v;
        }
      });

      data.push({
        iata,
        country:    flat(cols[1]),
        airport:    flat(cols[2]),
        runway:     parseInt(flat(cols[3]))  || 0,
        paxSize:    flat(cols[4]),
        cargoSize:  flat(cols[5]),
        paxSlots:   parseInt(flat(cols[6]))  || 0,
        cargoSlots: parseInt(flat(cols[7]))  || 0,
        paxCost:    parseInt(flat(cols[8]))  || 0,
        cargoCost:  parseInt(flat(cols[9]))  || 0,
        distances,
      });
    }

    console.log('CSV destinations loaded:', data.length);
    return data;
  }

  // Generic single-header CSV loader
  async function load(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const rows = parseRows(await res.text());
      if (!rows.length) return [];
      const headers = rows[0].map(flat);
      return rows.slice(1).map(cols => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = flat(cols[i]); });
        return obj;
      });
    } catch (e) {
      console.warn('CSV.load(' + path + '):', e.message);
      return null;
    }
  }



// ── Airport Layout CSV ─────────────────────────────────────────
// Row 0: section group labels  → skip
// Row 1: column headers        → use
// Row 2+: data (17 playable airports)
async function loadLayout() {
  let text;
  try {
    const res = await fetch('data/csv/layout.csv');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    text = await res.text();
  } catch(e) { console.warn('loadLayout:', e.message); return null; }

  const rows = parseRows(text);
  if (rows.length < 3) return null;

  const pi = (r, i) => { const v = flat(r[i]); return v ? parseInt(v) || 0 : 0; };
  const data = {};

  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    const iata = flat(r[1]);
    if (!iata || iata.length !== 3) continue;
    data[iata] = {
      name: flat(r[0]),
      costOfStands: pi(r,2), minCostOfStands: pi(r,3),
      paxTotal:   {A:pi(r,4),B:pi(r,5),C:pi(r,6),D:pi(r,7),E:pi(r,8),F:pi(r,9),G:pi(r,10)},
      cargoTotal: {A:pi(r,11),B:pi(r,12),C:pi(r,13),D:pi(r,14),E:pi(r,15),F:pi(r,16),G:pi(r,17)},
      paxStands:  {'A-B':pi(r,18),'A-C':pi(r,19),'A-D':pi(r,20),'A-E':pi(r,21),'A-F':pi(r,22),'C':pi(r,23),'C-E':pi(r,24),'C-F':pi(r,25),'D':pi(r,26),'D-E':pi(r,27),'D-F':pi(r,28)},
      combinedStands: {'A-C':pi(r,29),'A-D':pi(r,30),'A-E':pi(r,31),'A-F':pi(r,32),'A-G':pi(r,33),'D-E':pi(r,34),'D-F':pi(r,35)},
      cargoStands: {'A-B':pi(r,36),'A-C':pi(r,37),'A-D':pi(r,38),'A-E':pi(r,39),'A-F':pi(r,40),'A-G':pi(r,41),'C':pi(r,42),'C-E':pi(r,43),'C-F':pi(r,44),'C-G':pi(r,45),'D':pi(r,46),'D-E':pi(r,47),'D-F':pi(r,48),'D-G':pi(r,49)},
    };
  }
  console.log('CSV layout loaded:', Object.keys(data).length, 'airports');
  return data;
}

// ── Airport Characteristics CSV ────────────────────────────────
async function loadCharacteristics() {
  let text;
  try {
    const res = await fetch('data/csv/characteristics.csv');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    text = await res.text();
  } catch(e) { console.warn('loadCharacteristics:', e.message); return null; }

  const rows = parseRows(text);
  if (rows.length < 3) return null;

  const pi = (r, i) => { const v = flat(r[i]); return v ? parseInt(v) || 0 : 0; };
  const data = {};

  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    const iata = flat(r[1]);
    if (!iata || iata.length !== 3) continue;
    data[iata] = {
      name: flat(r[0]),
      contractCapacity: pi(r,2), handlingCrew: pi(r,3), wollarsCost: pi(r,4),
      costTerminals: pi(r,5), costStands: pi(r,6), costEquipment: pi(r,7),
      terminalExtensions: pi(r,8),
      totalStands: { passenger:pi(r,9), combined:pi(r,10), cargo:pi(r,11), total:pi(r,12) },
      equipment: { boarding:pi(r,13), baggage:pi(r,14), cleaning:pi(r,15), cargo:pi(r,16),
                   catering:pi(r,17), fuel:pi(r,18), lavatory:pi(r,19), water:pi(r,20),
                   ambulift:pi(r,21), repair:pi(r,22) },
      startingContractSlots: pi(r,23), startingHandlingCrew: pi(r,24),
      rewardedContractSlots: pi(r,25), rewardedHandlingCrew: pi(r,26),
      premiumContractSlots:  pi(r,27), premiumHandlingCrew:  pi(r,28),
      startingStands: pi(r,29), startingStandsCost: pi(r,30),
      minStandsCost: pi(r,31), minWollarsCost: pi(r,32),
      startingContracts: pi(r,33), unlockPrice: pi(r,34),
      levels: pi(r,35), premiumPassPrice: r.length > 36 ? pi(r,36) : 0,
    };
  }
  console.log('CSV characteristics loaded:', Object.keys(data).length, 'airports');
  return data;
}

  return { parseRows, flat, load, loadAircraft, loadDestinations, loadLayout, loadCharacteristics };
})();