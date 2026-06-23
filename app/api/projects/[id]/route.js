import { getProjectById, deleteProjectById } from '../../../../lib/sheets';
import { withAuth } from '../../../../lib/withAuth';

async function checkAccess(request, projectId) {
  const project = await getProjectById(projectId);
  if (!project) return { project: null, error: Response.json({ error: 'Not found' }, { status: 404 }) };
  const { role, id: userId } = request.user;
  if (role !== 'admin' && project.vendor_id !== userId) {
    return { project: null, error: Response.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { project, error: null };
}

export const GET = withAuth(async (request, { params }) => {
  const { project, error } = await checkAccess(request, params.id);
  if (error) return error;
  return Response.json(project);
});

export const DELETE = withAuth(async (request, { params }) => {
  const { error } = await checkAccess(request, params.id);
  if (error) return error;
  await deleteProjectById(params.id);
  return Response.json({ success: true });
});
