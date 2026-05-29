export function isValidApiKey(request: Request) {
  const key = request.headers.get('x-api-key') || request.headers.get('authorization');
  const expected = process.env.API_KEY || '';
  if (!expected) return false;
  if (!key) return false;
  // support 'Bearer <key>' or raw key
  if (key.startsWith('Bearer ')) return key.slice(7) === expected;
  return key === expected;
}
