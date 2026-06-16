import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  increment,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { uploadImageToCloudinary } from './cloudinaryService';

// ─── Projects ──────────────────────────────────────────────

export const createProject = async (data, userId) => {
  const docRef = await addDoc(collection(db, 'projects'), {
    ...data,
    createdBy: userId,
    photoCount: 0,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getProjects = async () => {
  const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getProject = async (projectId) => {
  const snap = await getDoc(doc(db, 'projects', projectId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const deleteProject = async (projectId) => {
  await deleteDoc(doc(db, 'projects', projectId));
};

export const subscribeToProjects = (callback) => {
  const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(projects);
  });
};

// ─── Photos ────────────────────────────────────────────────

export const addPhoto = async (projectId, photoData, imageUri, onProgress) => {
  const photoId = `photo_${Date.now()}`;
  const imageUrl = await uploadImageToCloudinary(imageUri, onProgress);

  const docRef = await addDoc(collection(db, 'projects', projectId, 'photos'), {
    ...photoData,
    imageUrl,
    photoId,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'projects', projectId), {
    photoCount: increment(1),
  });

  return { id: docRef.id, imageUrl };
};

export const getPhotos = async (projectId) => {
  const q = query(
    collection(db, 'projects', projectId, 'photos'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deletePhoto = async (projectId, photoDocId) => {
  await deleteDoc(doc(db, 'projects', projectId, 'photos', photoDocId));
  await updateDoc(doc(db, 'projects', projectId), {
    photoCount: increment(-1),
  });
};

export const subscribeToPhotos = (projectId, callback) => {
  const q = query(
    collection(db, 'projects', projectId, 'photos'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const photos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(photos);
  });
};
