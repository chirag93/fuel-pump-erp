
import { format } from 'date-fns';

export function formatTime(timeString?: string | null): string {
  if (!timeString) return 'N/A';
  try {
    // Handle both date-time strings and time-only strings
    const date = new Date(timeString);
    if (isNaN(date.getTime())) {
      return timeString;
    }
    return format(date, 'hh:mm a');
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
    return format(date, 'MM/dd/yyyy');
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString;
  }
}
