#!/usr/bin/env node
/* =============================================================
   FootyLab data builder — games stage (Squiggle) — v0.1.0
   -------------------------------------------------------------
   Runs in GitHub Actions (Node 20+). Fetches complete games from
   the Squiggle API with an identified User-Agent, normalizes to
   the app's schema (v1), and writes data/games.json.

   Incremental: seasons already present are never refetched;
   the current season is always refreshed. First run backfills
   1897→now (one-time, ~130 polite requests at 400ms gaps).

   Usage:
     CONTACT="FootyLab (repo url) - you@email" node scripts/build-data.mjs
     node scripts/build-data.mjs --selftest     (offline checks)

   Keep normalizeGame IN SYNC with index.html (schema v1).
   ============================================================= */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const SELFTEST = process.argv.includes('--selftest');
const MIN_YEAR = 1897;
const CUR = new Date().getFullYear();
const OUT = 'data/games.json';
const GAP_MS = 400;

/* ---------- schema v1 normalization (mirror of index.html) ---------- */
function dowFromDateStr(s){
  if (!s || s.length < 10) return -1;
  const y = +s.slice(0,4), m = +s.slice(5,7), d = +s.slice(8,10);
  if (!y || !m || !d) return -1;
  return new Date(Date.UTC(y, m-1, d)).getUTCDay();
}
function normalizeGame(g){
  const local = g.localtime || g.date || '';
  const hs = +g.hscore || 0, as = +g.ascore || 0;
  const draw = hs === as;
  return {
    id: g.id, y: +g.year, rnd: +g.round,
    rname: g.roundname || ('Round ' + g.round),
    fin: +g.is_final || 0, gf: +g.is_grand_final || 0,
    dstr: (local || '').slice(0,10), dow: dowFromDateStr(local),
    venue: g.venue || 'Unknown',
    ht: g.hteam, at: g.ateam, hs, as,
    hg: +g.hgoals||0, hb: +g.hbehinds||0, ag: +g.agoals||0, ab: +g.abehinds||0,
    tot: hs + as, mar: Math.abs(hs - as),
    win: draw ? null : (g.winner || (hs > as ? g.hteam : g.ateam))
  };
}

/* ---------- selftest (offline) ---------- */
if (SELFTEST) {
  let pass = 0, fail = 0;
  const t = (n, c) => { c ? pass++ : fail++; console.log((c ? 'PASS  ' : 'FAIL  ') + n); };
  const carl = normalizeGame({round:1,date:'2017-03-23 19:20:00',venue:'M.C.G.',roundname:'Round 1',
    is_grand_final:0,is_final:0,abehinds:12,ateam:'Richmond',winner:'Richmond',agoals:20,hscore:89,
    hbehinds:5,hteam:'Carlton',id:1,hgoals:14,ascore:132,localtime:'2017-03-23 19:20:00',year:2017,complete:100});
  t('normalize margin/total/winner', carl.mar === 43 && carl.tot === 221 && carl.win === 'Richmond');
  t('normalize dow (Thu)', carl.dow === 4);
  const draw = normalizeGame({round:4,ateam:'B',winner:null,hscore:88,hteam:'A',id:2,ascore:88,
    hgoals:13,hbehinds:10,agoals:12,abehinds:16,localtime:'2019-04-13 13:45:00',year:2019,complete:100,venue:null});
  t('normalize draw + null venue', draw.win === null && draw.mar === 0 && draw.venue === 'Unknown');
  const grouped = {};
  [carl, draw].forEach(g => (grouped[g.y] = grouped[g.y] || []).push(g));
  t('grouping by year', grouped[2017].length === 1 && grouped[2019].length === 1);
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

/* ---------- main ---------- */
const CONTACT = process.env.CONTACT;
if (!CONTACT || CONTACT.includes('@') === false) {
  console.error('CONTACT env var required (User-Agent with an email), e.g.\n  CONTACT="FootyLab (github.com/user/repo) - you@example.com"');
  process.exit(1);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchYear(y){
  const r = await fetch('https://api.squiggle.com.au/?q=games;year=' + y,
    { headers: { 'User-Agent': CONTACT, 'Accept': 'application/json' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  return (j.games || []).filter(g => +g.complete === 100).map(normalizeGame);
}

const byYear = {};
if (existsSync(OUT)) {
  const prev = JSON.parse(readFileSync(OUT, 'utf8'));
  (prev.games || []).forEach(g => (byYear[g.y] = byYear[g.y] || []).push(g));
  console.log('existing dataset: ' + (prev.games || []).length + ' games, built ' + prev.built);
}

const targets = [];
for (let y = MIN_YEAR; y <= CUR; y++) if (!byYear[y] || y === CUR) targets.push(y);
console.log('fetching ' + targets.length + ' season(s)...');

const failures = [];
for (const y of targets) {
  try {
    byYear[y] = await fetchYear(y);
    console.log('  ' + y + ': ' + byYear[y].length + ' games');
  } catch (e) {
    failures.push(y);
    console.error('  ' + y + ' FAILED: ' + e.message);
  }
  await sleep(GAP_MS);
}

const all = Object.values(byYear).flat()
  .sort((a, b) => a.dstr < b.dstr ? -1 : a.dstr > b.dstr ? 1 : a.id - b.id);
mkdirSync('data', { recursive: true });
writeFileSync(OUT, JSON.stringify({ v: 1, built: new Date().toISOString(), games: all }));
console.log('wrote ' + OUT + ': ' + all.length + ' games across ' + Object.keys(byYear).length + ' seasons');
if (failures.length) console.error('failed seasons: ' + failures.join(', '));
process.exit(failures.length > 3 ? 1 : 0);
