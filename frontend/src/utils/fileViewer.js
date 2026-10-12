/**
 * Safely preview/open a resume file in a new browser tab.
 * Handles both remote URLs (e.g. Cloudinary) and Data URIs (Base64).
 */
export const openResumeFile = (fileUrl) => {
  if (!fileUrl) return;

  if (fileUrl.startsWith('data:')) {
    try {
      const parts = fileUrl.split(';base64,');
      const contentType = parts[0].replace('data:', '') || 'application/pdf';
      const byteCharacters = atob(parts[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch {
      window.open(fileUrl, '_blank');
    }
  } else {
    window.open(fileUrl, '_blank');
  }
};
