import { z } from 'zod';

export type Venue = 'Steam' | 'Skinport' | 'CSFloat' | 'Buff';
export type VenueQuote = {
  venue: Venue;
  ask: number | null;          // best ask / floor price in USD (normalized where possible)
  bid?: number | null;         // if available
  median?: number | null;      // median or mean where available
  volume24h?: number | null;   // sales or volume proxy
  listings?: number | null;    // current listing count
  lastSeen: string;            // ISO timestamp
};

export type VenueNet = VenueQuote & { netAsk: number | null; netBid?: number | null };

export type PriceMatrix = {
  name: string;
  quotes: VenueNet[];
  bestVenue?: VenueNet | null;
  liquidityScore?: number;
  timeToSellDays?: [number, number];
};

export type FeeModel = {
  feePctByVenue: Partial<Record<Venue, number>>;
  payoutFeeByVenue?: Partial<Record<Venue, number>>;
  fxHaircutPct?: number;
};

// ---------- Helpers ----------
const SkinportItem = z.object({
  market_hash_name: z.string(),
  currency: z.string(),         // e.g., 'EUR' by default
  min_price: z.number().nullable(),
  median_price: z.number().nullable(),
  mean_price: z.number().nullable(),
  max_price: z.number().nullable(),
  quantity: z.number().nullable().optional(),
});

const CSFloatListing = z.object({
  price: z.number(),            // in cents USD
  item: z.object({
    market_hash_name: z.string(),
  }),
});

const SteamPrice = z.object({
  success: z.boolean().optional(),
  lowest_price: z.string().optional(),
  median_price: z.string().optional(),
  volume: z.string().optional(),
});

function parseNumberString(s?: string): number | null {
  if (!s) return null;
  const n = Number(s.replace(/[^0-9.,]/g, '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function eurToUsd(eur: number | null | undefined, fx=1.08): number | null {
  if (eur==null) return null;
  return Number((eur * fx).toFixed(2));
}

// ---------- Adapters ----------

// 1) Skinport — free, no auth; /v1/items returns all items (EUR by default)
// We fetch once and filter by market_hash_name.
async function skinportQuote(name: string): Promise<VenueQuote> {
  try {
    const params = new URLSearchParams({ app_id: '730', currency: 'EUR', tradable: '0' });
    const r = await fetch(`https://api.skinport.com/v1/items?${params}`, {
      headers: { 'Accept-Encoding': 'br' as any },
      // cache for 5 minutes per docs
      next: { revalidate: 300 }
    });
    if (!r.ok) throw new Error('Skinport error');
    const data = await r.json();
    const arr = z.array(SkinportItem).safeParse(data);
    if (!arr.success) throw new Error('Skinport schema mismatch');
    const found = arr.data.find(i => i.market_hash_name === name);
    if (!found) {
      return { venue: 'Skinport', ask: null, median: null, volume24h: null, listings: null, lastSeen: new Date().toISOString() };
    }
    const askEUR = found.min_price ?? null;
    const medianEUR = found.median_price ?? null;
    // quantity is current active listings on Skinport
    const listings = found.quantity ?? null;
    return {
      venue: 'Skinport',
      ask: eurToUsd(askEUR),
      median: eurToUsd(medianEUR),
      listings,
      volume24h: null, // not provided on this endpoint
      lastSeen: new Date().toISOString(),
    };
  } catch {
    return { venue: 'Skinport', ask: null, median: null, volume24h: null, listings: null, lastSeen: new Date().toISOString() };
  }
}

// 2) CSFloat — requires API key; we take lowest_price from listings as ask
async function csfloatQuote(name: string): Promise<VenueQuote> {
  const key = process.env.CSFLOAT_API_KEY;
  if (!key) {
    return { venue: 'CSFloat', ask: null, bid: null, median: null, volume24h: null, listings: null, lastSeen: new Date().toISOString() };
  }
  try {
    const params = new URLSearchParams({ market_hash_name: name, limit: '50', sort_by: 'lowest_price' });
    const r = await fetch(`https://csfloat.com/api/v1/listings?${params}`, {
      headers: { 'Authorization': key },
      next: { revalidate: 60 }
    });
    if (!r.ok) throw new Error('CSFloat error');
    const data = await r.json();
    const parsed = z.array(CSFloatListing).safeParse(data);
    if (!parsed.success || parsed.data.length === 0) {
      return { venue: 'CSFloat', ask: null, bid: null, median: null, volume24h: null, listings: 0, lastSeen: new Date().toISOString() };
    }
    // prices are in cents USD per docs
    const asksUSD = parsed.data.map(l => l.price / 100);
    const ask = Math.min(...asksUSD);
    const listings = parsed.data.length;
    return {
      venue: 'CSFloat',
      ask,
      median: null,
      listings,
      volume24h: null, // not in this endpoint
      lastSeen: new Date().toISOString(),
    };
  } catch {
    return { venue: 'CSFloat', ask: null, bid: null, median: null, volume24h: null, listings: null, lastSeen: new Date().toISOString() };
  }
}

// 3) Steam — keep as baseline/fallback
async function steamPriceoverview(name: string, currency = '1'): Promise<VenueQuote> {
  try {
    const url = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=${currency}&market_hash_name=${encodeURIComponent(name)}`;
    const r = await fetch(url, { cache: 'force-cache', next: { revalidate: 300 } });
    const j = await r.json();
    const parsed = SteamPrice.safeParse(j);
    if (!parsed.success) throw new Error('Steam schema mismatch');
    return {
      venue: 'Steam',
      ask: parseNumberString(parsed.data.lowest_price),
      median: parseNumberString(parsed.data.median_price),
      volume24h: parsed.data.volume ? Number(parsed.data.volume.replace(/[^0-9]/g, '')) : null,
      listings: null,
      lastSeen: new Date().toISOString(),
    };
  } catch {
    return { venue: 'Steam', ask: null, median: null, volume24h: null, listings: null, lastSeen: new Date().toISOString() };
  }
}

// Placeholder Buff (no official API); keep empty until we decide approach
async function buffQuote(_name: string): Promise<VenueQuote> {
  return { venue: 'Buff', ask: null, bid: null, median: null, volume24h: null, listings: null, lastSeen: new Date().toISOString() };
}

// ---------- Fee application & scoring ----------
export type FeeAware = { feePctByVenue: Partial<Record<Venue, number>>; payoutFeeByVenue?: Partial<Record<Venue, number>>; fxHaircutPct?: number; };

function applyFees(q: VenueQuote, fees: FeeAware): VenueNet {
  const pct = fees.feePctByVenue[q.venue] ?? 0;
  const payout = fees.payoutFeeByVenue?.[q.venue] ?? 0;
  const fx = fees.fxHaircutPct ?? 0;
  const net = (x: number | null | undefined) => (x==null ? null : Math.max(0, x * (1 - pct) * (1 - fx) - payout));
  return { ...q, netAsk: net(q.ask ?? q.median ?? null), netBid: net(q.bid ?? null) };
}

function computeLiquidity(quotes: VenueNet[]): { score: number; tts: [number, number] | undefined } {
  const vols = quotes.map(q => q.volume24h ?? 0);
  const lists = quotes.map(q => q.listings ?? 0);
  const vMax = Math.max(1, ...vols);
  const lMax = Math.max(1, ...lists);
  const norm = quotes.map(q => (0.7 * (q.volume24h ?? 0)/vMax) + (0.3 * (q.listings ?? 0)/lMax));
  const score = Math.round((norm.reduce((a,b)=>a+b,0) / (norm.length || 1)) * 100);
  const tMin = Math.max(0.25, 7 - (score/100)*6);
  const tMax = tMin * 2.2;
  return { score, tts: [Number(tMin.toFixed(2)), Number(tMax.toFixed(2))] };
}

// ---------- Public builders ----------
export async function buildPriceMatrix(name: string, currency = '1', fees?: FeeModel): Promise<PriceMatrix> {
  const [steam, skinport, csf, buff] = await Promise.all([
    steamPriceoverview(name, currency),
    skinportQuote(name),
    csfloatQuote(name),
    buffQuote(name),
  ]);
  const raw: VenueQuote[] = [skinport, csf, steam, buff]; // prioritize third-party first in UI
  const withFees = raw.map(q => applyFees(q, fees ?? { feePctByVenue: { Steam: 0.15, Skinport: 0.12, CSFloat: 0.01 }, fxHaircutPct: 0 }));
  const best = withFees.filter(q => q.netAsk!=null).sort((a,b)=> (b.netAsk! - a.netAsk!))[0] ?? null;
  const { score, tts } = computeLiquidity(withFees);
  return { name, quotes: withFees, bestVenue: best, liquidityScore: score, timeToSellDays: tts };
}

export async function buildMatrices(names: string[], currency = '1', fees?: FeeModel) {
  const out = new Map<string, PriceMatrix>();
  const CONCURRENCY = 3; // keep polite, skinport is heavy
  const queue = [...names];
  async function worker() {
    while (queue.length) {
      const n = queue.shift()!;
      out.set(n, await buildPriceMatrix(n, currency, fees));
      await new Promise(r=>setTimeout(r, 200));
    }
  }
  await Promise.all(Array.from({length: CONCURRENCY}, ()=>worker()));
  return out;
}
