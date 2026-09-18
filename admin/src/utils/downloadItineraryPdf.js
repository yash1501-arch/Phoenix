import { adventuresAPI } from './api';

async function messageFromBlobError(error) {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      try {
        const parsed = JSON.parse(text);
        return parsed.message || text;
      } catch {
        return text.trim().slice(0, 300) || 'Could not download itinerary PDF';
      }
    } catch {
      return 'Could not download itinerary PDF';
    }
  }
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return 'Could not download itinerary PDF';
}

async function fetchItineraryPdfBlob(adventureId) {
  if (!adventureId) throw new Error('Missing adventure id');
  const res = await adventuresAPI.downloadItineraryPdf(adventureId);
  const blob = res.data instanceof Blob
    ? res.data
    : new Blob([res.data], { type: 'application/pdf' });

  if (blob.type && blob.type.includes('json')) {
    const text = await blob.text();
    let message = 'Could not load itinerary PDF';
    try {
      message = JSON.parse(text).message || message;
    } catch {
      if (text.trim()) message = text.trim().slice(0, 300);
    }
    throw new Error(message);
  }

  const head = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
  if (!isPdf) {
    const text = await blob.text();
    let message = 'Server did not return a valid PDF';
    try {
      message = JSON.parse(text).message || message;
    } catch {
      if (text.trim()) message = text.trim().slice(0, 300);
    }
    throw new Error(message);
  }

  const disposition = res.headers?.['content-disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  return { blob, filename: match?.[1] || null };
}

/**
 * Download the professional itinerary PDF for an adventure (admin).
 */
export async function downloadItineraryPdf(adventureId, titleHint = 'adventure') {
  try {
    const { blob, filename: fromHeader } = await fetchItineraryPdfBlob(adventureId);
    const filename = fromHeader
      || `${String(titleHint).replace(/[^\w-]+/g, '-').slice(0, 60) || 'adventure'}-itinerary.pdf`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return filename;
  } catch (error) {
    const message = await messageFromBlobError(error);
    const err = new Error(message);
    err.cause = error;
    throw err;
  }
}

/**
 * Open itinerary PDF in a new browser tab for quick preview.
 */
export async function previewItineraryPdf(adventureId) {
  try {
    const { blob } = await fetchItineraryPdfBlob(adventureId);
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      URL.revokeObjectURL(url);
      throw new Error('Popup blocked — allow popups to preview the PDF');
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return true;
  } catch (error) {
    const message = await messageFromBlobError(error);
    const err = new Error(message);
    err.cause = error;
    throw err;
  }
}
