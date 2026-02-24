/**
 * src/context.js — Context store
 *
 * Lightweight SQLite store for envelope state.
 * Each context = one alias + one card + one generated identity.
 * Stored locally at ~/.pane/contexts.db
 */

import { createRequire } from 'module';
import { homedir }       from 'os';
import { mkdirSync }     from 'fs';
import { join }          from 'path';

const require = createRequire(import.meta.url);

export class ContextStore {
  constructor() {
    const dbPath = process.env.PANE_DB_PATH ||
      join(homedir(), '.pane', 'contexts.db');
    mkdirSync(join(homedir(), '.pane'), { recursive: true });
    // Lazy-load better-sqlite3 so server still parses without it installed
    try {
      const Database = require('better-sqlite3');
      this.db = new Database(dbPath);
    } catch {
      console.warn('[pane] better-sqlite3 not found — context store disabled. Run: npm install better-sqlite3');
      this.db = null;
    }
  }

  async init() {
    if (!this.db) return;
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS contexts (
        name        TEXT PRIMARY KEY,
        alias_email TEXT,
        alias_id    TEXT,
        card_token  TEXT,
        card_last4  TEXT,
        identity    TEXT,
        enroll_url  TEXT,
        status      TEXT DEFAULT 'active',
        created_at  TEXT,
        expired_at  TEXT
      );
    `);
  }

  async save(ctx) {
    if (!this.db) return;
    this.db.prepare(`
      INSERT OR REPLACE INTO contexts
        (name, alias_email, alias_id, card_token, card_last4, identity, enroll_url, status, created_at)
      VALUES
        (@name, @aliasEmail, @aliasId, @cardToken, @cardLast4, @identity, @enrollUrl, 'active', @createdAt)
    `).run({
      ...ctx,
      identity: JSON.stringify(ctx.identity || {}),
      enrollUrl: ctx.enrollUrl || null
    });
  }

  async update(name, fields) {
    if (!this.db) return;
    const existing = this.db.prepare('SELECT * FROM contexts WHERE name = ?').get(name) || {};
    await this.save({ ...existing, identity: existing.identity ? JSON.parse(existing.identity) : {}, name, ...fields });
  }

  async get(name) {
    if (!this.db) return null;
    const row = this.db.prepare('SELECT * FROM contexts WHERE name = ? AND status = "active"').get(name);
    if (!row) return null;
    return { ...row, aliasEmail: row.alias_email, aliasId: row.alias_id, cardToken: row.card_token, cardLast4: row.card_last4, enrollUrl: row.enroll_url, identity: JSON.parse(row.identity || '{}') };
  }

  async list() {
    if (!this.db) return [];
    return this.db.prepare('SELECT * FROM contexts WHERE status = "active" ORDER BY created_at DESC').all()
      .map(row => ({ ...row, aliasEmail: row.alias_email, aliasId: row.alias_id, cardToken: row.card_token, cardLast4: row.card_last4 }));
  }

  async tombstone(name) {
    if (!this.db) return;
    this.db.prepare('UPDATE contexts SET status = "expired", expired_at = ? WHERE name = ?')
      .run(new Date().toISOString(), name);
  }
}
