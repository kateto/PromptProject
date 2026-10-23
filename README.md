# State of the Prompt

*A year of everyday exchanges with AI*

State of the Prompt is a Rutgers University research project on how Americans use conversational AI for information and advice, from following the news to navigating health, work, and family life. This repository holds the project's public website, at **https://kateto.github.io/PromptProject/**.

## Why it matters

While Americans increasingly get information from conversational AI, these exchanges tend to remain private. Unlike news broadcasts or social media feeds, the content of AI chats is largely unavailable to journalists, regulators, and researchers. We look at who uses AI for what, how that differs by age, education, income, and region, and how these patterns shifted over a year in which conversational AI became part of daily routines for many Americans.

## The data

Through a collaboration with MFour Data Research, the project draws on ChatGPT conversations from 73,852 members of a US consumer research panel, who agreed to share their conversations through the panel's app. The conversations span July 2025 to June 2026. For most panelists, they are linked to a self-reported profile that includes age, gender, education, income, race and ethnicity, and state of residence.

The panel is not a random sample of the country, so our analyses focus on comparisons between groups rather than on national estimates. Language models sort the conversations by subject, purpose, and political content, and a topic model adds a finer map of recurring themes. Where possible, we check the models' judgments against conversations coded by members of the team.

## What the site offers

- **Insights**: short findings on what people ask AI, and when.
- **Reports**: longer write-ups on particular subjects, starting with politics and health.
- **Explore**: a dashboard of who asks about what, by group.
- **Ask the data**: questions in plain words, answered from published totals. Questions are answered in the visitor's browser and are never sent anywhere.
- **Trends**: how often people mention particular people, places, products, and other terms, month by month and across groups.

## Privacy

The conversations are often deeply personal, and the full text stays on secure university systems, available only to the research team under a license that permits research use at Rutgers. Everything on the site is an aggregate describing a group of people, never an individual, and no conversation is ever shown or quoted. The figures cover adults only. A figure is withheld when it rests on too few conversations or too few people, or when a handful of people account for most of it. This repository contains no conversation text, no panelist or conversation identifiers, and no individual-level data.

## Team

- **Katherine Ognyanova**, Professor of Communication (project lead)
- **Kiran Garimella**, Assistant Professor of Library and Information Science (project lead)
- **Mark Aakhus**, Professor of Communication
- **Shagun Jhaver**, Assistant Professor of Library and Information Science
- **Eu Gene Lee**, Assistant Professor of Communication
- **Jianing Li**, Assistant Professor of Communication
- **Sarah Shugars**, Assistant Professor of Communication

All are at the School of Communication and Information, Rutgers University. The project works with the [Rutgers Computational Social Science Lab](https://csslab.rutgers.edu/) and the [National AI Opinion Monitor](https://naiom.net/).

## Contact

For questions about the project, press inquiries, or collaboration, use the contact form on the site's About page.

## About this repository

The site is plain HTML, CSS, and JavaScript served by GitHub Pages, with no build step. The aggregate figures in `data/` are produced by the project's analysis code, which runs on the secure systems that hold the conversations and is not part of this repository.

## The question box

The box on the home page and on Ask the data (`assets/ask-search.js`, `assets/ask-search.css`) offers whole questions while you type, grouped by what the next words could be (people, subjects, times, purposes, mentions), plus questions from a pool that match the typed words; an empty box offers six questions to try, and the placeholder rotates through the pool. Arrow keys move, Enter takes a completion into the box, Enter on a question asks it, Escape closes. Small typos in a typed word still find the phrase.

Everything the box offers comes from `data/questions.json`, built by

```
node tools/build_questions.mjs
```

which runs every candidate question through this site's own parser and answer code (`assets/ask.js`, loaded headless) and keeps only those that read as intended and answer from published figures. Rerun it after `data/ask.json` or `assets/ask.js` changes. `node tools/test_search.mjs` checks the completion logic. The parser and the answers are not changed by any of this; the box only helps write a question they read well.

### Merged question reading

On Ask the data, a question is read twice. Mentions keep first say: a question about a named term (Ozempic, Bitcoin, Taylor Swift, Texas) goes to this site's own router untouched. For everything else `assets/ask-reader.js` (a lexicon parser with synonyms, occupations, typo correction, purpose and time words, built from the `claude_website` project by `claude_website/site/tools/build_reader.sh`) reads the question into groups, subject, time and purpose over this site's vocabulary and writes a question this site's parser reads with certainty; `assets/ask-merge.js` decides which reading is used. The reader takes over only when it reads strictly more of the question than this site's parser did (a typo fixed, a purpose or group that was missed); otherwise this site's own reading stands. Notes above the answer say what was corrected, converted (an hour becomes its part of the day for a group) or left out (a group this site has no figures for, such as an industry or a state). The answer code and the figures are untouched. `node tools/test_merge.mjs` runs a battery of questions through the merged reading and checks that no question in the pool changes its reading.
