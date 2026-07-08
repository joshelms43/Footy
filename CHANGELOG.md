# Changelog

All notable changes to FootyLab. Versions refer to `index.html` (the app) unless noted.
Data source: [Squiggle API](https://api.squiggle.com.au/) — fetched server-side via `api/squiggle.js`, per Squiggle's API rules.

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
