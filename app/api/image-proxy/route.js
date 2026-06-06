export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) return Response.json({ error: 'Missing url' }, { status: 400 });

  const res = await fetch(url);
  if (!res.ok) return Response.json({ error: 'Fetch failed' }, { status: 502 });

  const buffer      = await res.arrayBuffer();
  const base64      = Buffer.from(buffer).toString('base64');
  const contentType = res.headers.get('content-type') || 'image/jpeg';

  return Response.json({ data: `data:${contentType};base64,${base64}` });
}
