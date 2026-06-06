import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ============================================================
// IMPORTANT: Replace these values with your Firebase project
// credentials. See FIREBASE_SETUP.md for step-by-step guide.
// Firebase Storage is NOT used — images go to Cloudinary (free).
// ============================================================
  const firebaseConfig = {
    apiKey: "AIzaSyDsYjCrShE-5QVo8JkN7KO7Zi6dkybmSAU",
    authDomain: "wecapurred-e87c8.firebaseapp.com",
    databaseURL: "https://wecapurred-e87c8-default-rtdb.firebaseio.com",
    projectId: "wecapurred-e87c8",
    storageBucket: "wecapurred-e87c8.firebasestorage.app",
    messagingSenderId: "625611330452",
    appId: "1:625611330452:web:d0a6f7d9a5d4cc998eb581"
  };

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web'
    ? browserLocalPersistence
    : getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
