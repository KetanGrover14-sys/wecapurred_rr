import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDsYjCrShE-5QVo8JkN7KO7Zi6dkybmSAU",
  authDomain: "wecapurred-e87c8.firebaseapp.com",
  projectId: "wecapurred-e87c8",
  messagingSenderId: "625611330452",
  appId: "1:625611330452:web:d0a6f7d9a5d4cc998eb581",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
