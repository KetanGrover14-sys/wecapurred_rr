import { getPhotoRowById, deletePhotoById, incrementPhotoCount, getProjectById } from '../../../../../../lib/sheets';
import { deleteFromS3 } from '../../../../../../lib/s3';
import { withAuth } from '../../../../../../lib/withAuth';

export const DELETE = withAuth(async (request, { params }) => {
  const project = await getProjectById(params.id);
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

  const { role, id: userId } = request.user;
  if (role !== 'admin' && project.vendor_id !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const photo = await getPhotoRowById(params.photoId);
  if (photo?.s3_key) await deleteFromS3(photo.s3_key);
  await deletePhotoById(params.photoId);
  await incrementPhotoCount(params.id, -1);
  return Response.json({ success: true });
});
