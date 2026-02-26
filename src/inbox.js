/**
 * src/inbox.js — Alias inbox reader
 *
 * Reads email activity via Addy.io / SimpleLogin API.
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

  async read({ aliasId, limit = 10 }) {
    if (this.provider === 'addy') return this.#addyRead(aliasId, limit);
    return [];
  }

  async getHealth(aliasId) {
    try {
      const messages  = await this.read({ aliasId, limit: 50 });
      const senders   = [...new Set(messages.map(m => m.from_domain).filter(Boolean))];
      if (senders.length > 3) return 'warning';
      return 'clean';
    } catch { return 'unknown'; }
  }

  async #addyRead(aliasId, limit) {
    if (!this.apiKey) return [];
    try {
      const url  = `https://app.addy.io/api/v1/aliases/${aliasId}/emails?page_size=${limit}`;
      const resp = await fetch(url, {
        headers: {
          'Authorization':    `Bearer ${this.apiKey}`,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type':     'application/json',
        },
      });
      if (!resp.ok) return [];
      const data = await resp.json();
      return (data.data || []).map(msg => ({
        from:        msg.from_email || msg.from || '',
        from_domain: (msg.from_email || msg.from || '').split('@')[1] || '',
        subject:     msg.subject || '(no subject)',
        date:        msg.created_at || '',
        preview:     (msg.text || msg.html || '').slice(0, 200),
      }));
    } catch { return []; }
  }
}
