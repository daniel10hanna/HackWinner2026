import type { Event } from './events.ts';

export type Chill = { id: string; name: string; stops: Event[] };
export type Coordinates = { latitude: number; longitude: number };

export function coordinates(event: Event): Coordinates | null {
  const { latitude, longitude } = event;
  return typeof latitude === 'number' && Number.isFinite(latitude) && Math.abs(latitude) <= 90 &&
    typeof longitude === 'number' && Number.isFinite(longitude) && Math.abs(longitude) <= 180
    ? { latitude, longitude } : null;
}

export function stopMinutes(event: Event) {
  if (event.kind === 'restaurant') return event.duration_minutes ?? null;
  if (!event.end_time) return null;
  const duration = (Date.parse(event.end_time) - Date.parse(event.start_time)) / 60_000;
  return duration > 0 && Number.isFinite(duration) ? Math.round(duration) : null;
}

export function outingTotals(stops: Event[]) {
  const amount = stops.reduce((sum, event) => sum + (event.is_free ? 0 : event.price_currency === 'CAD' ? event.price_amount ?? 0 : 0), 0);
  const unknownPrices = stops.filter(event => !event.is_free && (event.price_amount == null || event.price_currency !== 'CAD')).length;
  const minutes = stops.reduce((sum, event) => sum + (stopMinutes(event) ?? 0), 0);
  return { amount, unknownPrices, minutes, unknownTimes: stops.filter(event => stopMinutes(event) == null).length };
}

export const formatCAD = (amount: number) => new Intl.NumberFormat('en-CA', { currency: 'CAD', style: 'currency' }).format(amount);
export const durationLabel = (minutes: number) => minutes >= 60
  ? Math.floor(minutes / 60) + 'h' + (minutes % 60 ? ' ' + minutes % 60 + 'm' : '')
  : minutes + 'm';

export async function drivingRoute(stops: Event[], signal: AbortSignal) {
  if (stops.length < 2) return { km: 0, minutes: 0 };
  const points = stops.map(coordinates);
  if (points.some(point => !point)) return null;
  const path = points.map(point => point!.longitude + ',' + point!.latitude).join(';');
  const base = process.env.EXPO_PUBLIC_ROUTING_URL ?? 'https://routing.openstreetmap.de/routed-car/route/v1/driving';
  const response = await fetch(base.replace(/\/$/, '') + '/' + path + '?overview=false', { signal });
  if (!response.ok) return null;
  const body = await response.json();
  const route = body.routes?.[0];
  return body.code === 'Ok' && Number.isFinite(route?.distance) && route.distance >= 0 &&
    Number.isFinite(route?.duration) && route.duration >= 0
    ? { km: route.distance / 1000, minutes: Math.round(route.duration / 60) } : null;
}

export function matchesSearch(event: Event, text: string) {
  const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const words = normalize(text).trim().split(/\s+/).filter(Boolean);
  const listing = normalize([event.title, event.kind ?? 'event', event.description, event.category, event.venue, event.neighborhood, event.address].join(' '));
  return words.every(word => listing.includes(word));
}
