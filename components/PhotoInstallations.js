'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, Loader2, Link as LinkIcon } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { getRepository, linkInstallationPhoto, uploadProjectFile } from '../lib/apiService';
import { formatTimestamp, formatRemovalDate } from '../lib/dates';
import { removalExpired } from '../lib/lifecycle';

function safeURL(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}

export default function PhotoInstallations({ photos, projectId, onFilesChanged }) {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [photoId, setPhotoId] = useState(photos[0].id);
  const [fileId, setFileId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [removalDate, setRemovalDate] = useState('');
  const [expiryDays, setExpiryDays] = useState('');
  const input = useRef(null);

  useEffect(() => {
    let active = true;
    const load = () => getRepository().then(data => {
      if (!active) return;
      setFiles(data.files.filter(file => file.project_id === projectId));
      setMappings(data.mappings.filter(mapping => mapping.project_id === projectId));
    }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    load();
    const timer = setInterval(load, 60000);
    return () => { active = false; clearInterval(timer); };
  }, [projectId]);

  const linked = mappings.filter(mapping => photos.some(photo => photo.id === mapping.photo_id))
    .map(mapping => ({ ...mapping, file: files.find(file => file.id === mapping.file_id) })).filter(mapping => mapping.file);
  const available = files.filter(file => file.type === 'installation' && !removalExpired(file) && !mappings.some(mapping => mapping.photo_id === photoId && mapping.file_id === file.id));

  function addMapping(mapping) {
    setMappings(previous => [...previous.filter(item => !(item.photo_id === mapping.photo_id && item.file_id === mapping.file_id)), mapping]);
  }

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!removalDate) { setError('Choose the planned removal date before uploading.'); input.current.value = ''; return; }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || !file.size || file.size > 15 * 1024 * 1024) {
      setError('Choose a JPEG, PNG, WebP, or GIF image up to 15 MB.'); input.current.value = ''; return;
    }
    if ((!/^[1-9]\d*$/.test(expiryDays) || Number(expiryDays) > 36500)) { setError('Enter project expiry as a whole number from 1 to 36500 days.'); return; }
    setBusy(true); setProgress(0); setError(''); setMessage('');
    try {
      const record = await uploadProjectFile(projectId, 'installation', file, setProgress, photoId, removalDate, expiryDays);
      setRemovalDate(''); setExpiryDays('');
      setFiles(previous => [...previous, record]);
      if (record.mapping) {
        addMapping(record.mapping);
        setMessage('Installation photo uploaded and linked. Refresh recce in Norrvex Bucket to see it.');
      } else {
        setFileId(record.id);
        setError(record.mapping_error || 'Photo uploaded. Select Link to recce below to finish mapping.');
      }
      onFilesChanged?.();
    } catch (error) { setError(error.message); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  }

  async function link() {
    if (!fileId) return;
    setBusy(true); setError(''); setMessage('');
    try {
      addMapping(await linkInstallationPhoto(projectId, photoId, fileId));
      setFileId(''); setMessage('Installation linked. Refresh recce in Norrvex Bucket to see it.');
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }

  return <section className="pt-5 border-t border-gray-200 space-y-4" aria-label="Installation photos">
    <div><h3 className="font-semibold text-gray-900">Installation photos</h3><p className="text-xs text-gray-500 mt-1">Link the completed installation to this recce photo. The same mapping appears in Norrvex Bucket.</p></div>
    {loading && <p className="text-sm text-gray-500" role="status">Loading mapped installations...</p>}
    {error && <p className="text-sm text-red-700 bg-red-50 rounded-xl p-3" role="alert">{error}</p>}
    {message && <p className="text-sm text-green-800 bg-green-50 rounded-xl p-3" role="status">{message}</p>}
    {photos.length > 1 && <label className="block text-xs font-semibold text-gray-600">Recce specification entry
      <select value={photoId} disabled={busy || loading} onChange={event => { setPhotoId(event.target.value); setFileId(''); }} className="mt-1 block w-full border rounded-xl p-2 text-sm">
        {photos.map((photo, index) => <option key={photo.id} value={photo.id}>Entry {index + 1} - {photo.material || 'No material'} {[photo.length && `L:${photo.length}`, photo.breadth && `B:${photo.breadth}`, photo.height && `H:${photo.height}`].filter(Boolean).join(' ')}</option>)}
      </select>
    </label>}
    {user?.role === 'admin' ? <div>
      <label className="block text-xs font-semibold mb-3">Project expiry in days<input type="number" min="1" max="36500" step="1" value={expiryDays} disabled={busy || loading} onChange={event => setExpiryDays(event.target.value)} placeholder="e.g. 30" className="mt-1 block w-full border rounded-xl p-2 text-sm" /><span className="block mt-1 font-normal">Planned duration. Removal date controls automatic unlinking.</span></label>
      <label className="block text-xs font-semibold text-gray-600 mb-3">Removal date (planned)
        <input type="date" value={removalDate} disabled={busy || loading} onChange={event => setRemovalDate(event.target.value)} className="mt-1 block w-full border rounded-xl p-2 text-sm" />
      </label>
      <input ref={input} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif" onChange={upload} disabled={busy || loading} />
      <button type="button" disabled={busy || loading || !removalDate} onClick={() => input.current?.click()} className="flex items-center gap-2 bg-primary-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} {busy ? `Saving ${progress ? `${progress}%` : ''}` : 'Upload installation photo'}
      </button><p className="text-xs text-gray-400 mt-2">Up to 15 MB. Automatically linked to the selected recce entry.</p>
    </div> : <p className="text-xs text-gray-500">Admins can upload installation photos. You can link an existing installation file from this project below.</p>}
    {!!available.length && <div className="flex flex-col sm:flex-row gap-2">
      <select aria-label="Existing installation file" value={fileId} disabled={busy || loading} onChange={event => setFileId(event.target.value)} className="min-w-0 flex-1 border rounded-xl p-2 text-sm">
        <option value="">Choose an existing installation file</option>{available.map(file => <option key={file.id} value={file.id}>{file.file_name}</option>)}
      </select><button type="button" disabled={busy || loading || !fileId} onClick={link} className="flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm text-primary-700 disabled:opacity-50"><LinkIcon size={14} /> Link to recce</button>
    </div>}
    {!loading && !linked.length && <p className="text-sm text-gray-400">No installation photos mapped to this recce yet.</p>}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{linked.map(mapping => {
      const file = mapping.file;
      const image = /\.(jpe?g|png|webp|gif)(?:\?|$)/i.test(file.file_name || '') || /\.(jpe?g|png|webp|gif)(?:\?|$)/i.test(file.file_url || '');
      const url = safeURL(file.file_url);
      return <div key={mapping.id} className="border rounded-xl overflow-hidden">
        {image && url && <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={file.file_name} className="w-full h-40 object-contain bg-gray-50" /></a>}
        <div className="p-3"><p className="text-sm font-medium break-words">{file.file_name}</p><p className="text-xs text-gray-500 mt-1">Entry {photos.findIndex(photo => photo.id === mapping.photo_id) + 1} · {file.status || 'pending'}</p>
          <p className="text-xs text-gray-500 mt-1">Installation added: {formatTimestamp(file.created_at)}</p>
          <p className="text-xs text-gray-500 mt-1">Removal date: {formatRemovalDate(file.removal_date)}{file.project_expiry_days && ` | Project expiry: ${file.project_expiry_days} days`}</p>
          {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-700 inline-block mt-2">Open installation file</a>}
        </div>
      </div>;
    })}</div>
  </section>;
}
