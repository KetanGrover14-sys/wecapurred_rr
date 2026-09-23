import { withAuth } from '../../../lib/withAuth';
import { getRepositoryData, getProjectById, getPhotoRowById, getProjectFileById, saveInstallationMapping, removeInstallationMapping } from '../../../lib/sheets';
import { v4 as uuid } from 'uuid';
import { removalExpired } from '../../../lib/lifecycle';

export const GET = withAuth(async request => {
  try {
    return Response.json(await getRepositoryData(request.user), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Repository load failed', error);
    return Response.json({ error: 'Unable to load the repository. Please try again.' }, { status: 500 });
  }
});

async function mutate(request) {
  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { project_id, photo_id, file_id } = body || {};
  if (![project_id, photo_id, file_id].every(v => typeof v === 'string' && v.length > 0 && v.length < 200)) {
    return Response.json({ error: 'Project, photo and installation file are required' }, { status: 400 });
  }
  try {
    const project = await getProjectById(project_id);
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });
    if (request.user.role !== 'admin' && project.vendor_id !== request.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const [photo, file] = await Promise.all([getPhotoRowById(photo_id), getProjectFileById(file_id)]);
    if (!photo || !file || photo.project_id !== project_id || file.project_id !== project_id || file.type !== 'installation') {
      return Response.json({ error: 'Select a photo and installation file from this project' }, { status: 400 });
    }
    if (request.method === 'DELETE') {
      await removeInstallationMapping(project_id, photo_id, file_id);
      return Response.json({ success: true });
    }
    if (removalExpired(file)) return Response.json({ error: 'This installation has passed its removal date and cannot be linked again.' }, { status: 400 });
    const mapping = await saveInstallationMapping({ id: uuid(), project_id, photo_id, file_id, created_by: request.user.id, created_at: new Date().toISOString() });
    return Response.json(mapping, { status: 201 });
  } catch (error) {
    console.error('Repository mapping failed', error);
    return Response.json({ error: 'Unable to save the mapping. Please try again.' }, { status: 500 });
  }
}

export const POST = withAuth(mutate);
export const DELETE = withAuth(mutate);
