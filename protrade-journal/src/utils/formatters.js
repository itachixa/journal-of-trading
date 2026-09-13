export const formatCurrency = (value, currency = 'EUR') => {
  const symbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'JPY' ? '¥' : currency === 'CHF' ? 'Fr' : currency === 'CAD' ? 'C$' : currency === 'AUD' ? 'A$' : '€';
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (Number.isNaN(num)) return `${symbol}0.00`;
  return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatNumber = (value, decimals = 2) => {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (Number.isNaN(num)) return '0.00';
  return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isNaN(num) ? 0 : num;
};
