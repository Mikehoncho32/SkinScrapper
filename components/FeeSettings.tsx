'use client';
import { useState } from 'react';

export default function FeeSettings({ onChange }: { onChange: (fees: any)=>void }){
  const [steam, setSteam] = useState(15);
  const [skinport, setSkinport] = useState(12);
  const [csfloat, setCSFloat] = useState(1);
  const [buff, setBuff] = useState(2);
  const [fx, setFx] = useState(0);

  function apply(){
    onChange({
      feePctByVenue: { Steam: steam/100, Skinport: skinport/100, CSFloat: csfloat/100, Buff: buff/100 },
      payoutFeeByVenue: { Skinport: 0, CSFloat: 0, Buff: 0 },
      fxHaircutPct: fx/100,
    });
  }

  const field = (label:string, value:number, setter:(n:number)=>void) => (
    <label style={{display:'flex',flexDirection:'column',gap:4}}>
      {label}
      <input type="number" value={value} onChange={e=>setter(+e.target.value)} />
    </label>
  );

  return (
    <details style={{marginTop:12}}>
      <summary style={{cursor:'pointer'}}>Fees & FX</summary>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:8,marginTop:8}}>
        {field('Steam %', steam, setSteam)}
        {field('Skinport %', skinport, setSkinport)}
        {field('CSFloat %', csfloat, setCSFloat)}
        {field('Buff %', buff, setBuff)}
        {field('FX haircut %', fx, setFx)}
      </div>
      <button onClick={apply} style={{marginTop:8,padding:'6px 10px'}}>Apply</button>
    </details>
  );
}
