/**
 * standplanner.js — Stand Planner
 * Real stand counts from layout.csv + fleet assignment from standType field
 */
const StandPlannerPage = (() => {
  let _layout = null;

  async function getLayout() {
    if (_layout) return _layout;
    _layout = await CSV.loadLayout();
    return _layout;
  }

  // Which aircraft sizes are physically compatible with each stand range
  // (used for "could fit" count — informational only)
  const COMPAT = {
    'A-B': ['A','B'],
    'A-C': ['A','B','C'],
    'A-D': ['A','B','C','D'],
    'A-E': ['A','B','C','D','E'],
    'A-F': ['A','B','C','D','E','F'],
    'A-G': ['A','B','C','D','E','F','G'],
    'C':   ['C'],
    'C-E': ['C','D','E'],
    'C-F': ['C','D','E','F'],
    'C-G': ['C','D','E','F','G'],
    'D':   ['D'],
    'D-E': ['D','E'],
    'D-F': ['D','E','F'],
    'D-G': ['D','E','F','G'],
  };

  // Normalize standType stored value → layout key + category
  // e.g. "D-F PAX" → { key: "D-F", cat: "pax" }
  //      "C Cargo"  → { key: "C",   cat: "cargo" }
  function parseStandType(st) {
    if (!st) return null;
    const s = st.trim();
    // Match: size-range then optional space and category word
    const m = s.match(/^([A-Z]-[A-Z]|[A-Z])\s*(PAX|Cargo|Combined)?$/i);
    if (!m) return null;
    return {
      key: m[1].toUpperCase(),
      cat: (m[2] || '').toLowerCase() || 'any',
    };
  }

  function standBar(used, total) {
    if (!total) return '';
    const pct = Math.min(100, Math.round((used / total) * 100));
    const cls = pct >= 100 ? 'full' : pct >= 80 ? 'warn' : '';
    return `
      <div class="stand-bar-wrap"><div class="stand-bar ${cls}" style="width:${pct}%"></div></div>
      <div style="font-size:11px;color:var(--text3);margin-top:4px">${used} assigned / ${total} total (${pct}%)</div>`;
  }

  function standCard(key, total, assigned, compatible, type, unassignedCompat=0) {
    if (!total) return '';
    const colors = { pax:'var(--blue-t)', cargo:'#713f12', combined:'var(--purple-t)' };
    const labels = { pax:'PAX', cargo:'Cargo', combined:'Combined' };
    const typeColor = colors[type] || 'var(--text2)';
    const typeLabel = labels[type] || type;
    const rangeDesc = sizeRangeLabel(key);
    const free      = Math.max(0, total - assigned);
    return `<div class="stand-card">
      <div class="stand-card-hd">
        <div>
          <div class="stand-name">${key} <span style="font-size:11px;color:${typeColor};font-weight:600">${typeLabel}</span></div>
          <div class="stand-range" style="color:${typeColor}">${rangeDesc}</div>
          ${unassignedCompat > 0 ? `<div style="font-size:10px;color:var(--amber);margin-top:2px">⚠ ${unassignedCompat} unassigned aircraft fit here</div>` : ''}
        </div>
        <div>
          <div class="stand-count">${total}</div>
          <div style="font-size:10px;color:var(--text3);text-align:right">${free} free</div>
        </div>
      </div>
      ${standBar(assigned, total)}
    </div>`;
  }

  function sizeRangeLabel(key) {
    const sizes = COMPAT[key] || [];
    if (!sizes.length) return key;
    if (sizes.length === 1) return `Size ${sizes[0]} only`;
    return `Size ${sizes[0]}–${sizes[sizes.length-1]}`;
  }

  async function render() {
    const ap     = Store.getActiveAirport();
    const iata   = ap.iata;
    const layout = await getLayout();
    const L      = layout?.[iata];
    const fleet  = Store.getFleet().filter(f => f.status !== 'Retired');
    const pax    = fleet.filter(f => f.type === 'Passenger');
    const cargo  = fleet.filter(f => f.type === 'Cargo');

    // ── Parse all fleet standType assignments ──────────────────
    // fleetAssigned[key][cat] = count of aircraft assigned there
    const fleetAssigned = {};
    fleet.forEach(f => {
      const p = parseStandType(f.standType);
      if (!p) return;
      if (!fleetAssigned[p.key]) fleetAssigned[p.key] = { pax:0, cargo:0, combined:0, any:0 };
      const bucket = p.cat === 'pax' ? 'pax' : p.cat === 'cargo' ? 'cargo' : p.cat === 'combined' ? 'combined' : 'any';
      fleetAssigned[p.key][bucket] = (fleetAssigned[p.key][bucket] || 0) + 1;
    });

    // ── Fleet overview for top summary ─────────────────────────
    const sizeCount = {};
    fleet.forEach(f => { sizeCount[f.size] = (sizeCount[f.size]||0)+1; });

    // Stands assigned summary for overview card
    const assignedSummary = {};
    fleet.forEach(f => {
      if (f.standType) assignedSummary[f.standType] = (assignedSummary[f.standType]||0)+1;
    });
    const unassigned = fleet.filter(f => !f.standType).length;

    if (!L) {
      return `<div class="page-heading"><h1>Stand Planner — ${iata}</h1></div>
        <div class="empty"><div class="ei">📂</div><div class="et">No layout data</div>
          <div class="es">Drop <code>layout.csv</code> into <code>data/csv/</code> and refresh.</div>
        </div>${renderOverview(fleet, sizeCount, assignedSummary, unassigned)}`;
    }

    // Helper: count assigned + compatible for a stand key + category
    function counts(key, cat, fleetSubset) {
      const assigned   = (fleetAssigned[key]?.[cat] || 0) + (fleetAssigned[key]?.any || 0);
      const compatible = fleetSubset.filter(f => (COMPAT[key]||[]).includes(f.size)).length;
      return { assigned, compatible };
    }

    // ── PAX stand cards ────────────────────────────────────────
    const unassignedPax   = pax.filter(f => !f.standType);
    const unassignedCargo = cargo.filter(f => !f.standType);
    const unassignedAll   = fleet.filter(f => !f.standType);

    const paxCards = Object.entries(L.paxStands)
      .filter(([,v]) => v > 0)
      .map(([key, total]) => {
        const { assigned, compatible } = counts(key, 'pax', pax);
        const unassignedCompat = unassignedPax.filter(f => (COMPAT[key]||[]).includes(f.size)).length;
        return standCard(key, total, assigned, compatible, 'pax', unassignedCompat);
      }).join('');

    // ── Combined stand cards ───────────────────────────────────
    const combCards = Object.entries(L.combinedStands)
      .filter(([,v]) => v > 0)
      .map(([key, total]) => {
        const assigned   = (fleetAssigned[key]?.combined||0) + (fleetAssigned[key]?.any||0);
        const compatible = fleet.filter(f => (COMPAT[key]||[]).includes(f.size)).length;
        const unassignedCompat = unassignedAll.filter(f => (COMPAT[key]||[]).includes(f.size)).length;
        return standCard(key, total, assigned, compatible, 'combined', unassignedCompat);
      }).join('');

    // ── Cargo stand cards ──────────────────────────────────────
    const cargoCards = Object.entries(L.cargoStands)
      .filter(([,v]) => v > 0)
      .map(([key, total]) => {
        const { assigned, compatible } = counts(key, 'cargo', cargo);
        const unassignedCompat = unassignedCargo.filter(f => (COMPAT[key]||[]).includes(f.size)).length;
        return standCard(key, total, assigned, compatible, 'cargo', unassignedCompat);
      }).join('');

    // ── Size totals ────────────────────────────────────────────
    const paxTotalCards = Object.entries(L.paxTotal)
      .filter(([,v]) => v > 0)
      .map(([size, total]) => {
        const assigned = pax.filter(f => f.size === size).length;
        return `<div class="stand-card">
          <div class="stand-card-hd">
            <div><div class="stand-name">Size ${size}</div><div class="stand-range" style="color:var(--blue-t)">PAX</div></div>
            <div class="stand-count">${total}</div>
          </div>${standBar(assigned, total)}</div>`;
      }).join('');

    const cargoTotalCards = Object.entries(L.cargoTotal)
      .filter(([,v]) => v > 0)
      .map(([size, total]) => {
        const assigned = cargo.filter(f => f.size === size).length;
        return `<div class="stand-card">
          <div class="stand-card-hd">
            <div><div class="stand-name">Size ${size}</div><div class="stand-range" style="color:#713f12">Cargo</div></div>
            <div class="stand-count">${total}</div>
          </div>${standBar(assigned, total)}</div>`;
      }).join('');

    return `
    <div class="page-heading">
      <h1>Stand Planner — ${iata}</h1>
      <p>${ap.name} · ${fleet.length} aircraft in fleet · bars show assigned / total</p>
    </div>

    ${renderOverview(fleet, sizeCount, assignedSummary, unassigned)}

    <div class="stand-section">
      <div class="stand-section-title">
        <span class="badge b-pax">PAX</span> Passenger Stands — only types available at ${iata}
      </div>
      <div class="stand-grid">
        ${paxCards || '<p style="color:var(--text3);font-size:13px">No passenger stands at this airport</p>'}
      </div>
    </div>

    ${combCards ? `<div class="stand-section">
      <div class="stand-section-title"><span class="badge b-D">Combined</span> Combined Stands</div>
      <div class="stand-grid">${combCards}</div>
    </div>` : ''}

    <div class="stand-section">
      <div class="stand-section-title">
        <span class="badge b-cargo">Cargo</span> Cargo Stands — only types available at ${iata}
      </div>
      <div class="stand-grid">
        ${cargoCards || '<p style="color:var(--text3);font-size:13px">No cargo stands at this airport</p>'}
      </div>
    </div>

    <div class="stand-section">
      <div class="stand-section-title">📊 Total Stand Capacity by Aircraft Size</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:8px">PAX — fleet size vs stand capacity</div>
          <div class="stand-grid">${paxTotalCards || '<p style="color:var(--text3);font-size:13px">—</p>'}</div>
        </div>
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:8px">Cargo — fleet size vs stand capacity</div>
          <div class="stand-grid">${cargoTotalCards || '<p style="color:var(--text3);font-size:13px">—</p>'}</div>
        </div>
      </div>
    </div>`;
  }

  function renderOverview(fleet, sizeCount, assignedSummary, unassigned) {
    const active  = fleet.filter(f => f.status==='Active').length;
    const idle    = fleet.filter(f => f.status==='Idle').length;
    const airbus  = fleet.filter(f => f.manufacturer==='Airbus').length;
    const cargo   = fleet.filter(f => f.type==='Cargo').length;

    const sizeRows = Object.entries(sizeCount).sort().map(([sz,cnt]) =>
      `<div class="info-row"><span class="ik">Size ${sz}</span><span class="iv">${cnt} aircraft</span></div>`
    ).join('') || '<div style="color:var(--text3);font-size:13px;padding:6px 0">No fleet</div>';

    const assignRows = Object.entries(assignedSummary).map(([st,cnt]) =>
      `<div class="info-row"><span class="ik">${st}</span><span class="iv">${cnt} assigned</span></div>`
    ).join('');

    const unassignedList = fleet.filter(f => !f.standType);
    const unassignedRow = unassignedList.length > 0
      ? `<div class="info-row">
          <span class="ik" style="color:var(--amber)">⚠ No stand assigned</span>
          <span class="iv" style="color:var(--amber);font-size:12px">
            ${unassignedList.map(f => f.icao).join(', ')}
          </span>
        </div>`
      : `<div class="info-row"><span class="ik" style="color:var(--green)">✓ All aircraft assigned</span><span class="iv" style="color:var(--green)">—</span></div>`;

    return `<div class="info-grid" style="margin-bottom:20px">
      <div class="info-card">
        <h3>Fleet Overview</h3>
        <div class="info-row"><span class="ik">Total</span><span class="iv">${fleet.length}</span></div>
        <div class="info-row"><span class="ik">Active</span><span class="iv">${active}</span></div>
        <div class="info-row"><span class="ik">Idle</span><span class="iv">${idle}</span></div>
        <div class="info-row"><span class="ik">Airbus</span><span class="iv">${airbus}</span></div>
        <div class="info-row"><span class="ik">Cargo</span><span class="iv">${cargo}</span></div>
      </div>
      <div class="info-card">
        <h3>Fleet by Size</h3>
        ${sizeRows}
      </div>
      <div class="info-card" style="grid-column:1/-1">
        <h3>Stand Assignments</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:2px">
          ${assignRows}${unassignedRow}
          ${!assignRows && !unassignedRow ? '<div style="color:var(--text3);font-size:13px;padding:6px 0">No stand types assigned — edit fleet cards to set Stand Type.</div>' : ''}
        </div>
      </div>
    </div>`;
  }

  function bindEvents() {}
  return { render, bindEvents };
})();