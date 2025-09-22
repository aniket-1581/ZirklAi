/**
 * Converts a UTC date string or Date object to a formatted IST time string (e.g., "08:51 PM").
 * @param utcDate The UTC date string or Date object to convert.
 * @returns A string representing the time in IST with AM/PM.
 */
export function formatUtcToIstTime(utcDate: string | Date): string {
  if (!utcDate) {
    return '';
  }
  const date = new Date(utcDate); // Works with both ISO strings and Date objects

  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(date.getTime() + istOffset);

  const istHoursUTC = istTime.getUTCHours();
  const istMinutesUTC = istTime.getUTCMinutes();

  const period = istHoursUTC >= 12 ? 'PM' : 'AM';
  let displayHours = istHoursUTC % 12;
  return displayHours === 0 ? `12:${istMinutesUTC.toString().padStart(2, '0')} ${period}` : `${displayHours}:${istMinutesUTC.toString().padStart(2, '0')} ${period}`;
}