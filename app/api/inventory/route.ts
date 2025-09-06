import { NextResponse } from 'next/server';
import { resolveToSteamId64, fetchInventory } from '@/lib/steam';
import { buildMatrices, type FeeModel } from '@/lib/pricing';

export const revalidate = 60; // light caching on Vercel

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const currency = process.env.DEFAULT_CURRENCY || '1'; // 1 = USD

    const steamid = await resolveToSteamId64(query);
    if (!steamid) return NextResponse.json({ error: 'Could not resolve SteamID from input.' }, { status: 400 });

    const inv = await fetchInventory(steamid);
    if (!inv) return NextResponse.json({ error: 'No inventory or profile is private.' }, { status: 404 });

    // Collate by market_hash_name
    const byName = new Map<string, { icon: string; count: number }>();
    for (const it of inv) {
      const name = it.market_hash_name || it.market_name || it.name;
      if (!name) continue;
      const icon = it.icon_url || it.icon_url_large || '';
      const cur = byName.get(name) || { icon: icon? `https://steamcommunity-a.akamaihd.net/economy/image/${icon}` : '', count: 0 };
      cur.count += 1;
      if (!cur.icon && icon) cur.icon = `https://steamcommunity-a.akamaihd.net/economy/image/${icon}`;
      byName.set(name, cur);
    }

    const uniqueNames = Array.from(byName.keys());
    const feeModel: FeeModel = {
      feePctByVenue: { Steam: 0.15, Skinport: 0.12, CSFloat: 0.01, Buff: 0.02 },
      payoutFeeByVenue: { Skinport: 0, CSFloat: 0, Buff: 0 },
      fxHaircutPct: 0.00,
    };
    const matrices = await buildMatrices(uniqueNames, currency, feeModel);

    let total = 0;
    const items = uniqueNames.map(name => {
      const meta = byName.get(name)!;
      const m = matrices.get(name)!;
      const bestNet = m.bestVenue?.netAsk ?? null;
      if (bestNet!=null) total += bestNet * meta.count;
      return {
        name,
        icon: meta.icon,
        count: meta.count,
        pricing: m,
      };
    }).sort((a,b)=> ((b.pricing.bestVenue?.netAsk ?? 0) - (a.pricing.bestVenue?.netAsk ?? 0)));

    return NextResponse.json({ items, total: Math.round(total*100)/100 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
