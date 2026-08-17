export const formatNumber = (value) => Number(value || 0).toLocaleString();
export const formatDate = (value) => value ? new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium' }).format(new Date(value)) : '—';
