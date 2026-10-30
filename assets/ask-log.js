/* State of the Prompt: an anonymous copy of each question asked on the Ask page,
 * kept to improve the tool.
 *
 * After an answer is shown, the Ask page calls PromptLog.ask(question, route, answer).
 * Four fields go to the team's Google Form, and nothing else:
 *   Question  the question as asked (first 300 characters)
 *   Source    "suggested" when it is word for word a question the site offers
 *             (the question box's list or Ask's own examples), otherwise "typed"
 *   Outcome   what Ask did: answered, mentions, minors, sensitive, no match,
 *             needs subject, term not listed, too few, about the study
 *   Matched   what the question was read as (groups, subjects, purposes, times,
 *             terms), groups it named that the site has no figures for, and
 *             "rewritten" when the second reader rewrote it
 * The request carries no cookies (credentials are omitted) and no page address,
 * and it is sent only from the published site. With FORM empty nothing is sent,
 * and the Ask and About pages must then not say that questions are kept.
 *
 *   PromptLog.ask(question, route, answer)  ->  Promise<true if sent>
 */
(function () {
  'use strict';
  const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSeVZqO2buVy4tcwhoJm7sXzDl36QElVcAuVmcB_PKLf3c5s5w/formResponse';
  const FIELD = { question: 'entry.1805804453', source: 'entry.672296989', outcome: 'entry.137267233', matched: 'entry.509685363' };
  const norm = (s) => String(s || '').toLowerCase().replace(/[?.!\s]+/g, ' ').trim();

  // what Ask did, from the reading and the answer's title (the titles are fixed in ask.js)
  function outcome(P, mids, a) {
    const t = (a && a.title) || '';
    if (P.minors) return 'minors';
    if (P.sensitive) return 'sensitive';
    if (/not on our list of terms/.test(t)) return 'term not listed';
    if (/^We could not match/.test(t)) return 'no match';
    if (/^Name a subject/.test(t)) return 'needs subject';
    if (/^Too few|^This figure is not published/.test(t)) return 'too few';
    if (/^This page answers questions about/.test(t)) return 'about the study';
    return mids.length ? 'mentions' : 'answered';
  }
  // what the question was read as, in the site's own codes
  function matched(P, mids, route) {
    const parts = [];
    P.who.forEach((w) => parts.push('who:' + w.dim + '=' + w.level));
    P.what.forEach((c) => parts.push('subject:' + c));
    P.why.forEach((c) => parts.push('purpose:' + c));
    P.when.forEach((w) => parts.push('when:' + w.kind + '=' + [].concat(w.value).join('+')));
    if (P.dim) parts.push('by:' + P.dim);
    if (P.occupation) parts.push('read as everyone:occupation');   // groups the site has no figures for
    if (P.unrecorded) parts.push('read as everyone:' + P.unrecorded);
    mids.forEach((id) => parts.push('term:' + id));
    if (route && route.by === 'ours') parts.push('rewritten');
    return parts.join('; ');
  }
  function ask(question, route, a) {
    if (!FORM || location.hostname !== 'stateoftheprompt.net') return Promise.resolve(false);
    const A = window.PromptAsk, P = A.parse(route.question), mids = A.mentionRoute(P);
    const offered = new Set(A.SUGGEST.map((s) => norm(s[1])));
    const pool = window.PromptSearch ? window.PromptSearch.ready('../data/questions.json').catch(() => null) : Promise.resolve(null);
    return pool.then((p) => {
      if (p) p.questions.forEach((q) => offered.add(norm(q)));
      const rec = {
        question: String(question).slice(0, 300),
        source: offered.has(norm(question)) ? 'suggested' : 'typed',
        outcome: outcome(P, mids, a),
        matched: matched(P, mids, route)
      };
      const body = new URLSearchParams();
      Object.keys(FIELD).forEach((k) => body.append(FIELD[k], rec[k]));
      return fetch(FORM, { method: 'POST', mode: 'no-cors', credentials: 'omit', body }).then(() => true, () => false);
    }).catch(() => false);
  }
  window.PromptLog = { ask, outcome, matched };
})();
