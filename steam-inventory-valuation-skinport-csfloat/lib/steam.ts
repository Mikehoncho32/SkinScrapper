const API_KEY = process.env.STEAM_API_KEY;

export async function resolveToSteamId64(input: string): Promise<string | null> {
  const trimmed = (input||'').trim();
  if (!trimmed) return null;
  let candidate = trimmed;
  try { const u = new URL(trimmed); candidate = u.pathname.replace(/\/$/, ''); } catch {}

  const mProfiles = candidate.match(/\/profiles\/(\d{17})/);
  if (mProfiles) return mProfiles[1];

  const mVanity = candidate.match(/\/id\/([^\/]+)/);
  if (mVanity) return await resolveVanity(mVanity[1]);

  if (/^\d{17}$/.test(candidate)) return candidate;
  return await resolveVanity(candidate);
}

async function resolveVanity(vanity: string): Promise<string | null> {
  if (!API_KEY) {
    // Allow numeric IDs without a key; vanity needs key
    return /^\d{17}$/.test(vanity) ? vanity : null;
  }
  const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${API_KEY}&vanityurl=${encodeURIComponent(vanity)}`;
  const r = await fetch(url, { next: { revalidate: 60 } });
  const j = await r.json();
  return j?.response?.success === 1 ? j.response.steamid : null;
}

// CS inventory (appid 730, contextid 2)
export async function fetchInventory(steamid: string) {
  const url = `https://steamcommunity.com/inventory/${steamid}/730/2?l=en&count=5000`;
  const r = await fetch(url, { next: { revalidate: 60 } });
  if (!r.ok) return null;
  const j = await r.json();
  if (!j || !Array.isArray(j.assets) || !Array.isArray(j.descriptions)) return null;

  const descKey = (d:any) => `${d.classid}_${d.instanceid||'0'}`;
  const descMap = new Map<string, any>();
  for (const d of j.descriptions) descMap.set(descKey(d), d);

  const items: any[] = [];
  for (const a of j.assets) {
    const d = descMap.get(`${a.classid}_${a.instanceid||'0'}`) || {};
    items.push({
      assetid: a.assetid,
      classid: a.classid,
      instanceid: a.instanceid,
      name: d.name,
      market_name: d.market_name,
      market_hash_name: d.market_hash_name,
      icon_url: d.icon_url,
      icon_url_large: d.icon_url_large,
    });
  }
  return items;
}
