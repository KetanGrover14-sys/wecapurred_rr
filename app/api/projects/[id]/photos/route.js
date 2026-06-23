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
  const file     = formData.get('file');
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

  const buffer   = Buffer.from(await file.arrayBuffer());
  const imageId  = uuid();
  const key      = `projects/${params.id}/${imageId}.jpg`;
  const imageUrl = await uploadToS3(buffer, key, file.type || 'image/jpeg');

  const location         = formData.get('location')          || '';
  const storeName        = formData.get('store_name')         || '';
  const storeOwnerName   = formData.get('store_owner_name')    || '';
  const storeOwnerMobile = formData.get('store_owner_mobile')  || '';
  const now              = new Date().toISOString();

  let entries = [];
  try { entries = JSON.parse(formData.get('entries') || '[]'); } catch {}
  if (!entries.length) entries = [{}];

  const created = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const photo = {
      id:                 uuid(),
      project_id:         params.id,
      image_url:          imageUrl,
      s3_key:             i === 0 ? key : '',
      location,
      store_name:         storeName,
      store_owner_name:   storeOwnerName,
      store_owner_mobile: storeOwnerMobile,
      length:             e.length   || '',
      breadth:            e.breadth  || '',
      height:             e.height   || '',
      material:           e.material || '',
      notes:              e.notes    || '',
      created_at:         now,
    };
    await insertPhoto(photo);
    created.push(photo);
  }

  await incrementPhotoCount(params.id, entries.length);
  return Response.json(created, { status: 201 });
});
