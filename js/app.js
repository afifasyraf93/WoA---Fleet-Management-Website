const App = (() => {
  const PAGES = {
    home:        'Home',
    fleet:       'Fleet',
    wishlist:    'Wishlist',
    standplanner:'Stand Planner',
    airportinfo: 'Airport Info',
    destinations:'Destinations',
    calculator:      'SP/XP Calculator',
    routeoptimizer:  'Route Optimizer',
    reference:   'Aircraft Data',
  };
  let _page = 'home';

  function bc(page) {
    if (page === 'home') return '';
    const ap = Store.getActiveAirport();
    return `<div class="breadcrumb">
      <span class="bc-icon">🏠</span>
      <span class="bc-link" data-page="home">Home</span>
      <span class="bc-sep">›</span>
      <span class="bc-link" data-page="airportinfo">${ap?.iata||''}</span>
      <span class="bc-sep">›</span>
      <span class="bc-cur">${PAGES[page]||page}</span>
    </div>`;
  }

  async function navigate(page) {  // always returns promise
    if (!PAGES[page]) return;
    _page = page;
    document.querySelectorAll('.nav-link[data-page]').forEach(el =>
      el.classList.toggle('active', el.dataset.page === page));

    const root = document.getElementById('root');
    root.innerHTML = `<div class="page-wrap"><div style="padding:40px;text-align:center;color:var(--text3)">Loading…</div></div>`;

    let html = '';
    switch(page) {
      case 'home':         html = renderHome(); break;
      case 'fleet':        html = FleetPage.render(); break;
      case 'wishlist':     html = WishlistPage.render(); break;
      case 'standplanner': html = await StandPlannerPage.render(); break;
      case 'airportinfo':  html = await AirportInfoPage.render(); break;
      case 'destinations': html = await DestinationsPage.render(); break;
      case 'calculator':      html = await CalculatorPage.render(); break;
      case 'routeoptimizer':  html = await RouteOptimizerPage.render(); break;
      case 'reference':    html = await ReferencePage.render(); break;
    }

    root.innerHTML = `<div class="page-wrap">${bc(page)}${html}</div>`;

    switch(page) {
      case 'home':         bindHome(); break;
      case 'fleet':        FleetPage.bindEvents(); break;
      case 'wishlist':     WishlistPage.bindEvents(); break;
      case 'standplanner': StandPlannerPage.bindEvents(); break;
      case 'airportinfo':  AirportInfoPage.bindEvents(); break;
      case 'destinations': DestinationsPage.bindEvents(); break;
      case 'calculator':      CalculatorPage.bindEvents(); break;
      case 'routeoptimizer':  RouteOptimizerPage.bindEvents(); break;
      case 'reference':    ReferencePage.bindEvents(); break;
    }

    document.querySelectorAll('[data-page]').forEach(el => {
      if (!el.classList.contains('nav-link') && !el.classList.contains('navbar-logo'))
        el.addEventListener('click', () => navigate(el.dataset.page));
    });
    document.querySelector('.bc-link[data-page="home"]')?.addEventListener('click', () => navigate('home'));
    document.querySelector('.bc-link[data-page="airportinfo"]')?.addEventListener('click', () => navigate('airportinfo'));
  }

  // ── Airport switcher ────────────────────────────────────────
  function renderSwitcher() {
    const switcher = document.getElementById('ap-switcher');
    if (!switcher) return;
    const airports = Store.getAllAirports().filter(a => a.status === 'Unlocked');
    const active   = Store.getActiveIata();
    const btns = airports.map(a =>
      `<button class="ap-btn${a.iata===active?' active':''}" data-iata="${a.iata}">${a.iata}</button>`
    ).join('');
    switcher.innerHTML = `<div class="ap-switcher-label">Airport</div>${btns}`;
    switcher.querySelectorAll('.ap-btn').forEach(b => {
      b.addEventListener('click', async () => {
        await Store.setActiveAirport(b.dataset.iata);
        renderSwitcher();
        navigate(_page);
        toast(`Switched to ${b.dataset.iata}`, '');
      });
    });
  }

  // ── Home ────────────────────────────────────────────────────
  function renderHome() {
    const ap     = Store.getActiveAirport();
    const fleet  = Store.getFleet().length;
    const wish   = Store.getWishlist().filter(w => w.status !== 'Unlocked').length;
    const aps    = Store.getAllAirports().filter(a => a.status === 'Unlocked').length;
    const active = Store.getFleet().filter(f => f.status === 'Active').length;

    const apCards = Store.getAllAirports().map(a => {
      const isActive = a.iata === Store.getActiveIata();
      const f = Store.getFleet(a.iata).length;
      const w = Store.getWishlist(a.iata).filter(x => x.status !== 'Unlocked').length;
      return `<div class="ap-card${isActive?' is-active':''}" data-iata="${a.iata}" id="apcard-${a.iata}">
        ${isActive?'<div class="ap-active-badge">Active</div>':''}
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
          <div>
            <div style="font-size:22px;font-weight:800;color:var(--navy)">${a.iata}</div>
            <div style="font-size:13px;font-weight:500">${a.name}</div>
            <div style="font-size:11px;color:var(--text3)">${a.country}</div>
          </div>
          <span class="badge ${a.status==='Unlocked'?'b-unlocked':'b-locked'}">${a.status}</span>
        </div>
        <div style="display:flex;gap:10px;font-size:12px;color:var(--text2);margin-top:6px">
          <span>✈ ${f} aircraft</span>
          <span>⭐ ${w} wishlist</span>
        </div>
        ${a.notes?`<div style="margin-top:8px;font-size:12px;color:var(--text2);border-top:1px solid var(--border);padding-top:6px">${a.notes}</div>`:''}
      </div>`;
    }).join('');

    return `
    <div class="page-heading">
      <h1>✈ WoA Fleet Manager</h1>
      <p>Multi-airport Airbus Empire · Active: <strong>${ap?.iata} — ${ap?.name}</strong></p>
    </div>
    <div class="stats-bar">
      <div class="stat-card"><div class="sl">Fleet (${ap?.iata})</div><div class="sv">${fleet}</div><div class="ss">${active} active</div></div>
      <div class="stat-card"><div class="sl">Wishlist (${ap?.iata})</div><div class="sv">${wish}</div><div class="ss">to unlock</div></div>
      <div class="stat-card"><div class="sl">Total Airports</div><div class="sv">${aps}</div><div class="ss">unlocked</div></div>
    </div>

    <div class="home-section" style="margin-top:24px">
      <div class="home-section-title">Manage — ${ap?.iata}</div>
      <div class="home-cards">
        <div class="home-card" data-page="fleet">
          <div class="home-card-icon">✈️</div>
          <div class="home-card-body"><div class="home-card-title">Fleet</div><div class="home-card-desc">Aircraft owned at ${ap?.iata}</div></div>
        </div>
        <div class="home-card" data-page="wishlist">
          <div class="home-card-icon">⭐</div>
          <div class="home-card-body"><div class="home-card-title">Wishlist</div><div class="home-card-desc">Aircraft to unlock at ${ap?.iata}</div></div>
        </div>
        <div class="home-card" data-page="standplanner">
          <div class="home-card-icon">🅿️</div>
          <div class="home-card-body"><div class="home-card-title">Stand Planner</div><div class="home-card-desc">Stand utilisation at ${ap?.iata}</div></div>
        </div>
        <div class="home-card" data-page="airportinfo">
          <div class="home-card-icon">🏢</div>
          <div class="home-card-body"><div class="home-card-title">Airport Info</div><div class="home-card-desc">Full data for ${ap?.iata}</div></div>
        </div>
      </div>
    </div>

    <div class="home-section" style="margin-top:24px">
      <div class="home-section-title">Game Data</div>
      <div class="home-cards">
        <div class="home-card" data-page="destinations">
          <div class="home-card-icon">🌍</div>
          <div class="home-card-body"><div class="home-card-title">Destinations</div><div class="home-card-desc">All airports & distances from ${ap?.iata}</div></div>
        </div>
        <div class="home-card" data-page="calculator">
          <div class="home-card-icon">🧮</div>
          <div class="home-card-body"><div class="home-card-title">SP/XP Calculator</div><div class="home-card-desc">Estimate earnings for any route</div></div>
        </div>
        <div class="home-card" data-page="routeoptimizer">
          <div class="home-card-icon">📡</div>
          <div class="home-card-body"><div class="home-card-title">Route Optimizer</div><div class="home-card-desc">Best routes ranked by SP/hr</div></div>
        </div>
        <div class="home-card" data-page="reference">
          <div class="home-card-icon">📖</div>
          <div class="home-card-body"><div class="home-card-title">Aircraft Data</div><div class="home-card-desc">Full specs from game CSV</div></div>
        </div>
      </div>
    </div>`;
  }

  function bindHome() {
    document.querySelectorAll('.home-card[data-page]').forEach(el =>
      el.addEventListener('click', () => navigate(el.dataset.page)));

  }

  function toast(msg, type='') {
    const box = document.getElementById('toast-box');
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast' + (type==='success'?' ok':type==='error'?' err':'');
    el.textContent = (type==='success'?'✅ ':type==='error'?'❌ ':'ℹ️ ') + msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  async function init() {
    document.querySelectorAll('.nav-link[data-page], .navbar-logo[data-page]').forEach(el =>
      el.addEventListener('click', () => navigate(el.dataset.page)));
    try {
      await Store.load();
      renderSwitcher();
      toast('Data loaded', 'success');
    } catch(e) {
      toast('Could not load data.json — run: py server.py', 'error');
    }
    navigate('home');
  }

  return { init, navigate, toast, renderSwitcher };
})();

document.addEventListener('DOMContentLoaded', App.init);