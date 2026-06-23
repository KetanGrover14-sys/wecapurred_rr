import { getUsers, getUserByEmail, insertUser } from '../../../lib/sheets';
import { hashPassword } from '../../../lib/auth';
import { withAuth } from '../../../lib/withAuth';
import { v4 as uuid } from 'uuid';

// GET /api/vendors — list all vendors (admin only)
export const GET = withAuth(async () => {
  const users = await getUsers();
  const vendors = users
    .filter(u => u.role === 'vendor')
    .map(({ password_hash, ...u }) => u);
  return Response.json(vendors);
}, { roles: ['admin'] });

// POST /api/vendors — create a vendor (admin only)
export const POST = withAuth(async (request) => {
  const { email, password, name } = await request.json();
  if (!email || !password || !name) {
    return Response.json({ error: 'email, password and name are required' }, { status: 400 });
  }

  const existing = await getUserByEmail(email.trim().toLowerCase());
  if (existing) {
    return Response.json({ error: 'A user with this email already exists' }, { status: 409 });
  }

  const hash = await hashPassword(password);
  const vendor = {
    id:            uuid(),
    email:         email.trim().toLowerCase(),
    password_hash: hash,
    name:          name.trim(),
    role:          'vendor',
  };
  await insertUser(vendor);
  const { password_hash, ...safe } = vendor;
  return Response.json(safe, { status: 201 });
}, { roles: ['admin'] });
