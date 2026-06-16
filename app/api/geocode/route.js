export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  if (!lat || !lon) return Response.json({ error: 'Missing lat/lon' }, { status: 400 });

  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`,
    { headers: { 'User-Agent': 'NorrvexPartner-App/1.0 (banner-management)' } }
  );
  const data = await res.json();
  return Response.json(data);
}
