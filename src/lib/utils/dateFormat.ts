/**
 * Consistent Date Formatter (Day/Month/Year Standard)
 * Enforces DD/MM/YYYY or DD MMM YYYY regardless of browser OS locale
 */

export function formatDate(
  dateValue: string | Date | null | undefined,
  mode: 'short' | 'medium' | 'long' | 'input' = 'short'
): string {
  if (!dateValue) return '—';
  try {
    const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (isNaN(d.getTime())) return '—';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    if (mode === 'short') {
      // DD/MM/YYYY (e.g., 28/10/2026)
      return `${day}/${month}/${year}`;
    }

    if (mode === 'medium') {
      // DD MMM YYYY (e.g., 28 Oct 2026)
      return `${day} ${monthNames[d.getMonth()]} ${year}`;
    }

    if (mode === 'long') {
      // DD MMM YYYY, hh:mm AM/PM (e.g., 28 Oct 2026, 04:30 PM)
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${day} ${monthNames[d.getMonth()]} ${year}, ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    }

    if (mode === 'input') {
      // YYYY-MM-DD for HTML input[type="date"]
      return `${year}-${month}-${day}`;
    }

    return `${day}/${month}/${year}`;
  } catch {
    return '—';
  }
}

/**
 * Convenience helper for strict DD/MM/YYYY
 */
export function formatDDMMYYYY(dateValue: string | Date | null | undefined): string {
  return formatDate(dateValue, 'short');
}

/**
 * Convenience helper for human friendly DD MMM YYYY
 */
export function formatFriendlyDate(dateValue: string | Date | null | undefined): string {
  return formatDate(dateValue, 'medium');
}
