/**
 * autocomplete.js — ICAO auto-fill for fleet & wishlist forms
 *
 * Usage:
 *   bindIcaoAutocomplete('fi', 'fn', 'fm2', 'fz2', 'ft2', 'fg2', 'fst2', layoutData)
 *
 * When user types an ICAO code, shows a dropdown of matches from aircraft CSV.
 * Selecting one fills all fields. Also filters stand type dropdown by size+type.
 */

const Autocomplete = (() => {

  // Default stand type for a given size + type combo
  const DEFAULT_STAND = {
    'A-Passenger': 'A-B PAX', 'B-Passenger': 'A-B PAX',
    'C-Passenger': 'C PAX',
    'D-Passenger': 'D-E PAX', 'E-Passenger': 'D-F PAX', 'F-Passenger': 'D-F PAX',
    'A-Cargo': 'A-C Cargo',  'B-Cargo': 'A-C Cargo',
    'C-Cargo': 'C Cargo',
    'D-Cargo': 'D-E Cargo',  'E-Cargo': 'D-F Cargo',  'F-Cargo': 'D-F Cargo',
  };

  function bindIcaoAutocomplete(icaoId, nameId, mfrId, sizeId, typeId, genId, standId, layoutData) {
    const input = document.getElementById(icaoId);
    if (!input) return;

    // Create autocomplete dropdown container
    let dropdown = document.getElementById('icao-ac-drop');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = 'icao-ac-drop';
      dropdown.style.cssText = `
        position:absolute; z-index:9999;
        background:#fff; border:1px solid var(--border);
        border-radius:var(--radius); box-shadow:var(--shadow-md);
        max-height:220px; overflow-y:auto;
        min-width:320px; display:none;
      `;
      document.body.appendChild(dropdown);
    }

    function positionDropdown() {
      const rect = input.getBoundingClientRect();
      dropdown.style.top  = (rect.bottom + window.scrollY + 2) + 'px';
      dropdown.style.left = rect.left + 'px';
      dropdown.style.width = Math.max(320, rect.width) + 'px';
    }

    function hideDropdown() {
      dropdown.style.display = 'none';
    }

    function fillFields(ac) {
      const iataField = document.getElementById(icaoId);
      const nameField = document.getElementById(nameId);
      const mfrField  = document.getElementById(mfrId);
      const sizeField = document.getElementById(sizeId);
      const typeField = document.getElementById(typeId);
      const genField  = document.getElementById(genId);
      const standField= document.getElementById(standId);

      if (iataField) iataField.value = ac.icao;
      if (nameField) nameField.value = ac.name;
      if (mfrField)  { for (const o of mfrField.options) if (o.value === ac.manufacturer) { mfrField.value = ac.manufacturer; break; } }
      if (sizeField) sizeField.value = ac.size;
      if (typeField) typeField.value = ac.type;
      if (genField && ac.gen)  genField.value = ac.gen;

      // Auto-select best stand type for this airport
      if (standField && layoutData) {
        const iata = Store.getActiveIata();
        const L    = layoutData[iata];
        const best = bestStand(ac.size, ac.type, L);
        if (best) standField.value = best;
      }

      hideDropdown();

      // Trigger change events so bindStandAutoSuggest reacts to programmatic fill
      document.getElementById(sizeId)?.dispatchEvent(new Event('change'));
      document.getElementById(typeId)?.dispatchEvent(new Event('change'));

      // Flash a subtle highlight on filled fields
      [nameId, mfrId, sizeId, typeId, genId, standId].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.transition = 'background .3s';
          el.style.background = '#e8f4ff';
          setTimeout(() => { el.style.background = ''; }, 800);
        }
      });
    }

    // Find best matching stand type for size+type at this airport
    function bestStand(size, type, L) {
      const key = `${size}-${type}`;
      const def = DEFAULT_STAND[key];
      if (!L || !def) return def || '';

      // Check if default exists at airport
      const [range] = def.split(' ');
      const section = type === 'Passenger' ? L.paxStands :
                      type === 'Cargo'     ? L.cargoStands : L.combinedStands;
      if (section?.[range] > 0) return def;

      // Fall back to any available stand that fits this size
      const COMPAT = {
        A:['A-B','A-C','A-D','A-E','A-F'],
        B:['A-B','A-C','A-D','A-E','A-F'],
        C:['A-C','A-D','A-E','A-F','C','C-E','C-F'],
        D:['A-D','A-E','A-F','C-E','C-F','D','D-E','D-F'],
        E:['A-E','A-F','C-E','C-F','D-E','D-F'],
        F:['A-F','C-F','D-F'],
      };
      const compatible = COMPAT[size] || [];
      for (const r of compatible) {
        if (section?.[r] > 0) return `${r} ${type}`;
      }
      return '';
    }

    input.addEventListener('input', async () => {
      const q = input.value.trim().toUpperCase();
      if (q.length < 2) { hideDropdown(); return; }

      const allAircraft = await CSV.loadAircraft();
      if (!allAircraft) { hideDropdown(); return; }

      const matches = allAircraft
        .filter(a => a.icao && (
          a.icao.toUpperCase().includes(q) ||
          (a.name || '').toUpperCase().includes(q)
        ))
        .slice(0, 12);

      if (!matches.length) { hideDropdown(); return; }

      dropdown.innerHTML = matches.map(a => `
        <div class="ac-item" data-icao="${a.icao}" style="
          padding:9px 12px; cursor:pointer; border-bottom:1px solid var(--border);
          display:flex; align-items:center; justify-content:space-between; gap:8px;
          font-size:13px; transition:background .1s;
        ">
          <div>
            <span style="font-weight:700;color:var(--navy);font-size:14px">${a.icao}</span>
            <span style="color:var(--text2);margin-left:8px">${a.name}</span>
          </div>
          <div style="display:flex;gap:5px;flex-shrink:0">
            <span class="badge b-${a.size}" style="font-size:10px">Size ${a.size}</span>
            <span class="badge ${a.type==='Cargo'?'b-cargo':'b-pax'}" style="font-size:10px">${a.type}</span>
            <span class="badge b-${a.manufacturer==='Airbus'?'airbus':'boeing'}" style="font-size:10px">${a.manufacturer}</span>
          </div>
        </div>`).join('');

      dropdown.querySelectorAll('.ac-item').forEach(item => {
        item.addEventListener('mouseenter', () => item.style.background = 'var(--sky-light)');
        item.addEventListener('mouseleave', () => item.style.background = '');
        item.addEventListener('mousedown', e => {
          e.preventDefault();
          const ac = matches.find(a => a.icao === item.dataset.icao);
          if (ac) fillFields(ac);
        });
      });

      positionDropdown();
      dropdown.style.display = 'block';
    });

    input.addEventListener('blur', () => setTimeout(hideDropdown, 150));
    input.addEventListener('focus', () => { if (input.value.length >= 2) input.dispatchEvent(new Event('input')); });

    // Close on scroll/resize
    window.addEventListener('scroll', hideDropdown, { passive: true });
    window.addEventListener('resize', hideDropdown, { passive: true });
  }


  // ── Stand type auto-suggest ────────────────────────────────
  // Call after form renders. Watches sizeId + typeId and filters standId options.
  function bindStandAutoSuggest(sizeId, typeId, standId, layoutData) {
    const sizeEl  = document.getElementById(sizeId);
    const typeEl  = document.getElementById(typeId);
    const standEl = document.getElementById(standId);
    if (!sizeEl || !typeEl || !standEl) return;

    // Which stand size ranges are compatible with each aircraft size
    const COMPAT = {
      A: ['A-B','A-C','A-D','A-E','A-F','A-G'],
      B: ['A-B','A-C','A-D','A-E','A-F','A-G'],
      C: ['A-C','A-D','A-E','A-F','A-G','C','C-E','C-F','C-G'],
      D: ['A-D','A-E','A-F','A-G','C-E','C-F','C-G','D','D-E','D-F','D-G'],
      E: ['A-E','A-F','A-G','C-E','C-F','C-G','D-E','D-F','D-G'],
      F: ['A-F','A-G','C-F','C-G','D-F','D-G'],
      G: ['A-G','C-G','D-G'],
    };

    // Best default stand for a given size + type
    const BEST = {
      'A-Passenger':'A-B PAX', 'B-Passenger':'A-B PAX',
      'C-Passenger':'C PAX',
      'D-Passenger':'D-E PAX', 'E-Passenger':'D-F PAX', 'F-Passenger':'D-F PAX',
      'A-Cargo':'A-C Cargo',   'B-Cargo':'A-C Cargo',
      'C-Cargo':'C Cargo',
      'D-Cargo':'D-E Cargo',   'E-Cargo':'D-F Cargo',   'F-Cargo':'D-F Cargo',
    };

    function refreshStands() {
      const size     = sizeEl.value;
      const type     = typeEl.value;
      const current  = standEl.value;
      const iata     = Store.getActiveIata();
      const L        = layoutData?.[iata];

      if (!size) return; // nothing to filter on yet

      const compatible = COMPAT[size] || [];

      // Rebuild options filtered to compatible ranges
      let html = '<option value="">— Not assigned —</option>';

      if (L) {
        // Use real airport data
        const sections = [
          { label: `PAX Stands (${iata})`,      data: L.paxStands,      cat: 'PAX',      show: !type || type === 'Passenger' },
          { label: `Cargo Stands (${iata})`,     data: L.cargoStands,    cat: 'Cargo',    show: !type || type === 'Cargo' },
          { label: `Combined Stands (${iata})`,  data: L.combinedStands, cat: 'Combined', show: !type || type === 'Passenger' },
        ];
        sections.forEach(({ label, data, cat, show }) => {
          if (!show) return;
          const opts = Object.entries(data || {})
            .filter(([key, count]) => count > 0 && compatible.includes(key))
            .map(([key]) => {
              const val = `${key} ${cat}`;
              return `<option value="${val}" ${current === val ? 'selected' : ''}>${val}</option>`;
            }).join('');
          if (opts) html += `<optgroup label="${label}">${opts}</optgroup>`;
        });
      } else {
        // Fallback without CSV
        const fallback = [
          { cat: 'PAX',      show: !type || type === 'Passenger' },
          { cat: 'Cargo',    show: !type || type === 'Cargo' },
          { cat: 'Combined', show: !type || type === 'Passenger' },
        ];
        fallback.forEach(({ cat, show }) => {
          if (!show) return;
          const opts = compatible.map(key => {
            const val = `${key} ${cat}`;
            return `<option value="${val}" ${current === val ? 'selected' : ''}>${val}</option>`;
          }).join('');
          if (opts) html += `<optgroup label="${cat} Stands">${opts}</optgroup>`;
        });
      }

      standEl.innerHTML = html;

      // Try to restore previous selection first
      if (current) standEl.value = current;

      // If current is empty or incompatible, auto-select best match
      const currentStillValid = current && Array.from(standEl.options).some(o => o.value === current && o.value !== '');
      const bestKey = `${size}-${type}`;
      const best    = BEST[bestKey];
      if (!currentStillValid && best) {
        const opt = Array.from(standEl.options).find(o => o.value === best);
        if (opt) {
          standEl.value = best;
          standEl.style.transition = 'background .3s';
          standEl.style.background = '#e8f4ff';
          setTimeout(() => { standEl.style.background = ''; }, 700);
        }
      }
    }

    sizeEl.addEventListener('change', refreshStands);
    sizeEl.addEventListener('input',  refreshStands);
    typeEl.addEventListener('change', refreshStands);
    typeEl.addEventListener('input',  refreshStands);

    // Run immediately so it reflects current form state on edit
    if (sizeEl.value) refreshStands();
  }

  return { bindIcaoAutocomplete, bindStandAutoSuggest };
})();