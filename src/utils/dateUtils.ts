
export function formatTime(timeString?: string | null): string {
  if (!timeString) return 'N/A';
  try {
    // Handle both date-time strings and time-only strings
    const date = new Date(timeString);
    if (isNaN(date.getTime())) {
      return timeString;
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    console.error('Error formatting time:', e);
    return timeString;
  }
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString();
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString;
  }
}
