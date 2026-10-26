/* State of the Prompt: save the figures behind a chart or table as a CSV file.
 *
 * The file is built in the visitor's browser from the published figures the page
 * has already loaded; nothing is sent anywhere. Every file has one row per figure
 * (or per term), and a figure the page does not show is left empty with a note
 * saying why, so an empty cell is never mistaken for zero.
 *
 *   PromptCSV.save(filename, header, rows)    rows: arrays of strings, numbers or null
 */
(function () {
  'use strict';
  function cell(v) {
    if (v == null) return '';
    let s = String(v);
    if (typeof v === 'string' && /^[=+@\t]/.test(s)) s = "'" + s;   // a spreadsheet must not read a label as a formula
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function text(header, rows) { return [header].concat(rows).map(r => r.map(cell).join(',')).join('\r\n') + '\r\n'; }
  function save(name, header, rows) {
    // the byte-order mark tells Excel the file is UTF-8, so "18–24" and "Bachelor’s" arrive intact
    const blob = new Blob(['﻿' + text(header, rows)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const slug = s => String(s).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  window.PromptCSV = { save, text, slug };
})();
