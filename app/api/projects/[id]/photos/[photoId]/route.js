import { getPhotoRowById, deletePhotoById, incrementPhotoCount } from '../../../../../../lib/sheets';
import { deleteFromS3 } from '../../../../../../lib/s3';

export async function DELETE(_, { params }) {
  const photo = await getPhotoRowById(params.photoId);
  if (photo?.s3_key) await deleteFromS3(photo.s3_key);
  await deletePhotoById(params.photoId);
  await incrementPhotoCount(params.id, -1);
  return Response.json({ success: true });
}
