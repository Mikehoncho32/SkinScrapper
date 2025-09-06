# Steam Inventory Valuation (Trader MVP)

Next.js app that resolves a Steam profile, fetches CS inventory, aggregates venue pricing (Steam + placeholders for third-party markets), applies fee-aware net proceeds, computes liquidity scores, and totals the value.

## Local Dev
1. `npm i`
2. Copy `.env.example` → `.env.local` and set `STEAM_API_KEY` + (optional) `DEFAULT_CURRENCY`
3. `npm run dev` → open http://localhost:3000

## Deploy to Vercel
1. Push to GitHub
2. Import in Vercel
3. In **Project → Settings → Environment Variables**, add:
   - `STEAM_API_KEY`
   - `DEFAULT_CURRENCY` (optional; default 1=USD)
4. Deploy

## Notes
- Inventory: `https://steamcommunity.com/inventory/{steamid}/730/2?l=en&count=5000`
- Prices: `https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=...` (24h median; rate-limited)
- Private inventories return 403/empty → surfaced as 404 in API response.
- Third-party venue adapters are placeholders in `lib/pricing.ts`. Replace with real APIs when available.


## Third-Party Pricing (enabled)
- **Skinport**: uses `/v1/items` (no auth, 8 req/5 min, requires `Accept-Encoding: br`). We fetch once and filter.
- **CSFloat**: uses `GET https://csfloat.com/api/v1/listings?market_hash_name=...&limit=50&sort_by=lowest_price` with header `Authorization: <API-KEY>`.
  - Add `CSFLOAT_API_KEY` to `.env.local` (dev) and Vercel (prod).
