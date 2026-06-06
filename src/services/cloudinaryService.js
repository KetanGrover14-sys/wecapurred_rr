// ============================================================
// Cloudinary free image storage (25 GB free, no credit card)
// See FIREBASE_SETUP.md → Step 4 for setup instructions.
// ============================================================

// Replace these two values after creating your Cloudinary account
export const CLOUDINARY_CLOUD_NAME = 'ddldweaqm';
export const CLOUDINARY_UPLOAD_PRESET = 'wecapurred_preset';

export const uploadImageToCloudinary = async (imageUri, onProgress) => {
  const formData = new FormData();

  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: `photo_${Date.now()}.jpg`,
  });
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'wecapurred');

  const xhr = new XMLHttpRequest();
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  return new Promise((resolve, reject) => {
    xhr.open('POST', url);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.secure_url) {
          resolve(data.secure_url);
        } else {
          reject(new Error(data.error?.message || 'Upload failed'));
        }
      } catch (e) {
        reject(e);
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
};
