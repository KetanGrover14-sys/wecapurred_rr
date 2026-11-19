import { getPhotoStores } from './photoStores';

export function addPhotoStores(slide, photos) {
  const text = getPhotoStores(photos).map(({ id, name }) =>
    [name && `Store name: ${name}`, id && `Store ID: ${id}`].filter(Boolean).join('\n')
  ).join('\n\n');
  if (!text) return;

  slide.addText(text, {
    x: 5.05, y: 0.58, w: 4.7, h: 3.5,
    color: '1B3A2A', fontSize: 16, valign: 'mid', fit: 'shrink',
  });
}
