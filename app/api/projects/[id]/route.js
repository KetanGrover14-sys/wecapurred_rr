import { getProjectById, deleteProjectById } from '../../../../lib/sheets';

export async function GET(_, { params }) {
  const project = await getProjectById(params.id);
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(project);
}

export async function DELETE(_, { params }) {
  await deleteProjectById(params.id);
  return Response.json({ success: true });
}
