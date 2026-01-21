// Fix: Import the ImageFile type to resolve the 'Cannot find name' error.
import type { ImageFile } from '../types';

export function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

export function dataUrlToImageFile(dataUrl: string, fileName: string = 'image.png'): ImageFile {
    const [header, base64] = dataUrl.split(',');
    if (!header || !base64) {
        throw new Error('Invalid data URL');
    }
    const match = header.match(/:(.*?);/);
    const type = match ? match[1] : 'application/octet-stream';
    return { name: fileName, base64, type };
}

export function dataURLtoFile(dataurl: string, filename: string): File {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0]?.match(/:(.*?);/);
    if (!mimeMatch) throw new Error('Invalid data URL');
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

export function resizeImage(file: ImageFile, maxDimension: number): Promise<ImageFile> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      
      if (width <= maxDimension && height <= maxDimension) {
        resolve(file); // No resizing needed
        return;
      }

      let newWidth = width;
      let newHeight = height;

      if (width > height) {
        newWidth = maxDimension;
        newHeight = Math.round((height * maxDimension) / width);
      } else {
        newHeight = maxDimension;
        newWidth = Math.round((width * maxDimension) / height);
      }

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Use JPEG for better compression of photographic or complex images
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const [, base64] = dataUrl.split(',');

      if (!base64) {
        return reject(new Error('Failed to create base64 string from resized canvas'));
      }
      
      resolve({
        ...file,
        base64,
        type: 'image/jpeg',
      });
    };
    img.onerror = (err) => reject(new Error(`Failed to load image for resizing: ${err}`));
    img.src = `data:${file.type};base64,${file.base64}`;
  });
}
