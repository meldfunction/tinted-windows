# pane 🪟

**Tinted windows for the web.**

You wouldn't mail a private letter on a postcard. But every time you sign up for a service — any service — that's exactly what you're doing. Your real email. Your real card. Your real IP. Handed to strangers, stored in databases you'll never see, sold to people you'll never know.

pane is the envelope.

---

## What it is

pane is an MCP server suite that automates personal privacy hygiene. Alias email, virtual cards, stealth form fills, central inbox monitoring — provisioned in a single command, managed from a single place.

It's not about hiding. It's not about doing anything wrong. It's about the same instinct that makes you close a curtain, use a private mailbox, or cover your PIN. These are the digital equivalents — and they should be as easy as opening a browser tab.

```
$ pane enroll notion.so
  ✓ alias: notion-x7k@pane.alias  [Addy.io]
  ✓ card: #4242 · $0 limit        [Privacy.com]
  ✓ enrolled as Jordan Ellis
```

That's it. notion.so has never seen your real email, your real card, or your real identity. When you're done with them:

```
$ pane expire notion
  ✓ alias burned · card frozen · context logged
```

They can no longer reach you. Not through spam. Not through a breach. Not through a data broker. The thread is cut.

---

## The threat model (plain English)

The web runs on surveillance. Not because the people building it are evil — because visibility is the default and nobody pays to change it. Here's what's watching:

- **Your email** — the universal ID that links you across every service, data broker, and ad network downstream
- **Your IP address** — ties your sessions together across platforms, even across different accounts
- **Your browser fingerprint** — canvas rendering, WebGL, font list. More stable than your IP. Survives VPNs.
- **Pixel trackers** — a 1×1 image in every email that phones home when you open it
- **URL decoration** — `?fbclid=` and `?utm_*` parameters that encode who sent you before you land
- **Your card number** — stored in databases you can't audit, breached in shops you trusted

pane seals each of these, layer by layer.

---

## MVP: what works right now

The core loop. No automation yet — just the envelope.

**Requirements:**
- [Addy.io](https://addy.io) account — free tier, get your API key at `addy.io/settings/api`
- [Privacy.com](https://privacy.com) account — free tier, get your API key at `app.privacy.com/developer`
- Node.js 18+
- Claude Desktop with MCP support

**Repo structure:**

```
pane/
├── index.html          ← visual essay / landing page (GitHub Pages)
├── README.md
├── server.js           ← MCP wire protocol + all tool handlers
├── package.json
├── .env.example
├── .gitignore
└── src/
    ├── alias.js        ← Addy.io + SimpleLogin API wrapper
    ├── card.js         ← Privacy.com API wrapper
    ├── identity.js     ← Deterministic fake identity generator
    ├── context.js      ← SQLite context store (~/.pane/contexts.db)
    └── services.js     ← InboxService, BrowserService (stub), logger
```

**Install:**

```bash
git clone https://github.com/yourhandle/pane
cd pane
npm install
```

This installs `dotenv` and `better-sqlite3` (context store). Playwright is a dev dependency — only needed when browser automation lands in the NEXT tier.

**Configure:**

```bash
cp .env.example .env
```

Open `.env` and fill in at minimum:

```env
ADDY_API_KEY=your_key_here        # addy.io/settings/api
PRIVACY_API_KEY=your_key_here     # app.privacy.com/developer
PANE_BASE_REGION=US-West
PANE_NAME_STYLE=generic-anglo
CARD_DEFAULT_LIMIT_CENTS=0
```

**Add to Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "pane": {
      "command": "node",
      "args": ["/absolute/path/to/pane/server.js"]
    }
  }
}
```

Restart Claude Desktop. You're ready.

---

## Commands

```
pane enroll <url>          Auto-signup: strips trackers, provisions alias + card, fills form
pane create-alias <name>   Spin up an alias email for a named context
pane create-card <name>    Create a virtual card for a named context
pane create-context <name> Bundle alias + card into a named envelope
pane list                  All active envelopes with health status
pane check-inbox <name>    Read alias emails — images proxied, no pixel phone-home
pane expire <name>         Burn alias, freeze card, log tombstone
pane audit <name>          Check a context for cross-contamination signals
```

---

## Ecosystem

pane doesn't build what already exists well. It orchestrates the best privacy services into a single, seamless envelope.

| Layer | Service | Tier | Notes |
|-------|---------|------|-------|
| Email alias | [Addy.io](https://addy.io) | MVP | Open source, API-first, free tier |
| Email alias | [SimpleLogin](https://simplelogin.io) | Alt | Proton-owned, great if you're in that ecosystem |
| Virtual card | [Privacy.com](https://privacy.com) | MVP | The gold standard. US only. |
| Virtual card | Revolut / Wise | Alt | Non-US fallback |
| VPN | [ProtonVPN](https://protonvpn.com) | MVP (free) | Free tier covers the network layer |
| VPN | [Mullvad](https://mullvad.net) | Next | API for per-context exit nodes. No account required. |
| Browser | [Brave](https://brave.com) | MVP (manual) | Built-in fingerprint resistance for manual browsing |
| Automation | Playwright + Stealth | Next | Powers `enroll()` — fills forms hands-free |
| Phone | [JMP.chat](https://jmp.chat) | Next | SMS-capable alias numbers per context |
| Phone | Google Voice | Workaround | Free, widely accepted, compromises Google graph |
| Phone | Prepaid SIM | Hard fallback | Cash-purchased, for carrier-required verification |
| CAPTCHA | [2captcha](https://2captcha.com) | Later | Stops handing Google behavioral data on every solve |
| Network | Tor | Later | High-sensitivity contexts |
| Comms | [Signal](https://signal.org) | Always | The envelope for real conversations |

---

## Roadmap

**NOW — Core envelope**
The fundamental privacy loop. Alias email, virtual cards, inbox monitoring, context management. Free to start with Addy.io + Privacy.com + ProtonVPN.

**NEXT — Automation layer**
`pane enroll <url>` — paste a URL, walk away. Playwright handles the form. Fingerprint spoofing so each session looks like a different device. JMP.chat for SMS verification. Tracker blocking before any request leaves your machine.

**LATER — Hardened**
Behavioral cadence randomization. CAPTCHA bypass via 2captcha. Residential proxy pool. Stylometric mixing for writing style. Full web dashboard. Tor routing for high-sensitivity contexts.

---

## The philosophy

**Envelopes, not masks.** Privacy isn't anonymity. You're still you — you just don't hand your return address to everyone you correspond with.

**One alias per relationship.** Each service gets exactly one alias. When it's sold, you know who. When you're done with them, you cut that thread — and only that thread.

**Friction is the enemy of hygiene.** Privacy tools people don't use protect no one. pane removes all the friction. One command. Done.

**Every alias is a canary.** When `notion-x7k` starts receiving pharma spam, Notion sold your data. You know exactly who, exactly when. Your privacy setup becomes a live data broker detector — as a side effect.

---

## Known limitations

**Phone verification is the hard wall.** JMP.chat covers most services. Some large platforms blocklist VOIP numbers — Google Voice is the pragmatic fallback (compromises the Google graph but is widely accepted). Prepaid SIM is the last resort for services requiring genuine carrier verification.

**CAPTCHA is surveillance.** Google reCAPTCHA fingerprints and scores you on every solve. `pane enroll` routes through 2captcha in the NEXT tier so we never hand Google a confirmed signal. Until then, some signups may require manual CAPTCHA completion.

**Behavioral biometrics persist.** Playwright's automated fills are inhuman by default — different enough from your real typing cadence to not match. We lean into this. Dedicated cadence randomization lands in the LATER tier.

---

## Contributing

This is early. The server is being built in the open.

If you've hit a wall on a specific service's signup flow, open an issue with the URL and what broke. If you've found a better approach to any of the envelope layers, PRs are welcome.

---

## License

MIT. Use it, fork it, improve it. Privacy tools should be free.

---

*Not hiding. Just not waving.*
