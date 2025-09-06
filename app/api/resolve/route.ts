import { NextResponse } from 'next/server';
import { resolveToSteamId64 } from '@/lib/steam';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const id = await resolveToSteamId64(q);
  if (!id) return NextResponse.json({ error: 'Could not resolve' }, { status: 404 });
  return NextResponse.json({ steamid: id });
}
