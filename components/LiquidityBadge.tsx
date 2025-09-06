import type { PriceMatrix } from '@/lib/pricing';

export default function LiquidityBadge({ m }: { m: PriceMatrix }){
  const s = m.liquidityScore ?? 0;
  const band = m.timeToSellDays ? `${m.timeToSellDays[0]}–${m.timeToSellDays[1]} days` : '—';
  const bg = s>70? '#DCFCE7' : s>40? '#FEF9C3' : '#FEE2E2';
  const fg = s>70? '#166534' : s>40? '#854d0e' : '#991b1b';
  return (
    <span style={{background:bg,color:fg,border:'1px solid #e5e7eb',borderRadius:999,padding:'4px 10px',fontSize:12}}>
      Liquidity {s}/100 • est. {band}
    </span>
  );
}
