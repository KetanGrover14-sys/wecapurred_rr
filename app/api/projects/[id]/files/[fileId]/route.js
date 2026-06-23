import { getProjectById, getProjectFileById, deleteProjectFileById, updateProjectFileStatus } from '../../../../../../lib/sheets';
import { deleteFromS3 } from '../../../../../../lib/s3';
import { withAuth } from '../../../../../../lib/withAuth';

async function checkProjectAccess(request, projectId) {
  const project = await getProjectById(projectId);
  if (!project) return { ok: false, res: Response.json({ error: 'Not found' }, { status: 404 }) };
  const { role, id: userId } = request.user;
  if (role !== 'admin' && project.vendor_id !== userId) {
    return { ok: false, res: Response.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true, res: null };
}

// DELETE /api/projects/:id/files/:fileId — admin or uploader can delete
export const DELETE = withAuth(async (request, { params }) => {
  const { ok, res } = await checkProjectAccess(request, params.id);
  if (!ok) return res;

  const file = await getProjectFileById(params.fileId);
  if (!file) return Response.json({ error: 'File not found' }, { status: 404 });

  const { role, id: userId } = request.user;
  if (role !== 'admin' && file.uploaded_by !== userId) {
    return Response.json({ error: 'Only the uploader or admin can delete this file' }, { status: 403 });
  }

  if (file.s3_key) await deleteFromS3(file.s3_key);
  await deleteProjectFileById(params.fileId);
  return Response.json({ success: true });
});

// PATCH /api/projects/:id/files/:fileId — vendor approves or declines installation file
// body: { action: 'approve' | 'decline' }
export const PATCH = withAuth(async (request, { params }) => {
  const { ok, res } = await checkProjectAccess(request, params.id);
  if (!ok) return res;

  const file = await getProjectFileById(params.fileId);
  if (!file) return Response.json({ error: 'File not found' }, { status: 404 });
  if (file.type !== 'installation') {
    return Response.json({ error: 'Only installation files can be approved or declined' }, { status: 400 });
  }

  const { action } = await request.json();
  if (!['approve', 'decline'].includes(action)) {
    return Response.json({ error: 'action must be approve or decline' }, { status: 400 });
  }

  const status = action === 'approve' ? 'approved' : 'declined';
  const updated = await updateProjectFileStatus(
    params.fileId,
    status,
    request.user.id,
    request.user.name,
  );
  return Response.json(updated);
});
