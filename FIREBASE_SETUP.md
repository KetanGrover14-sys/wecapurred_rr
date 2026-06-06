# Setup Guide for WecapuRRed App

> Images are stored on **Cloudinary** (free, no credit card).
> Login & project data are stored on **Firebase** (free Spark plan).

---

## Part A — Firebase (Auth + Database) — FREE

### Step 1 — Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it `wecapurred-app` → **Create project**

### Step 2 — Enable Authentication

1. Left sidebar → **Authentication** → **Get started**
2. Click **Email/Password** → toggle Enable → **Save**

### Step 3 — Create Firestore Database

1. Left sidebar → **Firestore Database** → **Create database**
2. Choose **Start in production mode** → select region `asia-south1` → **Enable**
3. Click the **Rules** tab → replace everything with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read, write: if request.auth != null;
      match /photos/{photoId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

4. Click **Publish**

> IMPORTANT: Go to "Firestore Database" in the sidebar — NOT "Realtime Database"

### Step 4 — Get your Firebase Config

1. Firebase console → gear icon (⚙️) → **Project settings**
2. Scroll to **Your apps** → click **</>** Web icon
3. Register app as `wecapurred-web` → copy the config values

### Step 5 — Update firebase.js

Open [firebase.js](firebase.js) and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "wecapurred-app.firebaseapp.com",
  projectId: "wecapurred-app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

---

## Part B — Cloudinary (Image Storage) — FREE (25 GB)

No credit card needed. Free tier gives 25 GB storage + 25 GB bandwidth/month.

### Step 6 — Create Cloudinary Account

1. Go to https://cloudinary.com/users/register/free
2. Sign up with email → verify your email
3. You will land on the **Dashboard**
4. Note your **Cloud name** (shown at the top of dashboard, e.g. `dxyz1234`)

### Step 7 — Create an Upload Preset

1. In Cloudinary dashboard → top-right settings → **Upload** tab
2. Scroll down to **Upload presets** section
3. Click **Add upload preset**
4. Set:
   - **Preset name**: `wecapurred_preset`
   - **Signing mode**: `Unsigned`  ← important!
   - **Folder**: `wecapurred`
5. Click **Save**

### Step 8 — Update cloudinaryService.js

Open [src/services/cloudinaryService.js](src/services/cloudinaryService.js) and replace:

```javascript
export const CLOUDINARY_CLOUD_NAME = 'dxyz1234';         // ← your cloud name
export const CLOUDINARY_UPLOAD_PRESET = 'wecapurred_preset'; // ← your preset name
```

---

## Part C — Run the App

```bash
cd "C:\Users\Ketan Grover\Downloads\presentingapp"
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone (free on Play Store / App Store).

---

## Part D — Build APK for Production (optional)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

This generates an APK you can install on any Android phone and share with employees.
