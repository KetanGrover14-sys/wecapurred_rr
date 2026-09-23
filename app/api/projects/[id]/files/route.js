import { getProjectById, getProjectFiles, insertProjectFile, getPhotoRowById, saveInstallationMapping } from '../../../../../lib/sheets';
import { uploadToS3 } from '../../../../../lib/s3';
import { withAuth } from '../../../../../lib/withAuth';
import { v4 as uuid } from 'uuid';

async function checkProjectAccess(request, projectId) {
  const project = await getProjectById(projectId);
  if (!project) return { ok: false, res: Response.json({ error: 'Not found' }, { status: 404 }) };
  const { role, id: userId } = request.user;
  if (role !== 'admin' && project.vendor_id !== userId) {
    return { ok: false, res: Response.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true, res: null };
}

// GET /api/projects/:id/files — list RACCE + installation files
export const GET = withAuth(async (request, { params }) => {
  const { ok, res } = await checkProjectAccess(request, params.id);
  if (!ok) return res;
  const files = await getProjectFiles(params.id);
  return Response.json(files);
});

// POST /api/projects/:id/files — upload a file
// type: 'racce' | 'installation'
// installation uploads: admin only
export const POST = withAuth(async (request, { params }) => {
  const { ok, res } = await checkProjectAccess(request, params.id);
  if (!ok) return res;

  const formData = await request.formData();
  const file     = formData.get('file');
  const type     = formData.get('type'); // 'racce' | 'installation'
  const photoId  = formData.get('photo_id');
  const removalDate = formData.get('removal_date') || '';
  const expiryDays = formData.get('project_expiry_days') || '';
  if (expiryDays !== '' && (type !== 'installation' || typeof expiryDays !== 'string' || !/^[1-9]\d*$/.test(expiryDays) || Number(expiryDays) > 36500)) {
    return Response.json({ error: 'Project expiry must be a whole number from 1 to 36500 days.' }, { status: 400 });
  }

  if (!file || typeof file.arrayBuffer !== 'function') return Response.json({ error: 'No file provided' }, { status: 400 });
  if (!['racce', 'installation'].includes(type)) {
    return Response.json({ error: 'type must be racce or installation' }, { status: 400 });
  }

  // Only admin can upload installation files
  if (type === 'installation' && request.user.role !== 'admin') {
    return Response.json({ error: 'Only admin can upload installation files' }, { status: 403 });
  }

  // Date-only value: never convert it to a timezone-dependent timestamp.
  // Missing values remain supported for older clients and historical records.
  if (removalDate) {
    const date = typeof removalDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(removalDate)
      ? new Date(`${removalDate}T00:00:00Z`) : new Date(NaN);
    if (type !== 'installation' || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== removalDate) {
      return Response.json({ error: 'Select a valid removal date (YYYY-MM-DD).' }, { status: 400 });
    }
  }

  // Validate the target before uploading anything. A recce entry must belong to this project.
  if (photoId !== null) {
    if (type !== 'installation' || typeof photoId !== 'string' || !photoId || photoId.length >= 200) {
      return Response.json({ error: 'Select a valid recce photo for this installation.' }, { status: 400 });
    }
    const photo = await getPhotoRowById(photoId);
    if (!photo || photo.project_id !== params.id) {
      return Response.json({ error: 'The recce photo does not belong to this project.' }, { status: 400 });
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || !file.size || file.size > 15 * 1024 * 1024) {
      return Response.json({ error: 'Choose a JPEG, PNG, WebP, or GIF installation image up to 15 MB.' }, { status: 400 });
    }
  }

  const fileId   = uuid();
  const ext      = file.name?.split('.').pop() || 'bin';
  const safeName = file.name?.replace(/[^a-zA-Z0-9._-]/g, '_') || `file.${ext}`;
  const key      = `projects/${params.id}/files/${type}/${fileId}-${safeName}`;

  const buffer   = Buffer.from(await file.arrayBuffer());
  const fileUrl  = await uploadToS3(buffer, key, file.type || 'application/octet-stream');

  const record = {
    id:               fileId,
    project_id:       params.id,
    type,
    file_name:        file.name || safeName,
    file_url:         fileUrl,
    s3_key:           key,
    uploaded_by:      request.user.id,
    uploaded_by_name: request.user.name,
    // installation files start as 'pending'; racce files don't need approval
    status:           type === 'installation' ? 'pending' : '',
    reviewed_by:      '',
    reviewed_by_name: '',
    reviewed_at:      '',
    created_at:       new Date().toISOString(),
    removal_date:     type === 'installation' ? removalDate : '',
    project_expiry_days: type === 'installation' ? expiryDays : '',
  };

  await insertProjectFile(record);
  if (photoId) {
    try {
      const mapping = await saveInstallationMapping({
        id: uuid(), project_id: params.id, photo_id: photoId, file_id: fileId,
        created_by: request.user.id, created_at: new Date().toISOString(),
      });
      return Response.json({ ...record, mapping }, { status: 201 });
    } catch (error) {
      console.error('Installation uploaded but mapping failed', error);
      // The file is already saved. Return it so the UI can retry linking without re-uploading.
      return Response.json({ ...record, mapping_error: 'The photo was uploaded, but linking failed. Select this file below and retry Link to recce.' }, { status: 201 });
    }
  }
  return Response.json(record, { status: 201 });
});
