/* State of the Prompt: the question box.
 *
 * Completions as whole questions while you type, a rotating set of questions
 * to try, and keyboard navigation, all drawn from data/questions.json. That
 * file is built by tools/build_questions.mjs, which runs every candidate
 * question through this site's own parser and answer code and keeps only the
 * ones that read as intended and answer from published figures. The parser and
 * the answers are untouched: the box only helps write a question they read well.
 *
 *   PromptSearch.attach(form, { questions: 'data/questions.json', askBase: 'ask/' })
 *   PromptSearch.ready().then(pool => pool.random(6))
 */
(function () {
  'use strict';

  const SLOT_NAME = { who: 'People', what: 'Subjects', when: 'Times', why: 'Purposes', terms: 'Mentions' };
  const WHO_FRAME = /^(what|how|when|where|why) (do|does|did) (.*)$/i;      // "what do wom…"
  const DO_FRAME = /^(do|does|did) (.*)$/i;                                  // "do wom…"
  const TAIL = /^(.*\b(about|at|in|on|during|for|mentions?|mentioned|than|vs|versus)) ([^?]*)$/i;   // greedy: the last keyword decides the slot
  const AFTER = { about: 'what', at: 'when', in: 'when', on: 'when', during: 'when', for: 'why', mention: 'terms', mentions: 'terms', mentioned: 'terms', than: 'who', vs: 'who', versus: 'who' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
  function shuffle(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  function norm(s) { return String(s || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9$+\- ]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // optimal string alignment distance (edits and adjacent swaps), cut off above max
  function osa(a, b, max) {
    const n = a.length, m = b.length;
    if (Math.abs(n - m) > max) return max + 1;
    let prev2 = [], prev = Array.from({ length: m + 1 }, (_, j) => j);
    for (let i = 1; i <= n; i++) {
      const cur = [i]; let rowMin = i;
      for (let j = 1; j <= m; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
        cur[j] = v; if (v < rowMin) rowMin = v;
      }
      if (rowMin > max) return max + 1;
      prev2 = prev; prev = cur;
    }
    return prev[m];
  }
  // a typed word against a phrase word: a prefix, or one typo (two from eight letters) against the same length of the phrase word
  function wordMatch(typed, word, last) {
    if (word.startsWith(typed)) return true;
    if (!last && typed === word) return true;
    if (typed.length < 5) return false;
    const max = typed.length >= 8 ? 2 : 1;
    return osa(typed, last ? word.slice(0, Math.min(word.length, typed.length + max)) : word, max) <= max;
  }
  // the typed words must line up with consecutive words of the phrase; the last typed word may be unfinished
  function phraseMatch(partial, phrase) {
    const pw = norm(partial).split(' ').filter(Boolean), ph = norm(phrase).split(' ');
    if (!pw.length) return true;
    for (let s = 0; s + pw.length <= ph.length; s++) {
      let ok = true;
      for (let i = 0; i < pw.length && ok; i++) ok = wordMatch(pw[i], ph[s + i], i === pw.length - 1);
      if (ok) return true;
    }
    return false;
  }
  function highlight(sentence, phrase) {
    const i = sentence.toLowerCase().indexOf(phrase.toLowerCase());
    if (i < 0) return esc(sentence);
    return esc(sentence.slice(0, i)) + '<b>' + esc(sentence.slice(i, i + phrase.length)) + '</b>' + esc(sentence.slice(i + phrase.length));
  }

  /* ------------------------------------------------------------ the pool */
  function Pool(data) {
    this.questions = data.questions || [];
    this.phrases = data.phrases || { who: [], what: [], when: [], why: [], terms: [] };
  }
  Pool.prototype.random = function (n) { return shuffle(this.questions).slice(0, n); };

  /** Whole-question completions for what has been typed so far. Returns [{slot, items:[{insert, phrase}]}]. */
  Pool.prototype.suggest = function (text, perGroup) {
    perGroup = perGroup || 4;
    const t = text.replace(/\?/g, ' ').replace(/\s+/g, ' ').trim();   // question marks do not count, wherever they are
    const groups = [];
    const used = new Set();
    const push = (slot, insert, phrase) => {
      if (used.has(insert)) return;
      let g = groups.find((x) => x.slot === slot);
      if (!g) { g = { slot, items: [] }; groups.push(g); }
      if (g.items.length >= perGroup) return;
      used.add(insert); g.items.push({ insert, phrase });
    };
    // 1. the slot the frame expects, completed in place
    let m;
    if ((m = TAIL.exec(t)) && AFTER[m[2].toLowerCase()]) {
      const prefix = m[1], key = m[2].toLowerCase(), slot = AFTER[key], partial = m[3];
      const list = this.phrases[slot] || [];
      for (const ph of list) {
        if (!phraseMatch(partial, ph.p)) continue;
        let q;
        if (slot === 'when' || slot === 'why') q = prefix.slice(0, prefix.length - key.length).trim() + ' ' + ph.p + '?';   // the phrase carries its own preposition
        else q = prefix + ' ' + ph.p + '?';
        push(slot, cap(q.replace(/\s+/g, ' ').trim()), ph.p);
      }
    } else if ((m = WHO_FRAME.exec(t)) || (m = DO_FRAME.exec(t))) {
      const partial = m[m.length - 1];
      for (const ph of this.phrases.who) if (phraseMatch(partial, ph.p)) push('who', ph.q, ph.p);
    }
    // 2. any phrase the last word or two could be the start of, as its default question
    const words = norm(t).split(' ').filter(Boolean);
    for (const len of [2, 1]) {
      if (words.length < len) continue;
      const partial = words.slice(-len).join(' ');
      if (partial.length < 2) continue;
      for (const slot of ['who', 'what', 'when', 'terms', 'why']) for (const ph of this.phrases[slot] || []) if (phraseMatch(partial, ph.p)) push(slot, ph.q, ph.p);
    }
    // 3. questions from the pool that contain every typed word
    const last = words.length ? words[words.length - 1] : '';
    if (last.length >= 3) {
      const qs = this.questions.filter((q) => { if (used.has(q)) return false; const nq = norm(q); return words.every((w) => nq.includes(w)); }).slice(0, 4);
      if (qs.length) groups.push({ slot: 'q', items: qs.map((q) => ({ insert: q, phrase: last, go: true })) });
    }
    return groups;
  };

  /* ----------------------------------------------------------- the box */
  let poolPromise = null;
  function ready(url) {
    if (!poolPromise) poolPromise = fetch(url || 'data/questions.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((d) => new Pool(d));
    return poolPromise;
  }

  function attach(form, opts) {
    opts = opts || {};
    const input = form.querySelector('input[name=q]');
    if (!input) return null;
    const askBase = opts.askBase || './';
    // the form clips its corners, so the panel hangs from a wrapper around it
    const wrap = document.createElement('div');
    wrap.className = 'asksearch';
    form.parentNode.insertBefore(wrap, form);
    wrap.appendChild(form);
    const box = document.createElement('div');
    box.className = 'sugg';
    box.hidden = true;
    box.setAttribute('role', 'listbox');
    wrap.appendChild(box);
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');

    let pool = null, active = -1, hideTimer = 0, placeholderTimer = 0;
    const items = () => Array.from(box.querySelectorAll('[data-q]'));
    const hide = () => { box.hidden = true; active = -1; input.setAttribute('aria-expanded', 'false'); };
    const show = (html) => { box.innerHTML = html; box.hidden = false; active = -1; input.setAttribute('aria-expanded', 'true'); };
    const submit = (q) => { q = (q || '').trim(); if (!q) return; location.href = askBase + '?q=' + encodeURIComponent(q); };
    const go = (q) => { input.value = q; submit(q); };
    const insert = (q) => { input.value = q; input.focus(); const at = q.endsWith('?') ? q.length - 1 : q.length; input.setSelectionRange(at, at); update(); };   // the caret sits before the question mark, so typing extends the question
    const group = (title, list, phrase, goAll) => '<div class="g"><h5>' + esc(title) + '</h5>' +
      list.map((it) => '<a href="' + esc(askBase + '?q=' + encodeURIComponent(it.insert)) + '" data-q="' + esc(it.insert) + '"' + (it.go || goAll ? ' data-go="1"' : '') + '>' + highlight(it.insert, it.phrase || phrase || '') + '</a>').join('') + '</div>';

    const showTry = () => { if (!pool) return; show(group('Try one of these', pool.random(6).map((q) => ({ insert: q, go: true })), '', true)); };
    const update = () => {
      const v = input.value;
      if (!v.trim()) { showTry(); return; }
      if (!pool) return;
      const groups = pool.suggest(v, 4);
      if (!groups.length) { hide(); return; }
      show(groups.map((g) => group(g.slot === 'q' ? 'Questions' : SLOT_NAME[g.slot] || g.slot, g.items, '', g.slot === 'q')).join(''));
    };
    const move = (d) => {
      const list = items();
      if (!list.length) return;
      list[active] && list[active].classList.remove('on');
      active = (active + d + list.length) % list.length;
      list[active].classList.add('on');
      list[active].scrollIntoView({ block: 'nearest' });
    };
    const choose = (el) => { if (!el) return; if (el.dataset.go) go(el.dataset.q); else insert(el.dataset.q); };

    form.addEventListener('submit', (ev) => { ev.preventDefault(); submit(input.value.trim() || input.placeholder); });
    input.addEventListener('input', update);
    input.addEventListener('focus', () => { clearTimeout(hideTimer); if (!input.value.trim()) showTry(); else update(); });
    input.addEventListener('blur', () => { hideTimer = setTimeout(hide, 150); });
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { hide(); return; }
      if (ev.key === 'ArrowDown') { if (box.hidden) update(); move(1); ev.preventDefault(); return; }
      if (ev.key === 'ArrowUp') { if (!box.hidden) { move(-1); ev.preventDefault(); } return; }
      if ((ev.key === 'Enter' || ev.key === 'Tab') && !box.hidden) {
        const list = items();
        const el = list[active >= 0 ? active : ev.key === 'Tab' ? 0 : -1];
        if (!el) return;
        ev.preventDefault(); choose(el);
      }
    });
    box.addEventListener('pointerdown', (ev) => ev.preventDefault());   // keep the caret in the box
    box.addEventListener('click', (ev) => { const el = ev.target.closest('[data-q]'); if (!el) return; ev.preventDefault(); choose(el); });

    ready(opts.questions).then((p) => {
      pool = p;
      if (!p.questions.length) return;
      let i = Math.floor(Math.random() * p.questions.length);
      input.placeholder = p.questions[i];
      placeholderTimer = setInterval(() => { if (!input.value && document.activeElement !== input) { i = (i + 1) % p.questions.length; input.placeholder = p.questions[i]; } }, 4200);
      if (document.activeElement === input) update();
    }).catch(() => {});
    return { input, box, hide, update };
  }

  window.PromptSearch = { attach, ready, Pool, osa };
})();
