/* ── Airports page ─────────────────────────────────────────── */
const AirportsPage = (() => {
  const B=(t,c)=>`<span class="badge ${c}">${t}</span>`;
  const bSt=s=>B(s,{'Unlocked':'b-unlocked','Locked':'b-locked','Planning':'b-planning'}[s]||'b-other');
  const bSz=s=>B('Size '+s,'b-'+(s||'A'));

  function card(ap) {
    const dist = ap.distFromIAD>0 ? `${Number(ap.distFromIAD).toLocaleString()} NM from IAD` : 'Hub Airport';
    return `<div class="dest-card" data-id="${ap.id}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div class="dest-iata">${ap.iata}</div>
          <div class="dest-name">${ap.name}</div>
          <div class="dest-ctry">${ap.country}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
          ${bSt(ap.status||'Locked')}
          ${ap.paxSize?bSz(ap.paxSize):''}
        </div>
      </div>
      <div class="dest-meta">
        <div class="dest-meta-item"><div class="dml">PAX Slots</div><div class="dmv">${ap.paxSlots||'—'}</div></div>
        <div class="dest-meta-item"><div class="dml">Cargo Slots</div><div class="dmv">${ap.cargoSlots||'—'}</div></div>
        <div class="dest-meta-item"><div class="dml">Runway</div><div class="dmv">${ap.runway?ap.runway.toLocaleString()+'m':'—'}</div></div>
        <div class="dest-meta-item"><div class="dml">Cargo Size</div><div class="dmv">${ap.cargoSize||'—'}</div></div>
      </div>
      <div class="dest-dist">✈ ${dist}</div>
      ${ap.notes?`<div style="margin-top:8px;font-size:12px;color:var(--text2)">${ap.notes}</div>`:''}
      <div style="display:flex;gap:6px;margin-top:10px;justify-content:flex-end">
        <button class="btn btn-outline btn-sm be" data-id="${ap.id}">✏️ Edit</button>
        <button class="btn btn-danger btn-sm bd" data-id="${ap.id}">🗑</button>
      </div>
    </div>`;
  }

  function form(it={}) {
    const f=(k,d='')=>it[k]!==undefined?it[k]:d;
    return `<div class="form-grid">
      <div class="fg"><label>IATA Code *</label><input class="fc" id="ai" value="${f('iata')}" style="text-transform:uppercase" placeholder="e.g. BKK"></div>
      <div class="fg"><label>Airport Name *</label><input class="fc" id="an" value="${f('name')}" placeholder="e.g. Bangkok Suvarnabhumi"></div>
      <div class="fg"><label>Country</label><input class="fc" id="ac" value="${f('country')}" placeholder="e.g. Thailand"></div>
      <div class="fg"><label>Runway (m)</label><input class="fc" id="ar" type="number" value="${f('runway')}" placeholder="4000"></div>
      <div class="fg"><label>PAX Size</label><select class="fc" id="apx">
        <option value="">—</option>${['A','B','C','D','E','F','G'].map(s=>`<option ${f('paxSize')===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="fg"><label>Cargo Size</label><select class="fc" id="acx">
        <option value="">—</option>${['A','B','C','D','E','F','G'].map(s=>`<option ${f('cargoSize')===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="fg"><label>PAX Slots</label><input class="fc" id="aps" type="number" value="${f('paxSlots',0)}"></div>
      <div class="fg"><label>Cargo Slots</label><input class="fc" id="acs" type="number" value="${f('cargoSlots',0)}"></div>
      <div class="fg"><label>Dist from IAD (NM)</label><input class="fc" id="ad" type="number" value="${f('distFromIAD',0)}"></div>
      <div class="fg"><label>Status</label><select class="fc" id="ast">
        ${['Unlocked','Locked','Planning'].map(s=>`<option ${f('status','Locked')===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="fg full"><label>Notes / Strategy</label><textarea class="fc" id="ao" placeholder="Strategy notes…">${f('notes')}</textarea></div>
    </div>`;
  }

  function collect() {
    return {
      iata:document.getElementById('ai').value.trim().toUpperCase(),
      name:document.getElementById('an').value.trim(),
      country:document.getElementById('ac').value.trim(),
      runway:parseInt(document.getElementById('ar').value)||0,
      paxSize:document.getElementById('apx').value,
      cargoSize:document.getElementById('acx').value,
      paxSlots:parseInt(document.getElementById('aps').value)||0,
      cargoSlots:parseInt(document.getElementById('acs').value)||0,
      distFromIAD:parseInt(document.getElementById('ad').value)||0,
      status:document.getElementById('ast').value,
      notes:document.getElementById('ao').value.trim(),
    };
  }

  function openModal(mode,id=null) {
    const ov=document.getElementById('ap-modal');
    const title=document.getElementById('ap-title');
    const body=document.getElementById('ap-body');
    const foot=document.getElementById('ap-foot');
    const item=id?Store.getAirports().find(x=>x.id===id):null;
    const close=()=>ov.classList.remove('open');

    title.textContent=mode==='add'?'Add Airport':`Edit — ${item.iata}`;
    body.innerHTML=form(item||{});

    if(mode==='add') {
      foot.innerHTML=`<button class="btn btn-outline" id="amc">Cancel</button><button class="btn btn-primary" id="ams">Save</button>`;
      document.getElementById('amc').onclick=close;
      document.getElementById('ams').onclick=async()=>{
        const d=collect();if(!d.iata||!d.name){App.toast('IATA and Name required','error');return;}
        await Store.addAirport(d);App.toast('Airport added!','success');close();App.navigate('airports');
      };
    } else {
      foot.innerHTML=`<button class="btn btn-danger" id="amdel" style="margin-right:auto">🗑 Delete</button>
        <button class="btn btn-outline" id="amc">Cancel</button><button class="btn btn-primary" id="ams">Save Changes</button>`;
      document.getElementById('amdel').onclick=async()=>{
        if(!confirm(`Delete ${item.iata}?`)) return;
        await Store.deleteAirport(id);App.toast('Deleted','success');close();App.navigate('airports');
      };
      document.getElementById('amc').onclick=close;
      document.getElementById('ams').onclick=async()=>{
        const d=collect();if(!d.iata||!d.name){App.toast('IATA and Name required','error');return;}
        await Store.updateAirport(id,d);App.toast('Updated!','success');close();App.navigate('airports');
      };
    }
    ov.classList.add('open');
  }

  function render() {
    const aps=Store.getAirports();
    const grid=aps.length?aps.map(card).join(''):
      `<div class="empty" style="grid-column:1/-1"><div class="ei">🏢</div><div class="et">No airports</div>
       <button class="btn btn-primary" id="eaa">+ Add Airport</button></div>`;
    return `<div class="stats-bar">
      <div class="stat-card"><div class="sl">Total</div><div class="sv">${aps.length}</div></div>
      <div class="stat-card"><div class="sl">Unlocked</div><div class="sv">${aps.filter(a=>a.status==='Unlocked').length}</div></div>
      <div class="stat-card"><div class="sl">Locked</div><div class="sv">${aps.filter(a=>a.status==='Locked').length}</div></div>
    </div>
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div><h2 style="font-size:18px;font-weight:700">Airports</h2><p style="font-size:13px;color:var(--text2)">Hub & destination management</p></div>
      <button class="btn btn-primary" id="ap-add">+ Add Airport</button>
    </div>
    <div class="card-grid" id="ap-grid">${grid}</div>
    <div class="modal-overlay" id="ap-modal">
      <div class="modal">
        <div class="modal-hd"><h3 id="ap-title"></h3><button class="modal-close" id="ap-x">×</button></div>
        <div class="modal-bd" id="ap-body"></div>
        <div class="modal-ft" id="ap-foot"></div>
      </div>
    </div>`;
  }

  function bindEvents() {
    document.getElementById('ap-add')?.addEventListener('click',()=>openModal('add'));
    document.getElementById('eaa')?.addEventListener('click',()=>openModal('add'));
    document.querySelectorAll('.be').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openModal('edit',b.dataset.id);}));
    document.querySelectorAll('.bd').forEach(b=>b.addEventListener('click',async e=>{
      e.stopPropagation();
      const ap=Store.getAirports().find(x=>x.id===b.dataset.id);
      if(!confirm(`Delete ${ap?.iata}?`)) return;
      await Store.deleteAirport(b.dataset.id);App.toast('Deleted','success');App.navigate('airports');
    }));
    document.getElementById('ap-modal')?.addEventListener('click',e=>{if(e.target.id==='ap-modal')e.target.classList.remove('open');});
    document.getElementById('ap-x')?.addEventListener('click',()=>document.getElementById('ap-modal').classList.remove('open'));
  }

  return { render, bindEvents };
})();


/* ── Routes page ───────────────────────────────────────────── */
const RoutesPage = (() => {
  const B=(t,c)=>`<span class="badge ${c}">${t}</span>`;
  const bSt=s=>B(s,{'Active':'b-route-active','Planned':'b-route-planned','Paused':'b-route-paused','Retired':'b-route-retired'}[s]||'b-other');

  function form(it={}) {
    const f=(k,d='')=>it[k]!==undefined?it[k]:d;
    return `<div class="form-grid">
      <div class="fg"><label>Aircraft ICAO *</label><input class="fc" id="ri" value="${f('aircraftIcao')}" style="text-transform:uppercase" placeholder="e.g. A333"></div>
      <div class="fg"><label>Aircraft Name</label><input class="fc" id="rn" value="${f('aircraftName')}" placeholder="e.g. A330-300"></div>
      <div class="fg"><label>Origin</label><input class="fc" id="ro" value="${f('origin','IAD')}" style="text-transform:uppercase" placeholder="IAD"></div>
      <div class="fg"><label>Destination</label><input class="fc" id="rd" value="${f('destination')}" style="text-transform:uppercase" placeholder="BKK"></div>
      <div class="fg"><label>Stand Type</label><select class="fc" id="rs">
        ${['D/E/F PAX','C PAX','D/E/F Cargo','A/B/C Cargo'].map(s=>`<option ${f('standType')===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="fg"><label>Status</label><select class="fc" id="rst">
        ${['Active','Planned','Paused','Retired'].map(s=>`<option ${f('status','Active')===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="fg full"><label>Notes</label><textarea class="fc" id="rnt" placeholder="Strategy notes…">${f('notes')}</textarea></div>
    </div>`;
  }

  function collect() {
    return {
      aircraftIcao:document.getElementById('ri').value.trim().toUpperCase(),
      aircraftName:document.getElementById('rn').value.trim(),
      origin:document.getElementById('ro').value.trim().toUpperCase(),
      destination:document.getElementById('rd').value.trim().toUpperCase(),
      standType:document.getElementById('rs').value,
      status:document.getElementById('rst').value,
      notes:document.getElementById('rnt').value.trim(),
    };
  }

  function openModal(mode,id=null) {
    const ov=document.getElementById('rt-modal');
    const title=document.getElementById('rt-title');
    const body=document.getElementById('rt-body');
    const foot=document.getElementById('rt-foot');
    const item=id?Store.getRoutes().find(x=>x.id===id):null;
    const close=()=>ov.classList.remove('open');

    title.textContent=mode==='add'?'Add Route':`Edit — ${item?.aircraftIcao} → ${item?.destination}`;
    body.innerHTML=form(item||{});

    if(mode==='add') {
      foot.innerHTML=`<button class="btn btn-outline" id="rmc">Cancel</button><button class="btn btn-primary" id="rms">Save</button>`;
      document.getElementById('rmc').onclick=close;
      document.getElementById('rms').onclick=async()=>{
        const d=collect();if(!d.aircraftIcao||!d.destination){App.toast('Aircraft and Destination required','error');return;}
        await Store.addRoute(d);App.toast('Route added!','success');close();App.navigate('routes');
      };
    } else {
      foot.innerHTML=`<button class="btn btn-danger" id="rmdel" style="margin-right:auto">🗑 Delete</button>
        <button class="btn btn-outline" id="rmc">Cancel</button><button class="btn btn-primary" id="rms">Save Changes</button>`;
      document.getElementById('rmdel').onclick=async()=>{
        if(!confirm('Delete this route?')) return;
        await Store.deleteRoute(id);App.toast('Deleted','success');close();App.navigate('routes');
      };
      document.getElementById('rmc').onclick=close;
      document.getElementById('rms').onclick=async()=>{
        const d=collect();if(!d.aircraftIcao||!d.destination){App.toast('Required fields missing','error');return;}
        await Store.updateRoute(id,d);App.toast('Updated!','success');close();App.navigate('routes');
      };
    }
    ov.classList.add('open');
  }

  function render() {
    const routes=Store.getRoutes();
    const rows=routes.length?routes.map(r=>`<tr>
      <td class="td-icao">${r.aircraftIcao}</td>
      <td>${r.aircraftName||'—'}</td>
      <td><strong>${r.origin}</strong> ↔ <strong>${r.destination}</strong></td>
      <td><span class="badge b-C" style="font-size:11px">${r.standType||'—'}</span></td>
      <td>${bSt(r.status)}</td>
      <td style="max-width:180px;color:var(--text2);font-size:12px">${r.notes||''}</td>
      <td><div class="td-acts">
        <button class="btn btn-outline btn-sm be" data-id="${r.id}">✏️</button>
        <button class="btn btn-danger btn-sm bd" data-id="${r.id}">🗑</button>
      </div></td>
    </tr>`).join(''):
      `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text2)">No routes yet — add one!</td></tr>`;

    return `<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div><h2 style="font-size:18px;font-weight:700">Route Assignments</h2>
      <p style="font-size:13px;color:var(--text2)">${routes.length} routes total</p></div>
      <button class="btn btn-primary" id="rt-add">+ Add Route</button>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Aircraft</th><th>Name</th><th>Route</th><th>Stand</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <div class="modal-overlay" id="rt-modal">
      <div class="modal">
        <div class="modal-hd"><h3 id="rt-title"></h3><button class="modal-close" id="rt-x">×</button></div>
        <div class="modal-bd" id="rt-body"></div>
        <div class="modal-ft" id="rt-foot"></div>
      </div>
    </div>`;
  }

  function bindEvents() {
    document.getElementById('rt-add')?.addEventListener('click',()=>openModal('add'));
    document.querySelectorAll('.be').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openModal('edit',b.dataset.id);}));
    document.querySelectorAll('.bd').forEach(b=>b.addEventListener('click',async e=>{
      e.stopPropagation();if(!confirm('Delete?')) return;
      await Store.deleteRoute(b.dataset.id);App.toast('Deleted','success');App.navigate('routes');
    }));
    document.getElementById('rt-modal')?.addEventListener('click',e=>{if(e.target.id==='rt-modal')e.target.classList.remove('open');});
    document.getElementById('rt-x')?.addEventListener('click',()=>document.getElementById('rt-modal').classList.remove('open'));
  }

  return { render, bindEvents };
})();


/* ── Destinations page (from CSV) ──────────────────────────── */
const DestinationsPage = (() => {
  let _data = null;
  let _fq='', _fsize='', _fpax='';

  async function load() {
    if(_data) return _data;
    _data = await CSV.loadDestinations();
    return _data;
  }

  function filtered(data) {
    if(!data) return [];
    return data.filter(d=>{
      if(_fq && !`${d.iata} ${d.airport} ${d.country}`.toLowerCase().includes(_fq.toLowerCase())) return false;
      if(_fsize && d.paxSize!==_fsize) return false;
      return true;
    });
  }

  // card() defined inside render() to capture activeIata

  async function render() {
    const data = await load();
    const activeIata = Store.getActiveIata();
    const items = filtered(data);
    const sizes = [...new Set((data||[]).map(d=>d.paxSize).filter(Boolean))].sort();

    function card(d) {
      const dist = d.distances?.[activeIata];
      return `<div class="dest-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div class="dest-iata">${d.iata}</div>
            <div class="dest-name">${d.airport}</div>
            <div class="dest-ctry">${d.country}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
            ${d.paxSize?`<span class="badge b-${d.paxSize}">PAX ${d.paxSize}</span>`:''}
            ${d.cargoSize?`<span class="badge b-cargo" style="font-size:10px">CGO ${d.cargoSize}</span>`:''}
          </div>
        </div>
        <div class="dest-meta">
          <div class="dest-meta-item"><div class="dml">PAX Slots</div><div class="dmv">${d.paxSlots||'—'}</div></div>
          <div class="dest-meta-item"><div class="dml">Cargo Slots</div><div class="dmv">${d.cargoSlots||'—'}</div></div>
          <div class="dest-meta-item"><div class="dml">Runway</div><div class="dmv">${d.runway?d.runway.toLocaleString()+'m':'—'}</div></div>
          <div class="dest-meta-item"><div class="dml">PAX Cost</div><div class="dmv">${d.paxCost?d.paxCost.toLocaleString():'—'}</div></div>
        </div>
        ${dist?`<div class="dest-dist">✈ ${dist.toLocaleString()} NM from ${activeIata}</div>`:''}
      </div>`;
    }

    let content;
    if(!data) {
      content = `<div class="empty"><div class="ei">📂</div><div class="et">No CSV data</div>
        <div class="es">Drop <code>destinations.csv</code> into <code>data/csv/</code> and refresh.</div></div>`;
    } else {
      content = items.length
        ? `<div class="card-grid">${items.map(card).join('')}</div>`
        : `<div class="empty"><div class="ei">🔍</div><div class="et">No results</div></div>`;
    }

    return `<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div><h2 style="font-size:18px;font-weight:700">Destinations</h2>
      <p style="font-size:13px;color:var(--text2)">${(data||[]).length} airports · distances from <strong>${activeIata}</strong></p></div>
    </div>
    <div class="toolbar">
      <div class="search-wrap"><span class="si">🔍</span><input id="dq" placeholder="Search IATA, airport, country…" value="${_fq}"></div>
      <select class="fsel" id="dsz">
        <option value="">All PAX Sizes</option>
        ${sizes.map(s=>`<option value="${s}" ${_fsize===s?'selected':''}>Size ${s}</option>`).join('')}
      </select>
      <span style="font-size:12px;color:var(--text2);margin-left:4px">${items.length} shown</span>
    </div>
    ${content}`;
  }

  function bindEvents() {
    document.getElementById('dq')?.addEventListener('input', async e=>{
      _fq=e.target.value;
      const data=await load();
      const items=filtered(data);
      const grid=document.querySelector('.card-grid');
      if(grid) grid.innerHTML=items.length?items.map(card).join(''):
        `<div class="empty"><div class="ei">🔍</div><div class="et">No results</div></div>`;
      const cnt=document.querySelector('.toolbar span');
      if(cnt) cnt.textContent=items.length+' shown';
    });
    document.getElementById('dsz')?.addEventListener('change', async e=>{
      _fsize=e.target.value;
      const data=await load();
      const items=filtered(data);
      const grid=document.querySelector('.card-grid');
      if(grid) grid.innerHTML=items.length?items.map(card).join(''):
        `<div class="empty"><div class="ei">🔍</div><div class="et">No results</div></div>`;
    });
  }

  return { render, bindEvents };
})();


/* ── Aircraft Reference page (from CSV) ────────────────────── */
const ReferencePage = (() => {
  let _data=null;
  let _fq='', _fmfr='', _ftype='', _fsize='';

  async function load() {
    if(_data) return _data;
    _data = await CSV.loadAircraft();
    return _data;
  }

  function filtered(data) {
    if(!data) return [];
    return data.filter(a=>{
      if(_fq    && !`${a.icao} ${a.name} ${a.manufacturer}`.toLowerCase().includes(_fq.toLowerCase())) return false;
      if(_fmfr  && a.manufacturer!==_fmfr)  return false;
      if(_ftype && a.type!==_ftype)          return false;
      if(_fsize && a.size!==_fsize)          return false;
      return true;
    });
  }

  function rows(data) {
    if(!data||!data.length) return `<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--text2)">
      No CSV data. Drop <code>aircraft.csv</code> into <code>data/csv/</code> and refresh.</td></tr>`;
    return data.map(a=>`<tr>
      <td class="td-icao">${a.icao}</td>
      <td>${a.manufacturer||'—'}</td>
      <td>${a.name}</td>
      <td><span class="badge b-${a.size||'A'}">Size ${a.size}</span></td>
      <td><span class="badge ${a.type==='Cargo'?'b-cargo':'b-pax'}">${a.type}</span></td>
      <td class="r">${a.gen||'—'}</td>
      <td class="r">${a.maxSeats||a.cargo_kg||'—'}</td>
      <td class="r">${a.maxRange?parseInt(a.maxRange).toLocaleString():'—'}</td>
      <td class="r">${a.maxSP||'—'}</td>
      <td class="r">${a.xp_lv10||'—'}</td>
      <td class="r">${a.price_w?parseInt(a.price_w).toLocaleString():'—'}</td>
      <td class="r">${a.unlock_ga||'—'}</td>
    </tr>`).join('');
  }

  async function render() {
    const data = await load();
    const items = filtered(data);
    const mfrs = [...new Set((data||[]).map(a=>a.manufacturer).filter(Boolean))].sort();

    return `<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div><h2 style="font-size:18px;font-weight:700">Aircraft Data</h2>
      <p style="font-size:13px;color:var(--text2)">${(data||[]).length} aircraft from game data v3.5.0</p></div>
    </div>
    <div class="toolbar">
      <div class="search-wrap"><span class="si">🔍</span><input id="rq" placeholder="Search ICAO, name…" value="${_fq}"></div>
      <select class="fsel" id="rmfr">
        <option value="">All Manufacturers</option>
        ${mfrs.map(m=>`<option value="${m}" ${_fmfr===m?'selected':''}>${m}</option>`).join('')}
      </select>
      <select class="fsel" id="rtype">
        <option value="">All Types</option>
        <option value="Passenger" ${_ftype==='Passenger'?'selected':''}>Passenger</option>
        <option value="Cargo" ${_ftype==='Cargo'?'selected':''}>Cargo</option>
      </select>
      <select class="fsel" id="rsize">
        <option value="">All Sizes</option>
        ${['A','B','C','D','E','F'].map(s=>`<option value="${s}" ${_fsize===s?'selected':''}>Size ${s}</option>`).join('')}
      </select>
      <span style="font-size:12px;color:var(--text2);margin-left:4px">${items.length} shown</span>
    </div>
    <div class="table-wrap"><table>
      <thead><tr>
        <th>ICAO</th><th>Manufacturer</th><th>Name</th><th>Size</th><th>Type</th>
        <th class="r">Gen</th><th class="r">Seats/Cargo</th><th class="r">Max Range</th>
        <th class="r">Max SP</th><th class="r">XP Lv.10</th>
        <th class="r">Price (W)</th><th class="r">Unlock (GA)</th>
      </tr></thead>
      <tbody id="ref-tbody">${rows(items)}</tbody>
    </table></div>`;
  }

  function reTable() {
    load().then(data=>{
      const items=filtered(data);
      document.getElementById('ref-tbody').innerHTML=rows(items);
      const cnt=document.querySelector('.toolbar span');
      if(cnt) cnt.textContent=items.length+' shown';
    });
  }

  function bindEvents() {
    document.getElementById('rq')?.addEventListener('input',e=>{_fq=e.target.value;reTable();});
    document.getElementById('rmfr')?.addEventListener('change',e=>{_fmfr=e.target.value;reTable();});
    document.getElementById('rtype')?.addEventListener('change',e=>{_ftype=e.target.value;reTable();});
    document.getElementById('rsize')?.addEventListener('change',e=>{_fsize=e.target.value;reTable();});
  }

  return { render, bindEvents };
})();
