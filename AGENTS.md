# pane agents 🤖

**Prototype specification for agent-native privacy workflows.**

> ⚠️ **FOLLOW AT YOUR OWN RISK.** This document describes experimental workflows for autonomous agents interacting with third-party services on your behalf. While pane will attempt to use end-to-end encrypted channels where possible, **E2E encryption cannot be guaranteed across all legs of an agent workflow**. Sensitive data travelling across the open web — even through agents — should be treated as potentially observable. This is a prototype, not a guaranteed service. Read the [security model](#security-model) section before using any agent workflow.

---

## What agents change

The core pane loop requires you. You run a command. You decide to burn an alias. You check the inbox. Agents remove you from the loop — they monitor continuously, escalate when needed, and execute routine operations without your intervention.

The privacy benefit is structural: **your personal device never touches the workflow.** A journalist in an adversarial jurisdiction doesn't use their laptop to manage a publication account. They send a Signal message. The agent — running on clean compute elsewhere — handles the rest.

---

## Security model

Read this before using any agent workflow.

### What is safe to travel on the open web

| Data type | Safe open web? | Notes |
|-----------|---------------|-------|
| Alias emails (e.g. `notion-x7k@pane.alias`) | ✅ Yes | These are the point — they're disposable |
| Virtual card metadata (last4, limit) | ✅ Yes | Non-sensitive by design |
| Task intent (e.g. "check my notion inbox") | ✅ With Signal/E2E | Intent alone reveals little |
| Your real name | ❌ Never via agent | Use placeholder identity |
| Your real email | ❌ Never via agent | That's what aliases are for |
| Your real address | ❌ Never via agent | Use P.O. box / forwarding address |
| Payment credentials | ❌ Never via agent | Virtual card numbers only |
| Government ID numbers | ❌ Never via agent | Do this yourself, last-mile by phone |
| Biometric data | ❌ Never via agent | No exceptions |

### Jurisdiction matters for agent hosting

Where your agent runs determines whose laws apply to its data. When operating in contexts where privacy is operationally important, **prefer hosting agent compute in jurisdictions with strong privacy law**:

| Jurisdiction | Why | Hosting options |
|-------------|-----|-----------------|
| 🇮🇸 Iceland | No data retention directives, strong press freedom, GDPR | 1984 Hosting, Flokinet |
| 🇨🇭 Switzerland | Swiss Federal Act on Data Protection (nFADP), not in EU but strong | Proton infrastructure, Infomaniak |
| 🇩🇪 Germany | Strict GDPR enforcement, strong constitutional privacy protections | Hetzner, Uberspace |
| 🇳🇴 Norway | GDPR + strong national data protection law, Five Eyes adjacent but strong courts | Servers.com |
| 🇵🇦 Panama | No mandatory data retention, no Five Eyes treaty obligations | VPN providers use this; some compute available |

**Avoid for sensitive agent hosting:** US, UK, Australia, Canada, New Zealand (Five Eyes), and any jurisdiction that has served data requests to similar platforms in the past.

### E2E coverage map

```
You (Signal/Tor)
    ↓ [E2E — Signal protocol or .onion]
Command agent (Iceland / Switzerland)
    ↓ [TLS in transit — observable at endpoints]
Execution agent (ephemeral container)
    ↓ [Tor exit node — IP obscured, content visible at destination]
Target service (notion.so, etc.)
```

**The gap:** The leg between execution agent and target service is TLS, not E2E. The target service sees the request content. An adversary with access to the target service's logs sees what the agent submitted. This is the same exposure you'd have if you submitted it yourself — just decoupled from your identity and IP.

---

## The placeholder account workflow

Some transactions require your real identity at some point — airline tickets, government services, financial accounts. The placeholder pattern separates the **provisioning** step (where no real identity is needed) from the **last-mile** step (where it is).

```
Phase 1 — Provisioning (agent handles, no real identity)
  → Create alias email
  → Create $0 virtual card
  → Register account with placeholder details
  → Seat held, account created

Phase 2 — Last mile (you handle, by phone or in person)
  → Call the airline/service directly
  → Provide real name for final booking
  → Update payment to real card (or load virtual card)
  → No platform ever received your real identity digitally
```

### Why phone as last mile

A phone call is difficult to aggregate into a cross-platform profile. There is no cookie, no browser fingerprint, no IP address. Call center records are siloed. They're hard to correlate with the digital record the agent created. The platform gets your name but not your browsing history, your IP, your device, or your email — because those were all handled under the alias.

It's inconvenient. That inconvenience is the point. You're paying in friction, not in data.

### Example: airline ticket

```python
# Phase 1 — agent runs this
result = pane.enroll('https://aa.com', {
    'identity': 'placeholder',   # generates Jordan Ellis, placeholder DOB
    'card': {'limit': 0},        # $0 until you decide to fund
    'alias': 'travel-aa-2025',
    'note': 'placeholder — call to complete with real name'
})
# → account created, seat held, alias email confirmed
# → your real name has never touched AA's servers

# Phase 2 — you call AA
# "Hi, I have a reservation under Jordan Ellis, 
#  I need to update the name to my legal name for travel."
# AA updates the record. You fund the virtual card for the exact amount.
# Done. AA has your name. They do not have your email, IP, or device.
```

### Example: hotel booking

```python
pane.enroll('https://booking.com', {
    'identity': 'placeholder',
    'card': {'limit': 0},
    'alias': 'hotel-booking-2025'
})
# Hold the room. 
# Day before: call hotel directly, give real name for check-in.
# Fund virtual card for exact amount + $50 incidental hold.
# Check in with real ID as required by law. 
# The profile booking.com built on "Jordan Ellis" is not you.
```

---

## Prototype: single agent (no MCP)

For environments without Claude Desktop or MCP access. This runs as a standalone Python process you host yourself.

```python
#!/usr/bin/env python3
"""
pane-agent.py — standalone agent prototype
No MCP required. Runs as a scheduled process or responds to Signal messages.
Host in a privacy-respecting jurisdiction (see jurisdiction table above).

FOLLOW AT YOUR OWN RISK — see security model in AGENTS.md
"""

import os, json, time, hashlib, hmac
from datetime import datetime, timedelta
from pathlib import Path

# ── CONFIG ────────────────────────────────────────────────────────────────────

ADDY_API_KEY     = os.environ['ADDY_API_KEY']
PRIVACY_API_KEY  = os.environ['PRIVACY_API_KEY']
AGENT_SECRET     = os.environ['AGENT_SECRET']      # shared secret for command auth
PANE_DATA_DIR    = Path(os.environ.get('PANE_DATA_DIR', '~/.pane')).expanduser()
PANE_DATA_DIR.mkdir(exist_ok=True)

# ── BREACH MONITOR ────────────────────────────────────────────────────────────

class BreachMonitor:
    """
    Runs continuously. Checks all active aliases for unexpected senders.
    When a breach is detected, logs the incident and queues an alert.
    """

    def __init__(self, check_interval_seconds=3600):
        self.interval = check_interval_seconds
        self.incidents = PANE_DATA_DIR / 'incidents.jsonl'

    def run(self):
        print(f'[pane-agent] breach monitor started · interval: {self.interval}s')
        while True:
            self.check_all()
            time.sleep(self.interval)

    def check_all(self):
        contexts = self._load_contexts()
        for ctx in contexts:
            self._check_context(ctx)

    def _check_context(self, ctx):
        import urllib.request
        req = urllib.request.Request(
            f'https://app.addy.io/api/v1/aliases/{ctx["alias_id"]}/emails',
            headers={'Authorization': f'Bearer {ADDY_API_KEY}',
                     'Content-Type': 'application/json',
                     'X-Requested-With': 'XMLHttpRequest'}
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read())
        except Exception as e:
            print(f'[pane-agent] check failed for {ctx["name"]}: {e}')
            return

        enrolled_domain = ctx.get('enrolled_domain', '')
        for msg in data.get('data', []):
            sender_domain = msg.get('from', '').split('@')[-1]
            if enrolled_domain and enrolled_domain not in sender_domain:
                self._log_incident(ctx['name'], ctx['alias_email'], sender_domain)

    def _log_incident(self, context, alias, unexpected_sender):
        incident = {
            'ts': datetime.utcnow().isoformat(),
            'context': context,
            'alias': alias,
            'unexpected_sender': unexpected_sender,
            'action': 'queued_burn'
        }
        with open(self.incidents, 'a') as f:
            f.write(json.dumps(incident) + '\n')
        print(f'[pane-agent] ⚠ breach signal: {context} ← {unexpected_sender}')
        # Extend here: send Signal message, webhook, email to your real address, etc.

    def _load_contexts(self):
        ctx_file = PANE_DATA_DIR / 'contexts.json'
        if not ctx_file.exists():
            return []
        return json.loads(ctx_file.read_text())


# ── COMMAND HANDLER ───────────────────────────────────────────────────────────

class CommandHandler:
    """
    Receives authenticated commands. Verify the HMAC before acting.
    Extend to receive via: Signal bot, webhook, .onion HTTP endpoint, CLI.

    Command format (JSON):
    {
        "ts": "2025-01-01T00:00:00Z",     # timestamp (replay protection)
        "cmd": "expire",                   # command name
        "args": {"context": "notion"},     # command arguments
        "sig": "hmac-sha256-hex"           # HMAC-SHA256(secret, ts+cmd+args)
    }
    """

    def verify(self, payload: dict) -> bool:
        ts = payload.get('ts', '')
        # Reject commands older than 5 minutes
        try:
            cmd_time = datetime.fromisoformat(ts.replace('Z', '+00:00'))
            if abs((datetime.utcnow() - cmd_time.replace(tzinfo=None)).total_seconds()) > 300:
                return False
        except Exception:
            return False

        msg = ts + payload.get('cmd', '') + json.dumps(payload.get('args', {}), sort_keys=True)
        expected = hmac.new(AGENT_SECRET.encode(), msg.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, payload.get('sig', ''))

    def handle(self, payload: dict) -> dict:
        if not self.verify(payload):
            return {'error': 'invalid signature or expired command'}

        cmd  = payload.get('cmd')
        args = payload.get('args', {})

        if cmd == 'expire':
            return self._expire(args['context'])
        elif cmd == 'list':
            return self._list()
        elif cmd == 'status':
            return self._status(args['context'])
        elif cmd == 'enroll':
            return {'status': 'queued', 'note': 'browser automation not yet implemented in standalone agent'}
        else:
            return {'error': f'unknown command: {cmd}'}

    def _expire(self, context_name):
        import urllib.request
        ctx = self._get_context(context_name)
        if not ctx:
            return {'error': f'context not found: {context_name}'}

        # Delete alias
        req = urllib.request.Request(
            f'https://app.addy.io/api/v1/aliases/{ctx["alias_id"]}',
            method='DELETE',
            headers={'Authorization': f'Bearer {ADDY_API_KEY}'}
        )
        try:
            urllib.request.urlopen(req, timeout=10)
        except Exception as e:
            return {'error': f'alias delete failed: {e}'}

        return {'status': 'expired', 'context': context_name}

    def _list(self):
        return {'contexts': self._load_contexts()}

    def _status(self, context_name):
        ctx = self._get_context(context_name)
        if not ctx:
            return {'error': f'context not found: {context_name}'}
        return ctx

    def _get_context(self, name):
        for ctx in self._load_contexts():
            if ctx['name'] == name:
                return ctx
        return None

    def _load_contexts(self):
        ctx_file = PANE_DATA_DIR / 'contexts.json'
        if not ctx_file.exists():
            return []
        return json.loads(ctx_file.read_text())


# ── ENTRY POINT ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    import sys

    if len(sys.argv) < 2:
        print('usage: python pane-agent.py monitor|command <json>')
        sys.exit(1)

    mode = sys.argv[1]

    if mode == 'monitor':
        monitor = BreachMonitor()
        monitor.run()

    elif mode == 'command':
        if len(sys.argv) < 3:
            print('usage: python pane-agent.py command \'{"cmd":"list","ts":"...","sig":"..."}\'')
            sys.exit(1)
        payload  = json.loads(sys.argv[2])
        handler  = CommandHandler()
        response = handler.handle(payload)
        print(json.dumps(response, indent=2))

    elif mode == 'check-incidents':
        incidents_file = PANE_DATA_DIR / 'incidents.jsonl'
        if not incidents_file.exists():
            print('no incidents logged')
        else:
            for line in incidents_file.read_text().strip().split('\n'):
                if line:
                    inc = json.loads(line)
                    print(f"⚠  {inc['ts'][:16]}  {inc['context']}  ←  {inc['unexpected_sender']}")
```

---

## Prototype: scheduled sweep (cron / systemd)

Run the breach monitor on a schedule without a long-lived process:

```bash
# /etc/cron.hourly/pane-monitor
#!/bin/bash
export ADDY_API_KEY="..."
export PRIVACY_API_KEY="..."
export AGENT_SECRET="..."
cd /opt/pane
python3 pane-agent.py check-incidents >> /var/log/pane-incidents.log 2>&1
```

```ini
# /etc/systemd/system/pane-monitor.service
[Unit]
Description=pane breach monitor

[Service]
Type=simple
EnvironmentFile=/etc/pane/env
ExecStart=/usr/bin/python3 /opt/pane/pane-agent.py monitor
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
```

---

## Hosting checklist

Before deploying any agent that handles alias or account data:

- [ ] Hosting jurisdiction selected (see table above — prefer Iceland, Switzerland, Germany)
- [ ] Server provisioned with Monero or cash-equivalent payment (not a card linked to your identity)
- [ ] SSH key auth only — no password login
- [ ] Firewall: only ports 22 (SSH) and your command endpoint open
- [ ] `AGENT_SECRET` is at least 32 random bytes, generated on the server: `openssl rand -hex 32`
- [ ] `.env` file is `chmod 600`, not in git, not logged
- [ ] Command channel is Signal bot or .onion endpoint — not plain HTTP
- [ ] Logs are rotated and not shipped to a third-party logging service
- [ ] Understand: this server **knows your alias emails**. Protect it accordingly.

---

## Command channel options

### Signal (recommended for individuals)

Signal has sealed sender, disappearing messages, and no metadata retention on message content. A Signal bot running on your agent server is the most accessible E2E command channel.

Libraries: `signal-cli` (Java), `semaphore` (Python wrapper), `signald` (daemon).

```bash
# signald setup — run on agent server
signald &
# link to your Signal account once, then receive commands programmatically
```

### .onion HTTP endpoint (recommended for orgs / journalists)

Run a Tor hidden service in front of your command handler. No IP exposure on either end.

```bash
# /etc/tor/torrc — add:
HiddenServiceDir /var/lib/tor/pane/
HiddenServicePort 80 127.0.0.1:8080
```

Start Tor, read `/var/lib/tor/pane/hostname` for your .onion address. Share it only with people who need it.

### CLI over SSH (simple, for self-hosters)

SSH already has E2E. SSH to your agent server and run commands directly:

```bash
ssh user@agent-server.example 'python3 /opt/pane/pane-agent.py command '"'"'{"cmd":"list","ts":"...","sig":"..."}'"'"''
```

---

## Operational rules

1. **Never put real identity data into an agent command.** If a workflow requires your real name, do it yourself, by phone, as the last mile.
2. **Treat your agent server as a known associate.** It knows your aliases. If it's compromised, your alias network is compromised.
3. **Rotate your agent secret regularly.** Quarterly minimum.
4. **Review incidents weekly.** The breach monitor logs anomalies but doesn't auto-burn by default. You make that call.
5. **Know what jurisdiction you're in.** If you're physically in a country that demands device access at the border, your agent knowing your aliases doesn't help if they find your agent server credentials on your laptop.

---

*This is a prototype. The architecture is right. The implementation is a starting point. Extend it for your threat model. And when in doubt — last mile by phone.*
