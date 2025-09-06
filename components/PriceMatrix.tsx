import type { PriceMatrix } from '@/lib/pricing';

export default function PriceMatrix({ m }: { m: PriceMatrix }){
  return (
    <details style={{marginTop:8}}>
      <summary style={{cursor:'pointer'}}>Pricing matrix (venues)</summary>
      <table width="100%" cellPadding={6} style={{borderCollapse:'collapse', marginTop:8}}>
        <thead>
          <tr style={{borderBottom:'1px solid #e5e7eb'}}>
            <th align="left">Venue</th>
            <th align="right">Ask</th>
            <th align="right">Bid</th>
            <th align="right">Median</th>
            <th align="right">Net (Ask)</th>
            <th align="right">Vol 24h</th>
            <th align="right">Listings</th>
            <th align="left">Seen</th>
          </tr>
        </thead>
        <tbody>
          {m.quotes.map((q,i)=> (
            <tr key={i} style={{borderBottom:'1px solid #f1f5f9'}}>
              <td>{q.venue}{m.bestVenue?.venue===q.venue && ' ⭐'}</td>
              <td align="right">{q.ask==null? '—' : `$${q.ask.toFixed(2)}`}</td>
              <td align="right">{q.bid==null? '—' : `$${q.bid.toFixed(2)}`}</td>
              <td align="right">{q.median==null? '—' : `$${q.median.toFixed(2)}`}</td>
              <td align="right">{q.netAsk==null? '—' : <strong>${q.netAsk.toFixed(2)}</strong>}</td>
              <td align="right">{q.volume24h ?? '—'}</td>
              <td align="right">{q.listings ?? '—'}</td>
              <td>{new Date(q.lastSeen).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
