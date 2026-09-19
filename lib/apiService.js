// All data goes through Next.js API routes → Google Sheets + AWS S3

const TOKEN_KEY = 'wecapurred_token';

function authHeaders(extra = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  return token
    ? { Authorization: `Bearer ${token}`, ...extra }
    : { ...extra };
}

export const getProjects = () =>
  fetch('/api/projects', { headers: authHeaders() }).then((r) => r.json());

export const createProject = (data) =>
  fetch('/api/projects', {
    method:  'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body:    JSON.stringify(data),
  }).then((r) => r.json());

export const deleteProject = (id) =>
  fetch(`/api/projects/${id}`, { method: 'DELETE', headers: authHeaders() }).then((r) => r.json());

export const getProject = (id) =>
  fetch(`/api/projects/${id}`, { headers: authHeaders() }).then((r) => r.json());

export const getPhotos = (projectId) =>
  fetch(`/api/projects/${projectId}/photos`, { headers: authHeaders() }).then((r) => r.json());

export const deletePhoto = (projectId, photoId) =>
  fetch(`/api/projects/${projectId}/photos/${photoId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then((r) => r.json());

// entries: [{ material, length, breadth, height, notes }, ...]
export const addPhoto = async (projectId, location, storeName, storeOwnerName, storeOwnerMobile, entries, file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('location', location);
  formData.append('store_name', storeName);
  formData.append('store_owner_name', storeOwnerName);
  formData.append('store_owner_mobile', storeOwnerMobile);
  formData.append('entries', JSON.stringify(entries));

  return new Promise((resolve, reject) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/projects/${projectId}/photos`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      const data = JSON.parse(xhr.responseText);
      xhr.status < 300 ? resolve(data) : reject(new Error(data.error || 'Upload failed'));
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
};

// ── Project files (RACCE & Installation) ─────────────────────────────────────

export const getProjectFiles = (projectId) =>
  fetch(`/api/projects/${projectId}/files`, { headers: authHeaders() }).then((r) => r.json());

export const uploadProjectFile = (projectId, type, file, onProgress, photoId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  if (photoId) formData.append('photo_id', photoId);
  return new Promise((resolve, reject) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('wecapurred_token') : null;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/projects/${projectId}/files`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        xhr.status >= 200 && xhr.status < 300 ? resolve(data) : reject(new Error(data.error || 'Upload failed'));
      } catch { reject(new Error('Upload failed. The server returned an invalid response.')); }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
};

async function repositoryRequest(method = 'GET', body) {
  const response = await fetch('/api/repository', {
    method, cache: 'no-store', headers: authHeaders(body ? { 'Content-Type': 'application/json' } : {}),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data;
  try { data = await response.json(); } catch { throw new Error('Unable to read the repository response.'); }
  if (!response.ok) throw new Error(data.error || 'Repository request failed.');
  return data;
}

export const getRepository = () => repositoryRequest();
export const linkInstallationPhoto = (projectId, photoId, fileId) => repositoryRequest('POST', {
  project_id: projectId, photo_id: photoId, file_id: fileId,
});

export const deleteProjectFile = (projectId, fileId) =>
  fetch(`/api/projects/${projectId}/files/${fileId}`, {
    method: 'DELETE', headers: authHeaders(),
  }).then((r) => r.json());

export const reviewInstallationFile = (projectId, fileId, action) =>
  fetch(`/api/projects/${projectId}/files/${fileId}`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ action }),
  }).then((r) => r.json());

// ── Vendor management (admin only) ───────────────────────────────────────────

export const getVendors = () =>
  fetch('/api/vendors', { headers: authHeaders() }).then((r) => r.json());

export const createVendor = (data) =>
  fetch('/api/vendors', {
    method:  'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body:    JSON.stringify(data),
  }).then((r) => r.json());

export const deleteVendor = (id) =>
  fetch(`/api/vendors/${id}`, { method: 'DELETE', headers: authHeaders() }).then((r) => r.json());
