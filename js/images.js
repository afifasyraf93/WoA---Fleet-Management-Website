/**
 * images.js — Local aircraft & airport images
 *
 * Place your images in:
 *   images/aircraft/[ICAO].jpg   e.g. images/aircraft/A333.jpg
 *   images/airports/[IATA].jpg   e.g. images/airports/IAD.jpg
 *
 * Naming must match exactly (uppercase, no spaces).
 * Change AIRCRAFT_EXT / AIRPORT_EXT if your files are .png or .webp
 */

const Images = (() => {

  const AIRCRAFT_EXT = 'png';
  const AIRPORT_EXT  = 'png';

  const SIZE_COLORS = {
    A:'#dbeafe', B:'#e0f2fe', C:'#ede9fe',
    D:'#fef3c7', E:'#fce7f3', F:'#fee2e2'
  };

  function aircraftCardImg(icao, size, type, height='160px') {
    const src  = `images/aircraft/${icao}.${AIRCRAFT_EXT}`;
    const bg   = SIZE_COLORS[size] || '#f0f4f8';
    const icon = type === 'Cargo' ? '📦' : '✈️';

    return `
      <div style="width:100%;height:${height};overflow:hidden;
        border-radius:var(--radius) var(--radius) 0 0;background:${bg};
        display:flex;align-items:center;justify-content:center;">
        <img src="${src}" alt="${icao}"
          style="width:100%;height:100%;object-fit:contain;display:block"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
          loading="lazy">
        <div style="display:none;width:100%;height:${height};background:${bg};
          align-items:center;justify-content:center;flex-direction:column;">
          <div style="font-size:38px">${icon}</div>
          <div style="font-size:11px;color:#7a8fa6;margin-top:4px">Size ${size}</div>
        </div>
      </div>`;
  }

  function airportCardImg(iata, height='110px') {
    const src = `images/airports/${iata}.${AIRPORT_EXT}`;

    return `
      <div style="width:100%;height:${height};overflow:hidden;
        border-radius:var(--radius) var(--radius) 0 0;background:var(--sky-light);">
        <img src="${src}" alt="${iata} Airport"
          style="width:100%;height:100%;object-fit:cover;display:block"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
          loading="lazy">
        <div style="display:none;width:100%;height:${height};background:var(--sky-light);
          align-items:center;justify-content:center;flex-direction:column;">
          <div style="font-size:38px">🏢</div>
          <div style="font-size:11px;color:#7a8fa6;margin-top:4px">${iata}</div>
        </div>
      </div>`;
  }

  return { aircraftCardImg, airportCardImg };
})();