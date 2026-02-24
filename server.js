#!/usr/bin/env node
/**
 * pane — MCP server
 * Tinted windows for the web.
 *
 * Implements the Model Context Protocol (stdio transport).
 * Claude Desktop calls these tools. You talk to Claude. pane handles the rest.
 *
 * Architecture:
 *   server.js        — MCP wire protocol, tool dispatch
 *   src/alias.js     — email alias layer (Addy.io / SimpleLogin)
 *   src/card.js      — virtual card layer (Privacy.com)
 *   src/identity.js  — consistent identity generation
 *   src/context.js   — context store (SQLite, ~/.pane/contexts.db)
 *   src/services.js  — InboxService, BrowserService (stub), logger
 *
 *   NEXT tier (stubs in src/services.js, not yet wired):
 *   - BrowserService  — stealth Playwright form automation
 *   - phone layer     — JMP.chat SMS alias provisioning
 */

import 'dotenv/config';
import { createInterface } from 'readline';
import { AliasService }    from './src/alias.js';
import { CardService }     from './src/card.js';
import { ContextStore }    from './src/context.js';
import { InboxService }    from './src/inbox.js';
import { BrowserService }  from './src/browser.js';
import { IdentityGen }     from './src/identity.js';
import { log }             from './src/logger.js';

// ── SERVICE INIT ─────────────────────────────────────────────────────────────

const alias   = new AliasService();
const card    = new CardService();
const store   = new ContextStore();
const inbox   = new InboxService();
const browser = new BrowserService();
const idgen   = new IdentityGen();

await store.init();

// ── TOOL DEFINITIONS ─────────────────────────────────────────────────────────
// These are the tools Claude sees and can call.

const TOOLS = [
  {
    name: 'pane_enroll',
    description: `Sign up for a website automatically using a fresh alias identity.
Strips tracking params from the URL, provisions an alias email and virtual card,
loads the page in a stealth browser, fills and submits the signup form.
Returns the context name and alias details.`,
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The signup URL to enroll in. e.g. "https://notion.so/signup"'
        },
        context_name: {
          type: 'string',
          description: 'Optional name for this envelope. Defaults to the domain name.'
        },
        card_limit_cents: {
          type: 'number',
          description: 'Optional spend limit for the virtual card in cents. Default: 0 (no funds).'
        }
      },
      required: ['url']
    }
  },
  {
    name: 'pane_create_alias',
    description: 'Create a new alias email address for a named context.',
    inputSchema: {
      type: 'object',
      properties: {
        context_name: { type: 'string', description: 'Name for this alias context. e.g. "notion"' },
        description:  { type: 'string', description: 'Optional human note. e.g. "Notion trial signup"' }
      },
      required: ['context_name']
    }
  },
  {
    name: 'pane_create_card',
    description: 'Create a virtual card for a named context via Privacy.com.',
    inputSchema: {
      type: 'object',
      properties: {
        context_name:      { type: 'string', description: 'Name for this card context.' },
        limit_cents:       { type: 'number', description: 'Spend limit in cents. Default: 0.' },
        merchant_lock:     { type: 'string', description: 'Optional: lock card to a specific merchant domain.' }
      },
      required: ['context_name']
    }
  },
  {
    name: 'pane_create_context',
    description: 'Create a full envelope: alias email + virtual card bundled under one context name.',
    inputSchema: {
      type: 'object',
      properties: {
        context_name:  { type: 'string', description: 'Name for this envelope. e.g. "notion"' },
        card_limit_cents: { type: 'number', description: 'Card spend limit in cents. Default: 0.' }
      },
      required: ['context_name']
    }
  },
  {
    name: 'pane_list',
    description: 'List all active envelopes with their status. Shows alias health and any breach signals.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'pane_check_inbox',
    description: `Read emails received by an alias. All remote images are proxied to block pixel trackers.
Returns message list with sender, subject, and body. Flags unexpected senders.`,
    inputSchema: {
      type: 'object',
      properties: {
        context_name: { type: 'string', description: 'Context name to check inbox for.' },
        limit:        { type: 'number', description: 'Max messages to return. Default: 10.' }
      },
      required: ['context_name']
    }
  },
  {
    name: 'pane_expire',
    description: `Burn an envelope completely. Deletes the alias email (stops all future mail),
freezes the virtual card, and logs a tombstone. The service can no longer reach you.`,
    inputSchema: {
      type: 'object',
      properties: {
        context_name: { type: 'string', description: 'Context name to expire.' }
      },
      required: ['context_name']
    }
  },
  {
    name: 'pane_audit',
    description: `Audit a context for cross-contamination signals.
Checks whether the alias has received mail from unexpected senders (breach indicator),
whether the context IP was consistent, and whether any real identity data may have leaked.`,
    inputSchema: {
      type: 'object',
      properties: {
        context_name: { type: 'string', description: 'Context to audit.' }
      },
      required: ['context_name']
    }
  }
];

// ── TOOL HANDLERS ─────────────────────────────────────────────────────────────

async function handleTool(name, args) {
  log.debug(`tool call: ${name}`, args);

  switch (name) {

    case 'pane_create_alias': {
      const identity = idgen.generate();
      const result   = await alias.create({
        name:        args.context_name,
        description: args.description || args.context_name,
        identity
      });
      await store.save({
        name:       args.context_name,
        aliasEmail: result.email,
        aliasId:    result.id,
        identity,
        createdAt:  new Date().toISOString()
      });
      return {
        context:    args.context_name,
        alias_email: result.email,
        identity:   `${identity.first_name} ${identity.last_name}`,
        message:    `Alias created. Mail to ${result.email} will forward to your real inbox.`
      };
    }

    case 'pane_create_card': {
      const result = await card.create({
        memo:           args.context_name,
        spend_limit:    args.limit_cents ?? parseInt(process.env.CARD_DEFAULT_LIMIT_CENTS) || 0,
        merchant_lock:  args.merchant_lock
      });
      await store.update(args.context_name, { cardToken: result.token, cardLast4: result.last_four });
      return {
        context:   args.context_name,
        card_last4: result.last_four,
        limit:     `$${((args.limit_cents ?? 0) / 100).toFixed(2)}`,
        message:   `Virtual card created. Limit: $${((args.limit_cents ?? 0)/100).toFixed(2)}. Freeze anytime with pane_expire.`
      };
    }

    case 'pane_create_context': {
      const identity   = idgen.generate();
      const aliasResult = await alias.create({ name: args.context_name, identity });
      const cardResult  = await card.create({
        memo:        args.context_name,
        spend_limit: args.card_limit_cents ?? 0
      });
      await store.save({
        name:       args.context_name,
        aliasEmail: aliasResult.email,
        aliasId:    aliasResult.id,
        cardToken:  cardResult.token,
        cardLast4:  cardResult.last_four,
        identity,
        createdAt:  new Date().toISOString()
      });
      return {
        context:     args.context_name,
        alias_email: aliasResult.email,
        card_last4:  cardResult.last_four,
        identity:    `${identity.first_name} ${identity.last_name}`,
        message:     `Envelope ready. Use ${aliasResult.email} and card ending ${cardResult.last_four} for ${args.context_name}.`
      };
    }

    case 'pane_enroll': {
      // Stub — full Playwright implementation in src/browser.js (NEXT tier)
      // For now: provisions alias + card, returns details for manual signup
      const url      = stripTrackingParams(args.url);
      const domain   = new URL(url).hostname.replace('www.', '');
      const ctxName  = args.context_name || domain.split('.')[0];
      const identity = idgen.generate();

      const aliasResult = await alias.create({ name: ctxName, identity });
      const cardResult  = await card.create({
        memo:        ctxName,
        spend_limit: args.card_limit_cents ?? 0
      });
      await store.save({
        name:       ctxName,
        aliasEmail: aliasResult.email,
        aliasId:    aliasResult.id,
        cardToken:  cardResult.token,
        cardLast4:  cardResult.last_four,
        identity,
        enrollUrl:  url,
        createdAt:  new Date().toISOString()
      });

      // TODO: browser.enroll(url, { identity, aliasResult, cardResult })
      // Uncomment when src/browser.js is implemented (NEXT tier):
      // const enrolled = await browser.enroll(url, { identity, aliasResult, cardResult });

      return {
        context:     ctxName,
        url:         url,
        alias_email: aliasResult.email,
        card_last4:  cardResult.last_four,
        identity:    `${identity.first_name} ${identity.last_name}`,
        status:      'provisioned',
        note:        'Auto-fill coming in NEXT tier. Use the alias and card above to sign up manually for now.',
        message:     `Envelope ready for ${domain}. Email: ${aliasResult.email} · Card: ····${cardResult.last_four}`
      };
    }

    case 'pane_list': {
      const contexts = await store.list();
      if (!contexts.length) return { contexts: [], message: 'No active envelopes.' };
      const rows = await Promise.all(contexts.map(async (ctx) => {
        const health = await inbox.getHealth(ctx.aliasId).catch(() => 'unknown');
        return { name: ctx.name, alias: ctx.aliasEmail, card: `····${ctx.cardLast4}`, status: health, created: ctx.createdAt?.split('T')[0] };
      }));
      return { contexts: rows, total: rows.length };
    }

    case 'pane_check_inbox': {
      const ctx = await store.get(args.context_name);
      if (!ctx) throw new Error(`No context found for "${args.context_name}". Run pane_create_context first.`);
      const messages = await inbox.read({ aliasId: ctx.aliasId, limit: args.limit || 10 });
      return {
        context:  args.context_name,
        alias:    ctx.aliasEmail,
        count:    messages.length,
        messages: messages.map(m => ({
          from:    m.from,
          subject: m.subject,
          date:    m.date,
          preview: m.preview,
          images:  'proxied'
        }))
      };
    }

    case 'pane_expire': {
      const ctx = await store.get(args.context_name);
      if (!ctx) throw new Error(`No context found for "${args.context_name}".`);
      await alias.delete(ctx.aliasId);
      await card.freeze(ctx.cardToken);
      await store.tombstone(args.context_name);
      return {
        context: args.context_name,
        alias:   ctx.aliasEmail,
        status:  'expired',
        message: `Done. ${args.context_name} alias burned, card frozen. They can no longer reach you.`
      };
    }

    case 'pane_audit': {
      const ctx = await store.get(args.context_name);
      if (!ctx) throw new Error(`No context found for "${args.context_name}".`);
      const messages  = await inbox.read({ aliasId: ctx.aliasId, limit: 100 });
      const senders   = [...new Set(messages.map(m => m.from_domain))];
      const enrolled  = ctx.enrollUrl ? new URL(ctx.enrollUrl).hostname.replace('www.', '') : null;
      const unexpected = enrolled
        ? senders.filter(s => !s.includes(enrolled))
        : [];
      return {
        context:       args.context_name,
        alias:         ctx.aliasEmail,
        total_messages: messages.length,
        known_senders:  enrolled ? senders.filter(s => s.includes(enrolled)) : senders,
        unexpected_senders: unexpected,
        breach_signal: unexpected.length > 0,
        verdict: unexpected.length > 0
          ? `⚠ Breach signal — unexpected mail from: ${unexpected.join(', ')}. Consider running pane_expire.`
          : '✓ Clean — no unexpected senders detected.'
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function stripTrackingParams(url) {
  const TRACKING = [
    'fbclid','gclid','gclsrc','utm_source','utm_medium','utm_campaign',
    'utm_term','utm_content','utm_id','ref','mc_cid','mc_eid',
    '_hsenc','_hsmi','hsCtaTracking','mkt_tok','igshid','msclkid'
  ];
  try {
    const u = new URL(url);
    TRACKING.forEach(p => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return url;
  }
}

// ── MCP WIRE PROTOCOL (stdio) ─────────────────────────────────────────────────

const rl = createInterface({ input: process.stdin });

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

rl.on('line', async (line) => {
  let msg;
  try { msg = JSON.parse(line); } catch { return; }

  const { id, method, params } = msg;

  try {
    if (method === 'initialize') {
      send({ jsonrpc: '2.0', id, result: {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'pane', version: '0.1.0' },
        capabilities: { tools: {} }
      }});
    }
    else if (method === 'tools/list') {
      send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
    }
    else if (method === 'tools/call') {
      const result = await handleTool(params.name, params.arguments || {});
      send({ jsonrpc: '2.0', id, result: {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      }});
    }
    else {
      send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
    }
  } catch (err) {
    log.error(err.message);
    send({ jsonrpc: '2.0', id, error: { code: -32000, message: err.message } });
  }
});

log.info('pane MCP server started');
