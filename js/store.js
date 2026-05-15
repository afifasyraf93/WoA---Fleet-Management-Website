/**
 * store.js — multi-airport data persistence
 */
const Store = (() => {
  const API = '/api/data';
  let _data = null;

  async function load() {
    const res = await fetch(API);
    if (!res.ok) throw new Error('Could not load data.json');
    _data = await res.json();
    if (!_data.airports) _data.airports = [];
    if (!_data.activeAirport) _data.activeAirport = _data.airports[0]?.iata || '';
    return _data;
  }

  async function save() {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(_data, null, 2)
    });
    if (!res.ok) throw new Error('Could not save');
    return true;
  }

  function uid(p) { return p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,5); }

  // ── Airport context ─────────────────────────────────────────
  function getActiveIata()   { return _data.activeAirport; }
  function setActiveAirport(iata) { _data.activeAirport = iata; return save(); }
  function getAllAirports()  { return _data.airports; }
  function getActiveAirport(){ return _data.airports.find(a => a.iata === _data.activeAirport) || _data.airports[0]; }
  function getAirportByIata(iata){ return _data.airports.find(a => a.iata === iata); }

  // ── Airport CRUD ────────────────────────────────────────────
  async function addAirport(ap) {
    ap.id = uid('a'); ap.fleet = []; ap.wishlist = [];
    _data.airports.push(ap); await save(); return ap;
  }
  async function updateAirport(iata, changes) {
    const ap = _data.airports.find(a => a.iata === iata);
    if (!ap) throw new Error('Airport not found');
    Object.assign(ap, changes); await save(); return ap;
  }
  async function deleteAirport(iata) {
    _data.airports = _data.airports.filter(a => a.iata !== iata);
    if (_data.activeAirport === iata) _data.activeAirport = _data.airports[0]?.iata || '';
    await save();
  }

  // ── Fleet CRUD (scoped to active airport) ───────────────────
  function getFleet(iata) {
    return (getAirportByIata(iata || getActiveIata()) || {}).fleet || [];
  }
  async function addFleet(item, iata) {
    item.id = uid('f'); item.addedDate = new Date().toISOString().slice(0,10);
    (getAirportByIata(iata || getActiveIata())).fleet.push(item);
    await save(); return item;
  }
  async function updateFleet(id, changes, iata) {
    const fleet = getFleet(iata);
    const idx = fleet.findIndex(x => x.id === id);
    if (idx < 0) throw new Error('Not found');
    Object.assign(fleet[idx], changes); await save(); return fleet[idx];
  }
  async function deleteFleet(id, iata) {
    const ap = getAirportByIata(iata || getActiveIata());
    ap.fleet = ap.fleet.filter(x => x.id !== id); await save();
  }

  // ── Wishlist CRUD ────────────────────────────────────────────
  function getWishlist(iata) {
    return (getAirportByIata(iata || getActiveIata()) || {}).wishlist || [];
  }
  async function addWishlist(item, iata) {
    item.id = uid('w'); item.addedDate = new Date().toISOString().slice(0,10);
    (getAirportByIata(iata || getActiveIata())).wishlist.push(item);
    await save(); return item;
  }
  async function updateWishlist(id, changes, iata) {
    const list = getWishlist(iata);
    const idx = list.findIndex(x => x.id === id);
    if (idx < 0) throw new Error('Not found');
    Object.assign(list[idx], changes); await save(); return list[idx];
  }
  async function deleteWishlist(id, iata) {
    const ap = getAirportByIata(iata || getActiveIata());
    ap.wishlist = ap.wishlist.filter(x => x.id !== id); await save();
  }
  async function promoteToFleet(id, iata) {
    const list = getWishlist(iata);
    const item = list.find(x => x.id === id);
    if (!item) throw new Error('Not found');
    // Respect targetAirport from wishlist item — fall back to active airport
    const targetIata = item.targetAirport || iata || getActiveIata();
    const targetAp   = getAirportByIata(targetIata) || getAirportByIata(iata || getActiveIata());
    const fleetItem = {
      icao: item.icao, name: item.name, manufacturer: item.manufacturer,
      size: item.size, type: item.type, gen: item.gen || '',
      airport: targetAp?.iata || getActiveIata(),
      route: item.plannedRoute || '', status: 'Active',
      standType: item.standType || '', notes: item.notes || '',
    };
    await addFleet(fleetItem, targetAp?.iata || getActiveIata());
    item.status = 'Unlocked'; await save();
    return { fleetItem, targetIata: targetAp?.iata || getActiveIata() };
  }

  return {
    load, save,
    getActiveIata, setActiveAirport, getAllAirports,
    getActiveAirport, getAirportByIata,
    addAirport, updateAirport, deleteAirport,
    getFleet, addFleet, updateFleet, deleteFleet,
    getWishlist, addWishlist, updateWishlist, deleteWishlist, promoteToFleet,
  };
})();