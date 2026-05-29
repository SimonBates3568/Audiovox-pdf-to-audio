import { NextResponse } from 'next/server';
import { isValidApiKey } from '../../../lib/apiAuth';

export async function GET(request: Request) {
  if (!isValidApiKey(request)) return NextResponse.json({ error: 'invalid or missing API key' }, { status: 401 });

  // Server can return a static list or proxy browser voices if available.
  const voices = [
    { name: 'Jenny', lang: 'en-US', gender: 'female' },
    { name: 'Adam', lang: 'en-GB', gender: 'male' },
  ];

  return NextResponse.json({ voices });
}
