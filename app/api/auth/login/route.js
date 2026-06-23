import { getUserByEmail } from '../../../../lib/sheets';
import { checkPassword, signToken } from '../../../../lib/auth';

export async function POST(request) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return Response.json({ error: 'Email and password required' }, { status: 400 });
  }

  const user = await getUserByEmail(email.trim().toLowerCase());
  if (!user) {
    return Response.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const valid = await checkPassword(password, user.password_hash);
  if (!valid) {
    return Response.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
  return Response.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
