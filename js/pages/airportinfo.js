/**
 * airportinfo.js — Airport Info page
 * Merges layout.csv + characteristics.csv + destinations.csv (distances)
 * Shows full profile of all 17 playable airports + manage user airports
 */
const AirportInfoPage = (() => {
  let _layout = null;
  let _chars  = null;
  let _dests  = null;
  let _view   = 'list'; // 'list' | 'detail'
  let _detailIata = null;

  async function loadAll() {
    if (!_layout) _layout = await CSV.loadLayout();
    if (!_chars)  _chars  = await CSV.loadCharacteristics();
    if (!_dests)  _dests  = await CSV.loadDestinations();
    return { layout: _layout, chars: _chars, dests: _dests };
  }

  function n(v) { return v ? Number(v).toLocaleString() : '—'; }

  function statusBadge(iata) {
    const ap = Store.getAllAirports().find(a => a.iata === iata);
    if (!ap) return '<span class="badge b-locked">Not Added</span>';
    return `<span class="badge ${ap.status==='Unlocked'?'b-unlocked':'b-locked'}">${ap.status}</span>`;
  }

  async function render() {
    const { layout, chars } = await loadAll();
    const active = Store.getActiveIata();

    if (_view === 'detail' && _detailIata) {
      return await renderDetail(_detailIata, layout, chars);
    }

    // ── Airport list ─────────────────────────────────────────
    const allIatas   = layout ? Object.keys(layout) : [];
    const myAirports = Store.getAllAirports();
    const myIatas    = myAirports.map(a => a.iata);

    // ── My Airports (user list, with edit/delete) ──────────────
    const myCards = myAirports.map(ap => {
      const L = layout?.[ap.iata] || {};
      const C = chars?.[ap.iata]  || {};
      const isActive = ap.iata === active;
      return `<div class="ap-card${isActive?' is-active':''}" style="padding:0;overflow:hidden;display:flex;flex-direction:column">
        ${Images.airportCardImg(ap.iata, '110px')}
        <div style="padding:14px 16px;flex:1;display:flex;flex-direction:column;position:relative">
          ${isActive?'<div class="ap-active-badge">Active</div>':''}
          <div style="cursor:pointer;margin-bottom:8px" data-detail="${ap.iata}">
            <div style="font-size:22px;font-weight:800;color:var(--text)">${ap.iata}</div>
            <div style="font-size:13px;font-weight:500">${L.name||C.name||ap.name||ap.iata}</div>
            <div style="font-size:11px;color:var(--text3)">${ap.country||''}</div>
          </div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">
            <span class="badge ${ap.status==='Unlocked'?'b-unlocked':'b-locked'}">${ap.status}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:10px">
            <div class="dest-meta-item"><div class="dml">Stands</div><div class="dmv">${C.totalStands?.total||'—'}</div></div>
            <div class="dest-meta-item"><div class="dml">Fleet</div><div class="dmv">${Store.getFleet(ap.iata).length}</div></div>
            <div class="dest-meta-item"><div class="dml">Wishlist</div><div class="dmv">${Store.getWishlist(ap.iata).filter(w=>w.status!=='Unlocked').length}</div></div>
            <div class="dest-meta-item" style="${ap.currentLevel?'':'opacity:.4'}">
              <div class="dml">Level</div>
              <div class="dmv" style="font-size:13px">${ap.currentLevel||0}<span style="font-size:10px;color:var(--text3);font-weight:400">/${C.levels||'?'}</span></div>
            </div>
          </div>
          ${ap.currentLevel && C.levels ? `
          <div style="background:var(--bg);border-radius:4px;height:5px;overflow:hidden;margin-bottom:8px">
            <div style="height:100%;width:${Math.min(100,Math.round((ap.currentLevel/C.levels)*100))}%;
              background:${Math.round((ap.currentLevel/C.levels)*100)>=100?'var(--green)':'var(--sky)'};border-radius:4px"></div>
          </div>` : ''}
          ${ap.notes?`<div style="font-size:12px;color:var(--text2);margin-bottom:8px">${ap.notes}</div>`:''}
          <div style="display:flex;gap:6px;padding-top:8px;margin-top:auto;border-top:1px solid var(--border)">
            <button class="btn btn-outline btn-sm" style="flex:1" data-detail="${ap.iata}">📋 Details</button>
            <button class="btn btn-outline btn-sm ap-edit-btn" data-iata="${ap.iata}" title="Edit">✏️</button>
            ${!isActive?`<button class="btn btn-danger btn-sm ap-del-btn" data-iata="${ap.iata}" title="Delete">🗑</button>`:'<button class="btn btn-outline btn-sm" disabled title="Cannot delete active airport" style="opacity:.4">🗑</button>'}
          </div>
        </div>
      </div>`;
    }).join('');

    // ── All playable airports from CSV (reference) ─────────────
    const allCards = allIatas.map(iata => {
      const L = layout?.[iata] || {};
      const C = chars?.[iata]  || {};
      const inMyList = myIatas.includes(iata);
      const unlockPrice = C.unlockPrice || 0;
      return `<div class="ap-card" style="${inMyList?'opacity:0.55':''}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          <div>
            <div style="font-size:20px;font-weight:800;color:var(--text)">${iata}</div>
            <div style="font-size:13px;font-weight:500">${L.name||C.name||iata}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
            ${unlockPrice?`<span style="font-size:11px;color:var(--text3)">🔓 ${n(unlockPrice)} GA</span>`:'<span style="font-size:11px;color:var(--green);font-weight:600">Free</span>'}
            ${inMyList?'<span class="badge b-unlocked" style="font-size:10px">Added</span>':''}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px">
          <div class="dest-meta-item"><div class="dml">Stands</div><div class="dmv">${C.totalStands?.total||'—'}</div></div>
          <div class="dest-meta-item"><div class="dml">Contracts</div><div class="dmv">${C.contractCapacity||'—'}</div></div>
          <div class="dest-meta-item"><div class="dml">Levels</div><div class="dmv">${C.levels||'—'}</div></div>
        </div>
        <div style="display:flex;gap:6px;padding-top:8px;padding-bottom:4px;border-top:1px solid var(--border);margin-top:auto">
          <button class="btn btn-outline btn-sm" style="flex:1" data-detail="${iata}">📋 Details</button>
          ${!inMyList?`<button class="btn btn-sky btn-sm ap-quick-add" data-iata="${iata}" data-name="${(L.name||C.name||iata).replace(/"/g,'')}" title="Add to my airports">+ Add</button>`:''}
        </div>
      </div>`;
    }).join('');

    return `
    <div style="margin-bottom:28px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:10px">
        <div><h2 style="font-size:18px;font-weight:700">My Airports</h2>
        <p style="font-size:13px;color:var(--text2)">${myAirports.length} airports in your list</p></div>
        <button class="btn btn-primary" id="btn-add-myap">+ Add Airport</button>
      </div>
      <div class="ap-list">${myCards||'<div style="color:var(--text3);font-size:13px;padding:16px 0">No airports yet — add from the list below.</div>'}</div>
    </div>
    <div>
      <div style="margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--text3);margin-bottom:4px">All Playable Airports</div>
        <p style="font-size:13px;color:var(--text2)">${allIatas.length} airports from game CSV · click + Add to add to your list</p>
      </div>
      <div class="ap-list">${allCards||'<div class="empty"><div class="ei">📂</div><div class="et">No CSV data</div><div class="es">Drop layout.csv and characteristics.csv into data/csv/</div></div>'}</div>
    </div>
    ${addAirportModal()}
    ${editAirportModal()}`;
  }


  async function renderDetail(iata, layout, chars) {
    const L = layout?.[iata] || {};
    const C = chars?.[iata]  || {};
    const ap = Store.getActiveAirport();

    // Distances from this airport in destinations CSV
    let distRows = '';
    if (_dests) {
      const myAps = Store.getAllAirports().map(a => a.iata);
      const thisAp = _dests.find(d => d.iata === iata);
      const relevantDests = _dests
        .filter(d => d.iata !== iata && d.distances?.[iata])
        .sort((a,b) => (a.distances[iata]||0) - (b.distances[iata]||0))
        .slice(0, 20);
      distRows = relevantDests.map(d =>
        `<div class="info-row">
          <span class="ik">${d.iata} — ${d.airport} (${d.country})</span>
          <span class="iv">${n(d.distances[iata])} NM</span>
        </div>`
      ).join('');
    }

    return `
    <!-- Hero background image -->
    <div style="position:relative;width:100%;height:220px;border-radius:var(--radius-lg);
      overflow:hidden;margin-bottom:20px;background:var(--sky-light);">
      <img src="images/airports/${iata}.png" alt="${iata}"
        style="width:100%;height:100%;object-fit:cover;display:block"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div style="display:none;width:100%;height:100%;align-items:center;
        justify-content:center;font-size:64px">🏢</div>
      <!-- Overlay gradient -->
      <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(10,20,40,.75) 0%,transparent 50%)"></div>
      <!-- Text over image -->
      <div style="position:absolute;bottom:0;left:0;right:0;padding:20px 24px">
        <div style="display:flex;align-items:flex-end;justify-content:space-between">
          <div>
            <div style="font-size:32px;font-weight:900;color:#fff;letter-spacing:.02em">${iata}</div>
            <div style="font-size:15px;font-weight:500;color:rgba(255,255,255,.85)">${L.name||iata}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            ${statusBadge(iata)}
            <button class="btn btn-outline btn-sm" id="btn-back-list"
              style="background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.3);color:#fff">← Back</button>
          </div>
        </div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <h3>General</h3>
        <div class="info-row"><span class="ik">Contract Capacity</span><span class="iv">${n(C.contractCapacity)}</span></div>
        <div class="info-row"><span class="ik">Handling Crew</span><span class="iv">${n(C.handlingCrew)}</span></div>
        <div class="info-row"><span class="ik">Total Wollars Cost</span><span class="iv">${n(C.wollarsCost)} W</span></div>
        <div class="info-row"><span class="ik">Unlock Price</span><span class="iv">${C.unlockPrice ? n(C.unlockPrice)+' GA' : 'Free'}</span></div>
        <div class="info-row"><span class="ik">Max Levels</span><span class="iv">${n(C.levels)}</span></div>
        <div class="info-row"><span class="ik">Terminal Extensions</span><span class="iv">${n(C.terminalExtensions)}</span></div>
        <div class="info-row"><span class="ik">Premium Pass Price</span><span class="iv">${n(C.premiumPassPrice)} GA</span></div>
      </div>

      <div class="info-card">
        <h3>Costs</h3>
        <div class="info-row"><span class="ik">Terminals</span><span class="iv">${n(C.costTerminals)} W</span></div>
        <div class="info-row"><span class="ik">Stands</span><span class="iv">${n(C.costStands)} W</span></div>
        <div class="info-row"><span class="ik">Equipment</span><span class="iv">${n(C.costEquipment)} W</span></div>
        <div class="info-row"><span class="ik">Starting Stands Cost</span><span class="iv">${n(C.startingStandsCost)} W</span></div>
        <div class="info-row"><span class="ik">Min Stands Cost</span><span class="iv">${n(C.minStandsCost)} W</span></div>
        <div class="info-row"><span class="ik">Min Total Cost</span><span class="iv">${n(C.minWollarsCost)} W</span></div>
      </div>

      <div class="info-card">
        <h3>Contracts & Crew</h3>
        <div class="info-row"><span class="ik">Starting Contract Slots</span><span class="iv">${n(C.startingContractSlots)}</span></div>
        <div class="info-row"><span class="ik">Starting Handling Crew</span><span class="iv">${n(C.startingHandlingCrew)}</span></div>
        <div class="info-row"><span class="ik">Rewarded Slots</span><span class="iv">${n(C.rewardedContractSlots)}</span></div>
        <div class="info-row"><span class="ik">Rewarded Crew</span><span class="iv">${n(C.rewardedHandlingCrew)}</span></div>
        <div class="info-row"><span class="ik">Premium Slots</span><span class="iv">${n(C.premiumContractSlots)}</span></div>
        <div class="info-row"><span class="ik">Premium Crew</span><span class="iv">${n(C.premiumHandlingCrew)}</span></div>
        <div class="info-row"><span class="ik">Starting Contracts</span><span class="iv">${n(C.startingContracts)}</span></div>
      </div>

      <div class="info-card">
        <h3>Total Stands</h3>
        <div class="info-row"><span class="ik">Passenger</span><span class="iv">${n(C.totalStands?.passenger)}</span></div>
        <div class="info-row"><span class="ik">Combined</span><span class="iv">${n(C.totalStands?.combined)}</span></div>
        <div class="info-row"><span class="ik">Cargo</span><span class="iv">${n(C.totalStands?.cargo)}</span></div>
        <div class="info-row"><span class="ik">Total</span><span class="iv"><strong>${n(C.totalStands?.total)}</strong></span></div>
        <div class="info-row"><span class="ik">Starting Stands</span><span class="iv">${n(C.startingStands)}</span></div>
      </div>
    </div>

    <div class="info-card" style="margin-bottom:14px">
      <h3>Equipment</h3>
      <div class="eq-grid">
        ${Object.entries(C.equipment||{}).map(([k,v])=>`
          <div class="eq-item">
            <div class="eql">${k.charAt(0).toUpperCase()+k.slice(1)}</div>
            <div class="eqv">${v||0}</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <h3>PAX Stand Layout (by size range)</h3>
        ${Object.entries(L.paxStands||{}).filter(([,v])=>v>0).map(([k,v])=>
          `<div class="info-row"><span class="ik">${k}</span><span class="iv">${v} stands</span></div>`
        ).join('') || '<p style="color:var(--text3);font-size:13px">No data</p>'}
      </div>
      <div class="info-card">
        <h3>Cargo Stand Layout (by size range)</h3>
        ${Object.entries(L.cargoStands||{}).filter(([,v])=>v>0).map(([k,v])=>
          `<div class="info-row"><span class="ik">${k}</span><span class="iv">${v} stands</span></div>`
        ).join('') || '<p style="color:var(--text3);font-size:13px">No data</p>'}
      </div>
    </div>

    ${distRows ? `<div class="info-card" style="margin-top:14px">
      <h3>Nearest Destinations (from ${iata})</h3>
      ${distRows}
    </div>` : ''}

    ${renderProgressSection(iata, C)}`;
  }

  function addAirportModal() {
    return `<div class="modal-overlay" id="addap-modal">
      <div class="modal">
        <div class="modal-hd"><h3>Add Airport to My List</h3><button class="modal-close" id="addap-x">×</button></div>
        <div class="modal-bd">
          <div class="form-grid">
            <div class="fg"><label>IATA Code *</label><input class="fc" id="addap-iata" placeholder="e.g. PRG" style="text-transform:uppercase"></div>
            <div class="fg"><label>Status</label>
              <select class="fc" id="addap-status">
                <option value="Unlocked">Unlocked</option>
                <option value="Locked">Locked</option>
                <option value="Planning">Planning</option>
              </select>
            </div>
            <div class="fg full"><label>Notes</label><textarea class="fc" id="addap-notes" placeholder="Strategy notes…"></textarea></div>
          </div>
        </div>
        <div class="modal-ft">
          <button class="btn btn-outline" id="addap-cancel">Cancel</button>
          <button class="btn btn-primary" id="addap-save">Add Airport</button>
        </div>
      </div>
    </div>`;
  }

  function editAirportModal() {
    return `<div class="modal-overlay" id="editap-modal">
      <div class="modal">
        <div class="modal-hd"><h3>Edit Airport</h3><button class="modal-close" id="editap-x">×</button></div>
        <div class="modal-bd">
          <div class="form-grid">
            <div class="fg"><label>IATA Code</label><input class="fc" id="editap-iata" disabled style="opacity:.6"></div>
            <div class="fg"><label>Status</label>
              <select class="fc" id="editap-status">
                <option value="Unlocked">Unlocked</option>
                <option value="Locked">Locked</option>
                <option value="Planning">Planning</option>
              </select>
            </div>
            <div class="fg full"><label>Notes</label>
              <textarea class="fc" id="editap-notes" placeholder="Strategy notes…"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-ft">
          <button class="btn btn-outline" id="editap-cancel">Cancel</button>
          <button class="btn btn-primary" id="editap-save">Save Changes</button>
        </div>
      </div>
    </div>`;
  }

  function renderProgressSection(iata, C) {
    const ap       = Store.getAirportByIata(iata);
    const maxLevel = C.levels || 0;
    const curLevel = ap?.currentLevel || 0;
    const pct      = maxLevel > 0 ? Math.min(100, Math.round((curLevel / maxLevel) * 100)) : 0;
    const barColor = pct >= 100 ? 'var(--green)' : pct >= 60 ? 'var(--sky)' : '#f59e0b';

    // Level milestones — rewarded slots come at certain levels
    // Starting contracts + (rewarded slots) at level completion
    const startContracts = C.startingContractSlots || 0;
    const rewardContracts = C.rewardedContractSlots || 0;
    const premiumContracts = C.premiumContractSlots || 0;
    const startCrew = C.startingHandlingCrew || 0;
    const rewardCrew = C.rewardedHandlingCrew || 0;

    // Estimated current contracts/crew based on level progress
    const estContracts = ap ? Math.round(startContracts + (rewardContracts * pct / 100)) : 0;
    const estCrew      = ap ? Math.round(startCrew + (rewardCrew * pct / 100)) : 0;

    return `<div class="info-card" style="margin-top:14px">
      <h3>Airport Progress</h3>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <div style="font-size:13px;font-weight:600;color:var(--text)">
          Level ${curLevel} <span style="color:var(--text3);font-weight:400">/ ${maxLevel} max</span>
        </div>
        <div style="font-size:12px;color:var(--text3)">${pct}% complete</div>
      </div>
      <div style="background:var(--bg);border-radius:6px;height:10px;overflow:hidden;margin-bottom:12px">
        <div style="height:100%;width:${pct}%;background:${barColor};border-radius:6px;transition:width .4s"></div>
      </div>

      ${ap ? `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
        <div class="dest-meta-item">
          <div class="dml">Levels Remaining</div>
          <div class="dmv">${maxLevel - curLevel}</div>
        </div>
        <div class="dest-meta-item">
          <div class="dml">Est. Contracts Now</div>
          <div class="dmv">${estContracts}</div>
        </div>
        <div class="dest-meta-item">
          <div class="dml">Est. Crew Now</div>
          <div class="dmv">${estCrew}</div>
        </div>
        <div class="dest-meta-item">
          <div class="dml">Max Contracts</div>
          <div class="dmv">${startContracts + rewardContracts}</div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:8px;flex:1">
          <label style="font-size:12px;font-weight:600;color:var(--text2);white-space:nowrap">Update level:</label>
          <input type="number" id="level-input-${iata}" min="0" max="${maxLevel}"
            value="${curLevel}" placeholder="0"
            style="width:80px;padding:5px 8px;border:1px solid var(--border);
                   border-radius:var(--radius);font-size:13px;outline:none">
          <span style="font-size:12px;color:var(--text3)">/ ${maxLevel}</span>
        </div>
        <button class="btn btn-sky btn-sm" id="level-save-${iata}">Save</button>
        ${pct >= 100 ? '<span style="font-size:12px;color:var(--green);font-weight:600">🎉 Max level!</span>' : ''}
      </div>` : `
      <div style="color:var(--text3);font-size:13px;padding:8px 0">
        Add this airport to your list to track progress.
      </div>`}
    </div>`;
  }

  function bindEvents() {
    // ── Single delegated listener on #root handles all dynamic buttons ──
    const root = document.getElementById('root');
    // Remove any previous listener to avoid stacking on re-renders
    if (root._apInfoController) root._apInfoController.abort();
    root._apInfoController = new AbortController();
    root.addEventListener('click', async e => {
      const btn = e.target.closest('button');

      // Edit airport
      if (btn?.classList.contains('ap-edit-btn')) {
        e.stopPropagation();
        const iata = btn.dataset.iata;
        const ap   = Store.getAllAirports().find(a => a.iata === iata);
        if (!ap) return;
        document.getElementById('editap-iata').value   = iata;
        document.getElementById('editap-status').value = ap.status || 'Locked';
        document.getElementById('editap-notes').value  = ap.notes  || '';
        document.getElementById('editap-modal').classList.add('open');
        return;
      }

      // Delete airport
      if (btn?.classList.contains('ap-del-btn')) {
        e.stopPropagation();
        const iata = btn.dataset.iata;
        const fleetCount = Store.getFleet(iata).length;
        const msg = fleetCount > 0
          ? `Delete ${iata}? This removes its ${fleetCount} fleet aircraft and wishlist too. Cannot be undone.`
          : `Delete ${iata} from your list?`;
        if (!confirm(msg)) return;
        await Store.deleteAirport(iata);
        App.renderSwitcher();
        App.toast(`${iata} removed`, 'success');
        App.navigate('airportinfo');
        return;
      }

      // Quick add from all-airports list
      if (btn?.classList.contains('ap-quick-add')) {
        e.stopPropagation();
        const iata = btn.dataset.iata;
        if (Store.getAllAirports().find(a => a.iata === iata)) {
          App.toast(`${iata} already in your list`, 'error'); return;
        }
        await Store.addAirport({ iata, name: btn.dataset.name||iata, country:'', status:'Locked', notes:'' });
        App.renderSwitcher();
        App.toast(`${iata} added!`, 'success');
        App.navigate('airportinfo');
        return;
      }

      // Detail view — click on card text area (not a button)
      if (!btn) {
        const detailEl = e.target.closest('[data-detail]');
        if (detailEl) {
          _view = 'detail'; _detailIata = detailEl.dataset.detail;
          App.navigate('airportinfo');
        }
      }

      // Details button
      if (btn?.dataset.detail) {
        _view = 'detail'; _detailIata = btn.dataset.detail;
        App.navigate('airportinfo');
      }

      // Level save button
      if (btn?.id?.startsWith('level-save-')) {
        const iata  = btn.id.replace('level-save-', '');
        const input = document.getElementById('level-input-' + iata);
        if (!input) return;
        const val = parseInt(input.value);
        if (isNaN(val) || val < 0) { App.toast('Enter a valid level', 'error'); return; }
        const C   = _chars?.[iata] || {};
        const max = C.levels || 999;
        if (val > max) { App.toast(`Max level for ${iata} is ${max}`, 'error'); return; }
        await Store.updateAirport(iata, { currentLevel: val });
        App.toast(`${iata} level updated to ${val}`, 'success');
        // Re-render detail in place without full navigate
        _view = 'detail'; _detailIata = iata;
        App.navigate('airportinfo');
      }
    }, { signal: root._apInfoController.signal });

    // Back button
    document.getElementById('btn-back-list')?.addEventListener('click', () => {
      _view = 'list'; _detailIata = null;
      App.navigate('airportinfo');
    });

    // Add airport modal open
    document.getElementById('btn-add-myap')?.addEventListener('click', () =>
      document.getElementById('addap-modal').classList.add('open'));

    // Add airport modal — cancel / close
    document.getElementById('addap-cancel')?.addEventListener('click', () =>
      document.getElementById('addap-modal').classList.remove('open'));
    document.getElementById('addap-x')?.addEventListener('click', () =>
      document.getElementById('addap-modal').classList.remove('open'));
    document.getElementById('addap-modal')?.addEventListener('click', e => {
      if (e.target.id === 'addap-modal') e.target.classList.remove('open');
    });

    // Add airport modal — save
    document.getElementById('addap-save')?.addEventListener('click', async () => {
      const iata   = document.getElementById('addap-iata').value.trim().toUpperCase();
      const status = document.getElementById('addap-status').value;
      const notes  = document.getElementById('addap-notes').value.trim();
      if (!iata) { App.toast('IATA required', 'error'); return; }
      if (Store.getAllAirports().find(a => a.iata === iata)) {
        App.toast(`${iata} already in your list`, 'error'); return;
      }
      const L2 = _layout?.[iata];
      const C2 = _chars?.[iata];
      await Store.addAirport({ iata, name: L2?.name||C2?.name||iata, country:'', status, notes });
      App.renderSwitcher();
      App.toast(`${iata} added!`, 'success');
      document.getElementById('addap-modal').classList.remove('open');
      App.navigate('airportinfo');
    });

    // Edit airport modal — save / close
    document.getElementById('editap-save')?.addEventListener('click', async () => {
      const iata = document.getElementById('editap-iata').value;
      await Store.updateAirport(iata, {
        status: document.getElementById('editap-status').value,
        notes:  document.getElementById('editap-notes').value.trim(),
      });
      App.toast(`${iata} updated!`, 'success');
      document.getElementById('editap-modal').classList.remove('open');
      App.navigate('airportinfo');
    });
    document.getElementById('editap-x')?.addEventListener('click', () =>
      document.getElementById('editap-modal').classList.remove('open'));
    document.getElementById('editap-cancel')?.addEventListener('click', () =>
      document.getElementById('editap-modal').classList.remove('open'));
    document.getElementById('editap-modal')?.addEventListener('click', e => {
      if (e.target.id === 'editap-modal') e.target.classList.remove('open');
    });
  }

  return { render, bindEvents };
})();