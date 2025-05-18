
/**
 * Safely formats a number with toLocaleString
 * Returns a fallback string if the value is null or undefined
 * 
 * @param value - The number to format
 * @param options - Intl.NumberFormatOptions for formatting
 * @param fallback - The fallback string to return if value is null/undefined
 * @returns Formatted number as string or fallback value
 */
export const safeNumberFormat = (
  value?: number | null,
  options?: Intl.NumberFormatOptions,
  fallback: string = 'N/A'
): string => {
  if (value === undefined || value === null) {
    return fallback;
  }
  
  try {
    return value.toLocaleString(undefined, options);
  } catch (error) {
    console.error('Error formatting number:', error);
    return String(value);
  }
};

/**
 * Safely formats a date string
 * 
 * @param dateString - The date string to format
 * @param options - DateTimeFormatOptions for formatting
 * @param fallback - The fallback string to return if date is invalid
 * @returns Formatted date as string or fallback value
 */
export const safeDateFormat = (
  dateString?: string | null,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  },
  fallback: string = 'N/A'
): string => {
  if (!dateString) return fallback;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString(undefined, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return fallback;
  }
};

/**
 * Safely formats money values with currency symbol
 * 
 * @param value - The money value to format
 * @param currencySymbol - The currency symbol to use
 * @param options - Intl.NumberFormatOptions for formatting
 * @returns Formatted money value with currency symbol
 */
export const formatMoney = (
  value?: number | null,
  currencySymbol: string = '₹',
  options?: Intl.NumberFormatOptions
): string => {
  if (value === undefined || value === null) return `${currencySymbol}0.00`;
  
  const formattedValue = safeNumberFormat(value, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    ...options
  }, '0.00');
  
  return `${currencySymbol}${formattedValue}`;
};
