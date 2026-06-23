import { getProjectById, getProjectFiles, insertProjectFile } from '../../../../../lib/sheets';
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

  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });
  if (!['racce', 'installation'].includes(type)) {
    return Response.json({ error: 'type must be racce or installation' }, { status: 400 });
  }

  // Only admin can upload installation files
  if (type === 'installation' && request.user.role !== 'admin') {
    return Response.json({ error: 'Only admin can upload installation files' }, { status: 403 });
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
  };

  await insertProjectFile(record);
  return Response.json(record, { status: 201 });
});
