/**
 * src/card.js — Virtual card layer
 *
 * Wraps Privacy.com API.
 * US only. For non-US, swap in Revolut/Wise.
 */

const PRIVACY_BASE = 'https://api.privacy.com/v1';

export class CardService {
  constructor() {
    this.apiKey = process.env.PRIVACY_API_KEY;
    if (!this.apiKey) {
      throw new Error('Missing PRIVACY_API_KEY. Get yours at app.privacy.com/developer.');
    }
  }

  /**
   * Create a new virtual card.
   * @param {object} opts
   * @param {string} opts.memo          - Label for the card (context name)
   * @param {number} [opts.spend_limit] - Spend limit in cents. 0 = no funds.
   * @param {string} [opts.merchant_lock] - Lock to a specific merchant domain
   * @returns {{ token: string, last_four: string, state: string }}
   */
  async create({ memo, spend_limit = 0, merchant_lock }) {
    const body = {
      memo,
      type:        merchant_lock ? 'MERCHANT_LOCKED' : 'UNLOCKED',
      spend_limit,
      spend_limit_duration: 'TRANSACTION'
    };
    if (merchant_lock) body.merchant_locked = merchant_lock;

    const res = await fetch(`${PRIVACY_BASE}/card`, {
      method:  'POST',
      headers: {
        'Authorization': `api-key ${this.apiKey}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Privacy.com card creation failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    return {
      token:     data.token,
      last_four: data.last_four,
      state:     data.state
    };
  }

  /**
   * Freeze a card instantly. Stops all future charges.
   * @param {string} cardToken
   */
  async freeze(cardToken) {
    const res = await fetch(`${PRIVACY_BASE}/card`, {
      method:  'PUT',
      headers: {
        'Authorization': `api-key ${this.apiKey}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({ card_token: cardToken, state: 'PAUSED' })
    });
    if (!res.ok) throw new Error(`Privacy.com card freeze failed (${res.status})`);
  }

  /**
   * Set a new spend limit on an existing card (e.g. to fund it).
   * @param {string} cardToken
   * @param {number} limitCents
   */
  async setLimit(cardToken, limitCents) {
    const res = await fetch(`${PRIVACY_BASE}/card`, {
      method:  'PUT',
      headers: {
        'Authorization': `api-key ${this.apiKey}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({ card_token: cardToken, spend_limit: limitCents })
    });
    if (!res.ok) throw new Error(`Privacy.com limit update failed (${res.status})`);
  }
}
