/* State of the Prompt: the desaturated hour dial in the title band of the About
   and Reports pages. It is the home page's dial in slate tints: each wedge is one
   hour, its length that hour's share of the day's conversations, its bands the
   eight subject families. Usage: drawRing(svgElement, path to the data folder). */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const TINT = ['#3d4c66', '#4b5b75', '#596984', '#677892', '#7686a0', '#8494ad', '#93a2ba', '#a1b0c6'];
  window.drawRing = function (svg, dataBase) {
    if (!svg) return Promise.resolve();
    return Promise.all([fetch(dataBase + 'hours.json').then(r => r.json()), fetch(dataBase + 'site.json').then(r => r.json())]).then(([hrs, site]) => {
      const fams = site.families.map(f => [].concat(f.codes));
      const H = hrs.hours, r0 = 70, span = 118, max = Math.max(...H.map(h => h.share));
      const pt = (r, a) => (200 + r * Math.sin(a)).toFixed(2) + ',' + (200 - r * Math.cos(a)).toFixed(2);
      const arc = (ri, ro, a0, a1) => 'M' + pt(ro, a0) + 'A' + ro + ',' + ro + ' 0 0 1 ' + pt(ro, a1) + 'L' + pt(ri, a1) + 'A' + ri + ',' + ri + ' 0 0 0 ' + pt(ri, a0) + 'Z';
      H.forEach(row => {
        const h = row.h, a0 = (h * 15 + 0.9) * Math.PI / 180, a1 = ((h + 1) * 15 - 0.9) * Math.PI / 180, len = span * row.share / max;
        const tot = Object.values(row.s).reduce((a, b) => a + b, 0);
        let r = r0;
        fams.forEach((codes, k) => {
          const d = len * codes.reduce((t, c) => t + row.s[c], 0) / tot, p = document.createElementNS(NS, 'path');
          p.setAttribute('d', arc(r, r + d, a0, a1)); p.setAttribute('fill', TINT[k]); svg.appendChild(p); r += d;
        });
      });
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', 200); c.setAttribute('cy', 200); c.setAttribute('r', r0 - 6); c.setAttribute('fill', 'none'); c.setAttribute('stroke', 'rgba(255,255,255,0.12)');
      svg.appendChild(c);
    }).catch(() => {});                 // decorative: a failed load leaves the band plain
  };
})();
