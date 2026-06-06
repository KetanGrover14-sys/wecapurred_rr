import { getProjects, insertProject } from '../../../lib/sheets';
import { v4 as uuid } from 'uuid';

export async function GET() {
  const projects = await getProjects();
  return Response.json(projects);
}

export async function POST(request) {
  const { name, clientName, description } = await request.json();
  const id  = uuid();
  const now = new Date().toISOString();
  const project = {
    id,
    name,
    client_name: clientName,
    description: description || '',
    photo_count: 0,
    created_at:  now,
  };
  await insertProject(project);
  return Response.json(project, { status: 201 });
}
