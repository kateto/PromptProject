/* State of the Prompt: Google Analytics (property G-2C84REEC7D), loaded by every page.
   It reports which page was visited and where the visitor came from, without the
   part of either address after "?" or "#": an Ask answer's address carries the
   question (ask/?q=...), and questions must never reach Google Analytics (the
   anonymous copy the Ask page keeps goes to the team's own form; see ask-log.js).
   Campaign tags (utm_*) are kept, so visits from a link in an email or post can
   be attributed. It runs only on the published site, not on local previews. */
(function () {
  'use strict';
  if (location.hostname !== 'stateoftheprompt.net') return;
  var ID = 'G-2C84REEC7D';
  var bare = function (u) { return String(u || '').split(/[?#]/)[0]; };
  var utm = new URLSearchParams();
  new URLSearchParams(location.search).forEach(function (v, k) { if (/^utm_/.test(k)) utm.append(k, v); });
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', ID, {
    page_location: bare(location.href) + (utm.toString() ? '?' + utm.toString() : ''),
    page_referrer: bare(document.referrer)
  });
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);
})();
