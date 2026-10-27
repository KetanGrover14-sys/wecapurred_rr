import { getPhotosByProject, insertPhoto, incrementPhotoCount, getProjectById } from '../../../../../lib/sheets';
import { uploadToS3 } from '../../../../../lib/s3';
import { withAuth } from '../../../../../lib/withAuth';
import { v4 as uuid } from 'uuid';

async function checkAccess(request, projectId) {
  const project = await getProjectById(projectId);
  if (!project) return { ok: false, res: Response.json({ error: 'Not found' }, { status: 404 }) };
  const { role, id: userId } = request.user;
  if (role !== 'admin' && project.vendor_id !== userId) {
    return { ok: false, res: Response.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true, res: null };
}

export const GET = withAuth(async (request, { params }) => {
  const { ok, res } = await checkAccess(request, params.id);
  if (!ok) return res;
  const photos = await getPhotosByProject(params.id);
  return Response.json(photos);
});

export const POST = withAuth(async (request, { params }) => {
  const { ok, res } = await checkAccess(request, params.id);
  if (!ok) return res;

  const formData = await request.formData();
  const legacyFile = formData.get('file'); // older clients: one image shared by all entries
  const storeId = formData.get('store_id') || '';
  const brandName = formData.get('brand_name') || '';
  if ([storeId, brandName].some(value => typeof value !== 'string' || value.length > 200)) {
    return Response.json({ error: 'Store ID and brand name must be text of up to 200 characters.' }, { status: 400 });
  }

  const location         = formData.get('location')          || '';
  const storeName        = formData.get('store_name')         || '';
  const storeOwnerName   = formData.get('store_owner_name')    || '';
  const storeOwnerMobile = formData.get('store_owner_mobile')  || '';
  const now              = new Date().toISOString();

  let entries = [];
  try { entries = JSON.parse(formData.get('entries') || '[]'); } catch {}
  if (!Array.isArray(entries) || !entries.length) entries = [{}];

  const files = entries.map((_, i) => formData.get(`file_${i}`) || legacyFile);
  if (files.some(f => !f || typeof f === 'string')) return Response.json({ error: 'Every entry needs a photo' }, { status: 400 });

  const uploaded = new Map();
  const upload = async (f) => {
    if (uploaded.has(f)) return { ...uploaded.get(f), primary: false };
    const key = `projects/${params.id}/${uuid()}.jpg`;
    const url = await uploadToS3(Buffer.from(await f.arrayBuffer()), key, f.type || 'image/jpeg');
    uploaded.set(f, { key, url });
    return { key, url, primary: true };
  };

  const created = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i] || {};
    const { key, url, primary } = await upload(files[i]);
    const photo = {
      id:                 uuid(),
      project_id:         params.id,
      image_url:          url,
      s3_key:             primary ? key : '',
      location,
      store_name:         storeName,
      store_id:           storeId.trim(),
      brand_name:         brandName.trim(),
      payment_status:     '',
      store_owner_name:   storeOwnerName,
      store_owner_mobile: storeOwnerMobile,
      length:             e.length   || '',
      breadth:            e.breadth  || '',
      height:             e.height   || '',
      material:           e.material || '',
      collateral:         e.collateral || '',
      notes:              e.notes    || '',
      created_at:         now,
    };
    await insertPhoto(photo);
    created.push(photo);
  }

  await incrementPhotoCount(params.id, entries.length);
  return Response.json(created, { status: 201 });
});
