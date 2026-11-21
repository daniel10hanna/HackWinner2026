export const categories = ['Music', 'Food', 'Nightlife', 'Arts', 'Festivals', 'Sports', 'Community', 'Other'] as const;
export type Category = typeof categories[number];
export interface Event {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  start_time: string;
  end_time: string | null;
  venue: string | null;
  address: string | null;
  neighborhood: string | null;
  price_amount: number | null;
  price_currency: string | null;
  is_free: boolean | null;
  image_url: string | null;
  source_name: string;
  source_url: string | null;
  official_url: string | null;
  featured: boolean;
  demo?: boolean;
}

export const zone = 'America/Toronto';
const calendar = new Intl.DateTimeFormat('en-CA', {
  timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
});
export function localDay(date: Date) {
  const parts = calendar.formatToParts(date);
  return ['year', 'month', 'day'].map(part => parts.find(item => item.type === part)?.value).join('-');
}
export function dayAfter(day: string, offset: number) {
  const date = new Date(day + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
export function torontoTime(day: string, time: string) {
  const wall = day + 'T' + time;
  const candidates = ['-04:00', '-05:00'].map(offset => new Date(wall + offset));
  const clock = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const matches = candidates.filter(date => Number.isFinite(+date) && localDay(date) === day && clock.format(date) === time);
  return matches.length === 1 ? matches[0] : null;
}
export const windows = ['Today', 'Tonight', 'Tomorrow', 'This Weekend', 'All Upcoming'] as const;
export type Window = typeof windows[number] | 'Now';
export function active(event: Event, now: Date) {
  return Date.parse(event.end_time ?? event.start_time) >= +now;
}
export function matchesWindow(event: Event, window: Window, now: Date) {
  if (!active(event, now)) return false;
  const start = Date.parse(event.start_time);
  if (window === 'Now') return start <= +now;
  if (window === 'All Upcoming') return true;
  const today = localDay(now);
  const weekday = new Date(today + 'T00:00:00Z').getUTCDay();
  const saturday = dayAfter(today, weekday === 0 ? -1 : 6 - weekday);
  const day = window === 'Tomorrow' ? dayAfter(today, 1) : window === 'This Weekend' ? saturday : today;
  const from = torontoTime(day, window === 'Tonight' ? '17:00' : '00:00')!;
  const until = torontoTime(dayAfter(day, window === 'This Weekend' ? 2 : 1), '00:00')!;
  return start < +until && Date.parse(event.end_time ?? event.start_time) >= +from;
}
export const budgets = ['Free', 'Under $20', 'Under $50', 'Any'] as const;
export type Budget = typeof budgets[number];
export function recommend(events: Event[], now: Date, window: Window, budget: Budget, interests: Category[], area: string) {
  const score = (event: Event) => (interests.includes(event.category) ? 10 : 0) +
    [event.end_time, event.venue, event.address, event.official_url, event.description, event.is_free ?? event.price_amount].filter(value => value != null).length;
  return events.filter(event => matchesWindow(event, window, now) &&
    (area === 'Anywhere' || event.neighborhood === area) &&
    (budget === 'Any' || event.is_free === true || (budget !== 'Free' &&
      event.price_currency === 'CAD' && event.price_amount !== null && event.price_amount < (budget === 'Under $20' ? 20 : 50))))
    .sort((a, b) => score(b) - score(a) || byStart(a, b));
}
export function byStart(a: Event, b: Event) {
  return Date.parse(a.start_time) - Date.parse(b.start_time) || a.id.localeCompare(b.id);
}
export function eventDate(time: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: zone, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(time));
}
export function price(event: Event) {
  if (event.is_free === true) return 'Free';
  if (event.price_amount !== null && event.price_currency) {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: event.price_currency, maximumFractionDigits: 2 }).format(event.price_amount);
  }
  return event.is_free === false ? 'Paid · price unknown' : 'Price unknown';
}
