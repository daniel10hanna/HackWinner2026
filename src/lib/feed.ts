import { byStart, type Event } from './events';
import { demoEvents } from './demo';

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
export const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const configured = Boolean(supabaseUrl && supabaseKey);

export async function loadEvents(demo: boolean, signal: AbortSignal): Promise<Event[]> {
  if (demo) return demoEvents(new Date()).sort(byStart);
  if (!supabaseUrl || !supabaseKey) throw new Error('Connect Supabase or open the fictional demo.');
  const events: Event[] = [];
  const now = new Date().toISOString();
  const fields = 'id,title,description,category,start_time,end_time,venue,address,neighborhood,latitude,longitude,price_amount,price_currency,is_free,image_url,source_url,source_name,official_url,featured';
  for (let offset = 0; ; offset += 100) {
    const query = new URLSearchParams({
      select: fields, status: 'eq.published', order: 'start_time.asc,id.asc',
      or: '(end_time.gte.' + now + ',and(end_time.is.null,start_time.gte.' + now + '))',
      limit: '100', offset: String(offset),
    });
    const response = await fetch(supabaseUrl + '/rest/v1/events?' + query, { headers: { apikey: supabaseKey }, signal });
    if (!response.ok) throw new Error('The live feed could not be loaded. Pull to refresh or try the fictional demo.');
    const page: Event[] = await response.json();
    events.push(...page);
    if (page.length < 100) return events;
  }
}

type Restaurant = Pick<Event, 'id' | 'title' | 'description' | 'address' | 'neighborhood' | 'latitude' |
  'longitude' | 'duration_minutes' | 'price_amount' | 'price_currency' | 'image_url' | 'source_url' | 'source_name' | 'official_url'>;

export async function loadRestaurants(signal: AbortSignal): Promise<Event[]> {
  if (!supabaseUrl || !supabaseKey) return [];
  const items: Event[] = [];
  for (let offset = 0; ; offset += 100) {
    const query = new URLSearchParams({ order: 'title.asc,id.asc', limit: '100', offset: String(offset) });
    const response = await fetch(supabaseUrl + '/rest/v1/restaurants?' + query, { headers: { apikey: supabaseKey }, signal });
    if (!response.ok) throw new Error('The restaurant catalog could not be loaded.');
    const page: Restaurant[] = await response.json();
    items.push(...page.map(place => ({
      ...place, id: 'restaurant-' + place.id, kind: 'restaurant' as const, category: 'Food' as const, venue: place.title,
      start_time: '', end_time: null, is_free: place.price_amount == null ? null : place.price_amount === 0, featured: false,
    })));
    if (page.length < 100) return items;
  }
}
