import { BASE_URL } from '../config';

const url = (path) => `${BASE_URL}${path}`;

export const getProjects = () =>
  fetch(url('/api/projects')).then((r) => r.json());

export const createProject = (data) =>
  fetch(url('/api/projects'), {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  }).then((r) => r.json());

export const deleteProject = (id) =>
  fetch(url(`/api/projects/${id}`), { method: 'DELETE' }).then((r) => r.json());

export const getProject = (id) =>
  fetch(url(`/api/projects/${id}`)).then((r) => r.json());

export const getPhotos = (projectId) =>
  fetch(url(`/api/projects/${projectId}/photos`)).then((r) => r.json());

// entries: [{ material, length, breadth, height, notes }]
// Image uploaded once; one DB row created per entry.
export const addPhoto = (projectId, location, entries, imageUri, onProgress) =>
  new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', { uri: imageUri, name: 'photo.jpg', type: 'image/jpeg' });
    formData.append('location', location);
    formData.append('entries', JSON.stringify(entries));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url(`/api/projects/${projectId}/photos`));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        xhr.status < 300 ? resolve(data) : reject(new Error(data.error || 'Upload failed'));
      } catch { reject(new Error('Invalid server response')); }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });

export const deletePhoto = (projectId, photoId) =>
  fetch(url(`/api/projects/${projectId}/photos/${photoId}`), { method: 'DELETE' }).then((r) => r.json());
