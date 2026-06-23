import { verifyToken, tokenFromRequest } from './auth';

/**
 * Wraps a Next.js route handler with JWT auth.
 * roles: array of allowed roles, e.g. ['admin'] or ['admin','vendor']
 * If roles is empty/undefined, any authenticated user is allowed.
 * Injects req.user = { id, email, name, role } via a patched NextRequest.
 */
export function withAuth(handler, { roles = [] } = {}) {
  return async (request, context) => {
    const token = tokenFromRequest(request);
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (roles.length && !roles.includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Attach user to request via a custom property
    request.user = user;
    return handler(request, context);
  };
}
