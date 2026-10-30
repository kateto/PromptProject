/* State of the Prompt: digging into a subject.
 *
 * "What do Hispanic people ask about sports?" names a group and a subject. The
 * site's figures stop at the subject (the share of the group's conversations
 * that are mainly about sports), so the answer could only say how much, not
 * what. This adds the what, from the site's own tracked terms: the terms filed
 * under that subject (for sports: the NFL, soccer, the Super Bowl...) ranked by
 * how often the group mentions them, each against everyone's rate. It runs
 * after the site's answer is drawn and inserts one sentence and one chart
 * under the title. Nothing else on the page changes. A question that asks
 * who, when, how much, or about a time is left alone; so is one the site
 * reads as being about minors or about suicide or self-harm.
 *
 * "How do people in the South use ChatGPT for work?" names a group and a
 * purpose. The site's figures stop at the purpose too (the share of the group's
 * conversations that are for work). The what comes from data/within_by_group.json,
 * exported from the project's topic classifier (adults only, published cells
 * only): the most common topics within the group's conversations of that
 * purpose, each against everyone's share. The chart says where it comes from.
 *
 *   PromptDig.plan(parse) → { cats, who } | null
 *   PromptDig.rows(plan)  → Promise<[{id, name, v, ref}]>   (v: the group's rate per 1,000; ref: everyone's)
 *   PromptDig.run(root, parse, readAs) → Promise<boolean>   (true when something was inserted)
 */
(function () {
  'use strict';
  // the site's subjects → the categories of its tracked terms (data/mentions_index.json)
  const CATS = {
    sports: ['Sports'],
    health_medicine: ['Health and medicine', 'Medications'],
    entertainment_games: ['Entertainment', 'People: entertainment and sports', 'People: media and influencers'],
    politics_government_law: ['News and policy', 'People: US politics', 'People: world leaders'],
    pol: ['News and policy', 'People: US politics', 'People: world leaders'],
    money_shopping_finance: ['Money and work', 'Companies and brands'],
    work_career_business: ['Money and work', 'Companies and brands', 'People: business and tech'],
    technology_devices: ['Technology and AI', 'Apps and platforms', 'People: business and tech'],
    social_media_online: ['Apps and platforms', 'People: media and influencers'],
    food_drink: ['Food and drink'],
    pets_animals: ['Pets and animals'],
    travel_places_vehicles: ['Travel', 'Cars', 'Places: countries', 'Places: cities'],
    home_garden_hobbies: ['Home and garden'],
    education_schools: ['School and learning'],
    relationships_family: ['Relationships and family'],
    religion_spirituality_philosophy: ['Religion and beliefs'],
    history_society_culture: ['People: historical', 'Science and history'],
    science_nature: ['Science and history', 'Weather and disasters']
  };
  const TOP = 30;    // terms looked up per question (the most mentioned overall), of which the chart shows up to eight
  const SHOW = 8;
  function plan(P) {
    if (!P || P.minors || P.sensitive) return null;
    if (P.intent !== 'general' || P.dim || P.mentionIntent) return null;
    if (P.when.length || P.who.length > 1) return null;
    if (P.what.length === 0 && P.why.length === 1 && PURPOSE[P.why[0]] && /^\s*(what|which|how)\b/i.test(P.q || '') && !/^\s*how\s+(often|much|many|frequently|common)/i.test(P.q || '')) return { purpose: P.why[0], who: P.who[0] || null };
    if (P.what.length !== 1 || P.why.length) return null;
    if (!/^\s*(what|which)\b/i.test(P.q || '')) return null;
    const cats = CATS[P.what[0]];
    if (!cats) return null;
    return { what: P.what[0], cats, who: P.who[0] || null };
  }
  // the purposes the site's parser reads, and the noun for their conversations
  const PURPOSE = { p_asking: 'question', p_doing: 'task', p_expressing: 'just-talking', p_school: 'school', p_selflearn: 'self-directed learning', p_howto: 'how-to', p_work: 'work', p_jobsearch: 'job-search', p_news: 'news' };
  let DATA = '../data/', withinP = null;
  function within() {
    if (!withinP) withinP = fetch(DATA + 'within_by_group.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
    return withinP;
  }
  function purposeRows(pl) {
    return within().then((W) => {
      if (!W) return [];
      const list = pl.who ? (((W.groups[pl.who.dim] || {})[pl.who.level] || {})[pl.purpose] || []) : Object.entries(W.everyone[pl.purpose] || {}).sort((a, b) => b[1] - a[1]).slice(0, 12).filter((x) => x[1] >= 0.5);
      const ev = W.everyone[pl.purpose] || {};
      return list.slice(0, SHOW).map((x) => ({ id: x[0], name: W.topics[x[0]] || x[0], v: x[1], ref: pl.who ? (ev[x[0]] != null ? ev[x[0]] : null) : null }));
    });
  }
  function rows(pl) {
    if (pl.purpose) return purposeRows(pl);
    const A = window.PromptAsk, ix = A.mentions();
    if (!ix) return Promise.resolve([]);
    const terms = ix.terms.filter((t) => pl.cats.indexOf(t.cat) >= 0 && t.per1000 != null).sort((a, b) => b.per1000 - a.per1000).slice(0, TOP);
    if (!pl.who) return Promise.resolve(terms.slice(0, SHOW).map((t) => ({ id: t.id, name: t.name, cat: t.cat, v: t.per1000, ref: null })));
    return Promise.all(terms.map((t) => A.loadTerm(t.id).then((d) => {
      const c = d && d.groups && d.groups[pl.who.dim] ? d.groups[pl.who.dim].filter((g) => g.level === pl.who.level)[0] : null;
      return c && c.per1000 != null ? { id: t.id, name: t.name, cat: t.cat, v: c.per1000, ref: t.per1000 } : null;
    }))).then((rs) => rs.filter(Boolean).sort((a, b) => b.v - a.v).slice(0, SHOW));
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const SUBJECT = { sports: 'sports', health_medicine: 'health', entertainment_games: 'entertainment', politics_government_law: 'politics', pol: 'politics', money_shopping_finance: 'money',
    work_career_business: 'work', technology_devices: 'technology', social_media_online: 'social media', food_drink: 'food and drink', pets_animals: 'pets', travel_places_vehicles: 'travel',
    home_garden_hobbies: 'home and garden', education_schools: 'education', relationships_family: 'relationships', religion_spirituality_philosophy: 'religion', history_society_culture: 'history', science_nature: 'science' };
  // a common noun reads lower-case mid-sentence (sleep, periods); names, places, brands and drugs keep their capital
  const PROPER = /^(People|Places|Companies|Apps|Medications)/;
  function wordOf(r) { return PROPER.test(r.cat || '') || /^.[^a-z]|[A-Z]/.test(r.name.slice(1)) ? r.name : r.name.charAt(0).toLowerCase() + r.name.slice(1); }
  function html(pl, rs, whoText) {
    const A = window.PromptAsk, perK = A.perK, fmtK = A.fmtK, subj = SUBJECT[pl.what] || pl.what;
    rs = rs.map((r) => Object.assign({}, r, { name: r.name, word: wordOf(r) }));
    if (pl.purpose) return purposeHtml(pl, rs, whoText);
    const first = rs[0], next = rs.slice(1, 3);
    let s;
    if (pl.who) {
      const cmp = first.ref ? (first.v / first.ref >= 1.5 ? ', well above' : first.v / first.ref >= 1.15 ? ', above' : first.v / first.ref <= 0.67 ? ', well below' : first.v / first.ref <= 0.87 ? ', below' : ', about the same as') + ' everyone’s ' + fmtK(first.ref) : '';
      s = 'Within ' + subj + ', ' + whoText + ' mention ' + first.word + ' most often: ' + perK(first.v) + ' conversations' + cmp + '.';
      if (next.length) s += ' Then ' + next.map((r) => r.word + ' (' + fmtK(r.v) + ')').join(' and ') + '.';
    } else {
      s = 'Within ' + subj + ', the terms people mention most are ' + first.word + ' (' + perK(first.v) + ' conversations)' + (next.length ? ', ' + next.map((r) => r.word + ' (' + fmtK(r.v) + ')').join(' and ') : '') + '.';
    }
    const max = Math.max.apply(null, rs.map((r) => Math.max(r.v, r.ref || 0))) * 1.12 || 1;
    let h = '<p class="abody">' + esc(s) + '</p><div class="achart"><h3>' + esc(whoText ? 'Mentions within ' + subj + ', ' + whoText : 'Most mentioned terms within ' + subj) + ' (per 1,000 conversations)</h3><div class="abars">';
    rs.forEach((r, i) => {
      h += '<div class="abrow' + (i === 0 ? ' hi' : '') + '"><span class="ablabel">' + esc(r.name) + '</span><span class="abtrack"><span class="abfill" style="width:' + (r.v / max * 100).toFixed(2) + '%"></span>' +
        (r.ref != null ? '<span class="abref" style="left:' + (r.ref / max * 100).toFixed(2) + '%"></span>' : '') + '</span><span class="abval">' + fmtK(r.v) + '</span></div>';
    });
    h += '</div>' + (pl.who ? '<p class="abkey"><i></i>Everyone’s rate for the same term</p>' : '') +
      '<p class="abkey">From the ' + subj + ' terms this site tracks in people’s own messages; a term is counted once per conversation that mentions it.</p></div>';
    return h;
  }
  const pc = (v) => v.toFixed(1) + '%';
  function purposeHtml(pl, rs, whoText) {
    const noun = PURPOSE[pl.purpose], first = rs[0], next = rs.slice(1, 3);
    const same = (r) => r.ref == null ? '' : r.v / r.ref >= 1.3 ? ', above everyone’s ' + pc(r.ref) : r.v / r.ref <= 0.77 ? ', below everyone’s ' + pc(r.ref) : ', about the same as everyone';
    const s = 'Within the ' + noun + ' conversations of ' + (pl.who ? whoText : 'everyone') + ', the most common topics are ' + first.word + ' (' + pc(first.v) + same(first) + ')' +
      (next.length ? ', then ' + next.map((r) => r.word + ' (' + pc(r.v) + ')').join(' and ') : '') + '.';
    const max = Math.max.apply(null, rs.map((r) => Math.max(r.v, r.ref || 0))) * 1.12 || 1;
    let h = '<p class="abody">' + esc(s) + '</p><div class="achart"><h3>' + esc('Topics within ' + noun + ' conversations, ' + (pl.who ? whoText : 'everyone') + ' (share of those conversations)') + '</h3><div class="abars">';
    rs.forEach((r, i) => {
      h += '<div class="abrow' + (i === 0 ? ' hi' : '') + '"><span class="ablabel">' + esc(r.name) + '</span><span class="abtrack"><span class="abfill" style="width:' + (r.v / max * 100).toFixed(2) + '%"></span>' +
        (r.ref != null ? '<span class="abref" style="left:' + (r.ref / max * 100).toFixed(2) + '%"></span>' : '') + '</span><span class="abval">' + pc(r.v) + '</span></div>';
    });
    h += '</div>' + (pl.who ? '<p class="abkey"><i></i>Everyone’s share for the same topic</p>' : '') +
      '<p class="abkey">Topics from a classifier that reads every conversation, not the main-subject label used in the figure above. Adults only.</p></div>';
    return h;
  }
  function run(root, P, readAs) {
    const pl = plan(P);
    if (!pl) return Promise.resolve(false);
    return rows(pl).then((rs) => {
      if (rs.length < 3) return false;
      const title = root.querySelector('.atitle');
      if (!title) return false;
      const whoText = pl.who ? (readAs && readAs[0] ? readAs[0].replace(/^people$/i, 'people') : 'this group') : '';
      title.insertAdjacentHTML('afterend', html(pl, rs, whoText));
      return true;
    }).catch(() => false);
  }
  window.PromptDig = { plan, rows, html, run, base: (b) => { DATA = b; } };
})();
