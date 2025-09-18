/**
 * Converts a UTC date string or Date object to a formatted IST time string (e.g., "08:51 PM").
 * @param utcDate The UTC date string or Date object to convert.
 * @returns A string representing the time in IST with AM/PM.
 */
export function formatUtcToIstTime(utcDate: string | Date): string {
  if (!utcDate) {
    return '';
  }
  const date = new Date(utcDate);

  // Use toLocaleString to format the time in the 'Asia/Kolkata' timezone.
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
  });
}