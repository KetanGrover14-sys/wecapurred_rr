import { withAuth } from '../../../../lib/withAuth';
import { getAdminPhotoRows, updateAdminPhotoDetails } from '../../../../lib/sheets';

export const GET = withAuth(async () => {
  try { return Response.json({ entries: await getAdminPhotoRows() }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) { console.error('Admin entries load failed', error); return Response.json({ error: 'Unable to load photo entries. Please retry.' }, { status: 500 }); }
}, { roles: ['admin'] });

export const PATCH = withAuth(async request => {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid request' }, { status: 400 }); }
  const allowed = ['store_id', 'store_name', 'collateral', 'brand_name', 'payment_status'];
  if (!body || typeof body.id !== 'string' || !body.id || body.id.length > 200 || Object.keys(body).some(key => key !== 'id' && !allowed.includes(key))) {
    return Response.json({ error: 'Invalid photo entry or editable fields.' }, { status: 400 });
  }
  const values = {};
  for (const field of allowed) if (Object.hasOwn(body, field)) {
    if (typeof body[field] !== 'string' || body[field].length > 200) return Response.json({ error: `Invalid ${field}.` }, { status: 400 });
    values[field] = body[field].trim();
  }
  if (!Object.keys(values).length || (Object.hasOwn(values, 'payment_status') && !['yes', 'no', ''].includes(values.payment_status))) {
    return Response.json({ error: 'Payment must be Yes, No, or Not recorded.' }, { status: 400 });
  }
  try {
    const entry = await updateAdminPhotoDetails(body.id, values);
    return entry ? Response.json(entry) : Response.json({ error: 'Photo entry not found.' }, { status: 404 });
  } catch (error) { console.error('Admin entry update failed', error); return Response.json({ error: 'Unable to save entry. Please retry.' }, { status: 500 }); }
}, { roles: ['admin'] });
