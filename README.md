# pane 🪟

**Tinted windows for the web.**

You wouldn't mail a private letter on a postcard. But every time you sign up for a service — any service — that's exactly what you're doing. Your real email. Your real card. Your real IP. Handed to strangers, stored in databases you'll never see, sold to people you'll never know.

pane is the envelope.

---

```
$ pane enroll notion.so
  → stripping tracking params
  → spinning alias [Addy.io]...
  ✓ notion-x7k@pane.alias created
  → creating virtual card [Privacy.com] ($0 limit)...
  ✓ card #4242 · Notion context saved
  ✓ enrolled as Jordan Ellis · Washington, DC

$ pane list
  notion        [Addy.io]  clean       9:14am
  figma         [Addy.io]  clean       yesterday
  shopsite-app  [Addy.io]  ⚠ spam     3:12am → burn?

$ pane expire shopsite-app
  → deleting alias...
  → freezing card...
  ✓ alias burned · card frozen · context logged
```

They can no longer reach you. Not through spam. Not through a breach. Not through a data broker. The thread is cut.

---

## What it is

pane is an MCP server suite that automates personal privacy hygiene. Alias email, virtual cards, stealth form fills, central inbox monitoring — provisioned in a single command, managed from a single place.

It's not about hiding. It's not about doing anything wrong. It's about the same instinct that makes you close a curtain, use a private mailbox, or cover your PIN. These are the digital equivalents — and they should be as easy as opening a browser tab.

**Site:** [index.html](./index.html) — the full visual essay  
**Stack:** [stack.html](./stack.html) — the 7-layer architecture  
**Services:** [services.html](./services.html) — every tool in the ecosystem  
**Toolkit:** [toolkit.html](./toolkit.html) — modular components for privacy-minded builders  
**Agents:** [AGENTS.md](./AGENTS.md) — standalone agent prototype, jurisdiction guide, placeholder workflow

---

## How to use these files

New here? Start in order. Already running your own setup? Jump to what you need.

| Step | File | What it does |
|------|------|-------------|
| 1 | [WORKFLOWS.md](./WORKFLOWS.md) | The full walkthrough — setup, seeds, alias map, VPN, placeholder accounts |
| 2 | [scrambler.py](./scrambler.py) | Run this first. Generates random word-pair seeds for your aliases. |
| 3 | [.env.example](./.env.example) | Copy to `.env`, add your API keys, set your region |
| 4 | [server.js](./server.js) | The MCP server — start this, then talk to Claude Desktop |
| 5 | [AGENTS.md](./AGENTS.md) | Agent prototype — standalone operation without Claude, jurisdiction guide |

**If you are an Anthropic / Claude Desktop user:** go to [WORKFLOWS.md §2](./WORKFLOWS.md#2-claude-desktop--anthropic-users) — it covers exactly how to wire pane into your Claude project folder.

**If you are a CLI user:** go to [WORKFLOWS.md §3](./WORKFLOWS.md#3-standalone-cli-no-ai) — no AI required.

**If you are a journalist or high-risk user:** read [AGENTS.md](./AGENTS.md) first, then [WORKFLOWS.md §9](./WORKFLOWS.md#9-journalist--high-risk-workflow).

---

## The threat model (plain English)

The web runs on surveillance. Not because the people building it are evil — because visibility is the default and nobody pays to change it.

**Your email** is your universal ID. It links you across every service, data broker, and ad network downstream. Every alias pane creates is a named canary — when `shopsite-x7k` receives pharma spam at 3am, you know exactly who sold it.

**Your IP address** ties your sessions together across platforms. A VPN helps but doesn't solve the problem — browser fingerprinting survives VPNs entirely.

**Your browser fingerprint** — canvas rendering hash, WebGL renderer, installed fonts (247 is nearly unique), screen resolution, audio context hash — is more stable than your IP. Survives cookie deletion. Survives incognito. Survives most VPNs. EFF's Cover Your Tracks finds 83.6% of browsers are uniquely identifiable without cookies.

**Your card number** is stored in databases you can't audit. One breach at one merchant exposes it permanently.

**Your face** is the identifier that doesn't change when you burn an alias. Clearview AI has scraped 30+ billion photos. PimEyes lets anyone search by face for $29/month. The photo you posted seven years ago is still in those databases.

**Data brokers** aggregate it all. For $0.99/month: full name, age, current address in Washington, DC or wherever you live, 3–6 prior addresses, phone numbers, email addresses, relatives with ages, estimated home value, political affiliation, vehicle registrations. Opt-out requires 127+ individual requests — and most re-acquire the data within 90 days from fresh public records sweeps.

pane seals each of these, layer by layer.

---

## MVP: what works right now

**Requirements:**
- [Addy.io](https://addy.io) — free tier, API key at `addy.io/settings/api`
- [Privacy.com](https://privacy.com) — free tier, API key at `app.privacy.com/developer`
- Node.js 18+
- Claude Desktop with MCP support

**Repo structure:**

```
pane/
├── index.html          ← landing page / visual essay (GitHub Pages)
├── stack.html          ← 7-layer isometric architecture diagram
├── services.html       ← full ecosystem service grid with photo cloaking layer
├── toolkit.html        ← modular components for builders; dashboard, CLI, agent prototype
├── README.md
├── AGENTS.md           ← agent prototype, security model, jurisdiction guide
├── server.js           ← MCP wire protocol + all tool handlers
├── package.json
├── .env.example        ← copy to .env and fill in keys
├── .gitignore
└── src/
    ├── alias.js        ← Addy.io + SimpleLogin API wrapper
    ├── card.js         ← Privacy.com API wrapper
    ├── identity.js     ← deterministic fake identity generator
    ├── context.js      ← SQLite context store (~/.pane/contexts.db)
    └── services.js     ← InboxService, BrowserService (stub), logger
```

**Install:**

```bash
git clone https://github.com/meldfunction/pane
cd pane
npm install
cp .env.example .env
# open .env and add ADDY_API_KEY and PRIVACY_API_KEY at minimum
```

**Add to Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

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

Restart Claude Desktop. Talk to Claude naturally:

```
"sign me up for that new AI writing tool"
"check if notion has emailed me"
"I don't like it, cancel everything"
```

---

## Commands

| Command | What it does |
|---------|-------------|
| `pane enroll <url>` | Auto-signup: strips trackers, provisions alias + card, fills form |
| `pane create-alias <n>` | Spin up an alias email for a named context |
| `pane create-card <n>` | Create a virtual card for a named context |
| `pane create-context <n>` | Bundle alias + card into a named envelope |
| `pane list` | All active envelopes with health status |
| `pane check-inbox <n>` | Read alias emails — images proxied, no pixel phone-home |
| `pane expire <n>` | Burn alias, freeze card, log tombstone |
| `pane audit <n>` | Check a context for cross-contamination and breach signals |

---

## Roadmap

### 01 · NOW — Core envelope
Alias email + virtual cards + inbox monitoring. The fundamental privacy loop. Free to start with Addy.io + Privacy.com + ProtonVPN (free tier).

### 02 · NEXT — Automation
`pane enroll <url>` — paste a URL, walk away. Playwright handles the form. Fingerprint spoofing per session: canvas hash, WebGL, font list, screen resolution all randomized. JMP.chat for SMS verification. Tracker stripping before any request leaves your machine.

### 03 · LATER — Hardened
Behavioral cadence randomization (typing patterns, mouse paths — all linkable). CAPTCHA bypass via 2captcha. Residential proxy pool. Stylometric mixing so writing style doesn't fingerprint you across platforms. Full web dashboard.

### 04 · HORIZON — Agent era `[speculation]`
Background agents that monitor all active aliases continuously, rotate exit IPs per invocation, and run on hosted compute with clean Monero-funded identities that never touch yours. Journalist workflow: personal device sends a Signal message; the agent outside the jurisdiction does the filing. See the [speculative section](./index.html#speculative) of the site for the full architecture.

### 05 · INFRASTRUCTURE — The big swing `[speculation]`

A design brief for what this becomes with resources, talent, and time.

**Browser extension** — intercepts every signup everywhere. Privacy becomes invisible infrastructure, like HTTPS.

**Automated legal arsenal** — CCPA + GDPR deletion requests fire the moment a breach is detected. 30-day clock. Day 31: pre-formatted state AG complaint. Day 60: escalation to consumer counsel. Reference: [yaelwrites/Big-Ass-Data-Broker-Opt-Out-List](https://github.com/yaelwrites/Big-Ass-Data-Broker-Opt-Out-List) — 200+ brokers, automatable.

**Continuous data broker sweep** — monthly sweeps of 127+ databases. Auto-submit removal. When re-acquired (they will), re-file. Every non-compliance escalated. DeleteMe charges $129/year to do this manually, with no enforcement pipeline. pane does it continuously, automatically.

**KYC vendor deletion automation** — Persona, Jumio, and Onfido collect biometrics as a condition of using someone else's platform. CCPA §1798.105 deletion rights apply to them directly. Agent-era: auto-fire deletion to every KYC vendor on a quarterly schedule with non-compliance escalation to the CPPA and relevant state AG.

**Burn leaderboard** — opt-in public aggregate burn ledger. "1,247 pane users burned their alias from [service] this month. Confidence: 91%." No individual data. Surveillance capitalism inverted.

**Privacy litigation fund** — burn data becomes evidence. Subscription revenue seeds class action. Documented alias burns with timestamps are plaintiff evidence chains. pane becomes the data collection infrastructure for the legal enforcement of privacy rights.

---

## Photo cloaking & biometric defence

The layer most privacy tools skip.

Clearview AI has scraped 30+ billion photos and sells facial recognition to law enforcement, landlords, and private investigators. PimEyes lets any person reverse-search by face for $29/month. Your face is the one identifier that survives burning everything else.

**What works:**

| Tool | What it does |
|------|-------------|
| [Fawkes](https://sandlab.cs.uchicago.edu/fawkes/) | Adversarial pixel noise, invisible to humans, breaks FR systems. Run every profile photo through before posting. Free, local. |
| LowKey | Second-pass adversarial perturbations benchmarked against Amazon, Microsoft, and Clarifai specifically. |
| MAT2 / ExifTool | Strips GPS (±3m), device model, serial, timestamps from photos and docs. Non-optional. |
| Background blur (rembg) | Background analysis can geolocate from visible architecture. Blur before posting. |
| Clearview opt-out | CCPA/GDPR deletion rights — removes your faceprint from their database. |
| PimEyes opt-out | pimeyes.com/en/opt-out — also a useful way to audit your own exposure first. |

**What doesn't work:** KYC liveness checks (Persona, Jumio, Onfido). Adversarial static noise doesn't defeat live video biometric capture. Current playbook: CCPA §1798.105 deletion after every use, document every KYC event.

**Compartmentalise your face.** Alias-identity accounts: no face photo, or a consistently different one. Never post the same photo across identity contexts. Your face is the most stable identifier you have.

---

## Philosophy

**Envelopes, not masks.** Privacy isn't anonymity. You're still you — you just don't hand your return address to everyone you correspond with.

**One alias per relationship.** Each service gets exactly one alias. When it's sold, you know who sold it. When you're done, you cut that thread — and only that thread.

**Friction is the enemy of hygiene.** Privacy tools people don't use protect no one. pane removes all the friction.

**Every alias is a canary.** When `shopsite-x7k` starts receiving pharma spam at 3am, the shop sold your data. You know exactly who, exactly when.

**Prevention vs. cleanup.** DeleteMe charges $129–$199/year to chase data after it's already been sold. Broker re-acquisition takes 60–90 days — it's a subscription to a treadmill. pane prevents new data from entering the system.

**The normalization flywheel.** Alias emails look unusual today because they're rare. As adoption grows, blocking them becomes economically irrational — you can't exclude 30% of your signups. Most privacy tools fight a rearguard action. Alias email adoption is the offensive play.

---

## Known limitations

**Phone verification is the hard wall.** JMP.chat covers most services. Some blocklist VOIP — Google Voice is the pragmatic fallback. Prepaid SIM is the last resort.

**KYC liveness defeats cloaking.** Fawkes works on static uploads. Persona/Jumio liveness requires live video biometric capture — no technical bypass that's both effective and legal. Use deletion rights aggressively.

**Behavioral biometrics persist.** Typing cadence and mouse paths are linkable. Playwright's automated fills are inhuman by default, which helps. Dedicated cadence randomization in the LATER tier.

**Privacy.com is US-only.** Non-US fallbacks: Revolut virtual cards, Wise, Monero for agent-era workflows.

---

## Contributing

This is early. The server is built in the open.

Open an issue if you've hit a wall on a specific service's signup flow. PRs welcome on:

- `src/browser.js` — Playwright stealth enrollment implementation
- Non-US virtual card integrations  
- JMP.chat SMS provisioning layer
- `.onion` transport for the MCP server
- Data broker sweep automation (see [yaelwrites/Big-Ass-Data-Broker-Opt-Out-List](https://github.com/yaelwrites/Big-Ass-Data-Broker-Opt-Out-List))

---

## Your legal rights

[LEGAL.md](./LEGAL.md) covers the privacy laws that let you demand deletion, disclose what's collected, and pursue enforcement — across the EU, US, Canada, and Mexico. Includes:

- GDPR Articles 15–22 (EU/EEA) — access, erasure, objection, automated decision-making
- CCPA / CPRA (California) — deletion templates, biometric rights, breach private right of action
- Illinois BIPA — biometric-specific, $1,000–$5,000 per violation, private right of action
- PIPEDA + Quebec Law 25 (Canada) — ARCO rights, breach notification triggers
- LFPDPPP (Mexico) — ARCO request templates in Spanish
- Templates for every deletion and access request letter
- pane-specific guidance: how alias burn logs become legal evidence

---

## License

MIT. Use it, fork it, improve it. Privacy tools should be free.

---

*Not hiding. Just not waving.*
