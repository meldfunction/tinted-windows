# pane workflows

Step-by-step guides for setting up and running pane. Start at the beginning if you are new. Jump to a specific workflow if you know what you need.

---

## Contents

1. [First-time setup — the full walkthrough](#1-first-time-setup--the-full-walkthrough)
2. [Claude Desktop / Anthropic users](#2-claude-desktop--anthropic-users)
3. [Standalone CLI (no AI)](#3-standalone-cli-no-ai)
4. [Your first alias — newsletter or SaaS trial](#4-your-first-alias--newsletter-or-saas-trial)
5. [Generating alias seeds with the scrambler](#5-generating-alias-seeds-with-the-scrambler)
6. [Building your alias map — one per service category](#6-building-your-alias-map--one-per-service-category)
7. [Setting up a no-log VPN](#7-setting-up-a-no-log-vpn)
8. [The placeholder account workflow](#8-the-placeholder-account-workflow)
9. [Journalist / high-risk workflow](#9-journalist--high-risk-workflow)
10. [Agent workflow without MCP](#10-agent-workflow-without-mcp)

> **Note:** These workflows assume you have read [AGENTS.md](./AGENTS.md) for the security model, especially the section on what is safe to send over the open web.

---

## 1. First-time setup — the full walkthrough

### What you need before starting

| Item | Purpose | Where to get it |
|------|---------|-----------------|
| Node.js 18+ | Runs pane | [nodejs.org](https://nodejs.org) |
| Git | Clones the repo | [git-scm.com](https://git-scm.com) |
| A no-log VPN | Masks your IP during setup and operation | See [§7 below](#7-setting-up-a-no-log-vpn) |
| Addy.io account | Your alias email provider | [addy.io](https://addy.io) — free tier is enough |
| Privacy.com account | Your virtual card provider | [privacy.com](https://privacy.com) — US only |
| A "catch" inbox | Where alias mail actually forwards | Proton Mail or any inbox you already own |
| A real bank account | Funds virtual cards | Your existing bank — Privacy.com pulls from it |

**Before you do anything else:** turn on your VPN. You are about to create accounts at Addy.io and Privacy.com. Do this from a clean network. The IP you use here is logged by both services.

---

### Step 1 — Get the repo

```bash
git clone https://github.com/meldfunction/pane
cd pane
npm install
```

This installs two runtime dependencies: `dotenv` and `better-sqlite3`. Nothing phones home. No telemetry.

---

### Step 2 — Create your baseline accounts

These are the two services that do the actual work. You only set these up once.

**Addy.io (alias email)**

1. Go to [addy.io](https://addy.io) and create an account. Use a real email you control — this is your *catch inbox*, the address that receives all forwarded alias mail.
2. Verify your email.
3. Go to **Settings → API** and generate an API key. Copy it.
4. Optional but recommended: add a custom domain so your aliases look like `notion-x7k@yourdomain.com` instead of `@addy.io`. This makes aliases harder to reject.

**Privacy.com (virtual cards)**

1. Go to [privacy.com](https://privacy.com). Create an account. Link a bank account (they need this to fund cards — this is a real financial service, not a workaround).
2. Go to **Account → Developer** and generate an API key. Copy it.
3. Set your default card type to **merchant-locked** if you can — this prevents a card issued for Notion from being charged by anyone else.

---

### Step 3 — Configure pane

```bash
cp .env.example .env
```

Open `.env` in any text editor and fill in at minimum:

```env
ADDY_API_KEY=your_key_from_addy
PRIVACY_API_KEY=your_key_from_privacy_com
EMAIL_PROVIDER=addy

# Where are you? Used to generate regional fake identities.
# Options: US-West | US-East | US-Midwest | UK | CA | AU
PANE_BASE_REGION=US-East

# Name style for generated fake identities
# Options: generic-anglo | hispanic | east-asian | south-asian
PANE_NAME_STYLE=generic-anglo

# Fields that are ALWAYS fake — never derived from your real data
PANE_FAKE_FIELDS=dob,phone,address

# Default card limit when you create a new card: 0 = no funds until you load it
CARD_DEFAULT_LIMIT_CENTS=0
```

Save `.env`. Verify it is listed in `.gitignore` (it is, by default). **Never commit this file.**

---

### Step 4 — Generate your alias seeds

Before you sign up for anything, generate your alias seeds. These are random word pairs that become the basis of every alias identity. Run:

```bash
python3 scrambler.py --count 20 --export
```

This produces output like:

```
  SEED              ALIAS EMAIL EXAMPLE                          COMMAND
  ──────────────    ────────────────────────────────────────     ─────────────────────────────────
  amber-circuit     amber-circuit-4a1@alias.yourdomain.com       pane enroll <url> --context amber-circuit
  frost-ridge       frost-ridge-b3c@alias.yourdomain.com         pane enroll <url> --context frost-ridge
  cedar-vault       cedar-vault-9f2@alias.yourdomain.com         pane enroll <url> --context cedar-vault
  ...
```

And writes them to `alias-seeds.txt`. This file is your alias inventory. Keep it private. Do not commit it. You will assign one seed to each service you sign up for.

**Why word pairs?**
A seed like `amber-circuit` is memorable, unambiguous to type, and contains no personal information. It does not tell anyone what service it belongs to. When Notion's alias is `amber-circuit-4a1@yourdomain.com` and you later see spam arriving at that address, you know immediately: Notion sold your data.

---

### Step 5 — Test the connection

```bash
node server.js &
```

In another terminal, send a test command:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node server.js
```

You should see a JSON response listing all eight pane tools. If you do, the server is working.

Kill the server: `fg` then `Ctrl+C`.

---

## 2. Claude Desktop / Anthropic users

If you use Claude Desktop (Anthropic's desktop app), pane integrates directly as an MCP server. You talk to Claude in natural language; Claude calls pane tools behind the scenes.

### Setup

Find your Claude Desktop config file:

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

Open the file (create it if it doesn't exist) and add:

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

Replace `/absolute/path/to/pane/server.js` with the actual path. On macOS, if you cloned to your home folder:

```json
{
  "mcpServers": {
    "pane": {
      "command": "node",
      "args": ["/Users/yourname/pane/server.js"]
    }
  }
}
```

Restart Claude Desktop. You will see a hammer icon in the chat interface indicating tools are available.

### Using pane via Claude

Now you can talk naturally:

```
You: "Sign me up for Notion"
Claude: [calls pane_enroll("notion.so")]
        ✓ alias: amber-circuit-4a1@yourdomain.com
        ✓ card: ····4242 · $0 limit
        ✓ enrolled as Jordan Ellis

You: "Has Notion emailed me?"
Claude: [calls pane_check_inbox("notion")]
        1 message — welcome email from notion.so

You: "Actually I don't want it anymore, kill it"
Claude: [calls pane_expire("notion")]
        ✓ alias burned · card frozen
```

### Project folder structure for Claude Desktop users

Anthropic users who manage multiple projects in Claude often find it useful to create a dedicated project folder:

```
~/pane/
├── .env                    ← your API keys — never share, never commit
├── server.js               ← the MCP server — leave this alone
├── scrambler.py            ← run this first to generate seeds
├── alias-seeds.txt         ← your seed inventory — keep private
├── alias-map.md            ← your service → seed mapping — keep private
└── ~/.pane/
    └── contexts.db         ← auto-created by pane — your alias store
```

Create `alias-map.md` yourself as you sign up for services. Format:

```markdown
# alias map — private

| service | seed | alias email | card | status |
|---------|------|-------------|------|--------|
| Notion | amber-circuit | amber-circuit-4a1@yourdomain.com | ····4242 | active |
| Morning Brew | frost-ridge | frost-ridge-b3c@yourdomain.com | no card | active |
| Shopsite | cedar-vault | cedar-vault-9f2@yourdomain.com | ····8821 | ⚠ burned |
```

This file lives only on your machine. It is the human-readable version of `contexts.db`.

---

## 3. Standalone CLI (no AI)

You do not need Claude Desktop or any AI to use pane. The CLI works directly.

### Install globally (optional)

```bash
npm link
```

This makes `pane` available as a global command. Or just use `node server.js` directly.

### Basic commands

```bash
# Create an alias for a service
pane create-alias morning-brew

# Create a virtual card
pane create-card morning-brew --limit 0

# Create both at once (an envelope)
pane create-context notion

# List all active envelopes
pane list

# Check what mail has arrived at an alias
pane check-inbox notion

# Audit a context for breach signals
pane audit notion

# Burn everything for a service
pane expire notion
```

### Alias-only workflow (no cards)

If you are outside the US or do not want to use Privacy.com, you can use only the alias layer:

```bash
export PRIVACY_API_KEY=skip   # disable card creation
pane create-alias morning-brew
pane check-inbox morning-brew
pane expire morning-brew
```

---

## 4. Your first alias — newsletter or SaaS trial

The safest place to start is a low-stakes service: a newsletter signup or a free-tier SaaS tool.

### Newsletter example: Morning Brew

```bash
# 1. Generate a seed if you haven't
python3 scrambler.py --count 1
# → frost-ridge

# 2. Create an alias
pane create-alias frost-ridge
# ✓ frost-ridge-b3c@yourdomain.com created

# 3. Go to morningbrew.com/daily and sign up with that alias
# (Manual until pane enroll is fully implemented)

# 4. Check in after a few days
pane check-inbox frost-ridge
# → 5 messages: all from morningbrew.com — clean

# 6 weeks later...
pane check-inbox frost-ridge
# → ⚠ 1 unexpected message from partnerads.net

# 5. Morning Brew sold your alias. Burn it.
pane audit frost-ridge
# → breach signal: partnerads.net
pane expire frost-ridge
# ✓ alias burned. Morning Brew can no longer reach you.
```

### SaaS trial with virtual card: Notion

```bash
# 1. Pick a seed
python3 scrambler.py --count 1
# → amber-circuit

# 2. Create a full envelope (alias + card)
pane create-context amber-circuit
# ✓ amber-circuit-4a1@yourdomain.com
# ✓ card ····4242 · $0 limit

# 3. Sign up at notion.so with:
#    email: amber-circuit-4a1@yourdomain.com
#    card:  ····4242 (from pane list to see full card number)
#    name:  whatever pane generated (Jordan Ellis, etc.)

# 4. Notion tries to charge your card when trial ends
#    → $0 limit means charge fails. You owe nothing.

# 5. If you decide you want Notion, fund the card:
pane card fund amber-circuit --amount 1600   # $16.00

# 6. If you don't:
pane expire amber-circuit
# ✓ card frozen · alias burned
```

---

## 5. Generating alias seeds with the scrambler

The scrambler (`scrambler.py`) generates random word-pair seeds using OS entropy. It does not call any external service. It does not need an internet connection.

```bash
# Generate 10 seeds and print to terminal
python3 scrambler.py

# Generate 20 seeds and save to alias-seeds.txt
python3 scrambler.py --count 20 --export

# Generate seeds for a specific batch (e.g. shopping accounts)
python3 scrambler.py --count 5
```

### How to assign seeds to services

The goal is one seed per service, assigned before you sign up. Work through your alias-seeds.txt top to bottom:

```
amber-circuit    → notion.so
frost-ridge      → morningbrew.com
cedar-vault      → shopify-store.com
willow-sluice    → substack author you follow
copper-root      → linkedin.com (yes, LinkedIn gets an alias)
orbit-ridge      → github.com (use carefully — real-name linked)
salt-span        → your gym's booking app
inlet-flare      → a one-time e-commerce purchase
```

Rules:
- **One seed per service.** Never reuse.
- **Assign seeds before you sign up**, not after. If you already have an account, create a new account under an alias if the service allows it, or note it as "no alias — pre-pane."
- **Keep a local alias-map.md** mapping seeds to services. This is your paper trail.
- **Seeds are not secret** — they are just identifiers. The alias email derived from a seed is the thing that must be protected.

---

## 6. Building your alias map — one per service category

Start with the highest-risk categories first, then work outward.

### Category 1 — Financial

These services already know your real identity (your bank, the IRS). The alias protects your email address from being sold, not your identity.

| Service | Alias purpose | Card? | Notes |
|---------|--------------|-------|-------|
| Bank/Credit Union | Email notifications only | No | Bank already has real ID |
| Privacy.com | Meta: alias for your card service | Yes | Ironic but useful |
| Subscription billing (Stripe-billed SaaS) | Catches billing list sales | Yes | $0 until subscribe |

```bash
pane create-context copper-root   # for Privacy.com account meta
pane create-alias salt-span       # for bank notification email
```

### Category 2 — Productivity / SaaS

The highest-volume signup category. Every tool gets its own seed.

```bash
pane create-context amber-circuit   # notion.so
pane create-context frost-ridge     # linear.app
pane create-context cedar-vault     # figma.com
pane create-context willow-sluice   # github.com (secondary account)
pane create-context orbit-ridge     # slack (workspace invite)
```

### Category 3 — News and newsletters

These are the highest-probability data sellers. Always alias, never a real email.

```bash
pane create-alias inlet-flare    # substack author
pane create-alias forge-sluice   # nytimes.com
pane create-alias raven-weir     # morning brew
pane create-alias larch-notch    # axios
```

No cards needed here — newsletters are free. The alias is the only thing protecting you.

### Category 4 — Shopping / e-commerce

Every merchant gets a unique card AND alias.

```bash
pane create-context teal-ledge     # amazon.com
pane create-context hazel-circuit  # etsy.com
pane create-context jade-span      # a one-time store purchase
```

Card limit: set to the exact amount of your purchase + $0. Merchant can't charge more.

### Category 5 — Social / networking

Use with care — these platforms expect a consistent identity.

```bash
pane create-alias navy-arch     # linkedin.com email alias
pane create-alias birch-strand  # twitter/x.com email alias
```

Note: social platforms sometimes reject alias domains. Use a custom domain with Addy.io to make your alias email look like a normal address.

### Category 6 — Government / institutional

Do **not** use fake identity fields. Use `identity: 'real'`. The alias email is the only thing you are protecting.

```bash
pane create-context zinc-mast   # dmv.dc.gov email alias
# When enrolling:
# identity: real  (your actual name and address)
# alias: real email alias for notifications
# card: your real card (government transactions)
```

For government: the alias protects your inbox from notification list sales. Your real identity is required for the transaction itself.

---

## 7. Setting up a no-log VPN

A VPN is not optional for pane workflows. Your ISP sees every DNS request you make. Without a VPN, signing up for Addy.io and Privacy.com from your home IP creates a link between your real identity and your privacy infrastructure.

### Recommended VPNs for pane use

| Provider | Why | Price | Jurisdiction |
|---------|-----|-------|-------------|
| **Mullvad** | No account required — you get a number, not a login. Accepts cash and Monero. Audited. API for per-context exit node assignment. | €5/month | 🇸🇪 Sweden |
| **ProtonVPN** | Free tier available. Swiss jurisdiction. Open source client. | Free–$10/month | 🇨🇭 Switzerland |
| **IVPN** | No email required to sign up. Accepts Monero and cash. | $6/month | 🇬🇮 Gibraltar |

### Mullvad setup (recommended)

```bash
# 1. Generate a Mullvad account number at mullvad.net
#    Pay with Monero if you want zero identity link.

# 2. Install Mullvad client
#    macOS: brew install --cask mullvadvpn
#    Linux: See mullvad.net/download/vpn/linux

# 3. Connect and verify
mullvad connect
mullvad status
# → Connected to Reykjavik, Iceland  ← or your chosen exit

# 4. Set your account number in .env
MULLVAD_ACCOUNT=your_account_number
```

### What "no-log" actually means

A no-log VPN does not retain records of which IP connected, when, or what sites were accessed. Mullvad, ProtonVPN, and IVPN have all been independently audited and have received legal requests that they could not fulfill because the logs did not exist.

This is different from: the VPN encrypting your traffic (all VPNs do that), or the VPN preventing fingerprinting (it does not — fingerprinting works at the browser level, not the IP level).

### When to connect

- Always on when creating Addy.io or Privacy.com accounts
- Always on when running `pane enroll` (once implemented)
- Always on when checking alias inboxes via pane
- Recommended: run permanently; turn off only for streaming services that block VPNs

---

## 8. The placeholder account workflow

Some services require your real identity at some point: airlines, hotels, government, financial accounts. The placeholder pattern holds a spot under a temporary identity, then you supply your real identity at the last mile — by phone, not by web form.

### Why phone as last mile

A phone call to a call center does not create:
- A browser fingerprint
- A cookie tracking your session
- An IP address logged against your account
- A device identifier linked to your profile

The operator updates the record. Your real name is in their system. Your digital footprint is not.

### Airline ticket: step by step

```bash
# 1. Create a placeholder context
python3 scrambler.py --count 1
# → birch-portal
pane create-context birch-portal
# ✓ birch-portal-7f3@yourdomain.com
# ✓ card ····9182 · $0

# 2. Go to aa.com (or any airline)
#    Sign up or check out as a guest using:
#      Name:  [pane-generated: e.g. Jordan Ellis]
#      Email: birch-portal-7f3@yourdomain.com
#      Card:  ····9182 · $0 (don't fund yet)
#    Seat is held. Booking reference created.

# 3. Retrieve your booking reference from the alias inbox
pane check-inbox birch-portal
# → booking confirmation from aa.com — ref: ABC123

# 4. Call the airline
# "Hi, I have a reservation under Jordan Ellis, confirmation ABC123.
#  I need to update the name to [your legal name] for travel ID purposes."
# → Airline updates name on record.

# 5. Fund the card exactly
pane card fund birch-portal --amount 34500   # $345.00 exact fare
# → Card is now funded. Charge goes through.

# 6. After travel, expire the context
pane expire birch-portal
# → alias burned, card frozen
```

### Hotel booking: step by step

```bash
# 1. Book on booking.com or hotel website with placeholder identity
pane create-context salt-arch
# ✓ salt-arch-2e1@yourdomain.com · card ····4401 · $0

# 2. Complete booking online with placeholder
#    Confirmation number lands in alias inbox.
pane check-inbox salt-arch
# → booking.com confirmation — res: XY9283

# 3. Night before check-in: call the hotel directly (not booking.com)
# "I have a reservation arriving tomorrow, confirmation XY9283.
#  I need to update the guest name to [real name]."
# → Hotel updates. Check in with real ID as required by law.

# 4. Fund card day of check-in (include incidental hold amount)
pane card fund salt-arch --amount 22000   # $220 = room + $50 incidental
```

### What this protects

The booking platform (booking.com, expedia, aa.com) builds a profile: where you travel, how often, with whom, what price you accepted. Under the placeholder pattern, that profile belongs to `Jordan Ellis`, not you. Your real name appears only in the hotel's property management system and the airline's reservation system — siloed, not aggregated.

---

## 9. Journalist / high-risk workflow

This workflow is for people operating in adversarial contexts: journalists filing from restrictive jurisdictions, activists, human rights workers, or anyone whose physical safety depends on digital separation.

> **Read [AGENTS.md](./AGENTS.md) in full before starting this workflow.** Specifically: the jurisdiction table, the E2E coverage map, and the hosting checklist.

### Setup

You need:
1. A personal device used only for Signal and receiving results
2. An agent server hosted in a privacy-respecting jurisdiction (Iceland or Switzerland preferred)
3. Signal on your personal device
4. The pane-agent.py prototype running on the server

### Agent server setup (run once, on the server)

```bash
# On your agent server (e.g. a VPS in Iceland)
git clone https://github.com/meldfunction/pane
cd pane
pip3 install  # no dependencies for pane-agent.py — it uses stdlib only

# Generate a strong shared secret
openssl rand -hex 32
# → 8f3a9c2d1e4b7f6a0c5d8e2f1a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b

# Store it — you will need it on your personal device too to sign commands
echo "AGENT_SECRET=8f3a9c2d..." > /opt/pane/.env
echo "ADDY_API_KEY=your_key" >> /opt/pane/.env

# Start the monitor
python3 pane-agent.py monitor &
```

### Filing a story: the workflow

```
Your phone                         Agent server (Iceland)
──────────────────────────────     ──────────────────────────────────
Signal message:                →   Command handler receives intent
"publish this draft to         →   Decodes task: enroll at publication
 [publication platform]"       →   Creates alias + placeholder identity
                               →   Navigates to publication platform
                               →   Fills form with alias identity
                               →   Submits draft
                               ←   Confirms: "published, ref #XY23"
You receive confirmation       ←
Your device never touched      
the publication platform
```

### What your device does and does not do

| Your device | The agent |
|------------|----------|
| Sends Signal message | Makes the actual web request |
| Receives confirmation | Manages the account |
| Has no publication account | Holds all alias credentials |
| Has your real Signal identity | Has a pane-managed identity |
| Can be searched at a border | Contains no account credentials |

### Border crossing protocol

If you are crossing a border and your device may be inspected:

1. Before crossing: `pane expire --all` on any contexts that should not be visible. The `contexts.db` file will show no active aliases.
2. The agent server still knows everything. You reconnect after crossing.
3. Signal messages are end-to-end encrypted and not stored on Signal's servers.
4. Your device contains no API keys, no alias emails, no account details — these live on the agent server.

---

## 10. Agent workflow without MCP

You have pane set up but do not use Claude Desktop. You want automated breach monitoring and command handling without any AI infrastructure.

### Option A: Cron-based breach check (simplest)

```bash
# Add to crontab (crontab -e)
# Runs breach check every 4 hours and logs incidents
0 */4 * * * cd /path/to/pane && node server.js check-all >> ~/.pane/incidents.log 2>&1
```

### Option B: Python agent with breach monitor

```bash
# Run the Python agent in monitor mode
python3 pane-agent.py monitor

# In another terminal, check what it found
python3 pane-agent.py check-incidents
```

Output:
```
⚠  2025-01-14 03:12  shopsite-app  ←  pharmaadvertiser.com
⚠  2025-01-13 09:44  morning-brew  ←  volume anomaly
✓  2025-01-08 11:03  all contexts  sweep clean
```

### Option C: Standalone via SSH (for self-hosters)

```bash
# From your laptop, query your agent server
ssh user@your-agent-server 'python3 /opt/pane/pane-agent.py check-incidents'

# Send a command (must include HMAC signature — see AGENTS.md)
ssh user@your-agent-server 'python3 /opt/pane/pane-agent.py command '"'"'{"cmd":"list","ts":"2025-01-14T10:00:00Z","sig":"your-hmac"}'"'"''
```

### Generating HMAC signatures for agent commands

```python
import hmac, hashlib, json
from datetime import datetime, timezone

secret = "your-agent-secret"
ts     = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
cmd    = "list"
args   = {}

msg = ts + cmd + json.dumps(args, sort_keys=True)
sig = hmac.new(secret.encode(), msg.encode(), hashlib.sha256).hexdigest()

payload = json.dumps({"ts": ts, "cmd": cmd, "args": args, "sig": sig})
print(payload)
```

---

## Cheatsheet

```bash
# Setup
git clone https://github.com/meldfunction/pane && cd pane
npm install && cp .env.example .env
# (edit .env with your API keys)

# Generate alias seeds
python3 scrambler.py --count 20 --export

# Create contexts
pane create-context [seed]          # alias + card
pane create-alias [seed]            # alias only

# Operate
pane list                           # all envelopes + status
pane check-inbox [seed]             # read alias mail
pane audit [seed]                   # breach signal check
pane expire [seed]                  # burn alias + freeze card

# Monitor (Python agent)
python3 pane-agent.py monitor       # continuous background sweep
python3 pane-agent.py check-incidents  # view logged incidents
```

---

## Related files

| File | What it contains |
|------|-----------------|
| [README.md](./README.md) | Project overview, ecosystem, known limitations |
| [AGENTS.md](./AGENTS.md) | Agent prototype, security model, jurisdiction table, E2E coverage map |
| [scrambler.py](./scrambler.py) | Alias seed generator — run this first |
| [.env.example](./.env.example) | All available configuration options with explanations |
| [src/identity.js](./src/identity.js) | How fake identities are generated (seeded, deterministic, regional) |
| [services.html](./services.html) | Every tool in the ecosystem with tier and integration status |
| [toolkit.html](./toolkit.html) | Modular components for builders |
