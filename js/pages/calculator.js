/**
 * calculator.js — SP/XP Route Calculator
 *
 * Given an aircraft + destination route, calculates:
 *   - Estimated flight time (distance / cruise speed)
 *   - Max SP and XP (from aircraft CSV)
 *   - SP per hour, XP per hour
 *   - Flights per day
 *   - Daily SP and XP estimate
 *
 * Also supports side-by-side comparison of up to 4 aircraft on the same route.
 */
const CalculatorPage = (() => {
  let _aircraft = null;
  let _dests    = null;
  let _results  = [];        // array of calculated rows
  let _activeIata = null;

  async function loadData() {
    if (!_aircraft) _aircraft = await CSV.loadAircraft();
    if (!_dests)    _dests    = await CSV.loadDestinations();
    _activeIata = Store.getActiveIata();
    return { aircraft: _aircraft, dests: _dests };
  }

  // ── Core calculation ────────────────────────────────────────
  function calculate(ac, dist) {
    const speed    = parseFloat(ac.speed)    || 480;  // knots
    const maxSP    = parseFloat(ac.maxSP)    || 0;
    const xp10     = parseFloat(ac.xp_lv10) || 0;

    // Flight time in hours (add ~30min for taxi/handling estimate)
    const flightHours  = dist / speed;
    const totalHours   = flightHours + 0.5;
    const flightMins   = Math.round(flightHours * 60);
    const totalMins    = Math.round(totalHours * 60);

    // Flights per day (24h / round-trip total time)
    const roundTripH   = totalHours * 2;
    const flightsPerDay = Math.max(1, Math.floor(24 / roundTripH));

    // Per-flight SP/XP (scaled by distance vs max contract distance)
    const maxContract  = parseFloat(ac.maxContract) || dist;
    const distRatio    = Math.min(1, dist / maxContract);
    const estSP        = Math.round(maxSP  * distRatio);
    const estXP        = Math.round(xp10   * distRatio);

    const spPerHour    = totalHours > 0 ? Math.round(estSP / totalHours) : 0;
    const xpPerHour    = totalHours > 0 ? Math.round(estXP / totalHours) : 0;
    const dailySP      = estSP  * flightsPerDay;
    const dailyXP      = estXP  * flightsPerDay;

    return {
      flightMins, totalMins, flightHours, totalHours,
      estSP, estXP, spPerHour, xpPerHour,
      flightsPerDay, dailySP, dailyXP,
      maxSP, xp10, dist,
    };
  }

  function fmtTime(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m.toString().padStart(2,'0')}m`;
  }

  function fmtN(n) { return Number(n).toLocaleString(); }

  // ── Result card ─────────────────────────────────────────────
  function resultCard(ac, dest, calc, idx, origin) {
    const barSP  = Math.min(100, Math.round((calc.estSP  / (calc.maxSP  || 1)) * 100));
    const barXP  = Math.min(100, Math.round((calc.estXP  / (calc.xp10   || 1)) * 100));

    return `<div style="
      background:var(--surface); border:1px solid var(--border);
      border-radius:var(--radius-lg); padding:18px; box-shadow:var(--shadow);
      position:relative;
    ">
      <button class="btn btn-danger btn-sm" style="position:absolute;top:10px;right:10px;padding:3px 8px"
        onclick="CalculatorPage.removeResult(${idx})">✕</button>

      <div style="margin-bottom:12px">
        <div style="font-size:18px;font-weight:800;color:var(--text)">${ac.icao}</div>
        <div style="font-size:13px;color:var(--text2)">${ac.name}</div>
        <div style="margin-top:4px;display:flex;gap:5px;flex-wrap:wrap">
          <span class="badge b-${ac.size}">Size ${ac.size}</span>
          <span class="badge ${ac.type==='Cargo'?'b-cargo':'b-pax'}">${ac.type}</span>
          <span class="badge b-${ac.manufacturer==='Airbus'?'airbus':'boeing'}">${ac.manufacturer}</span>
        </div>
      </div>

      <div style="background:var(--bg);border-radius:var(--radius);padding:10px 12px;margin-bottom:12px;font-size:12.5px">
        <div style="font-weight:600;color:var(--text2);margin-bottom:4px">
          ${origin} → ${dest.iata} · ${fmtN(calc.dist)} NM
        </div>
        <div style="color:var(--text3)">${dest.airport}, ${dest.country}</div>
        <div style="margin-top:5px;display:flex;gap:6px;flex-wrap:wrap">
          ${ac.maxRange ? `<span style="font-size:11px;color:${calc.dist > parseFloat(ac.maxRange) ? 'var(--red)' : 'var(--green)'}">
            ✈ Range: ${fmtN(parseFloat(ac.maxRange))} NM ${calc.dist > parseFloat(ac.maxRange) ? '❌ Out of range' : '✓ Reachable'}
          </span>` : ''}
          ${ac.maxContract && calc.dist > parseFloat(ac.maxContract) ? `<span style="font-size:11px;color:var(--amber)">⚠ Exceeds max contract (${fmtN(parseFloat(ac.maxContract))} NM)</span>` : ''}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div class="dest-meta-item">
          <div class="dml">Flight Time</div>
          <div class="dmv" style="font-size:13px">${fmtTime(calc.flightMins)}</div>
        </div>
        <div class="dest-meta-item">
          <div class="dml">Total (inc. ground)</div>
          <div class="dmv" style="font-size:13px">${fmtTime(calc.totalMins)}</div>
        </div>
        <div class="dest-meta-item">
          <div class="dml">Flights / day</div>
          <div class="dmv">${calc.flightsPerDay}</div>
        </div>
        <div class="dest-meta-item">
          <div class="dml">Cruise Speed</div>
          <div class="dmv" style="font-size:13px">${ac.speed||'—'} kts</div>
        </div>
      </div>

      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
          <span style="font-weight:600;color:var(--blue-t)">SP per flight</span>
          <span style="font-weight:700">${fmtN(calc.estSP)} <span style="color:var(--text3);font-weight:400">/ ${fmtN(calc.maxSP)} max</span></span>
        </div>
        <div style="background:var(--bg);border-radius:4px;height:7px;overflow:hidden">
          <div style="height:100%;width:${barSP}%;background:var(--sky);border-radius:4px"></div>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">${fmtN(calc.spPerHour)} SP/hr · ${fmtN(calc.dailySP)} SP/day</div>
      </div>

      <div>
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
          <span style="font-weight:600;color:var(--green)">XP per flight</span>
          <span style="font-weight:700">${fmtN(calc.estXP)} <span style="color:var(--text3);font-weight:400">/ ${fmtN(calc.xp10)} max</span></span>
        </div>
        <div style="background:var(--bg);border-radius:4px;height:7px;overflow:hidden">
          <div style="height:100%;width:${barXP}%;background:var(--green);border-radius:4px"></div>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">${fmtN(calc.xpPerHour)} XP/hr · ${fmtN(calc.dailyXP)} XP/day</div>
      </div>
    </div>`;
  }

  // ── Top route suggestions for an aircraft ───────────────────
  function topRoutes(ac, count=5) {
    if (!_dests) return '';
    const speed = parseFloat(ac.speed) || 480;
    const maxRange = parseFloat(ac.maxRange) || 9999;

    const ranked = _dests
      .filter(d => {
        const dist = d.distances?.[_activeIata];
        return dist && dist > 0 && dist <= maxRange && d.iata !== _activeIata;
      })
      .map(d => {
        const dist = d.distances[_activeIata];
        const calc = calculate(ac, dist);
        return { d, dist, calc };
      })
      .sort((a, b) => b.calc.spPerHour - a.calc.spPerHour)
      .slice(0, count);

    if (!ranked.length) return '';

    return `<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text3);margin-bottom:8px">
        Top ${count} routes by SP/hr from ${_activeIata}
      </div>
      ${ranked.map(({d, dist, calc}) => `
        <div class="info-row" style="cursor:pointer" onclick="CalculatorPage.quickAdd('${ac.icao}','${d.iata}')">
          <span class="ik">
            <strong>${d.iata}</strong> — ${d.airport}
            <span style="color:var(--text3);font-size:11px;margin-left:6px">${fmtN(dist)} NM · ${fmtTime(calc.flightMins)}</span>
            ${ac.maxContract && dist > parseFloat(ac.maxContract) ? '<span style="font-size:10px;color:var(--amber);margin-left:4px">⚠ over contract</span>' : ''}
          </span>
          <span class="iv" style="display:flex;gap:8px">
            <span style="color:var(--blue-t)">${fmtN(calc.spPerHour)} SP/hr</span>
            <span style="color:var(--text3);font-size:11px">+</span>
          </span>
        </div>`).join('')}
    </div>`;
  }

  // ── Render ──────────────────────────────────────────────────
  async function render() {
    await loadData();
    const fleetIcaos = Store.getFleet().map(f => f.icao);

    const resultsHTML = _results.length
      ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-bottom:24px">
           ${_results.map((r,i) => resultCard(r.ac, r.dest, r.calc, i, r.origin)).join('')}
         </div>`
      : `<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
            padding:40px;text-align:center;color:var(--text2);margin-bottom:20px">
           <div style="font-size:32px;margin-bottom:8px">📊</div>
           <div style="font-weight:600;margin-bottom:4px">No calculations yet</div>
           <div style="font-size:13px">Add an aircraft + route below to calculate SP/XP estimates</div>
         </div>`;

    // Quick-add from fleet buttons
    const fleetButtons = Store.getFleet()
      .filter(f => f.status !== 'Retired')
      .map(f => `<button class="btn btn-outline btn-sm" style="font-size:12px"
          onclick="CalculatorPage.openFromFleet('${f.icao}')">${f.icao}</button>`
      ).join('');

    return `
    <div class="page-heading">
      <h1>SP/XP Calculator</h1>
      <p>Estimate earnings for any aircraft + route · Active hub: <strong>${_activeIata}</strong></p>
    </div>

    ${resultsHTML}

    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;box-shadow:var(--shadow)">
      <div style="font-size:13px;font-weight:600;color:var(--text2);margin-bottom:14px;text-transform:uppercase;letter-spacing:.05em">
        Add a calculation
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="fg" style="position:relative">
          <label>Aircraft ICAO</label>
          <input class="fc" id="calc-icao" placeholder="e.g. A339" style="text-transform:uppercase"
            autocomplete="off">
          <div id="calc-ac-info" style="font-size:12px;color:var(--text2);margin-top:4px;min-height:18px"></div>
        </div>
        <div class="fg">
          <label>Destination IATA</label>
          <input class="fc" id="calc-dest" placeholder="e.g. BKK" style="text-transform:uppercase"
            autocomplete="off">
          <div id="calc-dest-info" style="font-size:12px;color:var(--text2);margin-top:4px;min-height:18px"></div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary" id="calc-run">Calculate</button>
        ${_results.length ? `<button class="btn btn-outline" id="calc-clear">Clear all</button>` : ''}
        ${fleetButtons ? `<div style="display:flex;align-items:center;gap:6px;margin-left:8px;flex-wrap:wrap">
          <span style="font-size:12px;color:var(--text3)">Quick add:</span>${fleetButtons}
        </div>` : ''}
      </div>

      <div id="calc-top-routes" style="margin-top:0"></div>
    </div>`;
  }

  function bindEvents() {
    const icaoInput = document.getElementById('calc-icao');
    const destInput = document.getElementById('calc-dest');

    // Live ICAO lookup
    icaoInput?.addEventListener('input', async () => {
      const q = icaoInput.value.trim().toUpperCase();
      const info = document.getElementById('calc-ac-info');
      const topDiv = document.getElementById('calc-top-routes');
      if (q.length < 2) { if(info) info.textContent=''; return; }

      const ac = _aircraft?.find(a => a.icao.toUpperCase() === q);
      if (ac && info) {
        info.innerHTML = `<span class="badge b-${ac.size}" style="font-size:10px">Size ${ac.size}</span>
          <span class="badge ${ac.type==='Cargo'?'b-cargo':'b-pax'}" style="font-size:10px;margin-left:4px">${ac.type}</span>
          <span style="margin-left:6px">${ac.name} · ${ac.speed||'?'} kts · Max SP: ${fmtN(ac.maxSP)}</span>`;
        if (topDiv) topDiv.innerHTML = topRoutes(ac);
      } else if (info) {
        const partials = _aircraft?.filter(a => a.icao.toUpperCase().startsWith(q)).slice(0,5) || [];
        info.innerHTML = partials.length
          ? `<span style="color:var(--text3)">Did you mean: ${partials.map(a=>`<strong>${a.icao}</strong>`).join(', ')}?</span>`
          : `<span style="color:var(--red)">ICAO not found in CSV</span>`;
        if (topDiv) topDiv.innerHTML = '';
      }
    });

    // Live dest lookup
    destInput?.addEventListener('input', () => {
      const q = destInput.value.trim().toUpperCase();
      const info = document.getElementById('calc-dest-info');
      if (!info || q.length < 3) { if(info) info.textContent=''; return; }
      const dest = _dests?.find(d => d.iata === q);
      if (dest) {
        const dist = dest.distances?.[_activeIata];
        info.innerHTML = `${dest.airport}, ${dest.country}${dist ? ` · <strong>${fmtN(dist)} NM</strong> from ${_activeIata}` : ' · No distance data'}`;
      } else {
        info.innerHTML = `<span style="color:var(--red)">Destination not found</span>`;
      }
    });

    // Calculate button
    document.getElementById('calc-run')?.addEventListener('click', () => {
      runCalc(
        document.getElementById('calc-icao').value.trim().toUpperCase(),
        document.getElementById('calc-dest').value.trim().toUpperCase()
      );
    });

    // Clear button
    document.getElementById('calc-clear')?.addEventListener('click', () => {
      _results = []; App.navigate('calculator');
    });

    // Enter key
    [icaoInput, destInput].forEach(el => el?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('calc-run')?.click();
    }));
  }

  function runCalc(icaoQ, destQ) {
    if (!icaoQ || !destQ) { App.toast('Enter both ICAO and destination', 'error'); return; }

    const ac   = _aircraft?.find(a => a.icao.toUpperCase() === icaoQ.toUpperCase());
    const dest = _dests?.find(d => d.iata === destQ);

    if (!ac)   { App.toast(`Aircraft "${icaoQ}" not found in CSV`, 'error'); return; }
    if (!dest) { App.toast(`Destination "${destQ}" not found`, 'error'); return; }

    const dist = dest.distances?.[_activeIata];
    if (!dist) { App.toast(`No distance data from ${_activeIata} to ${destQ}`, 'error'); return; }

    const maxRange    = parseFloat(ac.maxRange)    || 0;
    const maxContract = parseFloat(ac.maxContract) || 0;

    if (maxRange && dist > maxRange) {
      App.toast(`❌ ${icaoQ} max range is ${fmtN(maxRange)} NM — cannot reach ${destQ} (${fmtN(dist)} NM)`, 'error');
      return;
    }
    if (maxContract && dist > maxContract) {
      App.toast(`⚠ ${destQ} (${fmtN(dist)} NM) exceeds max contract distance (${fmtN(maxContract)} NM) — SP may be reduced`, '');
    }

    _results.push({ ac, dest, calc: calculate(ac, dist), origin: _activeIata });
    App.navigate('calculator');
  }

  async function quickAdd(icaoQ, destQ) {
    await loadData();  // ensure CSV is loaded before searching
    runCalc(icaoQ, destQ);
  }

  function openFromFleet(icaoQ) {
    App.navigate('calculator').then(() => {
      const input = document.getElementById('calc-icao');
      if (input) {
        input.value = icaoQ;
        input.dispatchEvent(new Event('input'));
      }
    });
  }

  function removeResult(idx) {
    _results.splice(idx, 1);
    App.navigate('calculator');
  }

  return { render, bindEvents, quickAdd, openFromFleet, removeResult };
})();