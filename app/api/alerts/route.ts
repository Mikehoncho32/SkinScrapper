import { NextResponse } from 'next/server';

// POST body: { name: string, rules: { spreadPct?: number, minLiquidity?: number } }
export async function POST(req: Request){
  const body = await req.json().catch(()=>({}));
  // TODO: persist to KV/DB; for now, echo back
  return NextResponse.json({ ok:true, alert: body });
}
