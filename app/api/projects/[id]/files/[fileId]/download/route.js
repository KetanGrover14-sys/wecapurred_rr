import { getProjectById, getProjectFileById } from '../../../../../../../lib/sheets';
import { verifyToken } from '../../../../../../../lib/auth';

// GET /api/projects/:id/files/:fileId/download?token=<jwt>
// Accepts token as query param since <a href> can't send Authorization headers.
// Proxies the S3 file with Content-Disposition: attachment so the browser downloads it.
export async function GET(request, { params }) {
  // Extract token from Authorization header OR ?token= query param
  const authHeader = request.headers.get('authorization') || '';
  const urlToken   = new URL(request.url).searchParams.get('token');
  const rawToken   = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : urlToken;

  if (!rawToken) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const user = verifyToken(rawToken);
  if (!user) return Response.json({ error: 'Invalid or expired token' }, { status: 401 });

  const project = await getProjectById(params.id);
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });
  if (user.role !== 'admin' && project.vendor_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const file = await getProjectFileById(params.fileId);
  if (!file) return Response.json({ error: 'File not found' }, { status: 404 });

  const upstream = await fetch(file.file_url);
  if (!upstream.ok) return Response.json({ error: 'Failed to fetch file' }, { status: 502 });

  const blob        = await upstream.arrayBuffer();
  const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
  const safeName    = file.file_name.replace(/"/g, '_');

  return new Response(blob, {
    headers: {
      'Content-Type':        contentType,
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Content-Length':      String(blob.byteLength),
    },
  });
}
