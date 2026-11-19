import { getPhotoStores } from './photoStores';

export function getPhotoStoreText(photos) {
  return getPhotoStores(photos).map(({ id, name }) =>
    [name && `Store name: ${name}`, id && `Store ID: ${id}`].filter(Boolean).join('  |  ')
  ).join('\n');
}
