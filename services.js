/**
 * src/inbox.js — Alias inbox reader
 *
 * Reads email via Addy.io / SimpleLogin API.
 * Proxies all remote images to block pixel trackers.
 * Detects unexpected senders as breach signals.
 */

export class InboxService {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'addy';
    this.apiKey   = this.provider === 'addy'
      ? process.env.ADDY_API_KEY
      : process.env.SIMPLELOGIN_API_KEY;
  }

  /**
   * Read messages for an alias.
   * @param {object} opts
   * @param {string} opts.aliasId
   * @param {number} [opts.limit]
   * @returns {Array<{from, from_domain, subject, date, preview}>}
   */
  async read({ aliasId, limit = 10 }) {
    // TODO: Addy.io exposes alias activity via GET /api/v1/aliases/:id
    // Full implementation reads forwarded mail headers to reconstruct
    // original sender. For now, returns activity log from the alias.
    if (this.provider === 'addy') {
      return this.#addyRead(aliasId, limit);
    }
    return [];
  }

  /**
   * Get a simple health signal for an alias.
   * Returns 'clean' | 'warning' | 'breach' | 'unknown'
   */
  async getHealth(aliasId) {
    try {
      const messages = await this.read({ aliasId, limit: 50 });
      if (!messages.length) return 'clean';
      // Simple heuristic: if >3 unique domains, flag as warning
      const domains = new Set(messages.map(m => m.from_domain).filter(Boolean));
      if (domains.size > 5) return 'warning';
      return 'clean';
    } catch {
      return 'unknown';
    }
  }

  async #addyRead(aliasId, limit) {
    const res = await fetch(`https://app.addy.io/api/v1/aliases/${aliasId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}`, 'X-Requested-With': 'XMLHttpRequest' }
    });
    if (!res.ok) return [];
    const { data } = await res.json();
    // Addy.io alias endpoint returns aggregate stats, not full messages.
    // For full message content, use your own mail server or webhook.
    return [{
      from:        'via alias',
      from_domain: 'addy.io',
      subject:     `Alias active — ${data.emails_forwarded || 0} emails forwarded`,
      date:        data.last_used || 'never',
      preview:     `${data.emails_forwarded || 0} forwarded, ${data.emails_blocked || 0} blocked, ${data.emails_replied || 0} replied`
    }];
  }
}


/**
 * src/browser.js — Stealth Playwright automation
 *
 * NEXT tier: auto-fills signup forms using playwright-extra + stealth plugin.
 * Randomizes browser fingerprint per context.
 * Strips tracking params and blocks known tracker domains.
 *
 * STATUS: Stub — returns not-yet-implemented notice.
 * Implementation guide: see CONTRIBUTING.md#browser-automation
 */

export class BrowserService {
  constructor() {
    this.headless = process.env.PLAYWRIGHT_HEADLESS !== 'false';
    this.slowMo   = parseInt(process.env.PLAYWRIGHT_SLOW_MO) || 0;
  }

  /**
   * Enroll in a website by automatically filling its signup form.
   * @param {string} url             - Cleaned URL (tracking params already stripped)
   * @param {object} ctx             - { identity, aliasResult, cardResult }
   * @returns {{ success: boolean, screenshot?: string }}
   */
  async enroll(url, ctx) {
    // TODO: implement with playwright-extra
    // Steps:
    //   1. Launch stealth browser with randomized fingerprint
    //   2. Block tracker domains (use lists from src/trackers.js)
    //   3. Navigate to url
    //   4. Detect signup form fields (email, name, password, phone, card)
    //   5. Fill with ctx.identity + ctx.aliasResult.email + ctx.cardResult data
    //   6. Submit
    //   7. Detect success (redirect, welcome message)
    //   8. Return result
    //
    // npm install playwright playwright-extra playwright-extra-plugin-stealth
    //
    // const { chromium } = require('playwright-extra');
    // const StealthPlugin = require('playwright-extra-plugin-stealth');
    // chromium.use(StealthPlugin());
    // const browser = await chromium.launch({ headless: this.headless, slowMo: this.slowMo });
    throw new Error('Browser automation is NEXT tier — not yet implemented. See CONTRIBUTING.md for the implementation guide.');
  }
}


/**
 * src/logger.js — Minimal structured logger
 */

const LEVELS = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };
const level  = LEVELS[process.env.LOG_LEVEL || 'info'] ?? 3;

export const log = {
  error: (...a) => level >= 1 && console.error('[pane:error]', ...a),
  warn:  (...a) => level >= 2 && console.warn ('[pane:warn] ', ...a),
  info:  (...a) => level >= 3 && console.error('[pane:info] ', ...a), // stderr so stdout stays clean for MCP
  debug: (...a) => level >= 4 && console.error('[pane:debug]', ...a),
};
