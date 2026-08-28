export function formatDate(iso?: string) {
  if (!iso) return '';
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day); // local midnight, not UTC
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

export function getTripDuration(startIso?: string, endIso?: string) {
  if (!startIso || !endIso) return null;
  const [sy, sm, sd] = startIso.split('-').map(Number);
  const [ey, em, ed] = endIso.split('-').map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const end = Date.UTC(ey, em - 1, ed);
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

export const getDatesInRange = (startIso: string, endIso: string): string[] => {
  const [sy, sm, sd] = startIso.split('-').map(Number);
  const [ey, em, ed] = endIso.split('-').map(Number);

  const start = Date.UTC(sy, sm - 1, sd);
  const end = Date.UTC(ey, em - 1, ed);

  const dates: string[] = [];
  for (let t = start; t <= end; t += 86_400_000) {
    const d = new Date(t);
    dates.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
        d.getUTCDate(),
      ).padStart(2, '0')}`,
    );
  }
  return dates;
};

export function formatDateRange(startIso?: string, endIso?: string) {
  if (!startIso || !endIso) return '';

  const [sy, sm, sd] = startIso.split('-').map(Number);
  const [ey, em, ed] = endIso.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });

  if (sy === ey && sm === em) return `${startMonth} ${sd}–${ed}`;
  if (sy === ey) return `${startMonth} ${sd} – ${endMonth} ${ed}`;
  return `${startMonth} ${sd}, ${sy} – ${endMonth} ${ed}, ${ey}`;
}

export const formatDayLabel = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
  });
};
