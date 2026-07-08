# Changelog

All notable changes to FootyLab. Versions refer to `index.html` (the app) unless noted.
Data source: [Squiggle API](https://api.squiggle.com.au/) — fetched server-side via `api/squiggle.js`, per Squiggle's API rules.

## [0.7.0] — 2026-07-08
### Added
- Server-side dataset architecture: a GitHub Actions "data factory" (`setup/update-data.yml` → copy to `.github/workflows/`) fetches Squiggle games weekly via `scripts/build-data.mjs` and the full Fryzigg player-stats dataset (~80 stat columns per player per game) via `scripts/players-split.R`, committing compact JSON to `data/`
- App loads `data/games.json` first for an instant full-history load, live-refreshing the current season through the proxy; falls back to per-year proxy loading when the bundle is absent

## [0.6.0] — 2026-07-08
### Added
- Ladder time machine: full H&A ladder for any loaded season (season selector in the results header), computed from results with finals excluded; premiers, minor premiers and wooden spoon called out; top and bottom rows highlighted
- Honour board: premierships (Grand Final wins), last flag, drought length, wooden spoons and last spoon — spoons derived from computed ladders, current season excluded
- A surprise fact auto-shows when a data load completes

### Changed
- Chips regrouped under labelled Presets / Deep dives rows

## [0.5.0] — 2026-07-08
### Added
- Computed historical ladder: entering-round positions derived from results alone (4-2-0 points, percentage tiebreak, H&A games only; finals annotated but never move the ladder) — no extra API calls
- Giant killings analysis: wins by lower-ranked teams over higher-ranked, sorted by ladder gap entering the game (both teams min 5 games played)
- Ladder positions in the game detail card ("entering: Richmond 2nd · Carlton 15th")
- 🎲 Surprise me: serves a random genuine oddity drawn from only-ever scorelines, top turnarounds, giant killings and the records book

## [0.4.0] — 2026-07-08
### Added
- Game detail drill-down: tap any result row for the full goals.behinds scoreline, result, day/venue context, scoreline rarity (count, first/last seen), and margin/total percentiles vs all loaded games
- Turnarounds analysis: biggest same-season rematch swings between the same two teams, with flipped-result badges
- Head-to-head margin sparkline inside the rivalry card (amber = selected team won, red = lost, tick = draw)
- Month filter

## [0.3.0] — 2026-07-08
### Added
- Records book analysis: extremes over loaded data — highest/lowest team scores, highest losing score, lowest winning score, biggest margin, aggregates, most goals/behinds by a team, biggest Grand Final margin, highest-scoring and most recent draws
- Venue almanac: per-ground games hosted, span, home W-L-D and win% (draws excluded), average total, biggest margin
- Team profile: all-time record, win% and AFL-style percentage, best win streak and worst losing run, biggest win/loss, most-played opponent, decade-by-decade breakdown
- "Most recent" line under query stats with days-since — drought spotting for any filter combination

## [0.2.0] — 2026-07-08
### Added
- Scorigami grid: interactive score-pair heatmap; tap a cell to inspect a scoreline and list its actual games
- Season trends chart (avg total + avg margin per season, respects current filters)
- Head-to-head card when team + opponent are both set (record, streak, biggest win each way, points for/against)
- Presets: "Won with fewer goals" (accuracy paradox), "On this day"
- Round-number filter
- Shareable query URLs ("Share query" copies a link that restores seasons, filters and view)

## [0.1.0] — 2026-07-08
### Added
- Initial release
- Season loader (1897→now) through `api/squiggle.js` proxy, with per-season localStorage cache (past seasons only)
- Query engine: team/role/result/opponent, venue, day of week, stage (H&A / finals / GF-only), season range, margin, total points, team-score ranges
- Preset chips: Draws, Thrillers, Demolitions, Shootouts, Slogfests, Grand Finals
- Analyses: Scorigami firsts and longest win/loss streaks (draws break streaks)
- Scoreboard stat strip, margin histogram, sortable results table (500-row render cap), CSV export

### `api/squiggle.js` — 0.1.0
- Year-scoped games proxy with identified User-Agent and CDN caching (past seasons: 1 year, current season: 10 minutes)
