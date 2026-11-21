import { byStart, type Event } from './events';
import { demoEvents } from './demo';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const configured = Boolean(url && key);

export async function loadEvents(demo: boolean, signal: AbortSignal): Promise<Event[]> {
  if (demo) return demoEvents(new Date()).sort(byStart);
  if (!url || !key) throw new Error('Connect Supabase or open the fictional demo.');
  const events: Event[] = [];
  const now = new Date().toISOString();
  const fields = 'id,title,description,category,start_time,end_time,venue,address,neighborhood,price_amount,price_currency,is_free,image_url,source_url,source_name,official_url,featured';
  for (let offset = 0; ; offset += 100) {
    const query = new URLSearchParams({
      select: fields, status: 'eq.published', order: 'start_time.asc,id.asc',
      or: '(end_time.gte.' + now + ',and(end_time.is.null,start_time.gte.' + now + '))',
      limit: '100', offset: String(offset),
    });
    const response = await fetch(url + '/rest/v1/events?' + query, { headers: { apikey: key }, signal });
    if (!response.ok) throw new Error('The live feed could not be loaded. Pull to refresh or try the fictional demo.');
    const page: Event[] = await response.json();
    events.push(...page);
    if (page.length < 100) return events;
  }
}
