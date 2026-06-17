import { getPhotosByProject, insertPhoto, incrementPhotoCount } from '../../../../../lib/sheets';
import { uploadToS3 } from '../../../../../lib/s3';
import { v4 as uuid } from 'uuid';

export async function GET(_, { params }) {
  const photos = await getPhotosByProject(params.id);
  return Response.json(photos);
}

export async function POST(request, { params }) {
  const formData = await request.formData();
  const file     = formData.get('file');
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

  // Upload image once to S3
  const buffer   = Buffer.from(await file.arrayBuffer());
  const imageId  = uuid();
  const key      = `projects/${params.id}/${imageId}.jpg`;
  const imageUrl = await uploadToS3(buffer, key, file.type || 'image/jpeg');

  const location          = formData.get('location')          || '';
  const storeName         = formData.get('store_name')         || '';
  const storeOwnerName    = formData.get('store_owner_name')    || '';
  const storeOwnerMobile  = formData.get('store_owner_mobile')  || '';
  const now               = new Date().toISOString();

  // Parse entries array [{ material, length, breadth, height, notes }]
  let entries = [];
  try { entries = JSON.parse(formData.get('entries') || '[]'); } catch {}
  if (!entries.length) entries = [{}]; // fallback: single empty entry

  const created = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const photo = {
      id:         uuid(),
      project_id: params.id,
      image_url:  imageUrl,
      // Only first record owns the S3 key for deletion; others set null to avoid double-delete
      s3_key:             i === 0 ? key : '',
      location,
      store_name:         storeName,
      store_owner_name:   storeOwnerName,
      store_owner_mobile: storeOwnerMobile,
      length:             e.length   || '',
      breadth:    e.breadth  || '',
      height:     e.height   || '',
      material:   e.material || '',
      notes:      e.notes    || '',
      created_at: now,
    };
    await insertPhoto(photo);
    created.push(photo);
  }

  await incrementPhotoCount(params.id, entries.length);
  return Response.json(created, { status: 201 });
}
