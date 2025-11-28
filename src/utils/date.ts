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

export function getGreetingByIST() {
  // Get current time in IST
  const istTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
  });

  const date = new Date(istTime);
  const hour = date.getHours(); // 0–23

  if (hour >= 0 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 16) return "Good Afternoon";
  return "Good Evening";
}

export function getGrowthMessageOnce() {
  const growthMessages = [
    "Let's nurture your network today.",
    "Your network is your net worth - Let's expand it!",
    "Your network is your superpower — activate it!",
    "Connect with purpose, grow with confidence.",
    "Build connections, build opportunities.",
    "Strong networks create strong futures."
  ];

  const randomIndex = Math.floor(Math.random() * growthMessages.length);
  return growthMessages[randomIndex];
}

