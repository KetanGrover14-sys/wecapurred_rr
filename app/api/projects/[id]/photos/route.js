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

  const buffer   = Buffer.from(await file.arrayBuffer());
  const photoId  = uuid();
  const key      = `projects/${params.id}/${photoId}.jpg`;
  const imageUrl = await uploadToS3(buffer, key, file.type || 'image/jpeg');

  const photo = {
    id:         photoId,
    project_id: params.id,
    image_url:  imageUrl,
    s3_key:     key,
    location:   formData.get('location')  || '',
    length:     formData.get('length')    || '',
    breadth:    formData.get('breadth')   || '',
    height:     formData.get('height')    || '',
    material:   formData.get('material')  || '',
    notes:      formData.get('notes')     || '',
    created_at: new Date().toISOString(),
  };

  await insertPhoto(photo);
  await incrementPhotoCount(params.id, 1);

  return Response.json(photo, { status: 201 });
}
