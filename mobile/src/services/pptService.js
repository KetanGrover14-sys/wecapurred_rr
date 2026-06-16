import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { BASE_URL } from '../config';

export const generateAndSharePPT = async (project) => {
  const url = `${BASE_URL}/api/projects/${project.id}/ppt`;
  const safeName = project.name.replace(/[^a-zA-Z0-9]/g, '_');
  const localPath = `${FileSystem.documentDirectory}${safeName}_Presentation.pptx`;

  const dl = await FileSystem.downloadAsync(url, localPath);
  if (dl.status !== 200) throw new Error(`Server error: ${dl.status}`);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing is not available on this device');

  await Sharing.shareAsync(dl.uri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    dialogTitle: `${project.name} Presentation`,
  });
};
