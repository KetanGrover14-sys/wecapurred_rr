import { deleteUserById, getUserById } from '../../../../lib/sheets';
import { withAuth } from '../../../../lib/withAuth';

// DELETE /api/vendors/:id — remove a vendor (admin only)
export const DELETE = withAuth(async (request, { params }) => {
  const user = await getUserById(params.id);
  if (!user) return Response.json({ error: 'Vendor not found' }, { status: 404 });
  if (user.role === 'admin') {
    return Response.json({ error: 'Cannot delete admin accounts' }, { status: 400 });
  }
  await deleteUserById(params.id);
  return Response.json({ success: true });
}, { roles: ['admin'] });
