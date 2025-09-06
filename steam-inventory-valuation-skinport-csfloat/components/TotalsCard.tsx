export default function TotalsCard({ total }: { total: number }){
  return (
    <div style={{marginTop:16,padding:12,border:'1px solid #e5e7eb',borderRadius:12,background:'#fafafa'}}>
      <strong>Total (best venue, net):</strong> ${total.toFixed(2)}
    </div>
  );
}
