#!/usr/bin/env node
/**
 * bin/pane.js — pane command-line interface
 *
 * Calls the same handlers as server.js directly (no JSON-RPC overhead).
 * Works standalone — no Claude Desktop, no MCP client needed.
 *
 * Usage:
 *   node bin/pane.js <command> [args] [flags]
 *   (After `npm link` or `npx pane`): pane <command> [args] [flags]
 *
 * Commands:
 *   create-alias  <seed>              Create alias email for a context
 *   create-card   <seed> [--limit N]  Create $0 virtual card for a context
 *   create-context <seed>             Create alias + card together (envelope)
 *   enroll        <url>  [--seed S] [--agent]   Provision context for a URL
 *   list          [--json]            List all envelopes + health status
 *   inbox         <seed> [--limit N] [--json]   Read alias mail
 *   audit         <seed>              Check for breach signals
 *   expire        <seed>              Burn alias + freeze card
 *   fund          <seed> --amount N   Fund card to exact dollar amount
 *   status                            Quick health check of all contexts
 *   help                              Show this help
 *
 * Flags:
 *   --json        Output raw JSON instead of formatted text
 *   --quiet       Suppress all output except errors
 *   --verbose     Extra detail
 *   --agent       Use Playwright browser for enrollment (requires: npm i playwright)
 *   --limit N     Message limit for inbox command (default: 10)
 *   --amount N    Dollar amount for fund command (e.g. 12.00)
 *   --seed S      Override seed/context name
 */

import 'dotenv/config';
import { AliasService }   from '../src/alias.js';
import { CardService }    from '../src/card.js';
import { ContextStore }   from '../src/context.js';
import { InboxService }   from '../src/inbox.js';
import { IdentityGen }    from '../src/identity.js';
import { BrowserService } from '../src/browser.js';

// ── COLOUR HELPERS ────────────────────────────────────────────────────────────
const isTTY = process.stdout.isTTY;
const c = {
  green:  s => isTTY ? `\x1b[32m${s}\x1b[0m` : s,
  red:    s => isTTY ? `\x1b[31m${s}\x1b[0m` : s,
  yellow: s => isTTY ? `\x1b[33m${s}\x1b[0m` : s,
  teal:   s => isTTY ? `\x1b[36m${s}\x1b[0m` : s,
  dim:    s => isTTY ? `\x1b[2m${s}\x1b[0m`  : s,
  bold:   s => isTTY ? `\x1b[1m${s}\x1b[0m`  : s,
  amber:  s => isTTY ? `\x1b[38;5;214m${s}\x1b[0m` : s,
};

// ── ARG PARSING ───────────────────────────────────────────────────────────────
const argv    = process.argv.slice(2);
const cmd     = argv[0];
const posArgs = argv.filter(a => !a.startsWith('-'));
const flags   = {
  json:    argv.includes('--json'),
  quiet:   argv.includes('--quiet'),
  verbose: argv.includes('--verbose'),
  agent:   argv.includes('--agent'),
  limit:   parseInt(argv[argv.indexOf('--limit')  + 1]) || 10,
  amount:  parseFloat(argv[argv.indexOf('--amount') + 1]) || null,
  seed:    argv[argv.indexOf('--seed') + 1] || null,
};

// ── SERVICE INIT ──────────────────────────────────────────────────────────────
const alias   = new AliasService();
const card    = new CardService();
const store   = new ContextStore();
const idgen   = new IdentityGen();
const inbox   = new InboxService();
const browser = new BrowserService();
await store.init();

// ── OUTPUT HELPERS ────────────────────────────────────────────────────────────
function out(data) {
  if (flags.quiet) return;
  if (flags.json) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    renderHuman(data);
  }
}

function err(msg) {
  console.error(c.red('  ✗ ' + msg));
  process.exit(1);
}

function ok(msg) {
  if (!flags.quiet) console.log(c.green('  ✓ ') + msg);
}

function info(msg) {
  if (!flags.quiet) console.log(c.dim('  · ') + msg);
}

// ── HUMAN-READABLE RENDERERS ──────────────────────────────────────────────────
function renderHuman(data) {
  if (Array.isArray(data)) {
    data.forEach(renderHuman);
    return;
  }

  // Context list
  if (data.contexts) {
    const rows = data.contexts;
    if (!rows.length) { console.log(c.dim('  No active envelopes.')); return; }
    const w = { name: 20, alias: 38, card: 12, status: 10, created: 12 };
    const hdr = [
      c.dim('context'.padEnd(w.name)),
      c.dim('alias email'.padEnd(w.alias)),
      c.dim('card'.padEnd(w.card)),
      c.dim('status'.padEnd(w.status)),
      c.dim('created'),
    ].join('  ');
    console.log('  ' + hdr);
    console.log('  ' + c.dim('─'.repeat(Object.values(w).reduce((a,b)=>a+b) + 8)));
    rows.forEach(r => {
      const statusIcon = r.status === 'clean'   ? c.green('●') + c.dim(' clean  ')
                       : r.status === 'warning' ? c.yellow('●') + c.yellow(' warning')
                       : r.status === 'breach'  ? c.red('●')   + c.red(' breach ')
                       : c.dim('● unknown');
      console.log('  ' +
        c.bold(String(r.name    || '').padEnd(w.name)) + '  ' +
        c.teal(String(r.alias   || '').padEnd(w.alias)) + '  ' +
        c.dim( String(r.card    || '').padEnd(w.card))  + '  ' +
        statusIcon.padEnd(10)                            + '  ' +
        c.dim(String(r.created || ''))
      );
    });
    console.log(c.dim(`\n  ${rows.length} envelope${rows.length !== 1 ? 's' : ''}`));
    return;
  }

  // Inbox messages
  if (data.messages) {
    console.log(c.teal(`\n  ${data.alias}`));
    console.log(c.dim(`  ${data.count} message${data.count !== 1 ? 's' : ''}\n`));
    if (!data.messages.length) { console.log(c.dim('  No messages.')); return; }
    data.messages.forEach(m => {
      console.log(`  ${c.bold(m.from || '?')}  ${c.dim(m.date || '')}`);
      console.log(`  ${m.subject || '(no subject)'}`);
      if (m.preview) console.log(c.dim(`  ${m.preview.slice(0, 120)}…`));
      console.log('');
    });
    return;
  }

  // Audit result
  if ('breach_signal' in data) {
    const icon = data.breach_signal ? c.red('⚠') : c.green('✓');
    console.log(`\n  ${icon}  ${c.bold(data.context)}`);
    console.log(`  ${c.dim('alias')}   ${c.teal(data.alias)}`);
    console.log(`  ${c.dim('msgs')}    ${data.total_messages}`);
    if (data.known_senders?.length) {
      console.log(`  ${c.dim('known')}   ${data.known_senders.slice(0,3).join(', ')}`);
    }
    if (data.unexpected_senders?.length) {
      console.log(`  ${c.red('⚠ unexpected')}  ${data.unexpected_senders.join(', ')}`);
    }
    console.log(`\n  ${data.breach_signal ? c.yellow(data.verdict) : c.green(data.verdict)}\n`);
    return;
  }

  // Envelope / context creation
  if (data.alias_email) {
    console.log('');
    console.log(`  ${c.bold(data.context || data.context_name)}`);
    console.log(`  ${c.dim('alias')}   ${c.teal(data.alias_email)}`);
    if (data.card_last4) console.log(`  ${c.dim('card')}    ····${data.card_last4}  ${c.dim('$0 limit')}`);
    if (data.identity)   console.log(`  ${c.dim('name')}    ${c.dim(data.identity)}`);
    if (data.message)    console.log(`\n  ${c.green('✓')} ${data.message}`);
    console.log('');
    return;
  }

  // Expire / burn
  if (data.status === 'expired') {
    console.log(`\n  ${c.red('✓')} ${data.context} burned`);
    console.log(`  ${c.dim(data.alias)} ${c.dim('→ deleted')}`);
    if (data.message) console.log(`  ${c.dim(data.message)}`);
    console.log('');
    return;
  }

  // Generic message
  if (data.message) {
    console.log(`  ${data.message}`);
  }
}

// ── COMMANDS ──────────────────────────────────────────────────────────────────

async function cmdCreateAlias(seed) {
  if (!seed) err('seed required. Usage: pane create-alias <seed>');
  const identity = idgen.generate(seed);
  info(`Creating alias for "${seed}"…`);
  const result = await alias.create({ name: seed, description: seed, identity });
  await store.save({ name: seed, aliasEmail: result.email, aliasId: result.id, identity, createdAt: new Date().toISOString() });
  out({ context: seed, alias_email: result.email, identity: `${identity.first_name} ${identity.last_name}`, message: `Mail to ${result.email} forwards to your inbox.` });
}

async function cmdCreateCard(seed) {
  if (!seed) err('seed required. Usage: pane create-card <seed>');
  info(`Creating virtual card for "${seed}"…`);
  const limitCents = flags.amount ? Math.round(flags.amount * 100) : 0;
  const result = await card.create({ memo: seed, spend_limit: limitCents });
  await store.update(seed, { cardToken: result.token, cardLast4: result.last_four });
  out({ context: seed, alias_email: null, card_last4: result.last_four, message: `Card ····${result.last_four} created. Limit: $${(limitCents/100).toFixed(2)}.` });
}

async function cmdCreateContext(seed) {
  if (!seed) err('seed required. Usage: pane create-context <seed>');
  const identity = idgen.generate(seed);
  info(`Creating envelope for "${seed}"…`);
  const [aliasResult, cardResult] = await Promise.all([
    alias.create({ name: seed, description: seed, identity }),
    card.create({ memo: seed, spend_limit: 0 }),
  ]);
  await store.save({ name: seed, aliasEmail: aliasResult.email, aliasId: aliasResult.id, cardToken: cardResult.token, cardLast4: cardResult.last_four, identity, createdAt: new Date().toISOString() });
  out({ context: seed, alias_email: aliasResult.email, card_last4: cardResult.last_four, identity: `${identity.first_name} ${identity.last_name}`, message: `Envelope ready. Use ${aliasResult.email} and card ····${cardResult.last_four} for ${seed}.` });
}

async function cmdEnroll(url) {
  if (!url) err('URL required. Usage: pane enroll <url> [--seed name] [--agent]');
  const stripped = stripTracking(url);
  const domain   = new URL(stripped).hostname.replace('www.', '');
  const seed     = flags.seed || domain.split('.')[0];
  const identity = idgen.generate(seed);

  info(`Provisioning envelope for ${domain}…`);
  const [aliasResult, cardResult] = await Promise.all([
    alias.create({ name: seed, description: seed, identity }),
    card.create({ memo: seed, spend_limit: 0 }),
  ]);
  await store.save({ name: seed, aliasEmail: aliasResult.email, aliasId: aliasResult.id, cardToken: cardResult.token, cardLast4: cardResult.last_four, identity, enrollUrl: stripped, createdAt: new Date().toISOString() });

  if (flags.agent) {
    info('Launching browser enrollment…');
    const result = await browser.enroll(stripped, { identity, aliasResult, cardResult }, (step, msg, shot) => {
      if (!flags.quiet) {
        const icon = msg.startsWith('✓') ? c.green('✓') : msg.startsWith('⚠') ? c.yellow('⚠') : c.dim('·');
        const shotNote = (shot && flags.verbose) ? c.dim(` [${shot.split('/').pop()}]`) : '';
        console.log(`  ${icon} ${msg}${shotNote}`);
      }
    });
    if (result.success) {
      ok(`Enrolled at ${domain} as ${aliasResult.email}`);
      if (result.screenshots?.length && flags.verbose) {
        result.screenshots.forEach(s => info(`screenshot: ${s}`));
      }
    } else {
      err(`Browser enrollment failed: ${result.error}`);
    }
  } else {
    out({ context: seed, alias_email: aliasResult.email, card_last4: cardResult.last_four, identity: `${identity.first_name} ${identity.last_name}`, message: `Ready. Sign up at ${stripped} using ${aliasResult.email} and card ····${cardResult.last_four}.` });
  }
}

async function cmdList() {
  const contexts = await store.list();
  if (!contexts.length) { out({ contexts: [], message: 'No active envelopes.' }); return; }
  const rows = await Promise.all(contexts.map(async ctx => {
    const health = await inbox.getHealth(ctx.aliasId).catch(() => 'unknown');
    return { name: ctx.name, alias: ctx.aliasEmail, card: ctx.cardLast4 ? `····${ctx.cardLast4}` : '—', status: health, created: ctx.createdAt?.split('T')[0] || '—' };
  }));
  out({ contexts: rows, total: rows.length });
}

async function cmdInbox(seed) {
  if (!seed) err('seed required. Usage: pane inbox <seed>');
  const ctx = await store.get(seed);
  if (!ctx) err(`No context "${seed}" — run: pane create-alias ${seed}`);
  const messages = await inbox.read({ aliasId: ctx.aliasId, limit: flags.limit });
  out({ context: seed, alias: ctx.aliasEmail, count: messages.length, messages: messages.map(m => ({ from: m.from, subject: m.subject, date: m.date, preview: m.preview })) });
}

async function cmdAudit(seed) {
  if (!seed) err('seed required. Usage: pane audit <seed>');
  const ctx = await store.get(seed);
  if (!ctx) err(`No context "${seed}"`);
  info(`Checking ${ctx.aliasEmail}…`);
  const messages   = await inbox.read({ aliasId: ctx.aliasId, limit: 100 });
  const senders    = [...new Set(messages.map(m => m.from_domain).filter(Boolean))];
  const enrolled   = ctx.enrollUrl ? new URL(ctx.enrollUrl).hostname.replace('www.','') : null;
  const unexpected = enrolled ? senders.filter(s => s && !s.includes(enrolled)) : [];
  out({ context: seed, alias: ctx.aliasEmail, total_messages: messages.length, known_senders: enrolled ? senders.filter(s => s?.includes(enrolled)) : senders, unexpected_senders: unexpected, breach_signal: unexpected.length > 0, verdict: unexpected.length > 0 ? `⚠ Breach signal — unexpected mail from: ${unexpected.join(', ')}. Consider: pane expire ${seed}` : '✓ Clean — no unexpected senders detected.' });
}

async function cmdExpire(seed) {
  if (!seed) err('seed required. Usage: pane expire <seed>');
  const ctx = await store.get(seed);
  if (!ctx) err(`No context "${seed}"`);
  info(`Burning ${seed}…`);
  await Promise.all([
    alias.delete(ctx.aliasId).catch(e => { if (flags.verbose) info(`alias delete: ${e.message}`); }),
    ctx.cardToken ? card.freeze(ctx.cardToken).catch(e => { if (flags.verbose) info(`card freeze: ${e.message}`); }) : Promise.resolve(),
  ]);
  await store.tombstone(seed);
  out({ context: seed, alias: ctx.aliasEmail, status: 'expired', message: `${seed} burned. ${ctx.aliasEmail} deleted. Card frozen.` });
}

async function cmdFund(seed) {
  if (!seed)         err('seed required. Usage: pane fund <seed> --amount 12.00');
  if (!flags.amount) err('--amount required. Example: pane fund amber-circuit --amount 12.00');
  const ctx = await store.get(seed);
  if (!ctx) err(`No context "${seed}"`);
  if (!ctx.cardToken) err(`No card for context "${seed}"`);
  const cents = Math.round(flags.amount * 100);
  info(`Funding card ····${ctx.cardLast4} to $${flags.amount.toFixed(2)}…`);
  // Privacy.com card update endpoint: PATCH /v1/card
  const apiKey = process.env.PRIVACY_API_KEY;
  if (!apiKey) err('PRIVACY_API_KEY not set in .env');
  const resp = await fetch('https://api.privacy.com/v1/card', {
    method: 'PATCH',
    headers: { 'Authorization': `api-key ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: ctx.cardToken, spend_limit: cents, spend_limit_duration: 'TRANSACTION' }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    err(`Privacy.com API error ${resp.status}: ${body}`);
  }
  ok(`Card ····${ctx.cardLast4} funded to $${flags.amount.toFixed(2)}`);
}

async function cmdStatus() {
  const contexts = await store.list();
  if (!contexts.length) {
    console.log(c.dim('\n  pane — no active envelopes\n'));
    return;
  }
  const statuses = await Promise.all(contexts.map(async ctx => {
    const h = await inbox.getHealth(ctx.aliasId).catch(() => 'unknown');
    return { ...ctx, health: h };
  }));
  const clean   = statuses.filter(s => s.health === 'clean').length;
  const warning = statuses.filter(s => s.health === 'warning').length;
  const breach  = statuses.filter(s => s.health === 'breach').length;
  console.log(c.bold(`\n  pane status`));
  console.log(`  ${contexts.length} envelopes · ${c.green(clean + ' clean')} · ${warning ? c.yellow(warning + ' warning') : c.dim('0 warning')} · ${breach ? c.red(breach + ' breach') : c.dim('0 breach')}`);
  if (breach > 0)   console.log(`  ${c.red('⚠')} Run ${c.amber('pane audit <seed>')} on flagged contexts`);
  if (warning > 0)  console.log(`  ${c.yellow('·')} Run ${c.amber('pane audit <seed>')} to investigate warnings`);
  console.log('');
}

function cmdHelp() {
  console.log(`
  ${c.bold('pane')} — privacy envelope manager

  ${c.bold('commands')}
  ${c.teal('create-alias')}  <seed>                 alias email only
  ${c.teal('create-card')}   <seed> [--amount N]    $0 virtual card (or --amount to prefund)
  ${c.teal('create-context')}<seed>                 alias + $0 card together (envelope)
  ${c.teal('enroll')}        <url>  [--agent]       provision context for a URL; --agent runs Playwright
  ${c.teal('list')}          [--json]               all envelopes + health status
  ${c.teal('inbox')}         <seed> [--limit N]     read alias mail
  ${c.teal('audit')}         <seed>                 check for breach signals
  ${c.teal('expire')}        <seed>                 burn alias + freeze card
  ${c.teal('fund')}          <seed> --amount N      fund card to exact dollar amount
  ${c.teal('status')}                               quick health summary

  ${c.bold('flags')}
  ${c.dim('--json')}         raw JSON output
  ${c.dim('--quiet')}        suppress output
  ${c.dim('--verbose')}      extra detail
  ${c.dim('--agent')}        use Playwright browser for enroll
  ${c.dim('--limit N')}      message count for inbox (default 10)
  ${c.dim('--amount N')}     dollar amount for fund/create-card
  ${c.dim('--seed S')}       override context name for enroll

  ${c.bold('examples')}
  ${c.dim('pane create-context frost-ridge')}
  ${c.dim('pane enroll https://notion.so --agent')}
  ${c.dim('pane list')}
  ${c.dim('pane audit morning-brew')}
  ${c.dim('pane expire shopsite-app')}
  ${c.dim('pane fund amber-circuit --amount 12.00')}
  ${c.dim('pane inbox frost-ridge --limit 5')}

  ${c.bold('more')}
  ${c.dim('npm run check')}   pre-flight: verify API keys + Playwright
  ${c.dim('npm run demo')}    start local demo server at localhost:3141
  ${c.dim('npm test')}        run browser.js smoke tests
`);
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function stripTracking(url) {
  const TRACKING = ['fbclid','gclid','utm_source','utm_medium','utm_campaign','utm_term','utm_content','ref','mc_cid','mkt_tok'];
  try {
    const u = new URL(url);
    TRACKING.forEach(p => u.searchParams.delete(p));
    return u.toString();
  } catch { return url; }
}

// ── DISPATCH ──────────────────────────────────────────────────────────────────
try {
  switch (cmd) {
    case 'create-alias':    await cmdCreateAlias(posArgs[1]);   break;
    case 'create-card':     await cmdCreateCard(posArgs[1]);    break;
    case 'create-context':  await cmdCreateContext(posArgs[1]); break;
    case 'enroll':          await cmdEnroll(posArgs[1]);        break;
    case 'list':            await cmdList();                    break;
    case 'inbox':           await cmdInbox(posArgs[1]);         break;
    case 'audit':           await cmdAudit(posArgs[1]);         break;
    case 'expire':          await cmdExpire(posArgs[1]);        break;
    case 'fund':            await cmdFund(posArgs[1]);          break;
    case 'status':          await cmdStatus();                  break;
    case undefined:
    case 'help':
    case '--help':
    case '-h':              cmdHelp();                          break;
    default:
      console.error(c.red(`  Unknown command: ${cmd}`));
      console.error(c.dim('  Run: pane help'));
      process.exit(1);
  }
} catch (e) {
  console.error(c.red(`  ✗ ${e.message}`));
  if (flags.verbose) console.error(e.stack);
  process.exit(1);
}
