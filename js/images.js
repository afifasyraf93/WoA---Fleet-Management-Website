/**
 * images.js — Aircraft & Airport images
 *
 * Fetches thumbnails from the Wikipedia REST API (client-side, no hotlinking issues).
 * Falls back to a clean SVG placeholder if not found or offline.
 *
 * Wikipedia article names mapped per ICAO/IATA code.
 */

const Images = (() => {

  // Cache so we don't re-fetch the same article twice
  const _cache = {};

  // ── Wikipedia article names per WoA ICAO code ──────────────
  const AIRCRAFT_WIKI = {
    // Airbus A220
    'BCS1': 'Airbus_A220',
    'BCS3': 'Airbus_A220',
    // Airbus A318-321
    'A318': 'Airbus_A318',
    'A319': 'Airbus_A319',
    'A19N': 'Airbus_A319neo',
    'A320': 'Airbus_A320',
    'A20N': 'Airbus_A320neo',
    'A321': 'Airbus_A321',
    'A21N': 'Airbus_A321neo',
    'A21NX': 'Airbus_A321XLR',
    'A21NY': 'Airbus_A321XLR',
    'A321F': 'Airbus_A321',
    // Airbus A300/310
    'A306': 'Airbus_A300',
    'A306F': 'Airbus_A300',
    'A30BF': 'Airbus_A300',
    // Airbus A330
    'A332': 'Airbus_A330',
    'A332F': 'Airbus_A330',
    'A333': 'Airbus_A330',
    'A333P2F': 'Airbus_A330',
    'A338': 'Airbus_A330neo',
    'A339': 'Airbus_A330neo',
    // Airbus A340
    'A343': 'Airbus_A340',
    'A346': 'Airbus_A340',
    // Airbus A350
    'A359': 'Airbus_A350',
    'A35K': 'Airbus_A350',
    // Airbus A380
    'A388': 'Airbus_A380',
    // Boeing 737
    'B734': 'Boeing_737_Classic',
    'B734F': 'Boeing_737_Classic',
    'B735': 'Boeing_737_Classic',
    'B737': 'Boeing_737_Next_Generation',
    'B738': 'Boeing_737_Next_Generation',
    'B739': 'Boeing_737_Next_Generation',
    'B38M': 'Boeing_737_MAX',
    'B39M': 'Boeing_737_MAX',
    'B3XM': 'Boeing_737_MAX',
    // Boeing 747
    'B744': 'Boeing_747-400',
    'B748': 'Boeing_747-8',
    'B748F': 'Boeing_747-8',
    // Boeing 757
    'B752': 'Boeing_757',
    'B753': 'Boeing_757',
    // Boeing 767
    'B762': 'Boeing_767',
    'B763': 'Boeing_767',
    'B764': 'Boeing_767',
    'B76F': 'Boeing_767',
    // Boeing 777
    'B772': 'Boeing_777',
    'B773': 'Boeing_777',
    'B77L': 'Boeing_777',
    'B77W': 'Boeing_777',
    'B77F': 'Boeing_777',
    'B779': 'Boeing_777X',
    // Boeing 787
    'B788': 'Boeing_787_Dreamliner',
    'B789': 'Boeing_787_Dreamliner',
    'B78X': 'Boeing_787_Dreamliner',
    // ATR
    'AT45': 'ATR_42',
    'AT72': 'ATR_72',
    'AT76': 'ATR_72',
    // Bombardier CRJ
    'CRJ2': 'Bombardier_CRJ200',
    'CRJ7': 'Bombardier_CRJ700_series',
    'CRJ9': 'Bombardier_CRJ700_series',
    'CRJX': 'Bombardier_CRJ700_series',
    // Embraer
    'E170': 'Embraer_E-jet_family',
    'E175': 'Embraer_E-jet_family',
    'E75L': 'Embraer_E-jet_family',
    'E190': 'Embraer_E-jet_family',
    'E195': 'Embraer_E-jet_family',
    // Antonov
    'AN12': 'Antonov_An-12',
    'A124': 'Antonov_An-124',
  };

  // ── Wikipedia article names per IATA airport code ──────────
  const AIRPORT_WIKI = {
    'IAD': 'Washington_Dulles_International_Airport',
    'INN': 'Innsbruck_Airport',
    'BRI': 'Bari_Karol_Wojtyła_Airport',
    'PRG': 'Václav_Havel_Airport_Prague',
    'BKK': 'Suvarnabhumi_Airport',
    'NGO': 'Chubu_Centrair_International_Airport',
    'SAN': 'San_Diego_International_Airport',
    'MCT': 'Muscat_International_Airport',
    'LEJ': 'Leipzig/Halle_Airport',
    'SXM': 'Princess_Juliana_International_Airport',
    'LHR': 'Heathrow_Airport',
    'SYD': 'Sydney_Airport',
    'MSY': 'Louis_Armstrong_New_Orleans_International_Airport',
    'GRU': 'São_Paulo/Guarulhos_International_Airport',
    'SCL': 'Arturo_Merino_Benítez_International_Airport',
    'HKG': 'Hong_Kong_International_Airport',
    'DXB': 'Dubai_International_Airport',
    'SIN': 'Singapore_Changi_Airport',
    'JFK': 'John_F._Kennedy_International_Airport',
    'CDG': 'Charles_de_Gaulle_Airport',
    'FRA': 'Frankfurt_Airport',
    'AMS': 'Amsterdam_Airport_Schiphol',
    'NRT': 'Narita_International_Airport',
    'ICN': 'Incheon_International_Airport',
  };

  // Fetch Wikipedia page thumbnail via REST API
  async function fetchWikiThumb(articleTitle) {
    if (_cache[articleTitle] !== undefined) return _cache[articleTitle];

    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleTitle)}`;
      const res  = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) { _cache[articleTitle] = null; return null; }
      const data = await res.json();
      const src  = data?.thumbnail?.source || null;
      _cache[articleTitle] = src;
      return src;
    } catch {
      _cache[articleTitle] = null;
      return null;
    }
  }

  // ── SVG placeholder ────────────────────────────────────────
  function placeholder(label, icon, bg='#f0f4f8') {
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="160" viewBox="0 0 320 160">
        <rect width="320" height="160" fill="${bg}"/>
        <text x="160" y="75" text-anchor="middle" font-size="36">${icon}</text>
        <text x="160" y="108" text-anchor="middle" font-size="13" fill="#7a8fa6" font-family="system-ui">${label}</text>
      </svg>`
    )}`;
  }

  const SIZE_COLORS = { A:'#dbeafe',B:'#e0f2fe',C:'#ede9fe',D:'#fef3c7',E:'#fce7f3',F:'#fee2e2' };

  // ── Public: render image container that loads async ─────────
  // Returns HTML with a placeholder, then JS swaps in the real image after fetch
  function aircraftCardImg(icao, size, type, height='130px') {
    const wiki = AIRCRAFT_WIKI[icao];
    const bg   = SIZE_COLORS[size] || '#f0f4f8';
    const icon = type === 'Cargo' ? '📦' : '✈️';
    const id   = `img-ac-${icao}-${Math.random().toString(36).slice(2,6)}`;

    // Render placeholder immediately
    const html = `<div id="${id}" style="width:100%;height:${height};overflow:hidden;
      border-radius:var(--radius) var(--radius) 0 0;background:${bg};
      display:flex;align-items:center;justify-content:center;">
      <div style="text-align:center">
        <div style="font-size:36px">${icon}</div>
        <div style="font-size:11px;color:#7a8fa6;margin-top:4px">Size ${size}</div>
      </div>
    </div>`;

    // Async swap in real image
    if (wiki) {
      setTimeout(async () => {
        const src = await fetchWikiThumb(wiki);
        const el  = document.getElementById(id);
        if (src && el) {
          el.innerHTML = `<img src="${src}" alt="${icao}"
            style="width:100%;height:100%;object-fit:cover"
            onerror="this.parentElement.innerHTML='<div style=\\'text-align:center\\'><div style=\\'font-size:36px\\'>${icon}</div></div>'"
            loading="lazy">`;
        }
      }, 0);
    }

    return html;
  }

  function airportCardImg(iata, height='110px') {
    const wiki = AIRPORT_WIKI[iata];
    const id   = `img-ap-${iata}-${Math.random().toString(36).slice(2,6)}`;

    const html = `<div id="${id}" style="width:100%;height:${height};overflow:hidden;
      border-radius:var(--radius) var(--radius) 0 0;background:var(--sky-light);
      display:flex;align-items:center;justify-content:center;">
      <div style="text-align:center">
        <div style="font-size:36px">🏢</div>
        <div style="font-size:11px;color:#7a8fa6;margin-top:4px">${iata}</div>
      </div>
    </div>`;

    if (wiki) {
      setTimeout(async () => {
        const src = await fetchWikiThumb(wiki);
        const el  = document.getElementById(id);
        if (src && el) {
          el.innerHTML = `<img src="${src}" alt="${iata} Airport"
            style="width:100%;height:100%;object-fit:cover"
            onerror="this.parentElement.innerHTML='<div style=\\'text-align:center\\'><div style=\\'font-size:36px\\'>🏢</div></div>'"
            loading="lazy">`;
        }
      }, 0);
    }

    return html;
  }

  return { aircraftCardImg, airportCardImg };
})();