export function getPhotoStores(photos) {
  const stores = new Map();
  for (const photo of photos) {
    const id = String(photo.store_id ?? '').trim();
    const name = String(photo.store_name ?? '').trim();
    if (!id && !name) continue;
    const key = JSON.stringify([id, name]);
    stores.set(key, { key, id, name });
  }
  return [...stores.values()];
}
