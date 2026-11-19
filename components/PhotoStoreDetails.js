import { getPhotoStores } from '../lib/photoStores';

export default function PhotoStoreDetails({ photos }) {
  return getPhotoStores(photos).map(({ key, id, name }) => (
    <dl key={key} className="flex flex-wrap gap-x-6 gap-y-2 border-b border-gray-100 px-5 py-3 text-sm">
      {name && <div className="min-w-0"><dt className="text-xs text-gray-500">Store name</dt><dd className="break-words font-semibold">{name}</dd></div>}
      {id && <div className="min-w-0"><dt className="text-xs text-gray-500">Store ID</dt><dd className="break-words font-semibold">{id}</dd></div>}
    </dl>
  ));
}
