import { getProjects, insertProject } from '../../../lib/sheets';
import { withAuth } from '../../../lib/withAuth';
import { v4 as uuid } from 'uuid';

// GET /api/projects
// Admin: all projects. Vendor: only their own.
export const GET = withAuth(async (request) => {
  const { role, id: vendorId } = request.user;
  const projects = await getProjects(role === 'admin' ? undefined : vendorId);
  return Response.json(projects);
});

// POST /api/projects
export const POST = withAuth(async (request) => {
  const { name, clientName, description } = await request.json();
  const { id: vendorId } = request.user;
  const id  = uuid();
  const now = new Date().toISOString();
  const project = {
    id,
    name,
    client_name: clientName,
    description: description || '',
    photo_count: 0,
    created_at:  now,
    vendor_id:   vendorId,
  };
  await insertProject(project);
  return Response.json(project, { status: 201 });
});
