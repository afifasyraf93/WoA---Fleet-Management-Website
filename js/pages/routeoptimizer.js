/**
 * routeoptimizer.js — Route Optimizer
 *
 * For a selected aircraft + active hub, ranks all reachable destinations
 * by SP/hr, XP/hr, SP/flight, and daily SP.
 * Supports sorting, filtering by size/type, and side-by-side comparison.
 */
const RouteOptimizerPage = (() => {
  let _aircraft  = null;
  let _dests     = null;
  let _results   = [];
  let _sortBy    = 'spPerHour';  // spPerHour | xpPerHour | spPerFlight | dailySP | dist
  let _filterSize = '';
  let _minSlots   = 0;
  let _selectedIcao = '';

  async function loadData() {
    if (!_aircraft) _aircraft = await CSV.loadAircraft();
    if (!_dests)    _dests    = await CSV.loadDestinations();
  }

  function fmtN(n) { return Number(n).toLocaleString(); }
  function fmtTime(mins) {
    const h = Math.floor(mins / 60), m = mins % 60;
    return `${h}h ${m.toString().padStart(2,'0')}m`;
  }

  function calcRoute(ac, dist) {
    const speed       = parseFloat(ac.speed)       || 480;
    const maxSP       = parseFloat(ac.maxSP)       || 0;
    const xp10        = parseFloat(ac.xp_lv10)     || 0;
    const maxContract = parseFloat(ac.maxContract) || dist;

    const flightHours   = dist / speed;
    const totalHours    = flightHours + 0.5;
    const flightMins    = Math.round(flightHours * 60);
    const distRatio     = Math.min(1, dist / maxContract);
    const estSP         = Math.round(maxSP  * distRatio);
    const estXP         = Math.round(xp10   * distRatio);
    const spPerHour     = totalHours > 0 ? Math.round(estSP / totalHours) : 0;
    const xpPerHour     = totalHours > 0 ? Math.round(estXP / totalHours) : 0;
    const flightsPerDay = Math.max(1, Math.floor(24 / (totalHours * 2)));
    const dailySP       = estSP * flightsPerDay;
    const dailyXP       = estXP * flightsPerDay;
    const overContract  = maxContract > 0 && dist > maxContract;

    return { flightMins, totalHours, estSP, estXP, spPerHour, xpPerHour,
             flightsPerDay, dailySP, dailyXP, dist, overContract };
  }

  function buildResults(ac) {
    const iata     = Store.getActiveIata();
    const maxRange = parseFloat(ac.maxRange) || 0;

    return (_dests || [])
      .filter(d => {
        const dist = d.distances?.[iata];
        if (!dist || dist <= 0 || d.iata === iata) return false;
        if (maxRange && dist > maxRange) return false;
        if (_filterSize && d.paxSize !== _filterSize) return false;
        if (_minSlots  && (d.paxSlots || 0) < _minSlots) return false;
        return true;
      })
      .map(d => ({ d, calc: calcRoute(ac, d.distances[iata]) }))
      .sort((a, b) => b.calc[_sortBy] - a.calc[_sortBy]);
  }

  function sortLabel(key) {
    return { spPerHour:'SP/hr', xpPerHour:'XP/hr', spPerFlight:'SP/flight',
             dailySP:'Daily SP', dist:'Distance' }[key] || key;
  }

  function resultRow(d, calc, rank) {
    const rankColors = ['#f59e0b','#9ca3af','#b45309'];  // gold, silver, bronze
    const rankStyle  = rank < 3 ? `color:${rankColors[rank]};font-weight:700` : 'color:var(--text3)';
    const overStyle  = calc.overContract ? 'color:var(--amber)' : '';

    return `<tr>
      <td style="text-align:center;${rankStyle}">${rank+1}</td>
      <td>
        <div style="font-weight:700;color:var(--navy)">${d.iata}</div>
        <div style="font-size:11px;color:var(--text3)">${d.airport}</div>
        <div style="font-size:11px;color:var(--text3)">${d.country}</div>
        ${d.paxCost ? `<div style="font-size:10px;color:var(--text3);margin-top:2px">Route: ${Number(d.paxCost).toLocaleString()} W</div>` : ''}
      </td>
      <td>
        <div style="display:flex;flex-direction:column;gap:3px">
          <span class="badge b-${d.paxSize||'A'}" style="font-size:10px">${d.paxSize||'—'}</span>
          ${d.paxSlots ? `<span style="font-size:10px;color:var(--blue-t)">✈ ${d.paxSlots} PAX</span>` : ''}
          ${d.cargoSlots ? `<span style="font-size:10px;color:#713f12">📦 ${d.cargoSlots} cargo</span>` : ''}
        </div>
      </td>
      <td class="r">${fmtN(calc.dist)} NM</td>
      <td class="r">${fmtTime(calc.flightMins)}</td>
      <td class="r" style="font-weight:600;color:var(--blue-t)">
        ${fmtN(calc.spPerHour)}
        ${_sortBy==='spPerHour'?'<span style="color:var(--sky);font-size:10px"> ▲</span>':''}
      </td>
      <td class="r" style="color:var(--green)">${fmtN(calc.xpPerHour)}</td>
      <td class="r ${calc.overContract?'':''}">
        <span style="${overStyle}">${fmtN(calc.estSP)}</span>
        ${calc.overContract?'<div style="font-size:10px;color:var(--amber)">⚠ over contract</div>':''}
      </td>
      <td class="r">${fmtN(calc.estXP)}</td>
      <td class="r" style="font-weight:600">${fmtN(calc.dailySP)}</td>
      <td class="r">${calc.flightsPerDay}x</td>
      <td>
        <button class="btn btn-sky btn-sm ro-calc-btn"
          data-icao="${_selectedIcao}" data-dest="${d.iata}"
          style="font-size:11px;padding:3px 8px">Calc</button>
      </td>
    </tr>`;
  }

  async function render() {
    await loadData();
    const iata     = Store.getActiveIata();
    const ap       = Store.getActiveAirport();
    const fleetAcs = Store.getFleet().filter(f => f.status !== 'Retired');
    const destSizes = [...new Set((_dests||[]).map(d=>d.paxSize).filter(Boolean))].sort();

    // Aircraft selector — fleet first, then search any ICAO
    const fleetOpts = fleetAcs.map(f =>
      `<option value="${f.icao}" ${_selectedIcao===f.icao?'selected':''}>${f.icao} — ${f.name}</option>`
    ).join('');

    const ac = _aircraft?.find(a => a.icao === _selectedIcao);
    _results = ac ? buildResults(ac) : [];

    const acInfo = ac ? `
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
        <span class="badge b-${ac.size}">Size ${ac.size}</span>
        <span class="badge ${ac.type==='Cargo'?'b-cargo':'b-pax'}">${ac.type}</span>
        <span class="badge b-${ac.manufacturer==='Airbus'?'airbus':'boeing'}">${ac.manufacturer}</span>
        <span style="font-size:12px;color:var(--text2);margin-left:4px">
          ${ac.speed||'?'} kts · Max SP: ${fmtN(ac.maxSP)} · Max Range: ${fmtN(parseFloat(ac.maxRange)||0)} NM
        </span>
      </div>` : '';

    const tableHTML = _results.length ? `
      <div class="table-wrap" style="margin-top:16px">
        <table>
          <thead><tr>
            <th style="text-align:center">#</th>
            <th>Destination</th>
            <th>Size / Slots</th>
            <th class="r sortable" data-sort="dist" style="cursor:pointer">${_sortBy==='dist'?'▲ ':''}Distance</th>
            <th class="r">Flight Time</th>
            <th class="r sortable" data-sort="spPerHour" style="cursor:pointer;color:${_sortBy==='spPerHour'?'var(--sky)':'inherit'}">${_sortBy==='spPerHour'?'▲ ':''}SP/hr</th>
            <th class="r sortable" data-sort="xpPerHour" style="cursor:pointer;color:${_sortBy==='xpPerHour'?'var(--green)':'inherit'}">${_sortBy==='xpPerHour'?'▲ ':''}XP/hr</th>
            <th class="r sortable" data-sort="spPerFlight" style="cursor:pointer">${_sortBy==='spPerFlight'?'▲ ':''}SP/flight</th>
            <th class="r">XP/flight</th>
            <th class="r sortable" data-sort="dailySP" style="cursor:pointer">${_sortBy==='dailySP'?'▲ ':''}Daily SP</th>
            <th class="r">Flights/day</th>
            <th></th>
          </tr></thead>
          <tbody>${_results.map(({d,calc},i) => resultRow(d,calc,i)).join('')}</tbody>
        </table>
      </div>
      <div style="font-size:12px;color:var(--text3);margin-top:8px">
        ${_results.length} reachable destinations · sorted by ${sortLabel(_sortBy)} · click column headers to re-sort
      </div>` :
      ac ? `<div class="empty" style="margin-top:16px"><div class="ei">🔍</div>
              <div class="et">No reachable destinations</div>
              <div class="es">Check aircraft range or adjust filters</div></div>` :
           `<div class="empty" style="margin-top:16px"><div class="ei">✈️</div>
              <div class="et">Select an aircraft to see optimal routes</div>
              <div class="es">Choose from your fleet or type any ICAO code</div></div>`;

    return `
    <div class="page-heading">
      <h1>Route Optimizer</h1>
      <p>Best routes from <strong>${iata}</strong> ranked by earnings · ${_results.length ? _results.length+' destinations found' : 'select an aircraft to start'}</p>
    </div>

    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;box-shadow:var(--shadow);margin-bottom:4px">
      <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:12px;align-items:end;flex-wrap:wrap">
        <div class="fg">
          <label>Aircraft — from fleet</label>
          <select class="fc" id="ro-fleet-sel">
            <option value="">— Pick from fleet —</option>
            ${fleetOpts}
          </select>
        </div>
        <div class="fg" style="position:relative">
          <label>Or type any ICAO</label>
          <input class="fc" id="ro-icao" placeholder="e.g. A359" style="text-transform:uppercase"
            value="${_selectedIcao}" autocomplete="off">
        </div>
        <div class="fg">
          <label>Filter dest. size</label>
          <select class="fc" id="ro-size">
            <option value="">All sizes</option>
            ${destSizes.map(s=>`<option value="${s}" ${_filterSize===s?'selected':''}>Size ${s}</option>`).join('')}
          </select>
        </div>
        <div class="fg">
          <label>Min PAX slots</label>
          <select class="fc" id="ro-minslots">
            <option value="0">Any slots</option>
            ${[2,3,4,5].map(n=>`<option value="${n}" ${_minSlots===n?'selected':''}>≥ ${n} slots</option>`).join('')}
          </select>
        </div>
      </div>
      ${acInfo}
    </div>

    <div style="display:flex;align-items:center;gap:8px;margin:12px 0;flex-wrap:wrap">
      <span style="font-size:12px;color:var(--text2);font-weight:600">Sort by:</span>
      ${['spPerHour','xpPerHour','spPerFlight','dailySP','dist'].map(k=>
        `<button class="btn btn-sm ro-sort ${_sortBy===k?'btn-sky':'btn-outline'}" data-sort="${k}">${sortLabel(k)}</button>`
      ).join('')}
    </div>

    ${tableHTML}`;
  }

  function bindEvents() {
    // Fleet selector
    document.getElementById('ro-fleet-sel')?.addEventListener('change', e => {
      _selectedIcao = e.target.value;
      const input = document.getElementById('ro-icao');
      if (input) input.value = _selectedIcao;
      App.navigate('routeoptimizer');
    });

    // ICAO text input with debounce
    let _debounce;
    document.getElementById('ro-icao')?.addEventListener('input', e => {
      clearTimeout(_debounce);
      _debounce = setTimeout(() => {
        _selectedIcao = e.target.value.trim().toUpperCase();
        App.navigate('routeoptimizer');
      }, 400);
    });

    // Size filter
    document.getElementById('ro-size')?.addEventListener('change', e => {
      _filterSize = e.target.value;
      App.navigate('routeoptimizer');
    });

    // Min slots filter
    document.getElementById('ro-minslots')?.addEventListener('change', e => {
      _minSlots = parseInt(e.target.value) || 0;
      App.navigate('routeoptimizer');
    });

    // Sort buttons
    document.querySelectorAll('.ro-sort').forEach(btn => {
      btn.addEventListener('click', () => {
        _sortBy = btn.dataset.sort;
        App.navigate('routeoptimizer');
      });
    });

    // Sortable column headers
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        _sortBy = th.dataset.sort;
        App.navigate('routeoptimizer');
      });
    });

    // Calc button → open calculator with prefilled values
    document.querySelectorAll('.ro-calc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Pass to calculator page
        const icao = btn.dataset.icao;
        const dest = btn.dataset.dest;
        CalculatorPage.quickAdd(icao, dest);
      });
    });
  }

  return { render, bindEvents };
})();