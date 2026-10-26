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
 * A question the site's parser reads as being about minors is never rewritten:
 * it goes to the site's own refusal, with no notes. A reader note about a word
 * the site's parser already read, or already explained, is dropped. When the
 * site's parser read every word, the reader takes over only to supply a who- or
 * when-question the site missed.
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
  // a reader note about a word the site's own notes already explain ("lawyers") would say it twice
  // and a reader note about a word the site's parser did read ("kids" in "parents with kids") would be wrong
  const quoted = (n) => (n.match(/"([^"]+)"/) || [])[1];
  const said = (w, T) => T.notes.some((t) => t.indexOf('"' + w + '"') >= 0);
  const readBySite = (w, T) => typeof T.rest === 'string' && T.rest.indexOf(' ' + w.toLowerCase().replace(/[^a-z0-9+$]+/g, ' ').trim() + ' ') < 0;
  function keep(notes, T) { return notes.filter((n) => KEEP.test(n) && !(quoted(n) && (said(quoted(n), T) || readBySite(quoted(n), T)))); }
  // Words the site's parser left unread, ignoring the frame every question has ("what do people ask about").
  // When none are left, the reader has nothing more to read: a reading of more slots is then a misreading
  // ("moms of toddlers" read as health), and its notes about parts "read as everyone" are wrong.
  const FRAME = new Set(('what do does did ask asks asked asking about people the a an of in on at for to and or is are was were how ' +
    'who when which most more less least use uses used using chatgpt chat gpt ai it its they their them often much many by with than ' +
    'compared americans users folks everyone everybody you we me i my our your typically usually s').split(' '));
  const unread = (T) => typeof T.rest === 'string' ? T.rest.split(' ').filter((w) => w && w.indexOf('#') < 0 && !FRAME.has(w)) : ['?'];
  // the reader takes "late" in "late 50s" for late at night; until it reads age decades, it sees "in their 50s"
  const forReader = (q) => q.replace(/\b(early|late)[\s-]+(?=(20|30|40|50|60|70|80|90)'?s\b|twenties|thirties|forties|fifties|sixties|seventies|eighties)/gi, '');
  function route(q) {
    const A = window.PromptAsk, R = window.PromptReader;
    const T = A.parse(q);
    if (T.minors) return { question: q, notes: [], by: 'theirs' };   // a question about minors is always refused, never rewritten
    let own;
    try { own = R.read(forReader(q)); } catch (e) { return { question: q, notes: [], by: 'theirs' }; }
    if (A.mentionRoute(T).length) return { question: q, notes: own.notes.filter((n) => /by state/.test(n)), by: 'theirs' };   // a state reads as mentions of its name; say why
    const allRead = unread(T).length === 0;
    if (own.minors || !own.question) return { question: q, notes: own.minors || allRead ? [] : keep(own.notes, T), by: 'theirs' };
    // what each reading got out of the question: a slot each, plus one when the question asks who or when and the reading says so
    const theirScore = slotsOf(T) + (T.intent === 'who' || T.intent === 'when' ? 1 : 0);
    const ourScore = own.slots + (own.intent ? 1 : 0);
    const addsIntent = own.intent && !(T.intent === 'who' || T.intent === 'when');   // "who asks about X?" without "most"
    if (theirScore >= ourScore || (allRead && !addsIntent)) return { question: q, notes: allRead ? [] : keep(own.notes, T), by: 'theirs' };
    return { question: own.question, notes: own.notes, by: 'ours' };
  }
  window.PromptMerge = { ready, route };
})();
