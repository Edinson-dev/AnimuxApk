/**
 * Subtitles Utility: SRT / VTT parsing, conversion, and track generation.
 */

/**
 * Converts raw SRT text to valid WebVTT format.
 * - Adds WEBVTT header
 * - Converts comma decimal timestamps (00:00:00,000) to periods (00:00:00.000)
 * - Applies timing offset in seconds if specified
 */
export function convertSrtToVtt(srtContent, offsetSeconds = 0) {
  if (!srtContent) return '';

  // Clean BOM and standardize line endings
  let text = srtContent.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Replace timecodes with optional offset
  const timecodeRegex = /(\d{2}:\d{2}:\d{2})[,.](\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2})[,.](\d{3})/g;

  if (offsetSeconds !== 0) {
    const shiftTime = (hhmmss, ms, offset) => {
      const parts = hhmmss.split(':').map(Number);
      let totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2] + Number(ms) / 1000 + offset;
      if (totalSeconds < 0) totalSeconds = 0;

      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = Math.floor(totalSeconds % 60);
      const msec = Math.floor((totalSeconds % 1) * 1000);

      const pad = (n, len = 2) => String(n).padStart(len, '0');
      return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(msec, 3)}`;
    };

    text = text.replace(timecodeRegex, (match, start, startMs, end, endMs) => {
      const newStart = shiftTime(start, startMs, offsetSeconds);
      const newEnd = shiftTime(end, endMs, offsetSeconds);
      return `${newStart} --> ${newEnd}`;
    });
  } else {
    // Just replace commas with periods in timestamps
    text = text.replace(timecodeRegex, '$1.$2 --> $3.$4');
  }

  // Ensure WebVTT header
  if (!text.startsWith('WEBVTT')) {
    text = `WEBVTT\n\n${text}`;
  }

  return text;
}

/**
 * Creates a Blob URL from subtitle text or file.
 */
export function createSubBlobUrl(rawText, isSrt = true, offsetSeconds = 0) {
  try {
    const vttContent = isSrt ? convertSrtToVtt(rawText, offsetSeconds) : rawText;
    const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('Error creating subtitle blob URL:', err);
    return null;
  }
}
