/* State of the Prompt: Ask the data
 *
 * Answers a typed question in the visitor's browser. The question is read into
 * four slots (who, what, when, why) by matching its words against the lists
 * below; the answer is looked up in data/ask.json and written from sentence
 * templates. The question is never sent anywhere. Approach after Kiran
 * Garimella's earlier draft site.
 *
 * Every figure covers adults: conversations by panelists 18 or older at the time.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ lists */

  // Each entry: [pattern, value, note]. Patterns are matched against the
  // lower-cased question with punctuation turned into spaces, longest first
  // within a slot; a matched span is consumed so it cannot match twice.

  const WHY = [
    ['for work|at work|on the job|work tasks|in their jobs|in their work|for their jobs?|professionally', 'p_work'],
    ['job search(es|ing)?|job hunt(s|ing)?|looking for (a )?(job|work)|finding (a )?job|find (a )?job|apply(ing)? for jobs?|job applications?|cover letters?', 'p_jobsearch'],
    ['homework|for school|for class(es)?|school ?work|assignments?|studying|study for|exams?|coursework|tests? prep', 'p_school'],
    ['how to|how-to|instructions|step by step|diy', 'p_howto'],
    ['to learn|for learning|self[- ]taught|learning for fun|out of curiosity|curious about', 'p_selflearn'],
    ['the news|news|current events|breaking', 'p_news'],
    ['vent(ing)?|express(ing)? (their )?feelings|share (their )?feelings|talk about (their )?feelings', 'p_expressing'],
    ['ask (it|chatgpt|ai|the ai) to do|to do things|to do something|get things done|do tasks|do things for them|write things|to write|draft', 'p_doing'],
    ['ask questions|asking questions', 'p_asking']
  ];

  const WHAT = [
    ['mental health|anxiety|anxious|depression|depressed|stress(ed)?|therapy|therapist|loneliness|lonely|grief', 'mental_health'],
    ['social media|instagram|tiktok|facebook|youtube|twitter|reddit|snapchat|influencers?', 'social_media_online'],
    ['creative writing|stories|story|poems?|poetry|fiction|novels?|fan fiction|song lyrics|lyrics', 'creative_writing'],
    ['programming|coding|code|python|javascript|software development|developers?', 'programming'],
    ['fitness|exercise|workouts?|gym|diet(s|ing)?|nutrition|weight loss|lose weight|calories|protein', 'fitness_nutrition'],
    ['health|medical|medicine|doctors?|symptoms?|illness(es)?|sick|disease|diagnos[ie]s|medications?|meds|pain|injur(y|ies)|nurses?|hospital', 'health_medicine'],
    ['politics|political|government|elections?|voting|vote|president|congress|senate|democrats?|republicans?|trump|biden|harris|policy|policies|laws?|legal|lawyers?|court|courts|immigration|taxes|tax|benefits|social security|medicaid|medicare', 'pol'],
    ['money|finances?|financial|budget(s|ing)?|shopping|shop|buy(ing)?|purchases?|credit|debt|loans?|bills|invest(ing|ments?)?|stocks?|prices?|deals', 'money_shopping_finance'],
    ['recipes?|cooking|cook|meals?|dinner|lunch recipes|food|drinks?|baking|bake|restaurants?|wine|cocktails?', 'food_drink'],
    ['technology|tech|phones?|iphone|android|computers?|laptops?|devices?|apps|software|internet|wifi|gadgets?', 'technology_devices'],
    ['images?|pictures?|photos?|art|design|drawings?|draw|logos?|illustrations?|avatars?', 'art_design_images'],
    ['games?|gaming|video games|movies?|films?|tv|television|shows|music|songs?|entertainment|anime|celebrities|celebrity', 'entertainment_games'],
    ['relationships?|family|dating|marriage|married|partners?|boyfriends?|girlfriends?|husbands?|wives|wife|friends?|friendship|break ?ups?|parenting', 'relationships_family'],
    ['home|house|garden(ing)?|hobb(y|ies)|repairs?|cleaning|crafts?|furniture|decor(ating)?|renovat(e|ion|ing)', 'home_garden_hobbies'],
    ['school|schools|education|college|university|teachers?|classes|class|students learning', 'education_schools'],
    ['beauty|fashion|makeup|skin ?care|hair(styles?)?|outfits?|clothes|clothing|style', 'beauty_fashion'],
    ['travel|trips?|vacations?|flights?|hotels?|cars?|vehicles?|driving|road trips?', 'travel_places_vehicles'],
    ['history|historical|culture|society', 'history_society_culture'],
    ['religion|religious|faith|god|bible|church|spiritual(ity)?|philosophy|prayers?|astrology|horoscopes?', 'religion_spirituality_philosophy'],
    ['math|maths|algebra|calculus|geometry|equations?|statistics', 'math'],
    ['science|biology|chemistry|physics|nature|space|astronomy|environment|climate|weather', 'science_nature'],
    ['sports?|football|basketball|baseball|soccer|nfl|nba|mlb|super bowl|world cup|olympics|betting|fantasy football', 'sports'],
    ['pets?|dogs?|cats?|puppy|puppies|kittens?|animals?', 'pets_animals'],
    ['sex|sexual|sexuality|intimacy', 'sex_sexuality'],
    ['translat(e|ion|ing)|languages?|spanish|french|grammar|vocabulary', 'languages_translation'],
    ['personal growth|self[- ]improvement|motivation|habits|productivity|goals', 'personal_growth'],
    ['companionship|companion|small talk|chit ?chat|chatting|keep them company|someone to talk to', 'social_chat_companionship'],
    ['work|jobs?|careers?|business(es)?|boss(es)?|coworkers?|resumes?|interviews?|workplace|office', 'work_career_business']
  ];

  const LEVEL = {
    age: { '18-24': 'people aged 18 to 24', '25-34': 'people aged 25 to 34', '35-44': 'people aged 35 to 44',
      '45-54': 'people aged 45 to 54', '55-64': 'people aged 55 to 64', '65+': 'people 65 and over' },
    gender: { Female: 'women', Male: 'men' },
    income: { 'Less than $25,000': 'people with household income under $25,000', '$25,000 to $34,999': 'people with household income of $25,000 to $34,999',
      '$35,000 to $49,999': 'people with household income of $35,000 to $49,999', '$50,000 to $74,999': 'people with household income of $50,000 to $74,999',
      '$75,000 to $99,999': 'people with household income of $75,000 to $99,999', '$100,000 or more': 'people with household income of $100,000 or more' },
    education: { 'Some High School or Less': 'people who did not finish high school', 'Finished High School': 'high school graduates',
      'Some College, A.A. Degree or Technical College': 'people with some college or an associate degree',
      'Finished College (4-year degree)': 'college graduates', 'Post Graduate Study or Degree': 'people with a postgraduate degree' },
    race: { Caucasian: 'people who identify as white', 'African American/Black': 'people who identify as Black',
      'Hispanic/Latino': 'people who identify as Hispanic or Latino', Asian: 'people who identify as Asian',
      'Native American/Alaskan': 'people who identify as Native American or Alaska Native', 'Middle Eastern': 'people who identify as Middle Eastern',
      'Pacific Islander': 'people who identify as Pacific Islander', Other: 'people of another race or ethnicity' },
    hispanic: { Yes: 'people of Hispanic origin', No: 'people not of Hispanic origin' },
    region: { Northeast: 'people in the Northeast', Midwest: 'people in the Midwest', South: 'people in the South', West: 'people in the West' },
    employment: { Student: 'students', Retired: 'retirees', Unemployed: 'people who are unemployed', Homemaker: 'homemakers',
      'Part-time': 'people who work part-time', 'Full-time White Collar/Professional': 'people in full-time white-collar or professional jobs',
      'Full-time Blue Collar': 'people in full-time blue-collar jobs' },
    children: { 'Yes, and at least one lives in my home': 'parents with a child at home', No: 'people without children',
      'Yes, but they do not live in my home': 'parents whose children live elsewhere' }
  };
  const SHORT = {
    '18-24': '18–24', '25-34': '25–34', '35-44': '35–44', '45-54': '45–54', '55-64': '55–64', '65+': '65 and over',
    Female: 'Women', Male: 'Men', 'Less than $25,000': 'Under $25k', '$25,000 to $34,999': '$25k–35k', '$35,000 to $49,999': '$35k–50k',
    '$50,000 to $74,999': '$50k–75k', '$75,000 to $99,999': '$75k–100k', '$100,000 or more': '$100k and over',
    'Some High School or Less': 'Some high school', 'Finished High School': 'High school', 'Some College, A.A. Degree or Technical College': 'Some college',
    'Finished College (4-year degree)': 'Bachelor’s degree', 'Post Graduate Study or Degree': 'Postgraduate',
    Caucasian: 'White', 'African American/Black': 'Black', 'Hispanic/Latino': 'Hispanic or Latino', Asian: 'Asian',
    'Native American/Alaskan': 'Native American', 'Middle Eastern': 'Middle Eastern', 'Pacific Islander': 'Pacific Islander', Other: 'Other race',
    Yes: 'Hispanic', No: 'Not Hispanic', Northeast: 'Northeast', Midwest: 'Midwest', South: 'South', West: 'West',
    Student: 'Students', Retired: 'Retired', Unemployed: 'Unemployed', Homemaker: 'Homemakers', 'Part-time': 'Part-time',
    'Full-time White Collar/Professional': 'White-collar', 'Full-time Blue Collar': 'Blue-collar',
    'Yes, and at least one lives in my home': 'Child at home', 'Yes, but they do not live in my home': 'Children elsewhere'
  };
  function shortLabel(dim, level) {
    if (dim === 'children' && level === 'No') return 'No children';
    if (dim === 'hispanic') return level === 'Yes' ? 'Hispanic origin' : 'Not Hispanic';
    return SHORT[level] || level;
  }

  // A kind of group named without a particular group ("by income", "does age
  // matter"): the answer shows the measure across every group of that kind.
  const DIMWORD = [
    ['by age|age groups?|ages|age|older or younger|younger or older|young or old', 'age'],
    ['by income|household income|incomes?|earnings|rich or poor', 'income'],
    ['by education|education levels?|level of education|educational attainment|how educated', 'education'],
    ['by race|race|racial|ethnicity|ethnic groups?', 'race'],
    ['by region|regions?|part of the country|parts of the country', 'region'],
    ['by employment|employment status|employment|job status|work status', 'employment'],
    ['by gender|gender|genders', 'gender'],
    ['by parenthood|parenthood|having kids|having children', 'children']
  ];

  const WHO = [
    // [pattern, dim, level, note]
    ['65 and (over|older)|65\\+|over 65|seniors?|senior citizens|elderly|oldest|retirement age|baby boomers|boomers', 'age', '65+'],
    ['older (people|adults|americans|users|folks)|older', 'age', '65+', 'Shown as people 65 and over.'],
    ['55 (to|and) 64|55 64|late 50s|early 60s|in their 50s|fifties', 'age', '55-64'],
    ['45 (to|and) 54|45 54', 'age', '45-54'],
    ['middle[- ]aged|in their 40s|forties', 'age', '45-54', 'Shown as people aged 45 to 54.'],
    ['35 (to|and) 44|35 44|in their 30s|thirties|thirtysomethings', 'age', '35-44'],
    ['25 (to|and) 34|25 34|millennials', 'age', '25-34'],
    ['in their 20s|twenties|twentysomethings', 'age', '25-34', 'Shown as people aged 25 to 34.'],
    ['18 (to|and) 24|18 24|young adults|young people|younger (people|adults|users|americans)|youngest|college[- ]age|gen z|younger', 'age', '18-24'],
    ['retirees|retired( people)?', 'employment', 'Retired'],
    ['college students|grad(uate)? students|students?', 'employment', 'Student'],
    ['unemployed|jobless|out of work|not working', 'employment', 'Unemployed'],
    ['homemakers?|stay[- ]at[- ]home (moms?|dads?|parents?)', 'employment', 'Homemaker'],
    ['part[- ]time( workers)?', 'employment', 'Part-time'],
    ['white[- ]collar|professionals|office workers', 'employment', 'Full-time White Collar/Professional'],
    ['blue[- ]collar|tradespeople|manual workers', 'employment', 'Full-time Blue Collar'],
    ['without (kids|children)|no kids|childless|child[- ]free|non[- ]parents', 'children', 'No'],
    ['parents?|moms?|dads?|mothers?|fathers?|people with (kids|children)|(people )?(who )?(have|has) (kids|children)', 'children', 'Yes, and at least one lives in my home'],
    ['women|woman|female(s)?|ladies', 'gender', 'Female'],
    ['men|man|male(s)?|guys', 'gender', 'Male'],
    ['six figures|100k|100 000|high[- ]income|higher[- ]income|wealth(y|ier)|rich(er)?|affluent|well[- ]off|high earners', 'income', '$100,000 or more'],
    ['low[- ]income|lower[- ]income|poor(er)?|under 25k|less than 25k|low earners', 'income', 'Less than $25,000'],
    ['middle[- ]income|middle class', 'income', '$50,000 to $74,999', 'Shown as household income of $50,000 to $74,999.'],
    ['post ?grad(uate)?s?|graduate degrees?|master s|masters|phd|doctorates?|advanced degrees?', 'education', 'Post Graduate Study or Degree'],
    ['college grad(uate)?s|college[- ]educated|bachelor s|bachelors|four[- ]year degrees?|graduated from college|college degrees?', 'education', 'Finished College (4-year degree)'],
    ['high school grad(uate)?s|high school diplomas?|only high school', 'education', 'Finished High School'],
    ['did not finish high school|didn t finish high school|no high school diploma|dropouts|without a diploma', 'education', 'Some High School or Less'],
    ['some college|associate s degrees?|community college|technical college|trade school', 'education', 'Some College, A.A. Degree or Technical College'],
    ['non ?hispanics?|not hispanic|non ?latinos?|not latino', 'hispanic', 'No'],
    ['hispanics?|latinos?|latinas?|latinx|latine', 'hispanic', 'Yes'],
    ['african americans?|black (people|americans|users)|black', 'race', 'African American/Black'],
    ['white (people|americans|users)|white|caucasians?', 'race', 'Caucasian'],
    ['asian americans?|asians?', 'race', 'Asian'],
    ['native americans?|american indians?|alaska natives?', 'race', 'Native American/Alaskan'],
    ['middle eastern', 'race', 'Middle Eastern'],
    ['pacific islanders?', 'race', 'Pacific Islander'],
    ['northeast(ern)?|new england', 'region', 'Northeast'],
    ['midwest(ern)?|midwesterners', 'region', 'Midwest'],
    ['the south|south|southern(ers)?', 'region', 'South'],
    ['west coast|the west|west|western(ers)?', 'region', 'West']
  ];
  const MINORS = 'teens?|teenagers?|adolescents?|minors?|under 18|high schoolers|high school students|middle schoolers|(?<!(with|without|no|have|has|their|my|our) )(kids|children) (ask|use|talk|do|want)|what do (kids|children)';

  const MONTHS = ['2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];
  const MONTH_NAME = { '2025-07': 'July 2025', '2025-08': 'August 2025', '2025-09': 'September 2025', '2025-10': 'October 2025',
    '2025-11': 'November 2025', '2025-12': 'December 2025', '2026-01': 'January 2026', '2026-02': 'February 2026',
    '2026-03': 'March 2026', '2026-04': 'April 2026', '2026-05': 'May 2026', '2026-06': 'June 2026' };
  const MONTH_WORD = [['january|jan', '2026-01'], ['february|feb', '2026-02'], ['march', '2026-03'], ['april|apr', '2026-04'],
    ['may', '2026-05'], ['june|jun', '2026-06'], ['july|jul', '2025-07'], ['august|aug', '2025-08'], ['september|sept|sep', '2025-09'],
    ['october|oct', '2025-10'], ['november|nov', '2025-11'], ['december|dec', '2025-12']];
  const DAY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const DAYPART_LABEL = { morning: 'in the morning (5 am to noon)', afternoon: 'in the afternoon (noon to 5 pm)',
    evening: 'in the evening (5 to 10 pm)', night: 'at night (10 pm to 5 am)' };

  const WHEN = [
    // [pattern, kind, value, label, note]
    ['tax season', 'months', ['2026-01', '2026-02', '2026-03', '2026-04'], 'during tax season (January to April 2026)'],
    ['back to school', 'months', ['2025-08', '2025-09'], 'at back-to-school time (August and September 2025)'],
    ['holiday season|the holidays|holidays|christmas', 'months', ['2025-12'], 'in December 2025'],
    ['thanksgiving', 'months', ['2025-11'], 'in November 2025'],
    ['new year', 'months', ['2026-01'], 'in January 2026'],
    ['summer', 'months', ['2025-07', '2025-08', '2026-06'], 'in summer (July and August 2025, June 2026)'],
    ['fall|autumn', 'months', ['2025-09', '2025-10', '2025-11'], 'in the fall (September to November 2025)'],
    ['winter', 'months', ['2025-12', '2026-01', '2026-02'], 'in winter (December 2025 to February 2026)'],
    ['spring', 'months', ['2026-03', '2026-04', '2026-05'], 'in spring (March to May 2026)'],
    ['weekends?|on saturdays? and sundays?', 'weekpart', 'weekend', 'on weekends'],
    ['weekdays?|workdays?|during the week', 'weekpart', 'weekday', 'on weekdays'],
    ['midnight', 'hour', 0, 'at midnight'],
    ['noon|lunchtime|lunch time|at lunch', 'hour', 12, 'at noon'],
    ['early morning|before dawn|dawn|sunrise|crack of dawn', 'hour', 5, 'at 5 am', 'Shown as 5 am.'],
    ['late at night|late night|at night|nighttime|night time|overnight|middle of the night|after midnight|bedtime|nights?', 'daypart', 'night', DAYPART_LABEL.night],
    ['mornings?', 'daypart', 'morning', DAYPART_LABEL.morning],
    ['afternoons?', 'daypart', 'afternoon', DAYPART_LABEL.afternoon],
    ['evenings?|after work|after dinner', 'daypart', 'evening', DAYPART_LABEL.evening]
  ];

  /* ---------------------------------------------------------------- parsing */

  function norm(q) {
    return ' ' + String(q || '').toLowerCase().replace(/[’']/g, ' ').replace(/[^a-z0-9+$]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  }
  function take(state, pat) {
    const re = new RegExp(' (' + pat + ')(?= )', 'g');
    const m = re.exec(state.t);
    if (!m) return null;
    const hit = m[1];
    state.t = state.t.slice(0, m.index) + ' ' + '#'.repeat(hit.length) + state.t.slice(m.index + 1 + hit.length);
    state.at = m.index;                 // where it was found, so groups keep the question's order
    return hit;
  }

  function parse(question) {
    const s = { t: norm(question) };
    const out = { q: question, who: [], what: [], why: [], when: [], notes: [], minors: false, intent: 'general' };
    const raw = s.t;

    if (take(s, MINORS)) out.minors = true;

    // when: clock times first (they contain numbers the age patterns would read)
    let m;
    const clock = / (at |around |about )?(\d{1,2})( \d\d)? ?(am|a m|pm|p m)(?= )/;
    while ((m = clock.exec(s.t))) {
      let h = parseInt(m[2], 10) % 12;
      if (m[4].replace(' ', '') === 'pm') h += 12;
      out.when.push({ kind: 'hour', value: h, label: 'at ' + hourLabel(h) });
      s.t = s.t.slice(0, m.index) + ' ' + '#'.repeat(m[0].length - 1) + s.t.slice(m.index + m[0].length);
    }
    WHEN.forEach(([pat, kind, value, label, note]) => {
      if (take(s, pat)) { out.when.push({ kind, value, label }); if (note) out.notes.push(note); }
    });
    MONTH_WORD.forEach(([pat, key]) => {
      if (take(s, '(in |during )?(' + pat + ')')) out.when.push({ kind: 'months', value: [key], label: 'in ' + MONTH_NAME[key] });
    });
    DAY.forEach((d, i) => { if (take(s, '(on )?' + d + 's?')) out.when.push({ kind: 'wday', value: i, label: 'on ' + cap(d) + 's' }); });

    const beforeWhy = s.t;
    WHY.forEach(([pat, code]) => { if (take(s, pat)) out.why.push(code); });
    const afterWhy = s.t;

    // numeric ages ("30-year-olds", "people aged 40")
    const ageRe = / (aged |age |ages )?(\d{2})( |-)?(year olds?|years old|yr olds?)?(?= )/;
    if ((m = ageRe.exec(s.t)) && (m[1] || m[4])) {
      const a = parseInt(m[2], 10);
      if (a < 18) out.minors = true;
      else {
        const band = a <= 24 ? '18-24' : a <= 34 ? '25-34' : a <= 44 ? '35-44' : a <= 54 ? '45-54' : a <= 64 ? '55-64' : '65+';
        out.who.push({ dim: 'age', level: band, at: m.index });
        out.notes.push('Shown as ' + LEVEL.age[band] + '.');
      }
      s.t = s.t.slice(0, m.index) + ' ' + '#'.repeat(m[0].length - 1) + s.t.slice(m.index + m[0].length);
    }
    WHO.forEach(([pat, dim, level, note]) => {
      if (take(s, pat)) { out.who.push({ dim, level, at: s.at }); if (note) out.notes.push(note); }
    });
    out.who.sort((a, b) => a.at - b.at);
    DIMWORD.forEach(([pat, dim]) => { if (!out.dim && take(s, pat)) out.dim = dim; });
    const beforeWhat = s.t;
    WHAT.forEach(([pat, code]) => { if (take(s, pat)) out.what.push(code); });

    // Mentions: terms are looked for (a) in the question with groups and times
    // taken out but subject and purpose words left in, and (b) in what remains
    // after everything else has been read. Taking groups out first keeps "people
    // in the South" from reading as a mention of "South".
    let mt = '';
    for (let i = 0; i < s.t.length; i++) mt += (beforeWhy[i] !== afterWhy[i] || beforeWhat[i] !== s.t[i]) ? raw[i] : s.t[i];
    out.mentionsAll = findMentions(mt);
    out.mentionsRest = findMentions(s.t);
    out.mentionIntent = / (mention|mentions|mentioned|mentioning|bring up|brings up|brought up|vs|versus|trend|trends) /.test(raw);
    // "When do people mention Christmas?": the holiday was read as a time; an
    // explicit mention question looks for terms in the whole question instead.
    if (out.mentionIntent && !out.mentionsAll.length) out.mentionsAll = findMentions(raw);
    out.raw = raw;

    if (/ who /.test(raw) && / (most|more|least|less|biggest|highest|lowest) /.test(raw)) out.intent = 'who';
    else if (/ which (group|groups|people) /.test(raw)) out.intent = 'who';
    else if (/ (when|what time|which day|which days|which month|what day|time of day) /.test(raw)) out.intent = 'when';
    else if (/ (more|less|than|compared) /.test(raw) && out.who.length) out.intent = 'compare';
    return out;
  }

  /* ---------------------------------------------------------------- helpers */

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function hourLabel(h) { return h === 0 ? 'midnight' : h === 12 ? 'noon' : (h % 12) + (h < 12 ? ' am' : ' pm'); }
  function pct(v) { return v == null ? 'not shown' : v.toFixed(1) + '%'; }
  const NUMWORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  function numWord(n) { return n <= 20 ? NUMWORD[n] : String(n); }
  function oneIn(p) {                   // the same rounding as the reports' prose
    if (p == null || p <= 0) return '';
    if (p >= 35) return 'about ' + numWord(Math.round(p / 10)) + ' in ten';
    const n = 100 / p;
    const r = n < 20 ? Math.round(n) : n < 40 ? Math.round(n / 5) * 5 : Math.round(n / 10) * 10;
    return 'about one in ' + numWord(r);
  }
  // "A, B and C"; when an item has its own commas ("art, design and images"),
  // separate items with semicolons so the list still reads unambiguously.
  function andList(items) {
    if (items.length < 2) return items.join('');
    if (items.length === 2) return items[0] + ' and ' + items[1];
    const semi = items.some(s => s.indexOf(',') >= 0);
    return items.slice(0, -1).join(semi ? '; ' : ', ') + (semi ? '; and ' : ' and ') + items[items.length - 1];
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }

  function measureVerb(m) {
    const V = { pol: 'involve politics, government or law', p_asking: 'ask a question', p_doing: 'ask ChatGPT to do something',
      p_expressing: 'express a thought or feeling', p_school: 'are for school', p_howto: 'ask how to do something',
      p_selflearn: 'are for learning’s sake', p_work: 'are for work', p_jobsearch: 'are part of a job search', p_news: 'are about the news' };
    return V[m] || 'are mainly about ' + DATA.measures[m];
  }
  function measureName(m) {
    const N = { pol: 'politics, government or law', p_asking: 'asking questions', p_doing: 'asking ChatGPT to do things',
      p_expressing: 'expressing thoughts or feelings', p_school: 'schoolwork', p_howto: 'how-to questions',
      p_selflearn: 'learning for its own sake', p_work: 'work', p_jobsearch: 'job searching', p_news: 'the news' };
    return N[m] || DATA.measures[m];
  }
  function compareWords(v, base) {
    if (v == null || base == null) return '';
    const r = v / base;
    if (pct(v) === pct(base)) return 'about the same as everyone (' + pct(base) + ')';
    if (r >= 1.5) return r.toFixed(1) + ' times the share for everyone (' + pct(base) + ')';
    if (r > 1.05) return 'more than everyone (' + pct(base) + ')';
    if (r >= 0.95) return 'about the same as everyone (' + pct(base) + ')';
    if (r > 0.67) return 'less than everyone (' + pct(base) + ')';
    return 'well below everyone (' + pct(base) + ')';
  }

  let DATA = null;
  function everyone() { return DATA.groups.everyone[0]; }
  function cell(dim, level) { return (DATA.groups[dim] || []).find(c => c.level === level) || null; }
  function val(c, m) { return c && c.shown && c.v && c.v[m] != null ? c.v[m] : null; }
  function timeCell(kind, key) {
    const list = DATA.time[kind === 'months' ? 'month' : kind] || [];
    return list.find(c => String(c.key) === String(key)) || null;
  }
  function combine(cells, m) {          // conversation-weighted share across cells
    let n = 0, s = 0;
    for (const c of cells) { const v = val(c, m); if (v == null) return null; n += c.convs; s += v * c.convs; }
    return n ? s / n : null;
  }
  function whenCells(w) {
    if (w.kind === 'months') return w.value.map(k => timeCell('months', k));
    return [timeCell(w.kind, w.value)];
  }
  function groupTime(dim, level, w) {
    if (w.kind !== 'daypart' && w.kind !== 'weekpart') return null;
    const list = ((DATA.group_time[dim] || {})[w.kind]) || [];
    return list.find(c => c.level === level && String(c.key) === String(w.value)) || null;
  }
  function whoLabel(w) { return LEVEL[w.dim][w.level]; }
  function rankGroups(m) {
    const rows = [];
    Object.keys(DATA.dims).forEach(dim => {
      (DATA.groups[dim] || []).forEach(c => { const v = val(c, m); if (v != null) rows.push({ dim, level: c.level, v, c }); });
    });
    return rows.sort((a, b) => b.v - a.v);
  }
  function topMeasures(c, ref, n, pool) {
    const codes = pool || Object.keys(DATA.measures).filter(k => !k.startsWith('p_') && k !== 'pol' && k !== 'unclear' && k !== 'other');
    return codes.map(k => ({ k, v: val(c, k), r: ref ? val(ref, k) : null })).filter(x => x.v != null)
      .sort((a, b) => b.v - a.v).slice(0, n);
  }
  function overIndexed(c, ref, n) {
    const codes = Object.keys(DATA.measures).filter(k => !k.startsWith('p_') && k !== 'pol' && k !== 'unclear' && k !== 'other');
    return codes.map(k => ({ k, v: val(c, k), r: val(ref, k) })).filter(x => x.v != null && x.r != null && x.v >= 1)
      .map(x => Object.assign(x, { ratio: x.v / x.r })).filter(x => x.ratio >= STANDOUT)
      .sort((a, b) => b.ratio - a.ratio).slice(0, n);
  }
  const STANDOUT = 1.2;                 // a subject "stands out" at 1.2 times its reference share or more
  // Politics answers use the political classification (as in the politics report);
  // this line gives the narrower main-subject share beside it, so the two agree
  // with the subject lists, where politics appears as one of the 28 subjects.
  const POL_TOPIC = 'politics_government_law';
  function polMain(t) { return 'Counted only when politics is the main subject of the conversation, the share is ' + pct(t) + '.'; }
  // A series is "flat" when its highest value is under 1.1 times its lowest, or
  // the two look the same at one decimal; then no peak is named.
  function flat(vs) {
    const xs = vs.filter(v => v != null);
    if (xs.length < 2) return true;
    const hi = Math.max.apply(null, xs), lo = Math.min.apply(null, xs);
    return lo > 0 ? hi / lo < 1.1 || pct(hi) === pct(lo) : false;
  }

  /* --------------------------------------------------------------- charts */

  function barsHTML(rows, opt) {          // opt.fmt formats values (default: percent)
    opt = opt || {};
    const fmt = opt.fmt || pct;
    const max = Math.max(...rows.map(r => r.v), opt.ref || 0) * 1.12 || 1;
    let h = '<div class="abars">';
    rows.forEach(r => {
      h += '<div class="abrow' + (r.hi ? ' hi' : '') + '"><span class="ablabel">' + esc(r.label) + '</span><span class="abtrack"><span class="abfill" style="width:' +
        (r.v / max * 100).toFixed(2) + '%"></span>' + (opt.ref != null ? '<span class="abref" style="left:' + (opt.ref / max * 100).toFixed(2) + '%"></span>' : '') +
        '</span><span class="abval">' + fmt(r.v) + '</span></div>';
    });
    h += '</div>';
    if (opt.ref != null) h += '<p class="abkey"><i></i>' + esc(opt.refLabel || 'Everyone') + ': ' + fmt(opt.ref) + '</p>';
    return h;
  }
  function columnsSVG(points, opt) {     // points: [{label, v, hi}]; opt.fmt as in barsHTML
    const W = 640, H = 200, L = 36, R = 8, T = 14, B = 30;
    const fmt = opt.fmt || pct;
    const vs = points.map(p => p.v).filter(v => v != null);
    const lows = points.map(p => p.lowTo).filter(v => v != null);
    const max = Math.max(...vs, ...lows) * 1.15 || 1;
    const bw = (W - L - R) / points.length;
    const hid = 'hatch' + (++HATCH);
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(opt.aria || 'Chart') + '">' + (lows.length ? hatchDef(hid) : '');
    [0.5, 1].forEach(f => {
      const y = T + (1 - f) * (H - T - B), v = max * f;
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="#e8e8e8"/>' +
        '<text x="' + (L - 6) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="#7d7d7d">' + (opt.fmt ? opt.axis(v) : v.toFixed(v < 2 ? 1 : 0) + '%') + '</text>';
    });
    points.forEach((p, i) => {
      const x = L + i * bw;
      if (p.v != null) {
        const h = p.v / max * (H - T - B);
        s += '<rect x="' + (x + bw * 0.15).toFixed(1) + '" y="' + (H - B - h).toFixed(1) + '" width="' + (bw * 0.7).toFixed(1) + '" height="' + h.toFixed(1) +
          '" rx="1.5" fill="' + (p.hi ? '#b00b33' : '#c9c9c9') + '"><title>' + esc(p.label + ': ' + fmt(p.v)) + '</title></rect>';
      } else if (p.lowTo != null) {       // too few to publish: a hatched bar up to the threshold
        const h = p.lowTo / max * (H - T - B);
        s += '<rect x="' + (x + bw * 0.15).toFixed(1) + '" y="' + (H - B - h).toFixed(1) + '" width="' + (bw * 0.7).toFixed(1) + '" height="' + h.toFixed(1) +
          '" rx="1.5" fill="url(#' + hid + ')"><title>' + esc(p.label + ': too few mentions to publish an exact figure (under ' + fmt(p.lowTo) + ')') + '</title></rect>';
      } else if (p.held) {
        s += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - B - 3) + '" text-anchor="middle" font-size="12" fill="#7d7d7d">×<title>' +
          esc(p.label + ': withheld, because a handful of people supply most of the mentions') + '</title></text>';
      }
      if (p.tick) s += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="11" fill="#7d7d7d">' + esc(p.tick) + '</text>';
    });
    s += '</svg>';
    if (lows.length) s += '<p class="alegend"><span><i style="height:10px;width:16px;background:repeating-linear-gradient(45deg,#ececec 0 3px,#cfcfcf 3px 5px)"></i>Too few mentions that month to publish an exact figure; the true value is below the hatched bar</span></p>';
    return s;
  }
  function hourPoints(m, hiSet) {
    return DATA.time.hour.slice().sort((a, b) => a.key - b.key).map(c => ({
      label: hourLabel(+c.key), v: val(c, m), hi: hiSet ? hiSet.has(+c.key) : false,
      tick: [0, 6, 12, 18].includes(+c.key) ? hourLabel(+c.key) : ''
    }));
  }
  function monthPoints(m, hiSet) {
    return MONTHS.map(k => ({ label: MONTH_NAME[k], v: val(timeCell('months', k), m), hi: hiSet ? hiSet.has(k) : false,
      tick: MONTH_NAME[k].slice(0, 3) }));
  }
  function dayPoints(m, hiSet) {
    return [1, 2, 3, 4, 5, 6, 0].map(d => ({ label: cap(DAY[d]) + 's', v: val(timeCell('wday', d), m), hi: hiSet ? hiSet.has(d) : false,
      tick: cap(DAY[d]).slice(0, 3) }));
  }

  /* ------------------------------------------------------------- mentions */
  // How often people mention a term in their own messages (data/mentions_index.json
  // for every term, data/mentions/<id>.json for one term's detail, loaded on demand).

  let MENT = null, MBASE = '';
  const MDET = {};
  let PHRASES = [];                     // [{p: normalized phrase, id}], longest first
  const SKIP_IMPLICIT = new Set(['ai', 'chatgpt', 'chat gpt', 'chatgbt', 'chat gbt', 'openai', 'open ai']);
  const LINE_COLORS = ['#b00b33', '#0e77a4', '#858585', '#c99a2e', '#3d7a5a'];
  const DIM_NAME = { age: 'age', gender: 'gender', income: 'household income', education: 'education', race: 'race and ethnicity',
    hispanic: 'Hispanic origin', region: 'region', employment: 'employment', children: 'children' };

  function setMentions(ix) {
    MENT = ix; MENT.byId = {};
    const seen = new Set();
    PHRASES = [];
    ix.terms.forEach(t => {
      MENT.byId[t.id] = t;
      [].concat(t.phrases).forEach(ph => {
        const p = norm(ph).trim();
        if (p && !seen.has(p + '|' + t.id)) { seen.add(p + '|' + t.id); PHRASES.push({ p, id: t.id }); }
      });
    });
    // Longest phrase first; for the same phrase, a hand-written term beats a listed
    // person, then a place, then a topic-model word.
    const rank = id => ({ m: 0, p: 1, g: 2, t: 3 })[MENT.byId[id].src] || 4;
    PHRASES.sort((a, b) => b.p.length - a.p.length || rank(a.id) - rank(b.id));
  }
  function ppFmt(v) { return v == null ? 'not shown' : (v < 10 ? v.toFixed(1) : v.toFixed(0)) + '%'; }
  function findMentions(text) {         // ordered term ids; each matched span is used once
    if (!MENT) return [];
    let t = text;
    const hits = [];
    PHRASES.forEach(({ p, id }) => {
      const i = t.indexOf(' ' + p + ' ');
      if (i < 0) return;
      hits.push({ id, p, at: i });
      t = t.slice(0, i + 1) + '#'.repeat(p.length) + t.slice(i + 1 + p.length);
    });
    hits.sort((a, b) => a.at - b.at);
    const out = [];
    hits.forEach(h => { if (!out.some(o => o.id === h.id)) out.push(h); });
    return out;
  }
  function mentionRoute(P) {           // which terms a question is about, if it is a mentions question
    if (!MENT || P.minors) return [];
    const all = P.mentionsAll.map(h => h.id);
    const rest = P.mentionsRest.filter(h => !SKIP_IMPLICIT.has(h.p)).map(h => h.id);
    const named = all.filter(id => /^(People|Places)/.test(MENT.byId[id].cat));
    if (P.mentionIntent && all.length) return all.slice(0, 5);
    if (/ (compare|comparing|compared) /.test(P.raw) && all.length >= 2) return all.slice(0, 5);
    if (named.length) return all.slice(0, 5);
    if (!P.what.length && !P.why.length && rest.length) return rest.slice(0, 5);
    return [];
  }
  function fmtK(v) { return v == null ? 'not shown' : v >= 10 ? v.toFixed(0) : v >= 1 ? v.toFixed(1) : v.toFixed(2); }
  function perK(v) { return fmtK(v) + ' per 1,000'; }
  function axisK(v) { return v >= 10 ? v.toFixed(0) : v >= 1 ? v.toFixed(1) : v.toFixed(2); }
  function groupSep(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function oneInK(v) {
    if (v == null || v <= 0) return '';
    const n = 1000 / v;
    let r;
    if (n < 20) r = Math.round(n);
    else if (n < 40) r = Math.round(n / 5) * 5;
    else if (n < 100) r = Math.round(n / 10) * 10;
    else { const e = Math.pow(10, Math.floor(Math.log10(n)) - 1); r = Math.round(n / e) * e; }
    return 'about one in ' + (r <= 20 ? numWord(r) : groupSep(r));
  }
  function compareK(v, base, ref) {
    if (v == null || base == null) return '';
    const r = v / base;
    if (fmtK(v) === fmtK(base)) return 'about the same as ' + ref + ' (' + fmtK(base) + ')';
    if (r >= 1.5) return r.toFixed(1) + ' times the rate for ' + ref + ' (' + fmtK(base) + ')';
    if (r > 1.05) return 'more than ' + ref + ' (' + fmtK(base) + ')';
    if (r >= 0.95) return 'about the same as ' + ref + ' (' + fmtK(base) + ')';
    if (r > 0.67) return 'less than ' + ref + ' (' + fmtK(base) + ')';
    return 'well below ' + ref + ' (' + fmtK(base) + ')';
  }
  function mGroupCells(d, dim) { return (d && d.groups && d.groups[dim] || []).filter(c => LEVEL[dim] && LEVEL[dim][c.level]); }
  function mMonthPoints(d, hiSet) {
    const fl = monthFloors('conv');
    return MONTHS.map((k, i) => ({ label: MONTH_NAME[k], v: d && d.month ? d.month[k] : null, hi: hiSet ? hiSet.has(k) : false, tick: MONTH_NAME[k].slice(0, 3),
      lowTo: d && fl && (d.month_low || []).includes(k) ? fl[i] : null, held: !!(d && (d.month_held || []).includes(k)) }));
  }
  function mChart(title, points) {
    return '<h3>' + esc(title) + '</h3>' + columnsSVG(points, { aria: title, fmt: perK, axis: axisK });
  }
  let HATCH = 0;
  function hatchDef(id) {
    return '<defs><pattern id="' + id + '" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<rect width="6" height="6" fill="#ececec"/><line x1="0" y1="0" x2="0" y2="6" stroke="#cfcfcf" stroke-width="2.5"/></pattern></defs>';
  }
  // The publishing threshold for each month, in the chart's unit: a month with fewer
  // than 50 mentioning conversations is known to sit below it.
  function monthFloors(unit) {
    const mt = MENT && MENT.meta, minc = mt && mt.rules ? mt.rules.min_conv : 50;
    if (!mt || !mt.month_n) return null;
    return MONTHS.map(k => unit === 'people' ? (mt.month_np[k] ? 100 * minc / mt.month_np[k] : null) : (mt.month_n[k] ? 1000 * minc / mt.month_n[k] : null));
  }
  // series: [{name, values: [v|null per month], low: [true when the month had too few mentions to publish]}]
  // opt.floor: monthFloors(...). Low months are drawn inside a hatched "too few to publish" band,
  // so a withheld month reads as small rather than as zero.
  function linesSVG(series, opt) {
    opt = opt || {};
    const fmt = opt.fmt || perK, axis = opt.axis || axisK, floor = opt.floor || null;
    const W = 640, H = 230, L = 40, R = 10, T = 14, B = 30;
    const anyLow = !!floor && series.some(se => (se.low || []).some(Boolean));
    const vs = [].concat(...series.map(s => s.values)).filter(v => v != null);
    if (!vs.length && !anyLow) return '<p class="empty">No month has enough mentions to publish a figure.</p>';
    const max = (Math.max(...vs, ...(anyLow ? floor.filter(f => f != null) : [])) || 1) * 1.15;
    const x = i => L + i * (W - L - R) / (MONTHS.length - 1), y = v => T + (1 - v / max) * (H - T - B);
    const hid = 'hatch' + (++HATCH);
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(opt.aria || 'Mentions per 1,000 conversations, by month') + '">';
    if (anyLow) {
      s += hatchDef(hid) + '<path d="M' + x(0).toFixed(1) + ',' + y(0).toFixed(1) +
        floor.map((f, i) => 'L' + x(i).toFixed(1) + ',' + y(f || 0).toFixed(1)).join('') +
        'L' + x(MONTHS.length - 1).toFixed(1) + ',' + y(0).toFixed(1) + 'Z" fill="url(#' + hid + ')"/>';
    }
    [0.5, 1].forEach(f => {
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(max * f).toFixed(1) + '" y2="' + y(max * f).toFixed(1) + '" stroke="#e8e8e8"/>' +
        '<text x="' + (L - 6) + '" y="' + (y(max * f) + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="#7d7d7d">' + axis(max * f) + '</text>';
    });
    MONTHS.forEach((k, i) => { s += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="11" fill="#7d7d7d">' + esc(MONTH_NAME[k].slice(0, 3)) + '</text>'; });
    series.forEach((se, j) => {
      const c = LINE_COLORS[j % LINE_COLORS.length];
      // a point per month: the published value, or (for a low month) a ghost inside the band
      const pts = se.values.map((v, i) => v != null ? { i, v, real: true }
        : (anyLow && se.low && se.low[i] && floor[i] != null ? { i, v: floor[i] / 2, real: false } : null));
      // months withheld for another reason (a handful of people supply most mentions): no bound, so an x on the axis
      (se.held || []).forEach((h, i) => {
        if (!h) return;
        s += '<text x="' + x(i).toFixed(1) + '" y="' + (y(0) - 3).toFixed(1) + '" text-anchor="middle" font-size="12" fill="' + c + '">×<title>' +
          esc(se.name + ', ' + MONTH_NAME[MONTHS[i]] + ': withheld, because a handful of people supply most of the mentions') + '</title></text>';
      });
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        if (!a || !b) continue;
        s += '<line x1="' + x(a.i).toFixed(1) + '" y1="' + y(a.v).toFixed(1) + '" x2="' + x(b.i).toFixed(1) + '" y2="' + y(b.v).toFixed(1) +
          '" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round"' + (a.real && b.real ? '' : ' stroke-dasharray="3 4" opacity="0.7"') + '/>';
      }
      pts.forEach(p => {
        if (!p) return;
        const minc = MENT && MENT.meta && MENT.meta.rules ? MENT.meta.rules.min_conv : 50;
        const tip = se.name + ', ' + MONTH_NAME[MONTHS[p.i]] + ': ' + (p.real ? fmt(p.v) : 'fewer than ' + minc + ' conversations, so under ' + fmt(floor[p.i]) + '; too few to publish an exact figure');
        s += '<circle cx="' + x(p.i).toFixed(1) + '" cy="' + y(p.v).toFixed(1) + '" r="' + (p.real ? 2.6 : 3) + '" fill="' + (p.real ? c : '#fff') +
          '" stroke="' + c + '" stroke-width="' + (p.real ? 0 : 1.6) + '"><title>' + esc(tip) + '</title></circle>';
      });
    });
    s += '</svg><p class="alegend">' + series.map((se, j) => '<span><i style="background:' + LINE_COLORS[j % LINE_COLORS.length] + '"></i>' + esc(se.name) + '</span>').join('') +
      (anyLow ? '<span><i style="height:10px;width:16px;background:repeating-linear-gradient(45deg,#ececec 0 3px,#cfcfcf 3px 5px)"></i>Too few mentions that month to publish an exact figure (hollow points)</span>' : '') +
      (series.some(se => (se.held || []).some(Boolean)) ? '<span>× Withheld: a handful of people supply most of that month’s mentions</span>' : '') + '</p>';
    return s;
  }
  function mentionNote(ts) {
    const ph = ts.map(t => t.name + ': ' + [].concat(t.phrases).slice(0, 6).join(', ') + ([].concat(t.phrases).length > 6 ? '…' : '')).join('; ');
    return 'A mention means the words appear in the person’s own message, whatever the conversation is about. Counted as: ' + ph + '.';
  }

  function mentionAnswer(res, P, ids) {
    const ts = ids.map(id => MENT.byId[id]);
    res.notes.push(mentionNote(ts));
    ts.forEach(t => { if (t.note) res.notes.push(t.name + ': ' + t.note + '.'); });
    let who = P.who[0] || null, who2 = P.who[1] && P.who[1].dim === who.dim ? P.who[1] : null;
    if (P.who.length > (who2 ? 2 : 1)) res.notes.push('Mentions can be shown for one kind of group at a time; ' + P.who.slice(who2 ? 2 : 1).map(whoLabel).join(' and ') + ' left out.');
    const when = P.when[0] || null;
    if (/^Places/.test(ts[0].cat) && / (people|those|folks|residents|users) (in|from) | who live in /.test(P.raw))
      res.notes.push('Figures are not broken down by state or city. This shows how often people mention ' + ts[0].name + ' instead.');
    if (ts.length >= 2) return mentionCompare(res, ts, who);
    const t = ts[0], d = MDET[t.id];
    if (who && when) res.notes.push('Mentions by group are shown for the whole year; the time was left out.');

    // a group, or two groups of one kind
    if (who) {
      const cg = mGroupCells(d, who.dim), c1 = cg.find(c => c.level === who.level);
      res.readAs = [whoLabel(who) + (who2 ? ' and ' + whoLabel(who2) : ''), 'mentions of ' + t.name, 'all year'];
      if (!d) { res.title = 'Loading the figures for ' + t.name + ' failed. Try again.'; return res; }
      if (!c1 || c1.per1000 == null) { res.title = 'This figure is not published for ' + whoLabel(who) + '.'; res.body.push('Too few of their conversations mention it, or a handful of people supply most of them.'); }
      else if (who2) {
        const c2 = cg.find(c => c.level === who2.level);
        if (!c2 || c2.per1000 == null) res.title = 'This comparison is not published.';
        else {
          res.title = t.name + ': ' + whoLabel(who) + ' mention it in ' + perK(c1.per1000) + ' conversations; ' + whoLabel(who2) + ', ' + perK(c2.per1000) + '.';
          const rel = c1.per1000 / c2.per1000;
          res.body.push((rel >= 0.95 && rel <= 1.05) || fmtK(c1.per1000) === fmtK(c2.per1000) ? 'The two rates are about the same.'
            : rel > 1 ? 'The rate for ' + whoLabel(who) + ' is ' + rel.toFixed(1) + ' times the rate for ' + whoLabel(who2) + '.'
              : 'The rate for ' + whoLabel(who2) + ' is ' + (1 / rel).toFixed(1) + ' times the rate for ' + whoLabel(who) + '.');
          if (c1.pp != null && c2.pp != null) res.body.push(ppFmt(c1.pp) + ' of ' + whoLabel(who) + ' and ' + ppFmt(c2.pp) + ' of ' + whoLabel(who2) + ' mentioned it at least once. Across everyone: ' + perK(t.per1000) + ' conversations.');
        }
      } else {
        res.title = t.name + ': ' + whoLabel(who) + ' mention it in ' + perK(c1.per1000) + ' conversations (' + oneInK(c1.per1000) + '), ' + compareK(c1.per1000, t.per1000, 'everyone') + '.';
        if (c1.pp != null) res.body.push(ppFmt(c1.pp) + ' of ' + whoLabel(who) + ' mentioned it at least once (everyone: ' + ppFmt(t.pp) + ').');
      }
      res.chart = '<h3>' + esc(t.name) + ', by ' + esc(DIM_NAME[who.dim]) + '</h3>' +
        barsHTML(cg.filter(c => c.per1000 != null).map(c => ({ label: shortLabel(who.dim, c.level), v: c.per1000, hi: c.level === who.level || (who2 && c.level === who2.level) })), { ref: t.per1000, fmt: perK });
      return res;
    }
    // one kind of group, or "who mentions X most"
    if (P.dim || P.intent === 'who') {
      res.readAs = [P.dim ? 'each ' + DIM_NAME[P.dim] + ' group' : 'every group', 'mentions of ' + t.name, 'all year'];
      if (!d) { res.title = 'Loading the figures for ' + t.name + ' failed. Try again.'; return res; }
      const rows = P.dim ? mGroupCells(d, P.dim).filter(c => c.per1000 != null).map(c => ({ dim: P.dim, level: c.level, v: c.per1000 }))
        : [].concat(...Object.keys(d.groups).map(dim => mGroupCells(d, dim).filter(c => c.per1000 != null).map(c => ({ dim, level: c.level, v: c.per1000 }))));
      if (rows.length < 2) { res.title = 'Too few groups mention ' + t.name + ' often enough to compare.'; return res; }
      const hi = rows.reduce((a, b) => (b.v > a.v ? b : a)), lo = rows.reduce((a, b) => (b.v < a.v ? b : a));
      res.title = flat(rows.map(r => r.v)) ? t.name + ': mentioned at similar rates across groups, from ' + perK(lo.v) + ' to ' + perK(hi.v) + ' conversations.'
        : t.name + ': mentioned most by ' + LEVEL[hi.dim][hi.level] + ', in ' + perK(hi.v) + ' conversations, against ' + perK(t.per1000) + ' for everyone.';
      if (!flat(rows.map(r => r.v))) res.body.push('The lowest rate is among ' + LEVEL[lo.dim][lo.level] + ', at ' + perK(lo.v) + '.');
      res.body.push('Groups are compared on their share of conversations, so people who use ChatGPT heavily count for more.');
      const shown = P.dim ? rows : rows.slice().sort((a, b) => b.v - a.v).slice(0, 8);
      res.chart = '<h3>' + esc(t.name) + (P.dim ? ', by ' + esc(DIM_NAME[P.dim]) : ': highest rates by group') + '</h3>' +
        barsHTML(shown.map(r => ({ label: P.dim ? shortLabel(r.dim, r.level) : cap(LEVEL[r.dim][r.level]), v: r.v, hi: r === hi })), { ref: t.per1000, fmt: perK });
      return res;
    }
    // "when do people mention X?": the profile over the year, the day and the week
    if (P.intent === 'when') {
      res.readAs = ['everyone', 'mentions of ' + t.name, 'by month, hour and day'];
      if (!d) { res.title = 'Loading the figures for ' + t.name + ' failed. Try again.'; return res; }
      const mv = MONTHS.map(k => ({ k, v: d.month[k] })).filter(x => x.v != null);
      const hv = Array.from({ length: 24 }, (_, h) => ({ h, v: d.hour[h] })).filter(x => x.v != null);
      const wv = [0, 1, 2, 3, 4, 5, 6].map(x => ({ x, v: d.wday[x] })).filter(x => x.v != null);
      const top = a => a.reduce((p, q) => (q.v > p.v ? q : p)), low = a => a.reduce((p, q) => (q.v < p.v ? q : p));
      res.title = mv.length < 2 ? t.name + ': too few mentions in most months to show a pattern.'
        : flat(mv.map(x => x.v)) ? t.name + ': mentions held steady through the year, at about ' + perK(t.per1000) + ' conversations.'
          : t.name + ': mentions peaked in ' + MONTH_NAME[top(mv).k] + ' (' + perK(top(mv).v) + ' conversations) and were lowest in ' + MONTH_NAME[low(mv).k] + ' (' + perK(low(mv).v) + ')' +
            (mv.length < MONTHS.length ? ', among the ' + mv.length + ' months with enough mentions to publish.' : '.');
      if (hv.length >= 2) res.body.push(flat(hv.map(x => x.v)) ? 'By hour, mentions vary little.' : 'By hour, they are most common around ' + hourLabel(top(hv).h) + ' (' + perK(top(hv).v) + ') and least common around ' + hourLabel(low(hv).h) + ' (' + perK(low(hv).v) + ').');
      if (wv.length >= 2) res.body.push(flat(wv.map(x => x.v)) ? 'They vary little by day of the week.' : 'By day, they are most common on ' + cap(DAY[top(wv).x]) + 's (' + perK(top(wv).v) + ').');
      res.body.push('Times are the panelist’s local time, from the state they live in.');
      res.chart = mChart(t.name + ', by month (per 1,000 conversations)', mMonthPoints(d)) +
        mChart(t.name + ', by hour of the day (per 1,000 conversations)',
          Array.from({ length: 24 }, (_, h) => ({ label: hourLabel(h), v: d.hour[h], hi: false, tick: [0, 6, 12, 18].includes(h) ? hourLabel(h) : '' })));
      return res;
    }
    // a time
    if (when) {
      res.readAs = ['everyone', 'mentions of ' + t.name, when.label];
      if (!d) { res.title = 'Loading the figures for ' + t.name + ' failed. Try again.'; return res; }
      const span = (vals, unit, ref) => fmtK(Math.min(...vals)) === fmtK(Math.max(...vals))
        ? 'mentioned in ' + perK(vals[0]) + ' conversations, ' + compareK(vals[0], t.per1000, ref)
        : 'mentioned in ' + perK(Math.min(...vals)) + ' to ' + perK(Math.max(...vals)) + ' conversations depending on the ' + unit + ', against ' + perK(t.per1000) + ' over ' + ref;
      if (when.kind === 'months') {
        const vals = when.value.map(k => d.month[k]).filter(v => v != null);
        if (!vals.length) res.title = 'Too few conversations mention ' + t.name + ' ' + when.label + ' to say.';
        else if (when.value.length === 1) res.title = t.name + ' ' + when.label + ': mentioned in ' + perK(vals[0]) + ' conversations, ' + compareK(vals[0], t.per1000, 'the whole year') + '.';
        else res.title = t.name + ' ' + when.label + ': ' + span(vals, 'month', 'the whole year') + '.';
        res.chart = mChart(t.name + ', by month (per 1,000 conversations)', mMonthPoints(d, new Set(when.value)));
      } else if (when.kind === 'hour' || when.kind === 'daypart') {
        const hs = when.kind === 'hour' ? [when.value] : Array.from({ length: 24 }, (_, h) => h).filter(h => dayPartOf(h) === when.value);
        const vals = hs.map(h => d.hour[h]).filter(v => v != null);
        res.title = !vals.length ? 'Too few conversations mention ' + t.name + ' ' + when.label + ' to say.'
          : hs.length === 1 ? t.name + ' ' + when.label + ': mentioned in ' + perK(vals[0]) + ' conversations, ' + compareK(vals[0], t.per1000, 'the whole day') + '.'
            : t.name + ' ' + when.label + ': ' + span(vals, 'hour', 'the whole day') + '.';
        res.chart = mChart(t.name + ', by hour of the day (per 1,000 conversations)',
          Array.from({ length: 24 }, (_, h) => ({ label: hourLabel(h), v: d.hour[h], hi: hs.includes(h), tick: [0, 6, 12, 18].includes(h) ? hourLabel(h) : '' })));
      } else {
        const ds = when.kind === 'wday' ? [when.value] : (when.value === 'weekend' ? [0, 6] : [1, 2, 3, 4, 5]);
        const vals = ds.map(x => d.wday[x]).filter(v => v != null);
        res.title = !vals.length ? 'Too few conversations mention ' + t.name + ' ' + when.label + ' to say.'
          : ds.length === 1 ? t.name + ' ' + when.label + ': mentioned in ' + perK(vals[0]) + ' conversations, ' + compareK(vals[0], t.per1000, 'the whole week') + '.'
            : t.name + ' ' + when.label + ': ' + span(vals, 'day', 'the whole week') + '.';
        res.chart = mChart(t.name + ', by day of the week (per 1,000 conversations)',
          [1, 2, 3, 4, 5, 6, 0].map(x => ({ label: cap(DAY[x]) + 's', v: d.wday[x], hi: ds.includes(x), tick: cap(DAY[x]).slice(0, 3) })));
      }
      return res;
    }
    // the term on its own
    res.readAs = ['everyone', 'mentions of ' + t.name, 'all year'];
    res.title = t.name + ': mentioned in ' + perK(t.per1000) + ' conversations (' + oneInK(t.per1000) + ').';
    res.body.push(ppFmt(t.pp) + ' of people in the study mentioned it at least once; those who did, in ' + t.cpp.toFixed(1) + ' conversations on average.');
    if (d) {
      const mv = MONTHS.map(k => ({ k, v: d.month[k] })).filter(x => x.v != null);
      if (mv.length >= 2) {
        const hi = mv.reduce((a, b) => (b.v > a.v ? b : a)), lo = mv.reduce((a, b) => (b.v < a.v ? b : a));
        res.body.push(flat(mv.map(x => x.v)) ? 'Mentions held steady through the year.'
          : 'Mentions peaked in ' + MONTH_NAME[hi.k] + ' (' + perK(hi.v) + ') and were lowest in ' + MONTH_NAME[lo.k] + ' (' + perK(lo.v) + ')' +
            (mv.length < MONTHS.length ? ', among the ' + mv.length + ' months with enough mentions to publish.' : '.'));
      }
      let best = null;                  // the kind of group with the widest spread
      Object.keys(d.groups).forEach(dim => {
        const cs = mGroupCells(d, dim).filter(c => c.per1000 != null);
        if (cs.length < 2) return;
        const vs = cs.map(c => c.per1000), sp = Math.max(...vs) / Math.min(...vs);
        if (!best || sp > best.sp) best = { dim, cs, sp };
      });
      if (best && !flat(best.cs.map(c => c.per1000))) {
        const hi = best.cs.reduce((a, b) => (b.per1000 > a.per1000 ? b : a)), lo = best.cs.reduce((a, b) => (b.per1000 < a.per1000 ? b : a));
        res.body.push('The biggest difference is by ' + DIM_NAME[best.dim] + ': ' + LEVEL[best.dim][hi.level] + ' mention it in ' + perK(hi.per1000) + ' conversations, ' + LEVEL[best.dim][lo.level] + ' in ' + perK(lo.per1000) + '.');
      }
      res.chart = mChart(t.name + ', by month (per 1,000 conversations)', mMonthPoints(d)) +
        (best ? '<h3>' + esc(t.name) + ', by ' + esc(DIM_NAME[best.dim]) + '</h3>' +
          barsHTML(best.cs.map(c => ({ label: shortLabel(best.dim, c.level), v: c.per1000 })), { ref: t.per1000, fmt: perK }) : '');
    }
    res.more.push(['Who mentions ' + t.name + ' most?', 'Who mentions ' + t.name + ' most?']);
    res.links = [['Compare ' + t.name + ' with other terms', '../trends/?t=' + t.id]];
    return res;
  }

  function mentionCompare(res, ts, who) {
    const ds = ts.map(t => MDET[t.id]);
    const names = andList(ts.map(t => t.name));
    if (who) {
      res.readAs = [whoLabel(who), 'mentions of ' + names, 'all year'];
      const vals = ts.map((t, i) => { const c = mGroupCells(ds[i], who.dim).find(c => c.level === who.level); return c ? c.per1000 : null; });
      res.title = 'Mentions per 1,000 conversations among ' + whoLabel(who) + ': ' + andList(ts.map((t, i) => t.name + ' ' + (vals[i] == null ? '(not shown)' : fmtK(vals[i])))) + '.';
      res.chart = '<h3>Mentions per 1,000 conversations, ' + esc(whoLabel(who)) + '</h3>' +
        barsHTML(ts.map((t, i) => ({ label: t.name, v: vals[i] || 0 })), { fmt: perK });
    } else {
      res.readAs = ['everyone', 'mentions of ' + names, 'all year'];
      res.title = 'Mentions per 1,000 conversations over the year: ' + andList(ts.map(t => t.name + ' ' + fmtK(t.per1000))) + '.';
      res.body.push('Share of people who mentioned each at least once: ' + andList(ts.map(t => t.name + ' ' + ppFmt(t.pp))) + '.');
      if (ds.every(d => d)) {
        const peaks = ts.map((t, i) => { const mv = MONTHS.filter(k => ds[i].month[k] != null); return mv.length ? t.name + ' in ' + MONTH_NAME[mv.reduce((a, b) => (ds[i].month[b] > ds[i].month[a] ? b : a))] : null; }).filter(Boolean);
        if (peaks.length) res.body.push('Peak months: ' + andList(peaks) + '.');
      }
      res.chart = (ds.every(d => d) ? '<h3>Mentions per 1,000 conversations, by month</h3>' + linesSVG(ts.map((t, i) => ({
        name: t.name, values: MONTHS.map(k => ds[i].month[k]),
        low: MONTHS.map(k => (ds[i].month_low || []).includes(k)), held: MONTHS.map(k => (ds[i].month_held || []).includes(k)) })), { floor: monthFloors('conv') }) : '') +
        '<h3>Over the whole year</h3>' + barsHTML(ts.map(t => ({ label: t.name, v: t.per1000 })), { fmt: perK });
    }
    res.links = [['Open this comparison in Trends', '../trends/?t=' + ts.map(t => t.id).join(',')]];
    return res;
  }

  /* -------------------------------------------------------------- answers */

  function answer(question) {
    const P = parse(question);
    const res = { readAs: [], notes: P.notes.slice(), title: '', body: [], chart: '', more: [] };
    if (P.minors) {                     // never answer for everyone in place of a question about minors
      res.title = 'Questions about teenagers or children cannot be answered here.';
      res.body.push('This site covers adults only: conversations by people 18 and over. Try the same question about adults, such as people aged 18 to 24 or students.');
      res.more = [['What do people aged 18 to 24 ask about?', 'What do people aged 18 to 24 ask about?'], ['What do students ask at night?', 'What do students ask at night?']];
      return res;
    }

    // Mentions of a named term (a person, a place, a product...) take precedence.
    const mids = mentionRoute(P);
    if (mids.length) return mentionAnswer(res, P, mids);

    let who = P.who[0] || null, who2 = null;
    if (P.who.length > 1) {
      // two groups of the same kind (women and men) can be compared; two kinds cannot be combined
      if (P.who[1].dim === who.dim) who2 = P.who[1];
      const dropped = P.who.slice(who2 ? 2 : 1).map(whoLabel);
      if (dropped.length) res.notes.push('The data cannot combine two kinds of group, so this shows ' + whoLabel(who) + (who2 ? ' and ' + whoLabel(who2) : '') + ' and leaves out ' + dropped.join(' and ') + '.');
    }
    let what = P.what[0] || null;
    if (P.what.length > 1) res.notes.push('Showing ' + measureName(what) + '; the question also mentioned ' + P.what.slice(1).map(measureName).join(' and ') + '. Ask about one subject at a time.');
    let why = P.why[0] || null;
    if (P.why.length > 1) res.notes.push('Showing ' + measureName(why) + ' only.');
    let when = P.when[0] || null;
    if (P.when.length > 1) res.notes.push('Showing ' + when.label + ' only.');
    if (what === 'pol') {
      const t = val(everyone(), POL_TOPIC);
      res.notes.push('Politics here means any conversation involving government, policy, law, elections or public figures, including people’s own dealings with government such as taxes or benefits. ' +
        (t != null ? 'Counted only when politics is the main subject, as in the lists of subjects, the share for everyone is ' + pct(t) + '. ' : '') + 'See the politics report.');
    }

    // A purpose with a subject: subjects within the purpose (everyone only).
    if (why && what) {
      if (who || when) res.notes.push('A subject within a purpose can only be shown for everyone, at any time.');
      const w = DATA.within[why];
      const v = w && w.s[what] != null ? w.s[what] : null;
      res.readAs = ['everyone', measureName(what), 'conversations ' + measureVerb(why).replace(/^are /, '')];
      if (v == null) { res.title = 'Too few conversations to say.'; return res; }
      res.title = cap(measureName(what)) + ' is the main subject of ' + pct(v) + ' of conversations that ' + measureVerb(why) + ' (' + oneIn(v) + ').';
      const top = Object.keys(w.s).filter(k => k !== 'unclear' && k !== 'other').map(k => ({ k, v: w.s[k] })).sort((a, b) => b.v - a.v).slice(0, 8);
      res.chart = '<h3>Main subjects of conversations that ' + esc(measureVerb(why)) + '</h3>' +
        barsHTML(top.map(t => ({ label: cap(DATA.measures[t.k]), v: t.v, hi: t.k === what })));
      return res;
    }
    const m = what || why;

    // Nothing to measure.
    if (!m) {
      if (who && when) return groupTimeTop(res, who, when);
      if (who) return groupTop(res, who);
      if (when) return timeTop(res, when);
      if (P.dim) {
        res.title = 'Name a subject to see how it varies by ' + DATA.dims[P.dim].toLowerCase() + '.';
        res.body.push('For example: does health vary by ' + DATA.dims[P.dim].toLowerCase() + '?');
        res.more.push(['Health by ' + DATA.dims[P.dim].toLowerCase(), 'Health by ' + DATA.dims[P.dim].toLowerCase()]);
        return res;
      }
      res.title = P.minors ? 'Try asking about adults.' : 'We could not match that question to the data.';
      res.body.push('Try naming a subject (health, money, recipes, politics), a group of people (women, retirees, people in the South) or a time (at night, on weekends, in December).');
      if (!P.minors) res.body.push('Specific names (people, places, products, shows) are answered only for the terms on our list, which you can browse on the Trends page. A name that is not on the list may still come up in the conversations; it simply has not been added to this site.');
      res.more = SUGGEST.slice(0, 4);
      return res;
    }

    // A measure across one kind of group ("does income matter for politics?").
    if (P.dim && !who) {
      if (when) res.notes.push('Groups can be compared only over the whole year; the time was left out.');
      return byDim(res, m, P.dim);
    }

    // A measure with a group and a time: only dayparts and weekparts exist by group.
    if (who && when) {
      const c = groupTime(who.dim, who.level, when);
      if (!c) {
        res.notes.push('Times can be combined with a group only as morning, afternoon, evening, night, weekdays or weekends; the time was left out.');
        when = null;
      } else {
        const v = val(c, m), base = val(cell(who.dim, who.level), m);
        res.readAs = [whoLabel(who), measureName(m), when.label];
        if (v == null) { res.title = 'Too few conversations to say.'; res.body.push('There are not enough conversations from ' + whoLabel(who) + ' ' + when.label + ' to publish this figure.'); return res; }
        res.title = cap(when.label) + ', ' + pct(v) + ' of conversations by ' + whoLabel(who) + ' ' + measureVerb(m) + ' (' + oneIn(v) + ').';
        res.body.push('At all times of day, the figure for ' + whoLabel(who) + ' is ' + pct(base) + '.');
        if (m === 'pol' && val(c, POL_TOPIC) != null) res.body.push(polMain(val(c, POL_TOPIC)));
        const keys = when.kind === 'daypart' ? ['morning', 'afternoon', 'evening', 'night'] : ['weekday', 'weekend'];
        const list = DATA.group_time[who.dim][when.kind];
        res.chart = '<h3>' + esc(cap(measureName(m))) + ' for ' + esc(whoLabel(who)) + ', by time</h3>' +
          barsHTML(keys.map(k => { const cc = list.find(x => x.level === who.level && x.key === k); return { label: cap(k), v: val(cc, m) || 0, hi: k === when.value }; }), { ref: base, refLabel: 'All times' });
        return res;
      }
    }

    // A measure with a group.
    if (who) {
      const c = cell(who.dim, who.level), v = val(c, m), base = val(everyone(), m);
      res.readAs = [whoLabel(who), measureName(m), 'all year'];
      if (who2) {
        const v2 = val(cell(who2.dim, who2.level), m);
        res.readAs = [whoLabel(who) + ' and ' + whoLabel(who2), measureName(m), 'all year'];
        if (v == null || v2 == null) {
          res.title = 'This comparison is not published.';
          res.body.push('One of the two groups has too few conversations on this, or a handful of people supply most of them.');
        } else {
          res.title = cap(whoLabel(who)) + ': ' + pct(v) + ' of their conversations ' + measureVerb(m) + '; ' + whoLabel(who2) + ': ' + pct(v2) + '.';
          const rel = v / v2;
          res.body.push((rel >= 0.95 && rel <= 1.05) || pct(v) === pct(v2) ? 'The two shares are about the same. Across everyone it is ' + pct(base) + '.'
            : rel > 1 ? 'The share for ' + whoLabel(who) + ' is ' + rel.toFixed(1) + ' times the share for ' + whoLabel(who2) + '. Across everyone it is ' + pct(base) + '.'
              : 'The share for ' + whoLabel(who2) + ' is ' + (1 / rel).toFixed(1) + ' times the share for ' + whoLabel(who) + '. Across everyone it is ' + pct(base) + '.');
          const t1 = val(cell(who.dim, who.level), POL_TOPIC), t2 = val(cell(who2.dim, who2.level), POL_TOPIC);
          if (m === 'pol' && t1 != null && t2 != null) res.body.push('Counted only when politics is the main subject: ' + whoLabel(who) + ' ' + pct(t1) + ', ' + whoLabel(who2) + ' ' + pct(t2) + '.');
        }
        const lv2 = (DATA.groups[who.dim] || []);
        res.chart = '<h3>' + esc(cap(measureName(m))) + ', by ' + esc(DATA.dims[who.dim].toLowerCase()) + '</h3>' +
          barsHTML(lv2.filter(l => val(l, m) != null).map(l => ({ label: shortLabel(who.dim, l.level), v: val(l, m), hi: l.level === who.level || l.level === who2.level })), { ref: base });
        return res;
      }
      if (v == null) {
        res.title = 'This figure is not published for ' + whoLabel(who) + '.';
        res.body.push('Either the group has too few conversations on this, or a handful of people supply most of them, which would make the figure misleading.');
      } else {
        res.title = cap(whoLabel(who)) + ': ' + pct(v) + ' of their conversations ' + measureVerb(m) + ' (' + oneIn(v) + '), ' + compareWords(v, base) + '.';
        if (m === 'pol' && val(c, POL_TOPIC) != null) res.body.push(polMain(val(c, POL_TOPIC)));
      }
      const levels = (DATA.groups[who.dim] || []);
      res.chart = '<h3>' + esc(cap(measureName(m))) + ', by ' + esc(DATA.dims[who.dim].toLowerCase()) + '</h3>' +
        barsHTML(levels.filter(l => val(l, m) != null).map(l => ({ label: shortLabel(who.dim, l.level), v: val(l, m), hi: l.level === who.level })), { ref: base });
      res.more.push(['Who asks about ' + measureName(m) + ' the most?', 'Who asks about ' + measureName(m) + ' the most?']);
      res.more.push(['What do ' + whoLabel(who) + ' ask about?', 'What do ' + whoLabel(who) + ' ask about?']);
      return res;
    }

    // A measure at a time.
    if (when) {
      const cs = whenCells(when), v = combine(cs, m), base = val(everyone(), m);
      res.readAs = ['everyone', measureName(m), when.label];
      if (v == null) { res.title = 'Too few conversations to say.'; return res; }
      res.title = cap(when.label) + ', ' + pct(v) + ' of conversations ' + measureVerb(m) + ' (' + oneIn(v) + '), ' + compareWords(v, base).replace('everyone', 'the whole year') + '.';
      if (m === 'pol' && combine(cs, POL_TOPIC) != null) res.body.push(polMain(combine(cs, POL_TOPIC)));
      if (when.kind === 'hour' || when.kind === 'daypart') {
        const hs = when.kind === 'hour' ? new Set([when.value]) : new Set(DATA.time.hour.map(c => +c.key).filter(h => dayPartOf(h) === when.value));
        res.chart = '<h3>' + esc(cap(measureName(m))) + ', by hour of the day</h3>' + columnsSVG(hourPoints(m, hs), { aria: 'Share by hour of the day' });
      } else if (when.kind === 'months') {
        res.chart = '<h3>' + esc(cap(measureName(m))) + ', by month</h3>' + columnsSVG(monthPoints(m, new Set(when.value)), { aria: 'Share by month' });
      } else {
        const ds = when.kind === 'wday' ? new Set([when.value]) : new Set(when.value === 'weekend' ? [0, 6] : [1, 2, 3, 4, 5]);
        res.chart = '<h3>' + esc(cap(measureName(m))) + ', by day of the week</h3>' + columnsSVG(dayPoints(m, ds), { aria: 'Share by day of the week' });
      }
      return res;
    }

    // A measure alone: who asks most, or when, or a summary of both.
    const base = val(everyone(), m);
    res.readAs = ['everyone', measureName(m), 'all year'];
    if (base == null) { res.title = 'Too few conversations to say.'; return res; }
    const ranked = rankGroups(m);
    if (P.intent === 'who' || P.intent === 'compare') {
      const top = ranked.slice(0, 8);
      res.title = 'Of the groups we can show, ' + LEVEL[top[0].dim][top[0].level] + ' ' + (m.startsWith('p_') || m === 'pol' ? 'have the highest share of conversations that ' + measureVerb(m) : 'bring up ' + measureName(m) + ' most') +
        ': ' + pct(top[0].v) + ' of their conversations, against ' + pct(base) + ' for everyone.';
      const low = ranked[ranked.length - 1];
      res.body.push('The lowest is ' + LEVEL[low.dim][low.level] + ', at ' + pct(low.v) + '.');
      res.body.push('Groups are compared on their share of conversations, so people who use ChatGPT heavily count for more. Figures that rest on a handful of people are withheld.');
      res.chart = '<h3>Highest shares of conversations that ' + esc(measureVerb(m)) + '</h3>' +
        barsHTML(top.map(r => ({ label: cap(LEVEL[r.dim][r.level]), v: r.v })), { ref: base });
      return res;
    }
    // The peak hour is read from a three-hour running average, so one noisy
    // small-hours value cannot make the claim; the share quoted is that hour's own.
    const hv = {};
    DATA.time.hour.forEach(c => { const v = val(c, m); if (v != null) hv[+c.key] = v; });
    const smooth = h => { const xs = [h - 1, h, h + 1].map(k => hv[(k + 24) % 24]).filter(v => v != null); return xs.reduce((a, b) => a + b, 0) / xs.length; };
    const hrs = Object.keys(hv).map(Number).map(h => ({ h, v: hv[h], s: smooth(h) })).sort((a, b) => b.s - a.s);
    const mons = MONTHS.map(k => ({ k, v: val(timeCell('months', k), m) })).filter(x => x.v != null).sort((a, b) => b.v - a.v);
    const days = [0, 1, 2, 3, 4, 5, 6].map(d => ({ d, v: val(timeCell('wday', d), m) })).filter(x => x.v != null).sort((a, b) => b.v - a.v);
    if (P.intent === 'when') {
      res.title = flat(hrs.map(x => x.s)) ? cap(measureName(m)) + ' varies little across the day, staying near ' + pct(base) + ' of conversations.'
        : cap(measureName(m)) + ' peaks around ' + hourLabel(hrs[0].h) + ', at ' + pct(hrs[0].v) + ' of conversations, against ' + pct(base) + ' across the day.';
      res.body.push((flat(days.map(x => x.v)) ? 'It varies little by day of the week' : 'By day it is highest on ' + cap(DAY[days[0].d]) + 's (' + pct(days[0].v) + ')') +
        (flat(mons.map(x => x.v)) ? '; it varies little by month.' : '; by month, it is highest in ' + MONTH_NAME[mons[0].k] + ' (' + pct(mons[0].v) + ').'));
      res.body.push('Times are the panelist’s local time, from the state they live in.');
      res.chart = '<h3>' + esc(cap(measureName(m))) + ', by hour of the day</h3>' + columnsSVG(hourPoints(m, new Set([hrs[0].h])), { aria: 'Share by hour of the day' }) +
        '<h3>By month</h3>' + columnsSVG(monthPoints(m, new Set([mons[0].k])), { aria: 'Share by month' });
      return res;
    }
    const pp = everyone().pp && everyone().pp[m] != null ? everyone().pp[m] : null;
    res.title = pct(base) + ' of conversations ' + measureVerb(m) + ' (' + oneIn(base) + ').';
    if (pp != null) res.body.push(pp.toFixed(0) + '% of people in the study had at least one such conversation during the year.');
    if (ranked.length) res.body.push('The highest share is among ' + LEVEL[ranked[0].dim][ranked[0].level] + ' (' + pct(ranked[0].v) + '). ' + (flat(hrs.map(x => x.s)) ? 'The share varies little by hour' : 'By hour, the share peaks around ' + hourLabel(hrs[0].h)) +
      (flat(mons.map(x => x.v)) ? ' and little by month.' : '; by month, it is highest in ' + MONTH_NAME[mons[0].k] + '.'));
    res.chart = '';
    // a purpose: what those conversations are about
    if (m.startsWith('p_') && DATA.within[m]) {
      const w = DATA.within[m].s;
      const top = Object.keys(w).filter(k => k !== 'unclear' && k !== 'other').map(k => ({ k, v: w[k] })).sort((a, b) => b.v - a.v).slice(0, 8);
      if (top.length >= 3) res.body.push('Their most common main subjects are ' + andList(top.slice(0, 3).map(t => DATA.measures[t.k] + ' (' + pct(t.v) + ')')) + '.');
      res.chart += '<h3>Main subjects of conversations that ' + esc(measureVerb(m)) + '</h3>' + barsHTML(top.map(t => ({ label: cap(DATA.measures[t.k]), v: t.v })));
    }
    res.chart += '<h3>' + esc(cap(measureName(m))) + ', by hour of the day</h3>' + columnsSVG(hourPoints(m, new Set([hrs[0].h])), { aria: 'Share by hour of the day' });
    res.more.push(['Who asks about ' + measureName(m) + ' the most?', 'Who asks about ' + measureName(m) + ' the most?']);
    res.more.push(['When do people ask about ' + measureName(m) + '?', 'When do people ask about ' + measureName(m) + '?']);
    return res;
  }

  function byDim(res, m, dim) {
    const base = val(everyone(), m), dname = DATA.dims[dim].toLowerCase();
    const rows = (DATA.groups[dim] || []).filter(c => LEVEL[dim][c.level]).map(c => ({ level: c.level, v: val(c, m) })).filter(x => x.v != null);
    res.readAs = ['each ' + dname + ' group', measureName(m), 'all year'];
    if (rows.length < 2) { res.title = 'Too few groups have enough conversations to compare.'; return res; }
    const hi = rows.reduce((a, b) => (b.v > a.v ? b : a)), lo = rows.reduce((a, b) => (b.v < a.v ? b : a));
    res.title = flat(rows.map(r => r.v))
      ? 'The share of conversations that ' + measureVerb(m) + ' varies little by ' + dname + ', from ' + pct(lo.v) + ' to ' + pct(hi.v) + '.'
      : 'By ' + dname + ', the share of conversations that ' + measureVerb(m) + ' is highest among ' + LEVEL[dim][hi.level] + ' (' + pct(hi.v) + ') and lowest among ' + LEVEL[dim][lo.level] + ' (' + pct(lo.v) + ').';
    res.body.push('Across everyone it is ' + pct(base) + '. Groups are compared on their share of conversations, so people who use ChatGPT heavily count for more.');
    if (rows.length < (DATA.groups[dim] || []).filter(c => LEVEL[dim][c.level]).length) res.body.push('Groups with too few conversations on this are not shown.');
    res.chart = '<h3>' + esc(cap(measureName(m))) + ', by ' + esc(dname) + '</h3>' +
      barsHTML(rows.map(r => ({ label: shortLabel(dim, r.level), v: r.v, hi: r.level === hi.level })), { ref: base });
    res.more.push(['Who asks about ' + measureName(m) + ' the most?', 'Who asks about ' + measureName(m) + ' the most?']);
    return res;
  }

  function dayPartOf(h) { return h >= 5 && h <= 11 ? 'morning' : h >= 12 && h <= 16 ? 'afternoon' : h >= 17 && h <= 21 ? 'evening' : 'night'; }

  function groupTop(res, who) {
    const c = cell(who.dim, who.level), ref = everyone();
    res.readAs = [whoLabel(who), 'any subject', 'all year'];
    if (!c || !c.shown) { res.title = 'This group is too small to show.'; return res; }
    const top = topMeasures(c, ref, 8), over = overIndexed(c, ref, 3);
    res.title = cap(whoLabel(who)) + ' ask most about ' + andList(top.slice(0, 3).map(t => DATA.measures[t.k] + ' (' + pct(t.v) + ')')) + '.';
    res.body.push(over.length ? 'Compared with everyone, they ask more often about ' + andList(over.map(o => DATA.measures[o.k] + ' (' + o.ratio.toFixed(1) + ' times as often)')) + '.'
      : 'No subject stands out: none is as much as 1.2 times as common as it is for everyone.');
    res.chart = '<h3>Main subjects of conversations by ' + esc(whoLabel(who)) + '</h3><p class="abnote">Gray marks show everyone.</p>' + barsMarked(top.map(t => ({ label: cap(DATA.measures[t.k]), v: t.v, r: t.r })));
    return res;
  }
  function groupTimeTop(res, who, when) {
    const c = groupTime(who.dim, who.level, when);
    if (!c) { res.notes.push('Times can be combined with a group only as morning, afternoon, evening, night, weekdays or weekends; the time was left out.'); return groupTop(res, who); }
    const ref = cell(who.dim, who.level);
    res.readAs = [whoLabel(who), 'any subject', when.label];
    if (!c.shown) { res.title = 'Too few conversations to say.'; return res; }
    const top = topMeasures(c, ref, 8), over = overIndexed(c, ref, 3);
    res.title = cap(when.label) + ', ' + whoLabel(who) + ' ask most about ' + andList(top.slice(0, 3).map(t => DATA.measures[t.k] + ' (' + pct(t.v) + ')')) + '.';
    res.body.push(over.length ? 'Compared with their conversations at other times, ' + andList(over.map(o => DATA.measures[o.k] + ' (' + o.ratio.toFixed(1) + ' times as often)')) + (over.length === 1 ? ' stands out.' : ' stand out.')
      : 'No subject stands out: none is as much as 1.2 times as common as at other times.');
    res.chart = '<h3>Main subjects, ' + esc(whoLabel(who)) + ' ' + esc(when.label) + '</h3><p class="abnote">Gray marks show the same group at all times.</p>' + barsMarked(top.map(t => ({ label: cap(DATA.measures[t.k]), v: t.v, r: t.r })));
    return res;
  }
  function timeTop(res, when) {
    const cs = whenCells(when);
    if (cs.some(c => !c)) { res.title = 'There is no data for that time.'; return res; }
    const codes = Object.keys(DATA.measures).filter(k => !k.startsWith('p_') && k !== 'pol' && k !== 'unclear' && k !== 'other');
    const rows = codes.map(k => ({ k, v: combine(cs, k), r: val(everyone(), k) })).filter(x => x.v != null);
    const top = rows.slice().sort((a, b) => b.v - a.v).slice(0, 8);
    const over = rows.filter(x => x.v >= 1 && x.r).map(x => Object.assign(x, { ratio: x.v / x.r })).filter(x => x.ratio >= STANDOUT)
      .sort((a, b) => b.ratio - a.ratio).slice(0, 3);
    res.readAs = ['everyone', 'any subject', when.label];
    res.title = cap(when.label) + ', people ask most about ' + andList(top.slice(0, 3).map(t => DATA.measures[t.k] + ' (' + pct(t.v) + ')')) + '.';
    res.body.push(over.length ? 'Compared with the year as a whole, ' + andList(over.map(o => DATA.measures[o.k] + ' (' + o.ratio.toFixed(1) + ' times as often)')) + (over.length === 1 ? ' stands out.' : ' stand out.')
      : 'No subject stands out: none is as much as 1.2 times as common as across the whole year.');
    res.chart = '<h3>Main subjects ' + esc(when.label) + '</h3><p class="abnote">Gray marks show the whole year.</p>' + barsMarked(top.map(t => ({ label: cap(DATA.measures[t.k]), v: t.v, r: t.r })));
    return res;
  }
  function barsMarked(rows) {
    const max = Math.max(...rows.map(r => Math.max(r.v, r.r || 0))) * 1.12 || 1;
    return '<div class="abars">' + rows.map(r => '<div class="abrow"><span class="ablabel">' + esc(r.label) + '</span><span class="abtrack"><span class="abfill" style="width:' +
      (r.v / max * 100).toFixed(2) + '%"></span>' + (r.r != null ? '<span class="abref" style="left:' + (r.r / max * 100).toFixed(2) + '%"></span>' : '') +
      '</span><span class="abval">' + pct(r.v) + '</span></div>').join('') + '</div>';
  }

  const SUGGEST = [
    ['Do older people ask more about health?', 'Do older people ask more about health?'],
    ['What do students ask at night?', 'What do students ask at night?'],
    ['How do people use ChatGPT for work?', 'How do people use ChatGPT for work?'],
    ['Who asks about money the most?', 'Who asks about money the most?'],
    ['When do people ask about recipes?', 'When do people ask about recipes?'],
    ['What do people ask about in December?', 'What do people ask about in December?'],
    ['Do women ask more about relationships than men?', 'Do women ask more about relationships than men?'],
    ['What do retirees ask about?', 'What do retirees ask about?'],
    ['How often do people mention Taylor Swift?', 'How often do people mention Taylor Swift?'],
    ['Compare Trump, Musk and Biden', 'Compare Trump, Musk and Biden'],
    ['When do people mention Christmas?', 'When do people mention Christmas?'],
    ['Who mentions Ozempic most?', 'Who mentions Ozempic most?']
  ];

  /* -------------------------------------------------------------- render */

  function render(root, question, askBase) {
    const r = answer(question);
    const link = q => askBase + '?q=' + encodeURIComponent(q);
    let h = '';
    if (r.readAs.length) h += '<p class="readas">Read as <span>' + r.readAs.map(esc).join('</span> · <span>') + '</span></p>';
    r.notes.forEach(n => { h += '<p class="anote">' + esc(n) + '</p>'; });
    h += '<h2 class="atitle">' + esc(r.title) + '</h2>';
    r.body.forEach(b => { h += '<p class="abody">' + esc(b) + '</p>'; });
    if (r.chart) h += '<div class="achart">' + r.chart + '</div>';
    if (r.links && r.links.length) h += '<p class="alinks">' + r.links.map(l => '<a href="' + esc(l[1]) + '">' + esc(l[0]) + ' →</a>').join(' ') + '</p>';
    const more = r.more.length ? r.more : SUGGEST.filter(s => s[1] !== question).slice(0, 3);
    h += '<div class="amore"><p>Try another</p>' + more.map(s => '<a href="' + esc(link(s[1])) + '">' + esc(s[0]) + '</a>').join('') + '</div>';
    root.innerHTML = h;
    return r;
  }

  function load(dataBase) {
    MBASE = dataBase;
    const ix = fetch(dataBase + 'mentions_index.json').then(x => (x.ok ? x.json() : null)).then(m => { if (m) setMentions(m); }).catch(() => {});
    return Promise.all([fetch(dataBase + 'ask.json').then(x => { if (!x.ok) throw new Error(x.status); return x.json(); }).then(d => { DATA = d; return d; }), ix])
      .then(r => r[0]);
  }
  function loadTerm(id) {               // one term's detail file, cached
    if (MDET[id]) return Promise.resolve(MDET[id]);
    return fetch(MBASE + 'mentions/' + id + '.json').then(x => (x.ok ? x.json() : null)).then(d => { if (d) MDET[id] = d; return d; }).catch(() => null);
  }
  // Fetch whatever a question will need, so render() can stay synchronous.
  function prepare(question) { return Promise.all(mentionRoute(parse(question)).map(loadTerm)); }

  window.PromptAsk = { load, prepare, loadTerm, parse, answer, render, SUGGEST, linesSVG, monthFloors, perK, fmtK, oneInK, ppFmt,
    mentions: () => MENT, termDetail: id => MDET[id], months: () => MONTHS, monthName: k => MONTH_NAME[k] };
})();
