/** Transaction list dates: `{weekday} {dd} {mmm}` — e.g. "Tue 04 Nov". */
export function formatTransactionDate(date: Date): string {
  const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(date);
  const day = new Intl.DateTimeFormat('en-GB', { day: '2-digit' }).format(date);
  const month = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(date);

  return `${weekday} ${day} ${month}`;
}

/** Bank feed times — e.g. "3:43pm". */
export function formatTransactionTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .toLowerCase()
    .replace(/\s/g, '');
}
