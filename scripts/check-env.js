#!/usr/bin/env node
/**
 * scripts/check-env.js — pre-flight check
 * Run: npm run check
 *
 * Verifies API keys are set and can reach their services.
 * Prints a clear GO / NO-GO for each layer.
 */

import 'dotenv/config';

const G  = '\x1b[32m✓\x1b[0m';
const R  = '\x1b[31m✗\x1b[0m';
const Y  = '\x1b[33m⚠\x1b[0m';
const D  = '\x1b[2m';
const X  = '\x1b[0m';

async function checkAddy() {
  const key = process.env.ADDY_API_KEY;
  if (!key) return { ok: false, msg: 'ADDY_API_KEY not set in .env' };
  try {
    const r = await fetch('https://app.addy.io/api/v1/account-details', {
      headers: { 'Authorization': `Bearer ${key}`, 'X-Requested-With': 'XMLHttpRequest' },
      signal: AbortSignal.timeout(5000),
    });
    if (r.ok) {
      const d = await r.json();
      return { ok: true, msg: `Connected — ${d.data?.username || 'account verified'}` };
    }
    return { ok: false, msg: `API returned ${r.status} — check key at addy.io/settings/api` };
  } catch (e) {
    return { ok: false, msg: `Network error: ${e.message}` };
  }
}

async function checkPrivacy() {
  const key = process.env.PRIVACY_API_KEY;
  if (!key) return { ok: null, msg: 'PRIVACY_API_KEY not set (US only — skip if outside US)' };
  try {
    const r = await fetch('https://api.privacy.com/v1/card', {
      headers: { 'Authorization': `api-key ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    if (r.ok) return { ok: true, msg: 'Connected — Privacy.com API active' };
    return { ok: false, msg: `API returned ${r.status} — check key at app.privacy.com/developer` };
  } catch (e) {
    return { ok: false, msg: `Network error: ${e.message}` };
  }
}

async function checkPlaywright() {
  try {
    await import('playwright');
    return { ok: true, msg: 'playwright installed — agent mode available' };
  } catch {
    return { ok: null, msg: 'playwright not installed — run: npm install playwright\n         (required for agent mode; manual mode works without it)' };
  }
}

function checkEnvVars() {
  const vars = [
    ['EMAIL_PROVIDER',         process.env.EMAIL_PROVIDER || 'addy (default)'],
    ['PANE_BASE_REGION',       process.env.PANE_BASE_REGION || 'US-West (default)'],
    ['PANE_NAME_STYLE',        process.env.PANE_NAME_STYLE || 'generic-anglo (default)'],
    ['CARD_DEFAULT_LIMIT_CENTS', process.env.CARD_DEFAULT_LIMIT_CENTS || '0 (default)'],
  ];
  return vars;
}

async function main() {
  console.log('\n  pane pre-flight check\n  ' + '─'.repeat(40));

  const [addy, priv, pw] = await Promise.all([checkAddy(), checkPrivacy(), checkPlaywright()]);

  const icon = r => r.ok === true ? G : r.ok === false ? R : Y;
  console.log(`\n  ${icon(addy)}  Addy.io         ${addy.msg}`);
  console.log(`  ${icon(priv)}  Privacy.com     ${priv.msg}`);
  console.log(`  ${icon(pw)}  Playwright      ${pw.msg}`);

  console.log('\n  Config:');
  checkEnvVars().forEach(([k, v]) => console.log(`  ${D}  ${k.padEnd(28)} ${v}${X}`));

  const broken = [addy, priv].filter(r => r.ok === false);
  console.log('');
  if (broken.length === 0) {
    console.log(`  ${G}  Ready. Run: npm run demo\n`);
  } else {
    console.log(`  ${R}  ${broken.length} issue(s) — fix above before running.\n`);
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
