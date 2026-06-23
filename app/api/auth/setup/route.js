/**
 * One-time setup: creates the admin account.
 * Protected by SETUP_SECRET env var.
 * Call: POST /api/auth/setup  { secret: "...", password: "..." }
 * Delete or disable this route after first use.
 */
import { getUserByEmail, insertUser } from '../../../../lib/sheets';
import { hashPassword } from '../../../../lib/auth';
import { v4 as uuid } from 'uuid';

export async function POST(request) {
  const { secret, password, name } = await request.json();
  const SETUP_SECRET = process.env.SETUP_SECRET;

  if (!SETUP_SECRET || secret !== SETUP_SECRET) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const existing = await getUserByEmail('ketangrover2002@gmail.com');
  if (existing) {
    return Response.json({ message: 'Admin already exists', email: existing.email });
  }

  const hash = await hashPassword(password || 'Rrgroup@987');
  await insertUser({
    id:            uuid(),
    email:         'ketangrover2002@gmail.com',
    password_hash: hash,
    name:          name || 'Ketan Grover',
    role:          'admin',
  });

  return Response.json({ message: 'Admin created successfully' });
}
