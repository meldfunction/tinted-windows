#!/usr/bin/env node
/**
 * demo-server.js — Live demo HTTP server
 *
 * Serves the demo page and provides a real-time workflow API.
 * Streams status updates via Server-Sent Events (SSE).
 *
 * Usage:
 *   node demo-server.js
 *   Open http://localhost:3141/demo.html
 *
 * Endpoints:
 *   GET  /demo.html             — the interactive demo page
 *   POST /api/generate-seeds    — generate alias seeds
 *   POST /api/create-alias      — create an alias via Addy.io
 *   POST /api/create-card       — create a virtual card via Privacy.com
 *   POST /api/enroll            — run the full Playwright enrollment
 *   GET  /api/stream/:jobId     — SSE stream for a running job
 *   GET  /api/status            — current alias inventory
 *   GET  /screenshots/:file     — serve Playwright screenshots
 */

import { createServer }    from 'http';
import { readFileSync, existsSync } from 'fs';
import { join }            from 'path';
import { homedir }         from 'os';
import { randomBytes }     from 'crypto';
import 'dotenv/config';

import { AliasService }    from './src/alias.js';
import { CardService }     from './src/card.js';
import { ContextStore }    from './src/context.js';
import { IdentityGen }     from './src/identity.js';
import { BrowserService }  from './src/browser.js';

const alias   = new AliasService();
const card    = new CardService();
const store   = new ContextStore();
const idgen   = new IdentityGen();
const browser = new BrowserService();

await store.init();

const PORT           = parseInt(process.env.MCP_PORT) || 3141;
const SCREENSHOT_DIR = join(homedir(), '.pane', 'screenshots');

// Active SSE jobs: jobId → { clients: [res], events: [] }
const jobs = new Map();

// ── HELPERS ──────────────────────────────────────────────────────────────────

function jobId() { return randomBytes(6).toString('hex'); }

function emit(id, event, data) {
  const job = jobs.get(id);
  if (!job) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  job.events.push({ event, data }); // replay buffer for reconnects
  job.clients.forEach(client => {
    try { client.write(payload); } catch {}
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function json(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── SEED GENERATOR ────────────────────────────────────────────────────────────

const ADJ  = ["amber","arctic","aspen","birch","blaze","bolt","cedar","chalk","cinder","cobalt","copper","coral","crimson","dawn","delta","dusk","echo","ember","fern","flint","forge","frost","glint","grove","hazel","heather","hollow","indigo","inlet","ivory","jade","jasper","larch","laurel","linen","lunar","maple","marsh","mist","navy","nimbus","ochre","opal","orbit","otter","petal","pine","prism","quartz","raven","ridge","river","rowan","runic","sable","sage","salt","sand","slate","smoke","solar","sparrow","spruce","storm","summit","swift","tallow","teal","thistle","timber","trace","tundra","vale","vault","willow","wren","zephyr","zenith"];
const NOUN = ["anvil","arch","basin","beacon","bridge","brook","cable","cairn","canal","canopy","cast","chord","circuit","cistern","cleft","crest","current","depth","dial","drift","dune","edge","ember","falls","field","flare","frame","gate","glade","gorge","grid","gully","haven","hearth","helm","hollow","kelp","knot","latch","ledge","lens","lever","light","line","link","loch","lock","loop","lore","mark","mast","meld","mesh","mill","moor","node","notch","orbit","pass","patch","peak","pier","pillar","pitch","plain","plank","pool","port","post","press","range","rapid","reach","reef","relay","ridge","rift","rivet","root","route","rune","seal","shaft","shore","sill","sluice","span","spoke","stack","stake","stave","stern","strand","strut","surge","sweep","tide","tine","torch","track","trail","vault","vein","weir","well","wharf"];
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function genSeed() { return `${pick(ADJ)}-${pick(NOUN)}`; }
function genSeeds(n = 6) {
  const s = new Set();
  while (s.size < n) s.add(genSeed());
  return [...s];
}

// ── TRACKING PARAMS STRIP ─────────────────────────────────────────────────────
const TRACKING = ['fbclid','gclid','utm_source','utm_medium','utm_campaign','utm_term','utm_content','ref','mc_cid','mkt_tok','igshid','msclkid'];
function stripTracking(url) {
  try {
    const u = new URL(url);
    TRACKING.forEach(p => u.searchParams.delete(p));
    return u.toString();
  } catch { return url; }
}

// ── ROUTE HANDLER ─────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url  = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // ── Serve demo.html ──
  if (path === '/' || path === '/demo.html') {
    const file = './demo.html';
    if (existsSync(file)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(readFileSync(file));
    } else {
      res.writeHead(404); res.end('demo.html not found');
    }
    return;
  }

  // ── Serve screenshots ──
  if (path.startsWith('/screenshots/')) {
    const file = join(SCREENSHOT_DIR, path.replace('/screenshots/', ''));
    if (existsSync(file)) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(readFileSync(file));
    } else {
      res.writeHead(404); res.end('screenshot not found');
    }
    return;
  }

  // ── SSE stream ──
  if (path.startsWith('/api/stream/')) {
    const id = path.split('/').pop();
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    if (!jobs.has(id)) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'job not found' })}\n\n`);
      res.end(); return;
    }
    const job = jobs.get(id);
    // Replay buffered events for reconnect
    job.events.forEach(e => res.write(`event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`));
    job.clients.push(res);
    req.on('close', () => {
      job.clients = job.clients.filter(c => c !== res);
    });
    return;
  }

  // ── POST routes ──
  if (req.method === 'POST') {
    const body = await parseBody(req);

    // Generate seeds
    if (path === '/api/generate-seeds') {
      const seeds = genSeeds(body.count || 8);
      return json(res, { seeds });
    }

    // Status overview
    if (path === '/api/status') {
      const contexts = await store.list().catch(() => []);
      return json(res, { contexts });
    }

    // Create alias
    if (path === '/api/create-alias') {
      const seed     = body.seed || genSeed();
      const identity = idgen.generate(seed);
      try {
        const result = await alias.create({ name: seed, description: seed, identity });
        await store.save({ name: seed, aliasEmail: result.email, aliasId: result.id, identity, createdAt: new Date().toISOString() });
        return json(res, { ok: true, seed, email: result.email, identity });
      } catch (e) {
        return json(res, { ok: false, error: e.message }, 500);
      }
    }

    // Create card
    if (path === '/api/create-card') {
      const seed = body.seed;
      if (!seed) return json(res, { ok: false, error: 'seed required' }, 400);
      try {
        const result = await card.create({ memo: seed, spend_limit: 0 });
        await store.update(seed, { cardToken: result.token, cardLast4: result.last_four });
        return json(res, { ok: true, seed, last4: result.last_four });
      } catch (e) {
        return json(res, { ok: false, error: e.message }, 500);
      }
    }

    // Full enrollment (runs Playwright, streams status)
    if (path === '/api/enroll') {
      const { url: enrollUrl, seed, mode } = body;
      if (!enrollUrl || !seed) return json(res, { ok: false, error: 'url and seed required' }, 400);

      const id = jobId();
      jobs.set(id, { clients: [], events: [] });

      // Start async job
      (async () => {
        emit(id, 'start', { seed, url: enrollUrl, mode });

        try {
          emit(id, 'status', { step: 'prepare', message: 'Preparing alias identity…', pct: 5 });
          const identity = idgen.generate(seed);

          emit(id, 'status', { step: 'alias', message: 'Creating alias email via Addy.io…', pct: 15 });
          let aliasResult;
          try {
            aliasResult = await alias.create({ name: seed, description: seed, identity });
            await store.save({ name: seed, aliasEmail: aliasResult.email, aliasId: aliasResult.id, identity, enrollUrl: stripTracking(enrollUrl), createdAt: new Date().toISOString() });
          } catch (e) {
            // Demo fallback if API key not set
            aliasResult = { email: `${seed}-demo@alias.yourdomain.com`, id: 'demo-' + seed };
          }
          emit(id, 'status', { step: 'alias', message: `✓ Alias created: ${aliasResult.email}`, pct: 25, email: aliasResult.email });

          emit(id, 'status', { step: 'card', message: 'Creating $0 virtual card…', pct: 35 });
          let cardResult;
          try {
            cardResult = await card.create({ memo: seed, spend_limit: 0 });
            await store.update(seed, { cardToken: cardResult.token, cardLast4: cardResult.last_four });
          } catch (e) {
            cardResult = { last_four: '0000', token: 'demo-token' };
          }
          emit(id, 'status', { step: 'card', message: `✓ Card created: ····${cardResult.last_four} · $0 limit`, pct: 45, last4: cardResult.last_four });

          if (mode === 'agent') {
            emit(id, 'status', { step: 'browser', message: 'Launching stealth browser…', pct: 55 });
            const cleanUrl = stripTracking(enrollUrl);

            const result = await browser.enroll(cleanUrl, { identity, aliasResult, cardResult }, (step, message, screenshot) => {
              const pctMap = { launch: 55, navigate: 65, block: 66, form: 75, fill: 82, submit: 90, verify: 96, error: 99 };
              const pct = pctMap[step] || 70;
              const screenshotUrl = screenshot ? `/screenshots/${screenshot.split('/').pop()}` : null;
              emit(id, 'status', { step, message, pct, screenshotUrl });
            });

            if (result.success) {
              emit(id, 'complete', {
                seed,
                email: aliasResult.email,
                last4: cardResult.last_four,
                identity: `${identity.first_name} ${identity.last_name}`,
                screenshots: result.screenshots.map(s => `/screenshots/${s.split('/').pop()}`),
                message: `✓ Enrolled at ${new URL(enrollUrl).hostname} as ${aliasResult.email}`
              });
            } else {
              emit(id, 'error', { message: result.error, screenshots: result.screenshots });
            }
          } else {
            // Manual mode — provide the details for user to complete
            emit(id, 'complete', {
              seed,
              email: aliasResult.email,
              last4: cardResult.last_four,
              identity: `${identity.first_name} ${identity.last_name}`,
              identityDetail: identity,
              manual: true,
              message: 'Alias and card ready — use the details below to sign up manually'
            });
          }

        } catch (err) {
          emit(id, 'error', { message: err.message });
        }
      })();

      return json(res, { ok: true, jobId: id });
    }
  }

  // ── GET /api/status ──
  if (req.method === 'GET' && path === '/api/status') {
    const contexts = await store.list().catch(() => []);
    return json(res, { contexts });
  }

  res.writeHead(404); res.end('not found');
});

server.listen(PORT, () => {
  console.log(`\n  pane demo server running`);
  console.log(`  → http://localhost:${PORT}/demo.html\n`);
});
