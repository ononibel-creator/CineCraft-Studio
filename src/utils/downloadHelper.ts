/**
 * Universal media downloader for high-resolution PNG images and MP4 videos.
 * Bypasses cross-origin restrictions by fetching blobs and rendering through
 * offscreen canvas, ensuring direct file saving to the user's local machine.
 */

function sanitizeFilename(text: string, ext: string): string {
  const clean = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40)
    .replace(/^-|-$/g, '');
  return `${clean || 'cinecraft'}-${Date.now()}.${ext}`;
}

/**
 * Downloads any image (data URL, blob, or remote URL) as a high-resolution lossless PNG file.
 */
export async function downloadImageAsPNG(imageUrl: string, promptText?: string): Promise<void> {
  const filename = sanitizeFilename(promptText || 'cinecraft-artwork', 'png');

  try {
    // If it's already a data URL with image/png or base64
    if (imageUrl.startsWith('data:image/png;base64,')) {
      triggerDirectDownload(imageUrl, filename);
      return;
    }

    // Load into an HTML Image element to extract native natural dimensions
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => {
        // Fallback: try fetching as blob if crossOrigin image fails
        fetchAsBlobAndDownload(imageUrl, filename, 'image/png')
          .then(resolve)
          .catch(reject);
      };
      img.src = imageUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width || 1024;
    canvas.height = img.naturalHeight || img.height || 1024;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }

    // High quality rendering flags
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          triggerDirectDownload(imageUrl, filename);
          return;
        }
        const blobUrl = URL.createObjectURL(blob);
        triggerDirectDownload(blobUrl, filename);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      },
      'image/png',
      1.0
    );
  } catch (error) {
    console.warn('Canvas conversion failed, falling back to direct blob download:', error);
    await fetchAsBlobAndDownload(imageUrl, filename, 'image/png');
  }
}

/**
 * Downloads an image directly as original JPEG.
 */
export async function downloadImageAsJPEG(imageUrl: string, promptText?: string): Promise<void> {
  const filename = sanitizeFilename(promptText || 'cinecraft-artwork', 'jpg');
  await fetchAsBlobAndDownload(imageUrl, filename, 'image/jpeg');
}

/**
 * Downloads a video directly as an MP4 file to the user's local machine.
 */
export async function downloadVideoAsMP4(videoUrl: string, promptText?: string, platform?: string): Promise<void> {
  const prefix = platform ? `cinecraft-${platform}` : 'cinecraft-scene';
  const filename = sanitizeFilename(`${prefix}-${promptText || ''}`, 'mp4');

  await fetchAsBlobAndDownload(videoUrl, filename, 'video/mp4');
}

/**
 * Helper to fetch any resource as a local Blob and trigger a native browser file save dialog.
 */
async function fetchAsBlobAndDownload(url: string, filename: string, mimeTypeFallback: string): Promise<void> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const blob = await res.blob();
    const finalBlob = blob.type ? blob : new Blob([blob], { type: mimeTypeFallback });
    const objectUrl = URL.createObjectURL(finalBlob);

    triggerDirectDownload(objectUrl, filename);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
  } catch (err) {
    console.warn('Fetch as blob failed, using anchor fallback:', err);
    triggerDirectDownload(url, filename);
  }
}

function triggerDirectDownload(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
