import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/** GET /api/push/vapid — trả VAPID public key cho client đăng ký push */
export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY || '';
  if (!key) {
    return NextResponse.json({ error: 'Push not configured' }, { status: 503 });
  }
  return NextResponse.json({ publicKey: key });
}
