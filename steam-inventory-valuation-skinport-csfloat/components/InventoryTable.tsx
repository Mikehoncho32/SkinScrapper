export default function InventoryTable({ rows }: { rows: any[] }){
  return (
    <div style={{marginTop:16,overflowX:'auto'}}>
      <table width="100%" cellPadding={8} style={{borderCollapse:'collapse',minWidth:720}}>
        <thead>
          <tr style={{borderBottom:'1px solid #e5e7eb'}}>
            <th align="left">Item</th>
            <th align="right">Qty</th>
            <th align="right">Best Venue</th>
            <th align="right">Net (Ask)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i)=> {
            const best = r.pricing?.bestVenue;
            return (
              <tr key={i} style={{borderBottom:'1px solid #f1f5f9'}}>
                <td style={{display:'flex',alignItems:'center',gap:8}}>
                  {r.icon && <img src={r.icon} alt="icon" width={32} height={32} style={{borderRadius:6}}/>}
                  {r.name}
                </td>
                <td align="right">{r.count}</td>
                <td align="right">{best?.venue ?? '—'}</td>
                <td align="right">{best?.netAsk==null? '—' : `$${best.netAsk.toFixed(2)}`}</td>
                <td align="right"><a target="_blank" href={`https://steamcommunity.com/market/search?appid=730&q=${encodeURIComponent(r.name)}`}>Market</a></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
