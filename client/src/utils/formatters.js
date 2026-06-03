/**
 * client/src/utils/formatters.js
 * ─────────────────────────────────────────────────────────────────────────────
 * DISPLAY FORMATTING UTILITIES (JavaScript version)
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Format a number as Indian Rupees using the en-IN locale, supporting up to 6 decimal places.
 */
export function formatINR(amount) {
  if (amount === undefined || amount === null) return '—';
  // Check if there are significant fractional parts beyond 2 decimals
  const hasSubPaise = (amount * 100) % 1 !== 0;
  return new Intl.NumberFormat('en-IN', {
    style:                'currency',
    currency:             'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: hasSubSubPaise(amount) ? 6 : 2,
  }).format(amount);
}

// Helper to determine if there are decimals beyond 2 places
function hasSubSubPaise(val) {
  const str = val.toString();
  const dotIndex = str.indexOf('.');
  if (dotIndex === -1) return false;
  return str.length - dotIndex - 1 > 2;
}

/**
 * Format a quantity value with its unit string, supporting up to 6 decimal places.
 */
export function formatQuantity(value, unit) {
  if (value === undefined || value === null) return '—';
  const rounded = parseFloat(Number(value).toFixed(6));
  return `${rounded} ${unit}`;
}

/**
 * Returns a Tailwind CSS class string for a status pill badge.
 */
export function getStatusColor(status) {
  const colorMap = {
    pending:   'bg-warning-100 text-warning-800',
    approved:  'bg-success-100 text-success-800',
    rejected:  'bg-danger-100 text-danger-800',
    fulfilled: 'bg-primary-100 text-primary-800',
  };
  return colorMap[status.toLowerCase()] ?? 'bg-gray-100 text-gray-800';
}

/**
 * Format an ISO date string into a human-readable format.
 */
export function formatDate(isoString) {
  if (!isoString) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day:    'numeric',
    month:  'short',
    year:   'numeric',
    hour:   'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoString));
}

/**
 * Truncate a UUID or ObjectId to the first 8 characters.
 */
export function truncateId(id) {
  if (!id) return '—';
  return `${id.slice(0, 8)}...`;
}

