/* =============================================================
   FootyLab — Squiggle data proxy (Vercel serverless, CJS)
   -------------------------------------------------------------
   CHANGELOG
   v0.1.0 (2026-07-08) Initial release. Year-scoped games proxy
     with identified User-Agent + aggressive CDN caching.
   -------------------------------------------------------------
   WHY THIS EXISTS
   Squiggle's API rules (api.squiggle.com.au, v1.13.2+) forbid
   sites from making visitors' browsers fetch Squiggle directly,
   and block such requests at the edge. The builder must fetch.
   This function is that builder-side fetch:
     - identifies itself with a User-Agent + contact email
     - caches past seasons on Vercel's CDN for a year
       (historical results never change)
     - caches the current season for 10 minutes
   Result: Squiggle sees a handful of requests, ever.
   ============================================================= */

// ⚠️ REQUIRED BEFORE DEPLOY: put a real contact email in here.
// Squiggle blocks unidentified bots at the edge.
const USER_AGENT = 'FootyLab (personal AFL history explorer) - YOUR_EMAIL_HERE';

const MIN_YEAR = 1897;

module.exports = async function handler(req, res) {
  const now = new Date().getFullYear();
  const year = parseInt((req.query && req.query.year) || '', 10);

  if (!Number.isInteger(year) || year < MIN_YEAR || year > now + 1) {
    res.status(400).json({ error: 'year must be an integer between ' + MIN_YEAR + ' and ' + (now + 1) });
    return;
  }

  try {
    const upstream = await fetch('https://api.squiggle.com.au/?q=games;year=' + year, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' }
    });

    if (!upstream.ok) {
      res.status(502).json({ error: 'Squiggle responded ' + upstream.status });
      return;
    }

    const data = await upstream.json();

    // Past seasons are immutable: cache on the CDN for a year.
    // Current season: 10 minutes, serve stale while revalidating.
    const sMaxAge = year < now ? 31536000 : 600;
    res.setHeader('Cache-Control', 'public, s-maxage=' + sMaxAge + ', stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Could not reach Squiggle: ' + (err && err.message ? err.message : 'unknown') });
  }
};
