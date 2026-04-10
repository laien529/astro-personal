export function formatDate(input: string) {
  const date = new Date(input);
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}
