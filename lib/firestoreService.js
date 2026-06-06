import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, serverTimestamp,
  onSnapshot, increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { uploadImageToCloudinary } from './cloudinaryService';

// ── Projects ──────────────────────────────────────────────

export const createProject = (data) =>
  addDoc(collection(db, 'projects'), {
    ...data, createdBy: 'ketangrover', photoCount: 0, createdAt: serverTimestamp(),
  });

export const getProjects = async () => {
  const snap = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deleteProject = (id) => deleteDoc(doc(db, 'projects', id));

export const subscribeToProjects = (cb) =>
  onSnapshot(query(collection(db, 'projects'), orderBy('createdAt', 'desc')), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );

// ── Photos ────────────────────────────────────────────────

export const addPhoto = async (projectId, photoData, imageFile, onProgress) => {
  const imageUrl = await uploadImageToCloudinary(imageFile, onProgress);
  const docRef = await addDoc(collection(db, 'projects', projectId, 'photos'), {
    ...photoData, imageUrl, createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'projects', projectId), { photoCount: increment(1) });
  return { id: docRef.id, imageUrl };
};

export const getPhotos = async (projectId) => {
  const snap = await getDocs(
    query(collection(db, 'projects', projectId, 'photos'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deletePhoto = async (projectId, photoId) => {
  await deleteDoc(doc(db, 'projects', projectId, 'photos', photoId));
  await updateDoc(doc(db, 'projects', projectId), { photoCount: increment(-1) });
};

export const subscribeToPhotos = (projectId, cb) =>
  onSnapshot(
    query(collection(db, 'projects', projectId, 'photos'), orderBy('createdAt', 'desc')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
