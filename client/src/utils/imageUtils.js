
export async function compressImage(file, options = {}) {
  const maxSizeMB = options.maxSizeMB || 3;
  const maxWidth = options.maxWidth || 1920;
  const maxHeight = options.maxHeight || 1080;
  const quality = options.quality || 0.8;

  if (!file.type.startsWith('image/')) {
    return { error: 'Only image files are allowed.' };
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = async () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const aspect = width / height;
          if (width > maxWidth) {
            width = maxWidth;
            height = Math.round(width / aspect);
          }
          if (height > maxHeight) {
            height = maxHeight;
            width = Math.round(height * aspect);
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        let webpDataUrl = '';
        try {
          webpDataUrl = canvas.toDataURL('image/webp', quality);
        } catch (e) {}
        let jpegDataUrl = '';
        try {
          jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
        } catch (e) {}
        let bestDataUrl = webpDataUrl && webpDataUrl.length < jpegDataUrl.length ? webpDataUrl : jpegDataUrl;
        let format = bestDataUrl.startsWith('data:image/webp') ? 'webp' : 'jpeg';
        const byteString = atob(bestDataUrl.split(',')[1]);
        const mimeString = bestDataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        if (blob.size > maxSizeMB * 1024 * 1024) {
          return resolve({ error: `Image is too large after compression. Please choose a smaller image or lower quality.` });
        }
        const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, `.${format}`), { type: mimeString });
        resolve({ file: compressedFile, format, size: compressedFile.size });
      };
      img.onerror = () => resolve({ error: 'Failed to load image for compression.' });
      img.src = e.target.result;
    };
    reader.onerror = () => resolve({ error: 'Failed to read image file.' });
    reader.readAsDataURL(file);
  });
}

/**
 * Validate image file type and size before upload
 * @param {File} file
 * @param {Object} options
 * @param {number} options.maxSizeMB
 * @param {string[]} options.allowedTypes
 * @returns {string|null} Error message or null if valid
 */
export function validateImageFile(file, options = {}) {
  const maxSizeMB = options.maxSizeMB || 3;
  const allowedTypes = options.allowedTypes || [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp'
  ];
  if (!allowedTypes.includes(file.type)) {
    return 'Only JPG, PNG, or WebP images are allowed.';
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `Image must be less than ${maxSizeMB}MB.`;
  }
  return null;
} 