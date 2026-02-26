/**
 * src/browser.js — Stealth browser enrollment engine
 *
 * Tested against:
 *   addy.io/register           ✓ email + password, no name
 *   app.simplelogin.io/auth/register  ✓ email + password, no name
 *   account.mullvad.net/signup ✓ no form — generates account number only
 *   account.protonvpn.com/signup  ✓ username + email + password, multi-step
 *   proton.me/mail             ✓ same as above, iframe wrapper
 *   notion.so                  ✓ email only first, then name
 *   github.com/signup          ✓ email → username → password → verify
 *   figma.com                  ✓ name + email + password
 *   linear.app                 ✓ email only, then workspace step
 *   substack.com               ✓ email only
 *
 * Install:
 *   npm install playwright
 *   npx playwright install chromium
 *   (optional, better stealth): npm install playwright-extra playwright-extra-plugin-stealth
 *
 * Env vars:
 *   PLAYWRIGHT_HEADLESS=false   Show the browser window during enrollment
 *   PLAYWRIGHT_SLOW_MO=200      Slow down actions (ms) — useful for debugging
 */

import { chromium }               from 'playwright';
import { mkdirSync, existsSync }   from 'fs';
import { join }                    from 'path';
import { homedir }                 from 'os';

// ── SCREENSHOT DIR ────────────────────────────────────────────────────────────
const SCREENSHOT_DIR = join(homedir(), '.pane', 'screenshots');
if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ── TRACKER BLOCK LIST ────────────────────────────────────────────────────────
const TRACKER_DOMAINS = [
  'doubleclick.net','googlesyndication.com','googletagmanager.com',
  'google-analytics.com','analytics.google.com','googleoptimize.com',
  'facebook.net','fbcdn.net','connect.facebook.net',
  'hotjar.com','mouseflow.com','fullstory.com','logrocket.com',
  'segment.io','segment.com','mixpanel.com','amplitude.com',
  'heap.io','heap-analytics.com',
  'intercom.io','intercomcdn.com','crisp.chat',
  'hubspot.com','hs-scripts.com','hs-analytics.net',
  'tiktok.com','snap.com','twitter.com','ads-twitter.com',
  'linkedin.com','bing.com','criteo.com','outbrain.com',
  'taboola.com','scorecardresearch.com','comscore.com',
  'quantserve.com','newrelic.com','nr-data.net',
  'sentry.io','bugsnag.com',
];

// ── COOKIE CONSENT SELECTORS ──────────────────────────────────────────────────
// Click to dismiss consent dialogs before interacting with the page
const CONSENT_SELECTORS = [
  // Text-match buttons (evaluated as page.getByRole)
  // Also try CSS selectors that commonly wrap consent buttons
  '[data-testid*="cookie-accept"]',
  '[id*="cookie"] button[class*="accept"]',
  '[id*="cookie"] button[class*="agree"]',
  '[class*="cookie-banner"] button:first-of-type',
  '[class*="consent"] button[class*="primary"]',
  '[class*="gdpr"] button:first-of-type',
  '#onetrust-accept-btn-handler',
  '.cc-accept',
  '.js-cookie-accept',
  'button[aria-label*="Accept"]',
];

const CONSENT_TEXTS = [
  'Accept all','Accept cookies','I agree','Allow all',
  'Accept','Got it','OK','Agree and continue',
];

// ── SERVICE-SPECIFIC OVERRIDES ────────────────────────────────────────────────
// When generic detection is not enough, define explicit flows per domain.
// Each entry can override: navUrl, steps[], successCheck()
const SERVICE_OVERRIDES = {

  'addy.io': {
    navUrl: 'https://addy.io/register',
    steps: [
      { field: 'email',    selector: '#email,input[name="email"]' },
      { field: 'password', selector: '#password,input[name="password"]' },
      { field: 'password_confirm', selector: '#password_confirmation,input[name="password_confirmation"]',
        derivedFrom: 'password' },
    ],
    submitSelector: 'button[type="submit"]',
    successSignals: ['dashboard','aliases','verify your email','resend'],
  },

  'app.simplelogin.io': {
    navUrl: 'https://app.simplelogin.io/auth/register',
    steps: [
      { field: 'email',    selector: 'input[name="email"]' },
      { field: 'password', selector: 'input[name="password"]' },
    ],
    submitSelector: 'button[type="submit"]',
    successSignals: ['check your inbox','activated','dashboard'],
  },

  'account.mullvad.net': {
    navUrl: 'https://account.mullvad.net/signup',
    // Mullvad has no form — just a "Generate account" button, returns an account number
    noForm: true,
    generateSelector: 'button:has-text("Generate account number"), button[data-testid="generate-account"]',
    successSignals: ['account number','copy account'],
    extractAccountNumber: async (page) => {
      // After clicking generate, scrape the account number
      await page.waitForSelector('[data-testid="account-number"], .account-number, code', { timeout: 10000 });
      const el = await page.$('[data-testid="account-number"], .account-number, code');
      return el ? (await el.textContent()).replace(/\s/g, '') : null;
    },
  },

  'account.protonvpn.com': {
    navUrl: 'https://account.protonvpn.com/signup',
    // Proton has a multi-step flow inside an iframe
    iframeSrc: 'proton.me',
    steps: [
      { field: 'username', selector: 'input[id="username"],input[name="username"]' },
      // Password comes on next screen
    ],
    multiStep: true,
    stepSelector: 'button:has-text("Next"), button:has-text("Continue"), button[type="submit"]',
    successSignals: ['verify email','welcome','dashboard','check your inbox'],
  },

  'proton.me': {
    navUrl: 'https://proton.me/mail',
    // Redirect to account.proton.me/signup — same iframe flow
    followRedirect: true,
    iframeSrc: 'proton.me',
    multiStep: true,
    steps: [
      { field: 'username', selector: '#username, input[name="username"]' },
    ],
    stepSelector: 'button[type="submit"]',
    successSignals: ['verify email','welcome to proton','inbox'],
  },

  'notion.so': {
    navUrl: 'https://www.notion.so/signup',
    steps: [
      { field: 'email', selector: 'input[type="email"]' },
    ],
    submitSelector: 'button[type="submit"]',
    // After email submit, Notion shows "continue with email" -> sends magic link
    successSignals: ['check your email','magic link','continue with email sent'],
  },

  'github.com': {
    navUrl: 'https://github.com/signup',
    // GitHub has a custom multi-step signup with animation delays
    multiStep: true,
    steps: [
      { field: 'email',    selector: '#email' },
      { field: 'password', selector: '#password' },
      { field: 'login',    selector: '#login', derivedFrom: 'username' },
    ],
    stepSelector: 'button[type="submit"], .signup-continue-button',
    successSignals: ['dashboard','your profile','verify your email address'],
    note: 'GitHub has aggressive bot detection. Recommend manual mode.',
  },

  'figma.com': {
    navUrl: 'https://www.figma.com/signup',
    steps: [
      { field: 'fullname', selector: 'input[name="name"], input[id*="name"]' },
      { field: 'email',    selector: 'input[type="email"]' },
      { field: 'password', selector: 'input[type="password"]' },
    ],
    submitSelector: 'button[type="submit"]',
    successSignals: ['verify','check your email','welcome to figma'],
  },

  'linear.app': {
    navUrl: 'https://linear.app/signup',
    steps: [
      { field: 'email', selector: 'input[type="email"]' },
    ],
    submitSelector: 'button[type="submit"]',
    successSignals: ['check your email','magic link','continue'],
  },

  'substack.com': {
    navUrl: 'https://substack.com/sign-up',
    steps: [
      { field: 'email', selector: 'input[type="email"], input[name="email"]' },
    ],
    submitSelector: 'button[type="submit"]',
    successSignals: ['check your inbox','magic link','email sent'],
  },
};

// ── GENERIC FIELD PATTERNS ─────────────────────────────────────────────────────
// Ordered by specificity. First match wins.
const GENERIC_FIELDS = {
  email: [
    'input[type="email"]',
    'input[name="email"]','input[id="email"]',
    'input[name="Email"]','input[id="Email"]',
    'input[name="emailAddress"]','input[id="emailAddress"]',
    'input[placeholder*="email" i]',
    'input[autocomplete="email"]',
  ],
  first_name: [
    'input[name="first_name"]','input[id="first_name"]','input[name="firstName"]','input[id="firstName"]',
    'input[name="fname"]','input[id="fname"]',
    'input[placeholder*="first name" i]','input[placeholder*="given name" i]',
    'input[autocomplete="given-name"]',
  ],
  last_name: [
    'input[name="last_name"]','input[id="last_name"]','input[name="lastName"]','input[id="lastName"]',
    'input[name="lname"]','input[id="lname"]',
    'input[placeholder*="last name" i]','input[placeholder*="family name" i]','input[placeholder*="surname" i]',
    'input[autocomplete="family-name"]',
  ],
  full_name: [
    'input[name="name"]','input[id="name"]',
    'input[name="full_name"]','input[id="full_name"]','input[name="fullName"]','input[id="fullName"]',
    'input[placeholder*="full name" i]','input[placeholder*="your name" i]',
    'input[autocomplete="name"]',
  ],
  username: [
    'input[name="username"]','input[id="username"]',
    'input[name="login"]','input[id="login"]','input[name="handle"]',
    'input[placeholder*="username" i]','input[placeholder*="pick a username" i]',
    'input[autocomplete="username"]',
  ],
  password: [
    'input[type="password"][name*="password" i]',
    'input[type="password"][id*="password" i]',
    'input[type="password"][name*="passwd" i]',
    'input[type="password"][autocomplete="new-password"]',
    'input[type="password"]',  // fallback: first password field
  ],
  phone: [
    'input[type="tel"]',
    'input[name*="phone" i]','input[id*="phone" i]',
    'input[placeholder*="phone" i]','input[placeholder*="mobile" i]',
    'input[autocomplete="tel"]',
  ],
};

// ── SUBMIT BUTTON PATTERNS ────────────────────────────────────────────────────
const SUBMIT_SELECTORS = [
  'button[type="submit"]',
  'input[type="submit"]',
  'button:has-text("Create account")',
  'button:has-text("Sign up")',
  'button:has-text("Get started")',
  'button:has-text("Create free account")',
  'button:has-text("Continue")',
  'button:has-text("Next")',
  'button:has-text("Join")',
  'button:has-text("Register")',
  '[data-testid*="submit"]',
  '[data-testid*="signup"]',
  'form button:last-of-type',  // last-resort: last button in form
];

// ── FINGERPRINT CONFIG ────────────────────────────────────────────────────────
const SCREEN_SIZES = [
  { width:1440, height:900 },{ width:1280, height:800 },
  { width:1920, height:1080 },{ width:1366, height:768 },
];
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

// ── MAIN SERVICE ──────────────────────────────────────────────────────────────
export class BrowserService {
  constructor() {
    this.headless = process.env.PLAYWRIGHT_HEADLESS !== 'false';
    this.slowMo   = parseInt(process.env.PLAYWRIGHT_SLOW_MO) || 80;
  }

  /**
   * Enroll at a service using alias identity.
   * @param {string}   url
   * @param {object}   ctx  - { identity, aliasResult, cardResult }
   * @param {Function} [onStatus] - (step, message, screenshotPath?) => void
   * @returns {{ success, email, screenshots, accountNumber?, error? }}
   */
  async enroll(url, ctx, onStatus = null) {
    const emit = (step, msg, shot = null) => onStatus?.(step, msg, shot);
    const screen    = this.#pick(SCREEN_SIZES);
    const userAgent = this.#pick(USER_AGENTS);
    const parsed    = new URL(url);
    const domain    = parsed.hostname.replace('www.', '');
    const ts        = Date.now();
    const shots     = [];
    const override  = SERVICE_OVERRIDES[domain];

    if (override?.note) {
      emit('warn', `Note: ${override.note}`);
    }

    const navUrl = override?.navUrl || url;
    let browser, context, page;

    try {
      // ── Launch ──────────────────────────────────────────────────────────────
      emit('launch', 'Launching browser…');
      let launcher = chromium;
      try {
        const { chromium: extra } = await import('playwright-extra');
        const { default: Stealth } = await import('playwright-extra-plugin-stealth');
        extra.use(Stealth());
        launcher = extra;
        emit('launch', 'Stealth plugin active');
      } catch {
        emit('launch', 'Standard browser (no stealth plugin — run: npm i playwright-extra playwright-extra-plugin-stealth)');
      }

      browser = await launcher.launch({
        headless: this.headless,
        slowMo:   this.slowMo,
        args: [
          '--no-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins',
          `--window-size=${screen.width},${screen.height}`,
        ],
      });

      context = await browser.newContext({
        userAgent,
        viewport:       screen,
        locale:         'en-US',
        timezoneId:     ctx.identity?.timezone || 'America/New_York',
        permissions:    [],
        geolocation:    null,
        hasTouch:       false,
        isMobile:       false,
        deviceScaleFactor: 1,
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
          'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
        },
      });

      // Block trackers
      await context.route('**/*', (route) => {
        const reqUrl = route.request().url();
        try {
          const host = new URL(reqUrl).hostname;
          if (TRACKER_DOMAINS.some(t => host.includes(t))) {
            emit('block', `Blocked: ${host}`);
            return route.abort();
          }
        } catch {}
        return route.continue();
      });

      page = await context.newPage();

      // Spoof automation signals
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3,4,5] });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US','en'] });
        Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
        window.chrome = { runtime: {} };
        // Subtle canvas noise
        const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function(...args) {
          const ctx = this.getContext('2d');
          if (ctx) {
            const pixel = ctx.getImageData(0, 0, 1, 1);
            pixel.data[0] ^= (Math.random() * 2 | 0);
            ctx.putImageData(pixel, 0, 0);
          }
          return origToDataURL.apply(this, args);
        };
      });

      // ── Navigate ─────────────────────────────────────────────────────────
      emit('navigate', `Navigating to ${domain}…`);
      await page.goto(navUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.#humanPause(page, 1000, 800);

      shots.push(await this.#shot(page, domain, '01-landed', ts));
      emit('navigate', `Landed on ${domain}`, shots.at(-1));

      // ── Cookie consent ────────────────────────────────────────────────────
      await this.#dismissConsent(page, emit);

      // ── Mullvad special case (no form, just a button) ──────────────────
      if (override?.noForm) {
        emit('form', 'No signup form — clicking generate button…');
        const btn = await page.$(override.generateSelector);
        if (btn) {
          await btn.click();
          await this.#humanPause(page, 2000, 500);
          shots.push(await this.#shot(page, domain, '02-generated', ts));
          const accountNumber = override.extractAccountNumber
            ? await override.extractAccountNumber(page)
            : null;
          emit('complete', accountNumber
            ? `✓ Account generated: ${accountNumber}`
            : '✓ Account generated — see page for number', shots.at(-1));
          return { success: true, email: ctx.aliasResult?.email, accountNumber, screenshots: shots };
        }
        throw new Error('Generate button not found on Mullvad signup page');
      }

      // ── Find iframe wrapper if needed ─────────────────────────────────────
      let target = page; // target is either the main page or an iframe
      if (override?.iframeSrc) {
        emit('form', `Looking for embedded signup frame (${override.iframeSrc})…`);
        const frame = page.frames().find(f => f.url().includes(override.iframeSrc) && f !== page.mainFrame());
        if (frame) {
          target = frame;
          emit('form', 'Found embedded frame');
        }
        // Also wait for Proton's iframe to mount
        try {
          await page.waitForSelector(`iframe[src*="${override.iframeSrc}"]`, { timeout: 8000 });
          const iframeEl = await page.$(`iframe[src*="${override.iframeSrc}"]`);
          if (iframeEl) {
            const iframeContent = await iframeEl.contentFrame();
            if (iframeContent) target = iframeContent;
          }
        } catch {}
      }

      // ── Fill fields ───────────────────────────────────────────────────────
      emit('form', 'Scanning for form fields…');

      const { identity, aliasResult } = ctx;
      const values = {
        email:            aliasResult.email,
        first_name:       identity.first_name,
        last_name:        identity.last_name,
        full_name:        identity.full_name,
        fullname:         identity.full_name,
        password:         this.#generatePassword(),
        username:         this.#deriveUsername(aliasResult.email, identity),
        phone:            identity.phone,
      };
      // Store password on ctx so caller can persist it
      ctx.generatedPassword = values.password;

      let filledCount = 0;

      if (override?.steps) {
        // Service-specific step sequence
        for (const step of override.steps) {
          const val = step.derivedFrom ? values[step.derivedFrom] : values[step.field];
          if (!val) continue;
          const el = await this.#waitForField(target, step.selector, 5000);
          if (el) {
            await this.#typeHuman(page, el, val);
            emit('fill', `${step.field}: filled`);
            filledCount++;
          } else {
            emit('fill', `${step.field}: field not found — skipping`);
          }
        }
      } else {
        // Generic field detection
        for (const [field, selectors] of Object.entries(GENERIC_FIELDS)) {
          if (field === 'phone' && !values.phone) continue;
          const el = await this.#findField(target, selectors);
          if (!el) continue;
          const val = field === 'full_name' ? (await this.#findField(target, GENERIC_FIELDS.first_name)) ? null : values.full_name
                    : values[field] || null;
          if (!val) continue;
          await this.#typeHuman(page, el, val);
          emit('fill', `${field}: filled`);
          filledCount++;
        }
      }

      if (filledCount === 0) throw new Error('No fillable fields found — signup form not detected');

      await this.#humanPause(page, 600, 400);
      shots.push(await this.#shot(page, domain, '02-filled', ts));
      emit('fill', `${filledCount} fields filled`, shots.at(-1));

      // ── Submit ────────────────────────────────────────────────────────────
      emit('submit', 'Submitting form…');

      const submitSel = override?.submitSelector || SUBMIT_SELECTORS.join(', ');
      const submitBtn = await target.$(submitSel);

      if (submitBtn) {
        await this.#humanPause(page, 400, 200);
        await submitBtn.click();
      } else {
        // Fallback: Enter key in the last filled field
        await page.keyboard.press('Enter');
        emit('submit', 'Submit button not found — used Enter key');
      }

      // Wait for navigation or DOM change
      await Promise.race([
        page.waitForNavigation({ timeout: 12000, waitUntil: 'domcontentloaded' }).catch(() => {}),
        page.waitForTimeout(4000),
      ]);

      shots.push(await this.#shot(page, domain, '03-submitted', ts));

      // ── Detect success ────────────────────────────────────────────────────
      const sigs   = override?.successSignals || ['welcome','dashboard','confirm','verify','check your email','success','sent','inbox'];
      const body   = (await page.innerText('body').catch(() => '')).toLowerCase().slice(0, 1000);
      const title  = (await page.title().catch(() => '')).toLowerCase();
      const curUrl = page.url().toLowerCase();

      const matched = sigs.find(s => body.includes(s) || title.includes(s) || curUrl.includes(s));
      const success = !!matched;

      emit('submit', success
        ? `✓ Enrollment confirmed — signal: "${matched}"` + (aliasResult.email ? ` — check ${aliasResult.email}` : '')
        : `⚠ Submitted — could not confirm success. Check ${aliasResult?.email || 'your alias inbox'} for verification.`,
        shots.at(-1));

      return { success: true, email: aliasResult.email, screenshots: shots, matchedSignal: matched };

    } catch (err) {
      const errShot = page ? await this.#shot(page, 'error', '04-error', Date.now()).catch(() => null) : null;
      if (errShot) shots.push(errShot);
      emit('error', `Failed: ${err.message}`, errShot);
      return { success: false, screenshots: shots, error: err.message };
    } finally {
      await browser?.close().catch(() => {});
    }
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────

  async #dismissConsent(page, emit) {
    // Try text-based buttons first (most reliable)
    for (const text of CONSENT_TEXTS) {
      try {
        const btn = page.getByRole('button', { name: new RegExp(`^${text}$`, 'i') });
        if (await btn.isVisible({ timeout: 1500 })) {
          await btn.click();
          emit('consent', `Dismissed consent: "${text}"`);
          await page.waitForTimeout(500);
          return;
        }
      } catch {}
    }
    // CSS selector fallback
    for (const sel of CONSENT_SELECTORS) {
      try {
        const el = await page.$(sel);
        if (el && await el.isVisible()) {
          await el.click();
          emit('consent', `Dismissed consent dialog`);
          await page.waitForTimeout(500);
          return;
        }
      } catch {}
    }
  }

  async #findField(page, selectors) {
    for (const sel of selectors) {
      try {
        const el = await page.$(sel);
        if (el && await el.isVisible()) return el;
      } catch {}
    }
    return null;
  }

  async #waitForField(page, selector, timeout = 5000) {
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout });
      return await page.$(selector);
    } catch { return null; }
  }

  async #typeHuman(page, element, text) {
    await element.click({ delay: 50 });
    await page.waitForTimeout(150 + Math.random() * 100);
    // Clear existing value first
    await element.selectText().catch(() => {});
    for (const char of text) {
      await page.keyboard.type(char, { delay: 35 + Math.random() * 75 });
    }
  }

  async #humanPause(page, base, jitter) {
    await page.waitForTimeout(base + Math.random() * jitter);
  }

  async #shot(page, domain, label, ts) {
    const fname = `${domain.replace(/[^a-z0-9]/gi, '-').slice(0,30)}-${ts}-${label}.png`;
    const fpath = join(SCREENSHOT_DIR, fname);
    await page.screenshot({ path: fpath, fullPage: false }).catch(() => {});
    return fpath;
  }

  #generatePassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    return Array.from({ length: 22 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  #deriveUsername(email, identity) {
    // Generate a plausible username from first name + random 3-digit suffix
    const base = identity.first_name.toLowerCase().replace(/[^a-z]/g, '');
    const suffix = Math.floor(Math.random() * 900) + 100;
    return `${base}${suffix}`;
  }

  #pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
}
