const CLOUD_NAME = 'ddldweaqm';
const UPLOAD_PRESET = 'wecapurred_preset';

export const uploadImageToCloudinary = (imageFile, onProgress) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'wecapurred');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      const data = JSON.parse(xhr.responseText);
      data.secure_url ? resolve(data.secure_url) : reject(new Error(data.error?.message));
    };

    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(formData);
  });
};
