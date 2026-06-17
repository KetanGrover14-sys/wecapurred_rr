// All data goes through Next.js API routes → MySQL + AWS S3

export const getProjects = () =>
  fetch('/api/projects').then((r) => r.json());

export const createProject = (data) =>
  fetch('/api/projects', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  }).then((r) => r.json());

export const deleteProject = (id) =>
  fetch(`/api/projects/${id}`, { method: 'DELETE' }).then((r) => r.json());

export const getProject = (id) =>
  fetch(`/api/projects/${id}`).then((r) => r.json());

export const getPhotos = (projectId) =>
  fetch(`/api/projects/${projectId}/photos`).then((r) => r.json());

// entries: [{ material, length, breadth, height, notes }, ...]
// Image is uploaded once; one DB record is created per entry.
export const addPhoto = async (projectId, location, storeName, storeOwnerName, storeOwnerMobile, entries, file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('location', location);
  formData.append('store_name', storeName);
  formData.append('store_owner_name', storeOwnerName);
  formData.append('store_owner_mobile', storeOwnerMobile);
  formData.append('entries', JSON.stringify(entries));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/projects/${projectId}/photos`);
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

export const deletePhoto = (projectId, photoId) =>
  fetch(`/api/projects/${projectId}/photos/${photoId}`, { method: 'DELETE' }).then((r) => r.json());
