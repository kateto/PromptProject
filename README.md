# State of the Prompt

The public website of a Rutgers University study of how people use AI in everyday life, based on a year of ChatGPT conversations shared by a US research panel (July 2025 to June 2026).

The site is plain HTML, CSS and JavaScript with no build step, so GitHub Pages can serve it as is. Every number it shows is an aggregate computed on the project's secure systems. **No conversation text, no panelist or conversation ids, and no row-level data are in this repository, and none may ever be added.**

## What is in the folder

| path | what it is |
|---|---|
| `index.html` | home page: the hour dial, Ask the data, insights, the year chart, the subject waffle, reports |
| `ask/` | answers to typed questions (the "Ask the data" engine; see below) |
| `trends/` | compare how often people mention up to five terms, by month and by group (preview; see "Mentions") |
| `explore/` | the dashboard: who asks about what, by group |
| `reports/` | the report list, and one folder per report |
| `about/` | the project, the team, and the contact form |
| `assets/` | logo, favicon, team photos, and the Ask engine (`ask.js`) |
| `assets/logo-alternatives/` | the two other logo candidates (see "Changing the logo") |
| `data/` | the aggregate files the pages read (see "Updating the numbers") |
| `404.html` | page shown for a broken link |
| `.nojekyll` | tells GitHub Pages to serve the files as they are |

## Who is in the figures

Every figure covers **adults only**: conversations by panelists who had a demographic profile and were 18 or older on the day the conversation began. Conversations that panelists had before their 18th birthday are excluded, as are panelists with no recorded age. Age groups (18 to 24, 25 to 34, and so on) use each panelist's age in July 2026, when the demographic profile was taken, the same convention as the project's other tables. The population is stated on the About page and in each report.

## Publishing on GitHub Pages

1. Push this folder to a GitHub repository (public repositories get Pages for free; a private one needs a paid plan).
2. In the repository, open **Settings → Pages**. Under "Build and deployment", choose **Deploy from a branch**, then branch `main` and folder `/ (root)`. Save.
3. After a minute or two the site is live at `https://<account>.github.io/<repository>/`. All links in the site are relative, so it works there and on a custom domain without changes.

## Pointing a domain at it

1. Buy the domain (Cloudflare, Namecheap, Porkbun and others all work).
2. At the domain company, add these DNS records (GitHub's current list is in its documentation, "Managing a custom domain for your GitHub Pages site"):
   - four `A` records for the bare domain: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - one `CNAME` record for `www`, pointing to `<account>.github.io`
3. In **Settings → Pages → Custom domain**, enter the domain and save. GitHub adds a `CNAME` file to the repository; keep it.
4. Tick **Enforce HTTPS** once GitHub has issued the certificate (usually within an hour).

Visitors then see only your domain; the github.io address redirects to it.

## Before launch: the contact form

The About page has a contact form that needs a free form service, because a static site cannot send email by itself. With [Formspree](https://formspree.io):

1. Create a form there and set it to deliver to the project leads' addresses (the addresses stay in Formspree, not on the page).
2. Copy the form's endpoint, which looks like `https://formspree.io/f/abcdwxyz`.
3. In `about/index.html`, find `FORM_ENDPOINT = ''` and paste the endpoint between the quotes.

Until then the form says plainly that it is not connected yet, rather than pretending to send.

## Updating the numbers

The files in `data/` are written by `r_scripts/80_site_data.R` in the private project repository. To update after new results:

1. Run `Rscript r_scripts/80_site_data.R` on the secure machine. It rebuilds every file, checks that nothing id-shaped is in them, and copies them into this folder's `data/`. If the mentions have changed, run `82_mentions_candidates.R` (about 10 minutes) and then `83_mentions_data.R` (under a minute) as well.
2. Run `Rscript r_scripts/81_site_check.R`. The charts read their numbers from `data/`, but the sentences in the pages are written by hand, so this script recomputes every number and claim in them from `outputs/site/facts.csv` and lists any sentence that no longer matches. Edit those sentences, and run it again until nothing fails. It also checks that no page mentions the 13 to 17 age group or carries anything shaped like a conversation id.
3. Commit and push. The site updates within a minute or two.

Nothing updates on its own, and the site never connects to the project's systems.

## Changing the logo

The logo is one file, `assets/logo.svg`, used in every page header and footer; the browser-tab icon is `assets/favicon.svg`. To switch to one of the alternatives, copy it over `assets/logo.svg`. Both alternatives are drawn for the navy header.

## The Ask the data engine

`assets/ask.js` answers questions in the visitor's browser, following the approach of an earlier draft site by Kiran Garimella. It matches words in the question against a word list with four slots (who, what, when and why), looks the answer up in `data/ask.json`, and fills a sentence template. The question never leaves the browser, and every answer has its own address (`ask/?q=...`), so it can be shared. When it substitutes something close to what was asked, or drops part of a question it cannot answer, the answer says so.

`data/ask.json` holds shares only. A group appears only with at least 200 people and 2,000 conversations; a share inside a group needs at least 50 conversations from at least 20 people, and is withheld when five people supply more than half of it.

## Mentions

Besides subjects, the site can say how often people mention a named thing — a person, place, product, show, drug, holiday — in their own messages: per 1,000 conversations, the share of people who mentioned it, by month, hour and weekday, and by group. The Ask box answers questions like "How often do people mention Taylor Swift?" or "Compare Trump, Musk and Biden", and the Trends page compares up to five terms.

The term list is built in the private project repository: `site_inputs/mention_terms.csv` (hand-written terms, with spelling variants and excluded phrases), the public-figure and place lists, and the topic model's distinctive words. `r_scripts/82_mentions_candidates.R` counts every candidate and writes a review workbook (`outputs/site/mentions/mentions_candidates.xlsx`); `r_scripts/83_mentions_data.R` writes `data/mentions_index.json` and one small file per term in `data/mentions/`, which the pages load only when a term is asked about. To publish only the terms the team has approved, list their names (one column, `term`, as the workbook shows them) in `site_inputs/mention_terms_live.csv` and rerun 83. A mention figure needs at least 20 conversations from at least 20 people (lower than the 50 used for subject figures, which are far larger), and is withheld when five people supply more than half of it. On the charts, a month below the threshold is drawn inside a hatched band whose top is the threshold, so it reads as small rather than as zero.

## Previewing locally

The pages load their data with `fetch`, which browsers block for files opened straight from disk. Serve the folder instead, for example with `python -m http.server 8000` run from this folder, and open `http://localhost:8000`.
