// Removal dates remain active through the full date in India Standard Time.
export function indiaDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const value = name => parts.find(part => part.type === name).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function removalExpired(file, now = new Date()) {
  return validDate(file.removal_date) && file.removal_date < indiaDate(now);
}

export function lifecycle(photo, files, mappings, now = new Date()) {
  const installations = mappings.filter(mapping => mapping.photo_id === photo.id && mapping.project_id === photo.project_id)
    .map(mapping => ({ mapping, file: files.find(file => file.id === mapping.file_id && file.project_id === photo.project_id && file.type === 'installation') }))
    .filter(item => item.file)
    .map(item => ({ ...item, expired: removalExpired(item.file, now) }));
  const active = installations.filter(item => !item.expired);
  const dates = (active.length ? active : installations).map(item => item.file.removal_date).filter(validDate).sort();
  const removalDate = active.length ? dates[0] : dates[dates.length - 1];
  const expiryDays = removalDate ? Math.round((Date.parse(`${removalDate}T00:00:00Z`) - Date.parse(`${indiaDate(now)}T00:00:00Z`)) / 86400000) : null;
  return { status: active.length ? 'installed' : installations.length ? 'removed' : 'recce', installations, removal_date: removalDate || '', expiry_days: expiryDays };
}

export function adminRows(data, now = new Date()) {
  const projects = new Map(data.projects.map(project => [project.id, project]));
  return data.photos.filter(photo => projects.has(photo.project_id)).map(photo => ({
    ...photo, project_name: projects.get(photo.project_id).name,
    ...lifecycle(photo, data.files, data.mappings, now),
  })).sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0));
}
