'use client';
import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import TotalsCard from '@/components/TotalsCard';
import InventoryTable from '@/components/InventoryTable';
import ErrorBanner from '@/components/ErrorBanner';
import PriceMatrix from '@/components/PriceMatrix';
import LiquidityBadge from '@/components/LiquidityBadge';
import FeeSettings from '@/components/FeeSettings';

type ItemRow = { name: string; icon: string; count: number; pricing: any };

export default function Home() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<ItemRow[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true); setError(null); setRows(null); setTotal(null);
    try {
      const r = await fetch(`/api/inventory?query=${encodeURIComponent(q)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Unknown error');
      setRows(j.items);
      setTotal(j.total);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  function onFeesChange(_fees:any){
    // Future: pass fees to API via querystring or persist in storage
    // For now, server-side defaults apply.
  }

  return (
    <main>
      <p>Paste a Steam vanity (e.g. <code>/id/yourname</code>), profile URL, or SteamID64. We’ll value your CS items using a multi-venue, fee-aware model.</p>
      <SearchBar value={q} onChange={setQ} onSubmit={go} loading={loading} />
      <FeeSettings onChange={onFeesChange} />
      {error && <ErrorBanner message={error} />}
      {total!=null && <TotalsCard total={total} />}
      {rows && <InventoryTable rows={rows} />}
      {rows && rows.map((r,i)=> (
        <div key={i} style={{marginTop:12}}>
          <LiquidityBadge m={r.pricing} />
          <PriceMatrix m={r.pricing} />
        </div>
      ))}
    </main>
  );
}
