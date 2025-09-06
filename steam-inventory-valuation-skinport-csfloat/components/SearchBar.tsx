export default function SearchBar({ value, onChange, onSubmit, loading }: { value: string; onChange: (v:string)=>void; onSubmit: ()=>void; loading: boolean; }){
  return (
    <div style={{display:'flex', gap:12, marginTop:12}}>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder="/id/s1mple or https://steamcommunity.com/profiles/7656... or 7656..." style={{flex:1,padding:'12px 14px',border:'1px solid #ddd',borderRadius:12}} />
      <button onClick={onSubmit} disabled={loading} style={{padding:'12px 16px',borderRadius:12,border:'1px solid #111',background:'#111',color:'#fff',cursor:'pointer'}}>{loading? 'Loading…':'Check'}</button>
    </div>
  );
}
