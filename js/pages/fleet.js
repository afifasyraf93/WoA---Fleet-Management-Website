const FleetPage = (() => {

  const B = (t,c) => `<span class="badge ${c}">${t}</span>`;
  const bSize   = s => B('Size '+s, 'b-'+s);
  const bType   = t => B(t, t==='Cargo'?'b-cargo':'b-pax');
  const bMfr    = m => B(m, m==='Airbus'?'b-airbus':m==='Boeing'?'b-boeing':'b-other');
  const bStatus = s => B(s, {'Active':'b-active','Idle':'b-idle','Maintenance':'b-maintenance','Retired':'b-retired'}[s]||'b-other');

  function card(a) {
    return `<div class="card" data-id="${a.id}" style="padding:0;overflow:hidden;display:flex;flex-direction:column">
      ${Images.aircraftCardImg(a.icao, a.size, a.type, '160px')}
      <div style="padding:14px 16px;flex:1;display:flex;flex-direction:column">
        <div class="card-header">
          <div><div class="card-icao">${a.icao}</div><div class="card-name">${a.name}</div></div>
          <div class="card-badges">${bSize(a.size)}${bType(a.type)}</div>
        </div>
        <div style="flex:1">
          <div class="card-row"><span class="lbl">Manufacturer</span><span class="val">${bMfr(a.manufacturer)}</span></div>
          <div class="card-row"><span class="lbl">Airport</span><span class="val">${a.airport||'—'}</span></div>
          <div class="card-row"><span class="lbl">Status</span><span class="val">${bStatus(a.status||'Active')}</span></div>
          ${a.gen?`<div class="card-row"><span class="lbl">Gen</span><span class="val">Gen ${a.gen}</span></div>`:''}
          ${a.standType?`<div class="card-row"><span class="lbl">Stand</span><span class="val" style="font-size:11px">${a.standType}</span></div>`:''}
        </div>
        <div class="card-footer" style="padding-top:10px;margin-top:10px;border-top:1px solid var(--border)">
          <div class="card-note">✈ ${a.route||'No route'}</div>
          <div class="card-actions">
            <button class="btn btn-outline btn-sm bv" data-id="${a.id}">👁</button>
            <button class="btn btn-outline btn-sm be" data-id="${a.id}">✏️</button>
            <button class="btn btn-danger btn-sm bd" data-id="${a.id}">🗑</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function filtered() {
    const q  = document.getElementById('fs')?.value.toLowerCase()||'';
    const m  = document.getElementById('fm')?.value||'';
    const sz = document.getElementById('fz')?.value||'';
    const t  = document.getElementById('ft')?.value||'';
    const st = document.getElementById('fst')?.value||'';
    return Store.getFleet().filter(a => {
      if(q  && !`${a.icao} ${a.name} ${a.manufacturer} ${a.airport} ${a.route}`.toLowerCase().includes(q)) return false;
      if(m  && a.manufacturer!==m)  return false;
      if(sz && a.size!==sz)         return false;
      if(t  && a.type!==t)          return false;
      if(st && a.status!==st)       return false;
      return true;
    });
  }

  function stats() {
    const ap = Store.getActiveAirport();
    const f = Store.getFleet();
    return `<div class="stats-bar">
      <div class="stat-card"><div class="sl">Total</div><div class="sv">${f.length}</div></div>
      <div class="stat-card"><div class="sl">Airbus</div><div class="sv">${f.filter(a=>a.manufacturer==='Airbus').length}</div></div>
      <div class="stat-card"><div class="sl">Active</div><div class="sv">${f.filter(a=>a.status==='Active').length}</div></div>
      <div class="stat-card"><div class="sl">Cargo</div><div class="sv">${f.filter(a=>a.type==='Cargo').length}</div></div>
    </div>`;
  }

  function exportCSV() {
    const ap    = Store.getActiveAirport();
    const fleet = Store.getFleet();
    if (!fleet.length) { App.toast('No aircraft to export', 'error'); return; }

    const headers = [
      'ICAO', 'Aircraft Name', 'Manufacturer', 'Size', 'Type', 'Generation',
      'Airport', 'Route', 'Stand Type', 'Status', 'Notes', 'Added Date'
    ];

    const rows = fleet.map(a => [
      a.icao        || '',
      a.name        || '',
      a.manufacturer|| '',
      a.size        || '',
      a.type        || '',
      a.gen         || '',
      a.airport     || '',
      a.route       || '',
      a.standType   || '',
      a.status      || '',
      (a.notes || '').replace(/,/g, ';').replace(/\n/g, ' '),
      a.addedDate   || '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    link.href     = url;
    link.download = `WoA_Fleet_${ap?.iata || 'export'}_${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    App.toast(`Exported ${fleet.length} aircraft to CSV`, 'success');
  }

  function render() {
    const f = Store.getFleet(), items = filtered();
    const grid = items.length ? items.map(card).join('') :
      `<div class="empty" style="grid-column:1/-1"><div class="ei">✈️</div><div class="et">No aircraft</div>
       <div class="es">Add your first aircraft below.</div>
       <button class="btn btn-primary" id="ea">+ Add Aircraft</button></div>`;
    return `${stats()}
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div><h2 style="font-size:18px;font-weight:700">My Fleet</h2><p style="font-size:13px;color:var(--text2)">${f.length} aircraft total</p></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline" id="btn-export">⬇ Export CSV</button>
        <button class="btn btn-primary" id="btn-add">+ Add Aircraft</button>
      </div>
    </div>
    <div class="toolbar">
      <div class="search-wrap"><span class="si">🔍</span><input id="fs" placeholder="Search ICAO, name, airport…"></div>
      <select class="fsel" id="fm"><option value="">All Manufacturers</option>
        ${['Airbus','Boeing','ATR','Embraer','Bombardier'].map(m=>`<option>${m}</option>`).join('')}</select>
      <select class="fsel" id="fz"><option value="">All Sizes</option>
        ${['A','B','C','D','E','F'].map(s=>`<option value="${s}">Size ${s}</option>`).join('')}</select>
      <select class="fsel" id="ft"><option value="">All Types</option><option>Passenger</option><option>Cargo</option></select>
      <select class="fsel" id="fst"><option value="">All Statuses</option>
        ${['Active','Idle','Maintenance','Retired'].map(s=>`<option>${s}</option>`).join('')}</select>
    </div>
    <div class="card-grid" id="fleet-grid">${grid}</div>
    ${modal()}`;
  }

  function modal() {
    return `<div class="modal-overlay" id="fleet-modal">
      <div class="modal" id="fleet-modal-inner">
        <div class="modal-hd"><h3 id="modal-title">Aircraft</h3><button class="modal-close" id="modal-x">×</button></div>
        <div class="modal-bd" id="modal-body"></div>
        <div class="modal-ft" id="modal-foot"></div>
      </div>
    </div>`;
  }

  // Build stand type options from layout CSV for the active airport
  function buildStandOptions(layout, selected) {
    const iata = Store.getActiveIata();
    const L = layout?.[iata];
    if (!L) {
      // Fallback generic list if CSV not loaded
      const fallback = [
        ['PAX Stands', ['A-B PAX','A-C PAX','C PAX','C-E PAX','C-F PAX','D-E PAX','D-F PAX']],
        ['Cargo Stands', ['A-C Cargo','C Cargo','C-E Cargo','D-E Cargo','D-F Cargo']],
        ['Combined Stands', ['A-C Combined','D-E Combined','D-F Combined']],
      ];
      return fallback.map(([grp, opts]) =>
        `<optgroup label="${grp}">${opts.map(s =>
          `<option value="${s}" ${selected===s?'selected':''}>${s}</option>`
        ).join('')}</optgroup>`
      ).join('');
    }

    const opt = (val) => `<option value="${val}" ${selected===val?'selected':''}>${val}</option>`;

    const paxOpts = Object.entries(L.paxStands)
      .filter(([,v]) => v > 0)
      .map(([k]) => opt(`${k} PAX`)).join('');

    const cargoOpts = Object.entries(L.cargoStands)
      .filter(([,v]) => v > 0)
      .map(([k]) => opt(`${k} Cargo`)).join('');

    const combOpts = Object.entries(L.combinedStands)
      .filter(([,v]) => v > 0)
      .map(([k]) => opt(`${k} Combined`)).join('');

    return [
      paxOpts   ? `<optgroup label="PAX Stands (${iata})">${paxOpts}</optgroup>` : '',
      cargoOpts ? `<optgroup label="Cargo Stands (${iata})">${cargoOpts}</optgroup>` : '',
      combOpts  ? `<optgroup label="Combined Stands (${iata})">${combOpts}</optgroup>` : '',
    ].join('');
  }

  function form(it={}, layout=null) {
    const f=(k,d='')=>it[k]!==undefined?it[k]:d;
    const mfrs=['Airbus','Boeing','ATR','Embraer','Bombardier','Other'];
    return `<div class="form-grid">
      <div class="fg"><label>ICAO Code *</label><input class="fc" id="fi" value="${f('icao')}" placeholder="e.g. A339" style="text-transform:uppercase"></div>
      <div class="fg"><label>Aircraft Name *</label><input class="fc" id="fn" value="${f('name')}" placeholder="e.g. A330-900neo"></div>
      <div class="fg"><label>Manufacturer</label><select class="fc" id="fm2">
        ${mfrs.map(m=>`<option ${f('manufacturer')===m?'selected':''}>${m}</option>`).join('')}</select></div>
      <div class="fg"><label>Size</label><select class="fc" id="fz2">
        ${['A','B','C','D','E','F'].map(s=>`<option ${f('size')===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="fg"><label>Type</label><select class="fc" id="ft2">
        <option value="Passenger" ${f('type','Passenger')==='Passenger'?'selected':''}>Passenger</option>
        <option value="Cargo" ${f('type','Passenger')==='Cargo'?'selected':''}>Cargo</option></select></div>
      <div class="fg"><label>Generation</label><input class="fc" id="fg2" type="number" min="1" max="4" value="${f('gen')}" placeholder="e.g. 3"></div>
      <div class="fg"><label>Airport</label><input class="fc" id="fa" value="${f('airport')||Store.getActiveIata()}" placeholder="e.g. IAD" style="text-transform:uppercase"></div>
      <div class="fg"><label>Status</label><select class="fc" id="fs2">
        ${['Active','Idle','Maintenance','Retired'].map(s=>`<option ${f('status','Active')===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="fg full"><label>Route</label><input class="fc" id="fr" value="${f('route')}" placeholder="e.g. IAD↔BKK"></div>
      <div class="fg"><label>Stand Type</label><select class="fc" id="fst2">
        <option value="" ${!f('standType')?'selected':''}>— Not assigned —</option>
        ${buildStandOptions(layout, f('standType'))}
      </select></div>
      <div class="fg full"><label>Notes / Strategy</label><textarea class="fc" id="fnt" placeholder="Strategy notes…">${f('notes')}</textarea></div>
    </div>`;
  }

  function detail(a) {
    const bg = {'A':'#dbeafe','B':'#e0f2fe','C':'#ede9fe','D':'#fef3c7','E':'#fce7f3','F':'#fee2e2'}[a.size]||'#f0f4f8';
    return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start">
      <!-- Image card -->
      <div style="background:${bg};border-radius:var(--radius-lg);overflow:hidden;
        display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:220px;">
        <img src="images/aircraft/${a.icao}.png" alt="${a.icao}"
          style="width:100%;max-height:260px;object-fit:contain;display:block"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div style="display:none;flex-direction:column;align-items:center;justify-content:center;
          padding:40px;font-size:48px">
          ${a.type==='Cargo'?'📦':'✈️'}
        </div>
        <div style="padding:12px 16px;text-align:center;border-top:1px solid rgba(0,0,0,.06);width:100%;background:rgba(255,255,255,.5)">
          <div style="font-size:18px;font-weight:800;color:var(--text)">${a.icao}</div>
          <div style="font-size:12px;color:var(--text2)">${a.name}</div>
          <div style="display:flex;gap:5px;justify-content:center;margin-top:6px">
            ${bSize(a.size)}${bType(a.type)}${bMfr(a.manufacturer)}
          </div>
        </div>
      </div>
      <!-- Details card -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:14px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);margin-bottom:10px">Details</div>
        <div class="detail-grid" style="grid-template-columns:1fr">
          <div class="di"><div class="dl">Generation</div><div class="dd">${a.gen ? 'Gen '+a.gen : '—'}</div></div>
          <div class="di"><div class="dl">Status</div><div class="dd">${bStatus(a.status||'Active')}</div></div>
          <div class="di"><div class="dl">Airport</div><div class="dd">${a.airport||'—'}</div></div>
          <div class="di"><div class="dl">Route</div><div class="dd">${a.route||'—'}</div></div>
          <div class="di"><div class="dl">Stand Type</div><div class="dd">${a.standType||'—'}</div></div>
          <div class="di"><div class="dl">Added</div><div class="dd">${a.addedDate||'—'}</div></div>
          ${a.notes?`<div class="di"><div class="dl">Notes</div><div class="detail-note">${a.notes}</div></div>`:''}
        </div>
      </div>
    </div>`;
  }

  function collect() {
    return {
      icao: document.getElementById('fi').value.trim().toUpperCase(),
      name: document.getElementById('fn').value.trim(),
      manufacturer: document.getElementById('fm2').value,
      size: document.getElementById('fz2').value,
      type: document.getElementById('ft2').value,
      gen: document.getElementById('fg2').value,
      airport: document.getElementById('fa').value.trim().toUpperCase(),
      status: document.getElementById('fs2').value,
      route: document.getElementById('fr').value.trim(),
      notes:     document.getElementById('fnt').value.trim(),
      standType: document.getElementById('fst2').value,
    };
  }

  function openModal(mode, id=null) {
    const ov = document.getElementById('fleet-modal');
    const title = document.getElementById('modal-title');
    const body  = document.getElementById('modal-body');
    const foot  = document.getElementById('modal-foot');
    const item  = id ? Store.getFleet().find(x=>x.id===id) : null;
    const close = () => ov.classList.remove('open');

    if(mode==='view') {
      title.textContent = `${item.icao} — ${item.name}`;
      body.innerHTML = detail(item);
      // Widen modal for two-panel layout
      const mi = document.getElementById('fleet-modal-inner');
      if(mi) mi.style.maxWidth = '820px';
      foot.innerHTML = `<button class="btn btn-outline" id="mv">✏️ Edit</button><button class="btn btn-outline" id="mc">Close</button>`;
      document.getElementById('mv').onclick = () => openModal('edit', id);
      document.getElementById('mc').onclick = close;
    } else if(mode==='add') {
      title.textContent = 'Add Aircraft';
      const mi = document.getElementById('fleet-modal-inner');
      if(mi) mi.style.maxWidth = '540px';
      body.innerHTML = form({}, null);
      CSV.loadLayout().then(layout => {
        body.innerHTML = form({}, layout);
        Autocomplete.bindIcaoAutocomplete('fi','fn','fm2','fz2','ft2','fg2','fst2', layout);
        Autocomplete.bindStandAutoSuggest('fz2','ft2','fst2', layout);
      });
      foot.innerHTML = `<button class="btn btn-outline" id="mc">Cancel</button><button class="btn btn-primary" id="ms">Save Aircraft</button>`;
      document.getElementById('mc').onclick = close;
      document.getElementById('ms').onclick = async () => {
        const d = collect();
        if(!d.icao||!d.name){App.toast('ICAO and Name required','error');return;}
        const targetIata = d.airport || Store.getActiveIata();
        const targetAp   = Store.getAirportByIata(targetIata);
        if (targetAp) {
          await Store.addFleet(d, targetIata);
          // If added to a different airport, switch to it
          if (targetIata !== Store.getActiveIata()) {
            close();
            await Store.setActiveAirport(targetIata);
            // Rebuild airport switcher buttons
            if (typeof App !== 'undefined') App.renderSwitcher?.();
            App.navigate('fleet');
            App.toast(`Aircraft added to ${targetIata} — switched to ${targetIata}`, 'success');
          } else {
            App.toast('Aircraft added!','success');
            close(); App.navigate('fleet');
          }
        } else {
          App.toast(`Airport "${targetIata}" not in your list — add it first`, 'error');
        }
      };
    } else {
      title.textContent = `Edit — ${item.icao}`;
      const mi = document.getElementById('fleet-modal-inner');
      if(mi) mi.style.maxWidth = '540px';
      body.innerHTML = form(item, null);
      CSV.loadLayout().then(layout => {
        body.innerHTML = form(item, layout);
        Autocomplete.bindIcaoAutocomplete('fi','fn','fm2','fz2','ft2','fg2','fst2', layout);
        Autocomplete.bindStandAutoSuggest('fz2','ft2','fst2', layout);
      });
      foot.innerHTML = `<button class="btn btn-danger" id="mdel" style="margin-right:auto">🗑 Delete</button>
        <button class="btn btn-outline" id="mc">Cancel</button><button class="btn btn-primary" id="ms">Save Changes</button>`;
      document.getElementById('mdel').onclick = async () => {
        if(!confirm(`Delete ${item.icao}?`)) return;
        await Store.deleteFleet(id);
        App.toast('Deleted','success'); close(); App.navigate('fleet');
      };
      document.getElementById('mc').onclick = close;
      document.getElementById('ms').onclick = async () => {
        const d = collect();
        if(!d.icao||!d.name){App.toast('ICAO and Name required','error');return;}
        const prevAirport = Store.getFleet().find(x => x.id === id)?.airport;
        const newAirport  = d.airport || Store.getActiveIata();
        if (prevAirport && newAirport !== prevAirport && Store.getAirportByIata(newAirport)) {
          // Move aircraft to new airport fleet
          await Store.deleteFleet(id);
          await Store.addFleet(d, newAirport);
          await Store.setActiveAirport(newAirport);
          App.toast(`Moved to ${newAirport} fleet`, 'success');
          close(); App.navigate('fleet');
        } else {
          await Store.updateFleet(id, d);
          App.toast('Updated!','success'); close(); App.navigate('fleet');
        }
      };
    }
    ov.classList.add('open');
  }

  function reGrid() {
    const items = filtered();
    document.getElementById('fleet-grid').innerHTML = items.length ? items.map(card).join('') :
      `<div class="empty" style="grid-column:1/-1"><div class="ei">🔍</div><div class="et">No results</div></div>`;
    bindCards();
  }

  function bindCards() {
    document.querySelectorAll('.bv').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openModal('view',b.dataset.id);}));
    document.querySelectorAll('.be').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openModal('edit',b.dataset.id);}));
    document.querySelectorAll('.bd').forEach(b=>b.addEventListener('click',async e=>{
      e.stopPropagation();
      const a=Store.getFleet().find(x=>x.id===b.dataset.id);
      if(!confirm(`Delete ${a?.icao}?`)) return;
      await Store.deleteFleet(b.dataset.id);
      App.toast('Deleted','success'); App.navigate('fleet');
    }));
    document.querySelectorAll('.card').forEach(c=>c.addEventListener('click',e=>{
      if(e.target.closest('button')) return;
      openModal('view',c.dataset.id);
    }));
  }

  function bindEvents() {
    document.getElementById('btn-add')?.addEventListener('click',()=>openModal('add'));
    document.getElementById('btn-export')?.addEventListener('click', exportCSV);
    document.getElementById('ea')?.addEventListener('click',()=>openModal('add'));
    ['fs','fm','fz','ft','fst'].forEach(id=>document.getElementById(id)?.addEventListener('input',reGrid));
    document.getElementById('fleet-modal')?.addEventListener('click',e=>{if(e.target.id==='fleet-modal')e.target.classList.remove('open');});
    document.getElementById('modal-x')?.addEventListener('click',()=>document.getElementById('fleet-modal').classList.remove('open'));
    bindCards();
  }

  return { render, bindEvents };
})();