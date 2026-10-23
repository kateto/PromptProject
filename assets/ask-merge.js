/* State of the Prompt: merged question reading.
 *
 * Mentions keep first say: a question about a named term (Ozempic, Bitcoin,
 * Taylor Swift) goes to this site's own router untouched. For everything else
 * the reader in ask-reader.js (a lexicon parser with synonyms, occupations,
 * typo correction and purpose and time words) reads the question into groups,
 * subject, time and purpose over this site's vocabulary and writes a question
 * the site's parser reads with certainty. The reader takes over only when it
 * reads strictly more of the question than the site's parser did; otherwise the
 * site's own reading stands. Its notes (what was corrected, converted or left
 * out) are shown above the answer. The answer code and the figures are untouched.
 *
 *   PromptAsk.load(base).then(() => PromptMerge.ready(base)).then(() => PromptMerge.route(question))
 *   → { question, notes, by: 'theirs' | 'ours' }
 */
(function () {
  'use strict';
  let readyP = null;
  function ready(dataBase) {
    if (!readyP) readyP = fetch(dataBase + 'ask.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((d) => { window.PromptReader.init(d); return true; });
    return readyP;
  }
  function slotsOf(P) { return P.who.length + P.what.length + P.when.length + P.why.length; }
  const KEEP = /no figures|records age|read as everyone/;   // notes worth showing even when the site's own reading stands
  function route(q) {
    const A = window.PromptAsk, R = window.PromptReader;
    const T = A.parse(q);
    let own;
    try { own = R.read(q); } catch (e) { return { question: q, notes: [], by: 'theirs' }; }
    if (A.mentionRoute(T).length) return { question: q, notes: own.notes.filter((n) => /by state/.test(n)), by: 'theirs' };   // a state reads as mentions of its name; say why
    if (own.minors || !own.question) return { question: q, notes: own.minors ? [] : own.notes.filter((n) => KEEP.test(n)), by: 'theirs' };
    // what each reading got out of the question: a slot each, plus one when the question asks who or when and the reading says so
    const theirScore = slotsOf(T) + (T.intent === 'who' || T.intent === 'when' ? 1 : 0);
    const ourScore = own.slots + (own.intent ? 1 : 0);
    if (!T.minors && theirScore >= ourScore) return { question: q, notes: own.notes.filter((n) => KEEP.test(n)), by: 'theirs' };
    return { question: own.question, notes: own.notes, by: 'ours' };
  }
  window.PromptMerge = { ready, route };
})();
