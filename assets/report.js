/* State of the Prompt: chart helpers shared by the report pages. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const R = {};

  /* horizontal bars: rows are [label, value, class] */
  R.bars = function (id, rows, opt) {
    opt = opt || {};
    const el = document.getElementById(id), dp = opt.dp == null ? 1 : opt.dp;
    const max = opt.max || Math.max.apply(null, rows.map(r => r[1])) * 1.08;
    el.innerHTML = rows.map(([l, v, c]) => '<div class="brow"><span class="blabel">' + l + '</span><span class="track"><span class="fill' + (c ? ' ' + c : '') +
      '" style="width:' + (v / max * 100).toFixed(2) + '%"></span></span><span class="bval">' + v.toFixed(dp) + '%</span></div>').join('');
  };

  /* a 100% stacked bar with a key: parts are [label, value, color, text color] */
  R.stack = function (id, keyId, parts, opt) {
    opt = opt || {};
    document.getElementById(id).innerHTML = parts.map(([l, v, c, t]) => '<div style="width:' + v + '%;background:' + c + ';color:' + t + '">' +
      (v > 10 ? (opt.labels ? l + ' ' : '') + Math.round(v) + '%' : '') + '</div>').join('');
    document.getElementById(keyId).innerHTML = parts.map(([l, v, c]) => '<span><i class="sw" style="background:' + c + '"></i>' + l + ' ' + v.toFixed(1) + '%</span>').join('');
  };

  /* an SVG element factory bound to one svg */
  R.svg = function (svg) {
    return (t, a, txt) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; svg.appendChild(e); return e; };
  };

  /* charts shown side by side share one row height, so their rows line up across the pair */
  R.evenRows = function () {
    document.querySelectorAll('.two').forEach(two => {
      const bs = two.querySelectorAll('.bars'); if (bs.length < 2) return;
      bs.forEach(b => { b.style.gridAutoRows = ''; });
      let m = 0; two.querySelectorAll('.brow').forEach(r => { m = Math.max(m, r.getBoundingClientRect().height); });
      bs.forEach(b => { b.style.gridAutoRows = m.toFixed(1) + 'px'; });
    });
  };
  window.addEventListener('load', R.evenRows);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(R.evenRows);
  let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(R.evenRows, 120); });

  /* the "Cite this report" button */
  R.cite = function (btnId, noteId, text) {
    const note = document.getElementById(noteId);
    document.getElementById(btnId).addEventListener('click', () => {
      try { navigator.clipboard.writeText(text).then(() => { note.textContent = 'Citation copied.'; }).catch(() => { note.textContent = text; }); }
      catch (e) { note.textContent = text; }
    });
  };

  R.load = function (file) {
    return fetch(file).then(r => { if (!r.ok) throw new Error(file + ' ' + r.status); return r.json(); });
  };

  R.MONTH = { '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec' };
  window.Report = R;
})();
