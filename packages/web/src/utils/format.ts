const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const NUMBER = new Intl.NumberFormat('en-IN');
const CRORE = 10_000_000;
const LAKH = 100_000;

export const formatInr = (value: number): string => INR.format(value);
export const formatNumber = (value: number): string => NUMBER.format(value);

export const formatInrCompact = (value: number): string => {
  if (value >= CRORE)
    return `₹${(value / CRORE).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;
  if (value >= LAKH)
    return `₹${(value / LAKH).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L`;
  return formatInr(value);
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatDate = (iso: string): string => {
  const date = new Date(iso);
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${day} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

export const formatRelative = (iso: string, now: number): string => {
  const diffMs = now - Date.parse(iso);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 60 ? `${days}d ago` : formatDate(iso);
};
