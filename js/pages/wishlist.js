const WishlistPage = (() => {

  const B=(t,c)=>`<span class="badge ${c}">${t}</span>`;
  const bSize=s=>B('Size '+s,'b-'+s);
  const bType=t=>B(t,t==='Cargo'?'b-cargo':'b-pax');
  const bPri=p=>B(p,{'High':'b-high','Medium':'b-medium','Low':'b-low'}[p]||'b-other');
  const bSt=s=>B(s,{'Planning':'b-planning','Saving':'b-saving','Unlocked':'b-unlocked','Skipped':'b-skipped'}[s]||'b-other');
  const ORDER={High:0,Medium:1,Low:2};

  function card(w) {
    return `<div class="card" data-id="${w.id}" style="padding:0;overflow:hidden">
      ${Images.aircraftCardImg(w.icao, w.size, w.type, '120px')}
      <div style="padding:14px 16px">
      <div class="card-header">
        <div><div class="card-icao">${w.icao}</div><div class="card-name">${w.name}</div></div>
        <div class="card-badges">${bSize(w.size)}${bType(w.type)}</div>
      </div>
      <div>
        <div class="card-row"><span class="lbl">Priority</span><span class="val">${bPri(w.priority)}</span></div>
        <div class="card-row"><span class="lbl">Status</span><span class="val">${bSt(w.status)}</span></div>
        <div class="card-row"><span class="lbl">Target</span><span class="val">${w.targetAirport||'—'}</span></div>
      </div>
      </div>
      <div class="card-footer" style="padding:0 16px 12px;margin-top:0">
        <div class="card-note">✈ ${w.plannedRoute||'No route planned'}</div>
        <div class="card-actions">
          <button class="btn btn-outline btn-sm bv" data-id="${w.id}" title="View">👁</button>
          <button class="btn btn-sky btn-sm bp" data-id="${w.id}" title="Move to Fleet">✅</button>
          <button class="btn btn-outline btn-sm be" data-id="${w.id}" title="Edit">✏️</button>
          <button class="btn btn-danger btn-sm bd" data-id="${w.id}" title="Delete">🗑</button>
        </div>
      </div>
    </div>`;
  }

  function filtered() {
    const q=document.getElementById('wq')?.value.toLowerCase()||'';
    const p=document.getElementById('wp')?.value||'';
    const s=document.getElementById('ws')?.value||'';
    const t=document.getElementById('wt')?.value||'';
    return Store.getWishlist()
      .filter(w=>{
        if(q&&!`${w.icao} ${w.name} ${w.targetAirport}`.toLowerCase().includes(q)) return false;
        if(p&&w.priority!==p) return false;
        if(s&&w.status!==s)   return false;
        if(t&&w.type!==t)     return false;
        return true;
      })
      .sort((a,b)=>(ORDER[a.priority]??9)-(ORDER[b.priority]??9));
  }

  function buildWishStandOptions(layout, selected) {
    const iata = Store.getActiveIata();
    const L = layout?.[iata];
    if (!L) return '';
    const opt = v => `<option value="${v}" ${selected===v?'selected':''}>${v}</option>`;
    const pax   = Object.entries(L.paxStands).filter(([,v])=>v>0).map(([k])=>opt(`${k} PAX`)).join('');
    const cargo = Object.entries(L.cargoStands).filter(([,v])=>v>0).map(([k])=>opt(`${k} Cargo`)).join('');
    const comb  = Object.entries(L.combinedStands).filter(([,v])=>v>0).map(([k])=>opt(`${k} Combined`)).join('');
    return [
      pax   ? `<optgroup label="PAX Stands (${iata})">${pax}</optgroup>` : '',
      cargo ? `<optgroup label="Cargo Stands (${iata})">${cargo}</optgroup>` : '',
      comb  ? `<optgroup label="Combined Stands (${iata})">${comb}</optgroup>` : '',
    ].join('');
  }

  function form(it={}, layout=null) {
    const f=(k,d='')=>it[k]!==undefined?it[k]:d;
    return `<div class="form-grid">
      <div class="fg"><label>ICAO Code *</label><input class="fc" id="wi" value="${f('icao')}" style="text-transform:uppercase" placeholder="e.g. A359"></div>
      <div class="fg"><label>Aircraft Name *</label><input class="fc" id="wn" value="${f('name')}" placeholder="e.g. A350-900"></div>
      <div class="fg"><label>Manufacturer</label><select class="fc" id="wm">
        ${['Airbus','Boeing','ATR','Embraer','Bombardier','Other'].map(m=>`<option ${f('manufacturer','Airbus')===m?'selected':''}>${m}</option>`).join('')}</select></div>
      <div class="fg"><label>Size</label><select class="fc" id="wz">
        ${['A','B','C','D','E','F'].map(s=>`<option ${f('size')===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="fg"><label>Type</label><select class="fc" id="wt2">
        <option value="Passenger" ${f('type','Passenger')==='Passenger'?'selected':''}>Passenger</option>
        <option value="Cargo" ${f('type','Passenger')==='Cargo'?'selected':''}>Cargo</option></select></div>
      <div class="fg"><label>Priority</label><select class="fc" id="wpr">
        ${['High','Medium','Low'].map(p=>`<option ${f('priority','High')===p?'selected':''}>${p}</option>`).join('')}</select></div>
      <div class="fg"><label>Status</label><select class="fc" id="wst">
        ${['Planning','Saving','Unlocked','Skipped'].map(s=>`<option ${f('status','Planning')===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="fg"><label>Target Airport</label><input class="fc" id="wa" value="${f('targetAirport')}" style="text-transform:uppercase" placeholder="e.g. IAD"></div>
      <div class="fg full"><label>Planned Route</label><input class="fc" id="wr" value="${f('plannedRoute')}" placeholder="e.g. IAD↔BKK"></div>
      <div class="fg full"><label>Notes</label><textarea class="fc" id="wo" placeholder="Why you want it, strategy…">${f('notes')}</textarea></div>
    </div>`;
  }

  function detail(w) {
    return `<div class="detail-grid">
      <div class="di"><div class="dl">ICAO</div><div class="dd">${w.icao}</div></div>
      <div class="di"><div class="dl">Name</div><div class="dd">${w.name}</div></div>
      <div class="di"><div class="dl">Size / Type</div><div class="dd">${w.size} / ${w.type}</div></div>
      <div class="di"><div class="dl">Priority</div><div class="dd">${bPri(w.priority)}</div></div>
      <div class="di"><div class="dl">Status</div><div class="dd">${bSt(w.status)}</div></div>
      <div class="di"><div class="dl">Target Airport</div><div class="dd">${w.targetAirport||'—'}</div></div>
      <div class="di full"><div class="dl">Planned Route</div><div class="dd">${w.plannedRoute||'—'}</div></div>
      ${w.notes?`<div class="di full"><div class="dl">Notes</div><div class="detail-note">${w.notes}</div></div>`:''}
    </div>`;
  }

  function collect() {
    return {
      icao:document.getElementById('wi').value.trim().toUpperCase(),
      name:document.getElementById('wn').value.trim(),
      manufacturer:document.getElementById('wm').value,
      size:document.getElementById('wz').value,
      type:document.getElementById('wt2').value,
      priority:document.getElementById('wpr').value,
      status:document.getElementById('wst').value,
      targetAirport:document.getElementById('wa').value.trim().toUpperCase(),
      plannedRoute:document.getElementById('wr').value.trim(),
      notes:document.getElementById('wo').value.trim(),
      standType:document.getElementById('wst2')?.value||'',
    };
  }

  function openModal(mode, id=null) {
    const ov=document.getElementById('wish-modal');
    const title=document.getElementById('wm-title');
    const body=document.getElementById('wm-body');
    const foot=document.getElementById('wm-foot');
    const item=id?Store.getWishlist().find(x=>x.id===id):null;
    const close=()=>ov.classList.remove('open');

    if(mode==='view'){
      title.textContent=`${item.icao} — ${item.name}`;
      body.innerHTML=detail(item);
      foot.innerHTML=`<button class="btn btn-sky" id="wmp">✅ Move to Fleet</button>
        <button class="btn btn-outline" id="wme">✏️ Edit</button>
        <button class="btn btn-outline" id="wmc">Close</button>`;
      document.getElementById('wmp').onclick=async()=>{
        const result = await Store.promoteToFleet(id);
        const target = result.targetIata;
        const switched = target !== Store.getActiveIata();
        if (switched) {
          await Store.setActiveAirport(target);
          App.renderSwitcher?.();
        }
        App.toast(`${item.icao} moved to ${target} fleet!${switched?' Switched to '+target:''}`, 'success');
        close();
        App.navigate('fleet');
      };
      document.getElementById('wme').onclick=()=>openModal('edit',id);
      document.getElementById('wmc').onclick=close;
    } else if(mode==='add'){
      title.textContent='Add to Wishlist';
      body.innerHTML=form({});
      CSV.loadLayout().then(layout => {
        body.innerHTML=form({}, layout);
        Autocomplete.bindIcaoAutocomplete('wi','wn','wm','wz','wt2',null,'wst2', layout);
        Autocomplete.bindStandAutoSuggest('wz','wt2','wst2', layout);
      });
      foot.innerHTML=`<button class="btn btn-outline" id="wmc">Cancel</button><button class="btn btn-primary" id="wms">Save</button>`;
      document.getElementById('wmc').onclick=close;
      document.getElementById('wms').onclick=async()=>{
        const d=collect();
        if(!d.icao||!d.name){App.toast('ICAO and Name required','error');return;}
        await Store.addWishlist(d);
        App.toast('Added!','success');close();App.navigate('wishlist');
      };
    } else {
      title.textContent=`Edit — ${item.icao}`;
      body.innerHTML=form(item);
      CSV.loadLayout().then(layout => {
        body.innerHTML=form(item, layout);
        Autocomplete.bindIcaoAutocomplete('wi','wn','wm','wz','wt2',null,'wst2', layout);
        Autocomplete.bindStandAutoSuggest('wz','wt2','wst2', layout);
      });
      foot.innerHTML=`<button class="btn btn-danger" id="wmdel" style="margin-right:auto">🗑 Delete</button>
        <button class="btn btn-outline" id="wmc">Cancel</button><button class="btn btn-primary" id="wms">Save Changes</button>`;
      document.getElementById('wmdel').onclick=async()=>{
        if(!confirm(`Remove ${item.icao}?`)) return;
        await Store.deleteWishlist(id);
        App.toast('Removed','success');close();App.navigate('wishlist');
      };
      document.getElementById('wmc').onclick=close;
      document.getElementById('wms').onclick=async()=>{
        const d=collect();
        if(!d.icao||!d.name){App.toast('ICAO and Name required','error');return;}
        await Store.updateWishlist(id,d);
        App.toast('Updated!','success');close();App.navigate('wishlist');
      };
    }
    ov.classList.add('open');
  }

  function reGrid() {
    const items=filtered();
    document.getElementById('wish-grid').innerHTML=items.length?items.map(card).join(''):
      `<div class="empty" style="grid-column:1/-1"><div class="ei">🔍</div><div class="et">No results</div></div>`;
    bindCards();
  }

  function bindCards() {
    document.querySelectorAll('.bv').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openModal('view',b.dataset.id);}));
    document.querySelectorAll('.be').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openModal('edit',b.dataset.id);}));
    document.querySelectorAll('.bp').forEach(b=>b.addEventListener('click',async e=>{
      e.stopPropagation();
      const w=Store.getWishlist().find(x=>x.id===b.dataset.id);
      const result = await Store.promoteToFleet(b.dataset.id);
      const target  = result.targetIata;
      const switched = target !== Store.getActiveIata();
      if (switched) {
        await Store.setActiveAirport(target);
        App.renderSwitcher?.();
      }
      App.toast(`${w?.icao} moved to ${target} fleet!${switched?' Switched to '+target:''}`, 'success');
      App.navigate('fleet');
    }));
    document.querySelectorAll('.bd').forEach(b=>b.addEventListener('click',async e=>{
      e.stopPropagation();
      const w=Store.getWishlist().find(x=>x.id===b.dataset.id);
      if(!confirm(`Remove ${w?.icao}?`)) return;
      await Store.deleteWishlist(b.dataset.id);
      App.toast('Removed','success');App.navigate('wishlist');
    }));
    document.querySelectorAll('.card').forEach(c=>c.addEventListener('click',e=>{
      if(e.target.closest('button')) return;
      openModal('view',c.dataset.id);
    }));
  }

  function render() {
    const list=Store.getWishlist();
    const items=filtered();
    const grid=items.length?items.map(card).join(''):
      `<div class="empty" style="grid-column:1/-1"><div class="ei">⭐</div><div class="et">Wishlist is empty</div>
       <button class="btn btn-primary" id="eaw">+ Add to Wishlist</button></div>`;
    return `<div class="stats-bar">
      <div class="stat-card"><div class="sl">Total</div><div class="sv">${list.length}</div></div>
      <div class="stat-card"><div class="sl">High Priority</div><div class="sv">${list.filter(w=>w.priority==='High').length}</div></div>
      <div class="stat-card"><div class="sl">Saving For</div><div class="sv">${list.filter(w=>w.status==='Saving').length}</div></div>
      <div class="stat-card"><div class="sl">Unlocked</div><div class="sv">${list.filter(w=>w.status==='Unlocked').length}</div></div>
    </div>
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div><h2 style="font-size:18px;font-weight:700">Wishlist</h2><p style="font-size:13px;color:var(--text2)">${list.length} aircraft to unlock</p></div>
      <button class="btn btn-primary" id="wbtn-add">+ Add to Wishlist</button>
    </div>
    <div class="toolbar">
      <div class="search-wrap"><span class="si">🔍</span><input id="wq" placeholder="Search ICAO, name…"></div>
      <select class="fsel" id="wp"><option value="">All Priorities</option>
        ${['High','Medium','Low'].map(p=>`<option>${p}</option>`).join('')}</select>
      <select class="fsel" id="ws"><option value="">All Statuses</option>
        ${['Planning','Saving','Unlocked','Skipped'].map(s=>`<option>${s}</option>`).join('')}</select>
      <select class="fsel" id="wt"><option value="">All Types</option><option>Passenger</option><option>Cargo</option></select>
    </div>
    <div class="card-grid" id="wish-grid">${grid}</div>
    <div class="modal-overlay" id="wish-modal">
      <div class="modal">
        <div class="modal-hd"><h3 id="wm-title"></h3><button class="modal-close" id="wm-x">×</button></div>
        <div class="modal-bd" id="wm-body"></div>
        <div class="modal-ft" id="wm-foot"></div>
      </div>
    </div>`;
  }

  function bindEvents() {
    document.getElementById('wbtn-add')?.addEventListener('click',()=>openModal('add'));
    document.getElementById('eaw')?.addEventListener('click',()=>openModal('add'));
    ['wq','wp','ws','wt'].forEach(id=>document.getElementById(id)?.addEventListener('input',reGrid));
    document.getElementById('wish-modal')?.addEventListener('click',e=>{if(e.target.id==='wish-modal')e.target.classList.remove('open');});
    document.getElementById('wm-x')?.addEventListener('click',()=>document.getElementById('wish-modal').classList.remove('open'));
    bindCards();
  }

  return { render, bindEvents };
})();