
export function formatTime(timeString?: string | null): string {
  if (!timeString) return 'N/A';
  try {
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return timeString;
  }
}
