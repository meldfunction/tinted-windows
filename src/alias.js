/**
 * src/alias.js — Email alias layer
 *
 * Wraps Addy.io and SimpleLogin APIs.
 * Switched via EMAIL_PROVIDER env var.
 */

export class AliasService {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'addy';
    this.apiKey   = this.provider === 'addy'
      ? process.env.ADDY_API_KEY
      : process.env.SIMPLELOGIN_API_KEY;

    if (!this.apiKey) {
      throw new Error(`Missing API key for email provider "${this.provider}". Check your .env file.`);
    }
  }

  /**
   * Create a new alias email address.
   * @param {object} opts
   * @param {string} opts.name        - Context name (used as alias description)
   * @param {object} opts.identity    - Generated identity from IdentityGen
   * @param {string} [opts.description]
   * @returns {{ id: string, email: string }}
   */
  async create({ name, identity, description }) {
    if (this.provider === 'addy') return this.#addyCreate({ name, description: description || name });
    return this.#simpleloginCreate({ name, description: description || name });
  }

  /**
   * Delete an alias by ID (burns it — no more forwarding).
   * @param {string} aliasId
   */
  async delete(aliasId) {
    if (this.provider === 'addy') return this.#addyDelete(aliasId);
    return this.#simpleloginDelete(aliasId);
  }

  // ── ADDY.IO ────────────────────────────────────────────────────────────────

  async #addyCreate({ name, description }) {
    const domain = process.env.ALIAS_DOMAIN || undefined;
    const body   = { description };
    if (domain) body.domain = domain;

    const res = await fetch('https://app.addy.io/api/v1/aliases', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type':  'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Addy.io alias creation failed (${res.status}): ${text}`);
    }

    const { data } = await res.json();
    return { id: data.id, email: data.email };
  }

  async #addyDelete(aliasId) {
    const res = await fetch(`https://app.addy.io/api/v1/aliases/${aliasId}`, {
      method:  'DELETE',
      headers: { 'Authorization': `Bearer ${this.apiKey}`, 'X-Requested-With': 'XMLHttpRequest' }
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(`Addy.io alias deletion failed (${res.status})`);
    }
  }

  // ── SIMPLELOGIN ────────────────────────────────────────────────────────────

  async #simpleloginCreate({ name, description }) {
    const res = await fetch('https://app.simplelogin.io/api/alias/random/new', {
      method:  'POST',
      headers: {
        'Authentication': this.apiKey,
        'Content-Type':   'application/json'
      },
      body: JSON.stringify({ note: description })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`SimpleLogin alias creation failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    return { id: String(data.id), email: data.email };
  }

  async #simpleloginDelete(aliasId) {
    const res = await fetch(`https://app.simplelogin.io/api/aliases/${aliasId}`, {
      method:  'DELETE',
      headers: { 'Authentication': this.apiKey }
    });
    if (!res.ok) throw new Error(`SimpleLogin alias deletion failed (${res.status})`);
  }
}
