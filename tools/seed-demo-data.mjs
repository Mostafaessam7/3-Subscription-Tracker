/**
 * Fills a demo account with subscriptions, so the dashboard, the renewal warnings and the
 * spend-by-category chart have something to draw.
 *
 *   node tools/seed-demo-data.mjs
 *
 * Environment overrides:
 *
 *   ST_API_URL   default http://localhost:5000/api
 *   ST_EMAIL     default demo@tracker.local
 *   ST_PASSWORD  default Demo@12345
 *
 * The account must already exist -- register it in the app first, or POST /api/v1/auth/register.
 * Subscriptions are per-user, so seeding a different account than the one you sign in with leaves
 * the dashboard looking empty while the database is full.
 *
 * Everything goes through the HTTP API rather than SQL, so validation and domain rules apply and
 * this cannot create a row the application would itself reject.
 *
 * Enums travel as numbers: BillingCycle Monthly=0, Yearly=1, Weekly=2, Quarterly=3;
 * Currency EGP=0, USD=1, EUR=2, GBP=3, SAR=4, AED=5.
 */

const API = process.env.ST_API_URL ?? 'http://localhost:5000/api';
const EMAIL = process.env.ST_EMAIL ?? 'demo@tracker.local';
const PASSWORD = process.env.ST_PASSWORD ?? 'Demo@12345';

let token = '';
const stats = { created: 0, failed: [] };

async function call(method, path, body) {
  let res;
  try {
    res = await fetch(API + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    throw new Error(`Could not reach the API at ${API}. Is it running?`, { cause });
  }
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  return { ok: res.ok, status: res.status, json, text };
}

const daysFromNow = n => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

// A believable spread rather than a uniform list: several currencies and cycles, renewals at
// varying distances so the "due soon" band is populated, and one already overdue so the late
// state has something to render.
const SUBS = [
  { name: 'Netflix',            price: 260,  currency: 0, cycle: 0, renewIn: 6,   icon: '🎬', favorite: true, notes: 'خطة العائلة، 4 شاشات' },
  { name: 'Spotify',            price: 90,   currency: 0, cycle: 0, renewIn: 12,  icon: '🎧', favorite: true },
  { name: 'YouTube Premium',    price: 130,  currency: 0, cycle: 0, renewIn: 21,  icon: '📺' },
  { name: 'Adobe Creative',     price: 55,   currency: 1, cycle: 0, renewIn: 3,   icon: '🎨', notes: 'Photoshop + Illustrator' },
  { name: 'GitHub Copilot',     price: 10,   currency: 1, cycle: 0, renewIn: 17,  icon: '🤖' },
  { name: 'JetBrains Suite',    price: 289,  currency: 1, cycle: 1, renewIn: 140, icon: '💻', favorite: true },
  { name: 'Figma',              price: 12,   currency: 1, cycle: 0, renewIn: 9,   icon: '🖌️' },
  { name: 'Notion',             price: 8,    currency: 1, cycle: 0, renewIn: 25,  icon: '📝' },
  { name: 'iCloud+ 2TB',        price: 165,  currency: 0, cycle: 0, renewIn: 2,   icon: '☁️' },
  { name: 'Vodafone Fibre',     price: 700,  currency: 0, cycle: 0, renewIn: 14,  icon: '🌐', notes: '200 ميجا' },
  { name: 'Gym Membership',     price: 1200, currency: 0, cycle: 3, renewIn: 46,  icon: '🏋️' },
  { name: 'Amazon Prime',       price: 599,  currency: 0, cycle: 1, renewIn: 210, icon: '📦' },
  { name: 'Microsoft 365',      price: 99,   currency: 1, cycle: 1, renewIn: 88,  icon: '📊' },
  { name: 'Duolingo Plus',      price: 84,   currency: 1, cycle: 1, renewIn: 300, icon: '🦉' },
  { name: 'Domain + Hosting',   price: 45,   currency: 1, cycle: 1, renewIn: 61,  icon: '🖥️' },
  { name: 'Car Insurance',      price: 4800, currency: 0, cycle: 1, renewIn: 175, icon: '🚗' },
  { name: 'Newspaper',          price: 60,   currency: 0, cycle: 0, renewIn: -4,  icon: '📰', notes: 'متأخر — محتاج تجديد' },
  { name: 'Cloud Backup',       price: 6,    currency: 1, cycle: 0, renewIn: 30,  icon: '💾' },
];

async function main() {
  const login = await call('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
  if (!login.ok) {
    throw new Error(
      `Login failed for ${EMAIL} (${login.status}). Register the account first, then re-run. ` +
      login.text.slice(0, 160));
  }
  token = login.json.token ?? login.json.accessToken;
  const userId = login.json.userId ?? login.json.user?.id;
  if (!userId) throw new Error('Login succeeded but returned no user id: ' + JSON.stringify(login.json).slice(0, 200));

  // Subscriptions carry no natural key, so the API cannot reject a duplicate -- a second run
  // would simply double every figure on the dashboard. Bail out if this account already has any.
  // The list route is per-user: a bare GET /subscriptions is 405, which silently looked like
  // 'no subscriptions' and let a second run double everything.
  const existing = await call('GET', `/subscriptions/user/${userId}`);
  const current = Array.isArray(existing.json) ? existing.json : existing.json?.items ?? [];
  if (current.length) {
    console.log(`${EMAIL} already has ${current.length} subscriptions; leaving them alone.`);
    return;
  }

  for (const s of SUBS) {
    // Started far enough back that the renewal date is genuinely the *next* one.
    const startedDaysAgo = 30 + Math.abs(s.renewIn);
    const r = await call('POST', '/subscriptions', {
      name: s.name,
      description: s.notes ?? null,
      price: s.price,
      currency: s.currency,
      billingCycle: s.cycle,
      startDate: daysFromNow(-startedDaysAgo),
      nextRenewalDate: daysFromNow(s.renewIn),
      autoRenew: s.renewIn >= 0,
      websiteUrl: null,
      notes: s.notes ?? null,
      isFavorite: !!s.favorite,
      icon: s.icon,
      categoryId: null,
      paymentMethodId: null,
      tagIds: null,
      userId,
    });
    if (r.ok) stats.created++;
    else stats.failed.push(`${s.name}: ${r.status} ${r.text.slice(0, 140)}`);
  }

  console.log(`created ${stats.created}, failed ${stats.failed.length}`);
  stats.failed.slice(0, 10).forEach(f => console.log('  ! ' + f));
  if (stats.failed.length) process.exitCode = 1;
}

main().catch(err => {
  console.error(err.message);
  if (err.cause) console.error('  cause:', err.cause.message);
  process.exit(1);
});
