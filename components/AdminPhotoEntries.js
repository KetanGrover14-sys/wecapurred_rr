'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { formatTimestamp, formatRemovalDate } from '../lib/dates';

const labels = { recce: 'Recce', installed: 'Installed', removed: 'Removed' };
const colors = { recce: 'bg-blue-50 text-blue-700', installed: 'bg-green-50 text-green-800', removed: 'bg-gray-100 text-gray-600' };
const fieldStyle = 'w-full border border-gray-200 rounded-lg p-2 text-sm bg-white';

async function entriesRequest(method = 'GET', values) {
  const token = localStorage.getItem('wecapurred_token');
  const response = await fetch('/api/admin/entries', {
    method, cache: 'no-store', headers: { Authorization: `Bearer ${token || ''}`, ...(values ? { 'Content-Type': 'application/json' } : {}) },
    ...(values ? { body: JSON.stringify(values) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unable to load entries.');
  return data;
}

function safeURL(value) { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } }

export default function AdminPhotoEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [payment, setPayment] = useState('all');
  const [project, setProject] = useState('all');
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const dialog = useRef(null);
  const loadSequence = useRef(0);

  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    try { const data = await entriesRequest(); if (sequence === loadSequence.current) { setEntries(data.entries); setError(''); } }
    catch (error) { if (sequence === loadSequence.current) setError(error.message); }
    finally { if (sequence === loadSequence.current) setLoading(false); }
  }, []);
  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    window.addEventListener('focus', load);
    return () => { loadSequence.current++; clearInterval(timer); window.removeEventListener('focus', load); };
  }, [load]);
  useEffect(() => { if (edit && !dialog.current.open) dialog.current.showModal(); }, [edit]);

  async function save(event) {
    event.preventDefault(); setSaving(true); setSaveError('');
    try {
      const updated = await entriesRequest('PATCH', edit);
      loadSequence.current++; // Do not let an older refresh overwrite the saved fields.
      setLoading(false);
      setEntries(previous => previous.map(entry => entry.id === updated.id ? { ...entry, ...updated } : entry));
      setEdit(null); dialog.current.close();
    } catch (error) { setSaveError(error.message); }
    finally { setSaving(false); }
  }

  const projects = [...new Map(entries.map(entry => [entry.project_id, entry.project_name])).entries()];
  const query = search.trim().toLowerCase();
  const visible = entries.filter(entry => (status === 'all' || entry.status === status) && (payment === 'all' || (entry.payment_status || 'unknown') === payment) &&
    (project === 'all' || entry.project_id === project) && [entry.store_id, entry.store_name, entry.collateral, entry.brand_name, entry.project_name].join(' ').toLowerCase().includes(query));

  return <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden mb-8">
    <div className="p-5 border-b border-gray-100 flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-semibold text-gray-900">All photo entries</h2><p className="text-sm text-gray-500 mt-1">Store, collateral, payment and installation tracking. One row per recce entry.</p><p className="text-xs text-gray-500 mt-1">Links expire after the removal date ends (IST). Original files remain in Project Files. Refreshes every minute.</p></div><button onClick={load} disabled={loading} className="border rounded-xl px-4 py-2 text-sm disabled:opacity-50">{loading ? 'Refreshing...' : 'Refresh entries'}</button></div>
    <div className="px-5 pt-4 flex flex-wrap gap-3 text-sm"><span className="rounded-lg bg-gray-50 px-3 py-2">Total: {entries.length}</span>{Object.entries(labels).map(([key, label]) => <span key={key} className={`rounded-lg px-3 py-2 ${colors[key]}`}>{label}: {entries.filter(entry => entry.status === key).length}</span>)}</div>
    <div className="p-5 flex flex-wrap gap-3">
      <input className={`${fieldStyle} flex-1 min-w-[200px]`} aria-label="Search photo entries" placeholder="Search store ID, store, brand, collateral..." value={search} onChange={event => setSearch(event.target.value)} />
      <select className="border rounded-lg p-2 text-sm" aria-label="Filter project" value={project} onChange={event => setProject(event.target.value)}><option value="all">All projects</option>{projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
      <select className="border rounded-lg p-2 text-sm" aria-label="Filter status" value={status} onChange={event => setStatus(event.target.value)}><option value="all">All statuses</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <select className="border rounded-lg p-2 text-sm" aria-label="Filter payment" value={payment} onChange={event => setPayment(event.target.value)}><option value="all">All payments</option><option value="yes">Paid: Yes</option><option value="no">Paid: No</option><option value="unknown">Not recorded</option></select>
    </div>
    {error && <p role="alert" className="px-5 pb-4 text-red-700">{error}</p>}
    <div className="overflow-x-auto"><table className="w-full text-left text-sm" style={{ minWidth: 1450 }}>
      <thead className="bg-gray-50 text-xs uppercase text-gray-600"><tr>{['Recce photo', 'Project', 'Store ID', 'Store name', 'Collateral type', 'Brand name', 'Recce added', 'Installation date / time', 'Project expiry (days)', 'Removal date', 'Payment', 'Status', 'Actions'].map(title => <th key={title} className="p-3 whitespace-nowrap">{title}</th>)}</tr></thead>
      <tbody>{visible.map(entry => <tr key={entry.id} className="border-t border-gray-100 align-top">
        <td className="p-3">{safeURL(entry.image_url) ? <a href={safeURL(entry.image_url)} target="_blank" rel="noopener noreferrer"><img src={safeURL(entry.image_url)} alt={`Recce for ${entry.store_name || entry.store_id || 'store'}`} className="w-20 h-16 object-cover rounded-lg" loading="lazy" /></a> : 'No image'}</td>
        <td className="p-3"><Link className="text-green-800 underline" href={`/projects/${encodeURIComponent(entry.project_id)}`}>{entry.project_name}</Link></td>
        <td className="p-3">{entry.store_id || 'Not recorded'}</td><td className="p-3">{entry.store_name || 'Not recorded'}</td><td className="p-3">{entry.collateral || 'Not recorded'}</td><td className="p-3">{entry.brand_name || 'Not recorded'}</td>
        <td className="p-3 whitespace-nowrap text-xs">{formatTimestamp(entry.created_at)}</td>
        <td className="p-3 text-xs">{entry.installations.length ? entry.installations.map(({ mapping, file, expired }, index) => <div className="mb-2" key={mapping.id}><span className="font-semibold">{index + 1}. </span>{formatTimestamp(file.created_at)}<span className="block text-gray-500">{expired ? 'Unlinked after expiry' : 'Linked'}</span></div>) : 'Not installed'}</td>
        <td className="p-3 whitespace-nowrap" title="Days until this entry's next linked installation removal date; today is zero.">{entry.expiry_days === null ? 'Not specified' : entry.expiry_days < 0 ? `Expired ${Math.abs(entry.expiry_days)} day(s) ago` : entry.expiry_days === 0 ? 'Expires today' : `${entry.expiry_days} day(s)`}</td>
        <td className="p-3 text-xs">{entry.installations.length ? entry.installations.map(({ mapping, file }, index) => <p className="mb-2 whitespace-nowrap" key={mapping.id}>{index + 1}. {formatRemovalDate(file.removal_date)}</p>) : 'Not specified'}</td>
        <td className="p-3">{entry.payment_status === 'yes' ? 'Yes' : entry.payment_status === 'no' ? 'No' : 'Not recorded'}</td>
        <td className="p-3"><span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${colors[entry.status]}`}>{labels[entry.status]}</span></td>
        <td className="p-3"><button className="border rounded-lg px-3 py-1.5" onClick={() => { setSaveError(''); setEdit({ id: entry.id, store_id: entry.store_id || '', store_name: entry.store_name || '', collateral: entry.collateral || '', brand_name: entry.brand_name || '', payment_status: entry.payment_status || '' }); }}>Edit</button></td>
      </tr>)}</tbody>
    </table></div>
    {!visible.length && <p className="p-8 text-center text-gray-500">{loading ? 'Loading photo entries...' : error ? 'Entries could not be loaded.' : 'No matching photo entries.'}</p>}
    <p className="px-5 py-3 text-xs text-gray-500 border-t">Showing {visible.length} of {entries.length} entries. Expiry is calculated from the next active removal date; installation timestamps are upload times.</p>
    <dialog ref={dialog} onCancel={event => { if (saving) event.preventDefault(); else setEdit(null); }} className="w-full max-w-lg rounded-2xl p-6 shadow-xl backdrop:bg-black/50" aria-labelledby="edit-entry-title">
      {edit && <form onSubmit={save}><h3 id="edit-entry-title" className="text-xl font-semibold mb-4">Edit photo entry</h3>
        {[['store_id', 'Store ID'], ['store_name', 'Store name'], ['collateral', 'Collateral type'], ['brand_name', 'Brand name']].map(([key, label]) => <label key={key} className="block text-sm mb-3">{label}<input className={`${fieldStyle} mt-1`} maxLength={200} value={edit[key]} disabled={saving} onChange={event => setEdit(previous => ({ ...previous, [key]: event.target.value }))} /></label>)}
        <label className="block text-sm mb-3">Payment received<select className={`${fieldStyle} mt-1`} value={edit.payment_status} disabled={saving} onChange={event => setEdit(previous => ({ ...previous, payment_status: event.target.value }))}><option value="">Not recorded</option><option value="yes">Yes</option><option value="no">No</option></select></label>
        {saveError && <p role="alert" className="text-red-700 text-sm">{saveError}</p>}
        <div className="flex justify-end gap-2 mt-5"><button type="button" disabled={saving} className="border rounded-xl px-4 py-2" onClick={() => { dialog.current.close(); setEdit(null); }}>Cancel</button><button disabled={saving} className="bg-green-800 text-white rounded-xl px-4 py-2">{saving ? 'Saving...' : 'Save entry'}</button></div>
      </form>}
    </dialog>
  </section>;
}
