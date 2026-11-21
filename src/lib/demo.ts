import { dayAfter, localDay, torontoTime, type Category, type Event } from './events.ts';

const samples: [string, Category, string, string, number][] = [
  ['Afterglow Jazz Sessions', 'Music', 'Plateau', 'Velvet Room', 18],
  ['Little Italy Night Market', 'Food', 'Little Italy', 'Mercato Courtyard', 0],
  ['Blue Hour Rooftop', 'Nightlife', 'Downtown', 'Skyline Terrace', 25],
  ['Montréal in Colour', 'Arts', 'Mile End', 'Atelier Indigo', 12],
  ['Canal Sounds', 'Festivals', 'Saint-Henri', 'Canal Stage', 0],
  ['Sunday Social Run', 'Sports', 'Old Montréal', 'Harbour Pavilion', 0],
  ['Neighbourhood Table', 'Community', 'Verdun', 'Maison du Fleuve', 15],
  ['Late Night Vinyl', 'Music', 'Mile End', 'Side B Room', 22],
  ['Lantern Walk', 'Other', 'Old Montréal', 'Lantern Court', 0],
  ['Small Plates Club', 'Food', 'Plateau', 'Studio Saffron', 35],
  ['Prints After Dark', 'Arts', 'Saint-Henri', 'Pressroom Gallery', 10],
  ['City Lights Dance Floor', 'Nightlife', 'Downtown', 'Neon Annex', 30],
];

export function demoEvents(now: Date): Event[] {
  const today = localDay(now);
  const weekday = new Date(today + 'T00:00:00Z').getUTCDay();
  const weekend = weekday === 0 ? 0 : 6 - weekday;
  return samples.map(([title, category, neighborhood, venue, amount], i) => {
    const day = dayAfter(today, [0, 0, 0, 1, weekend, weekend, 1, weekend, 2, 3, 4, 5][i]);
    const start = i === 0 ? new Date(+now - 30 * 60_000) : torontoTime(day, ['18:00', '20:00', '22:00', '13:00'][i % 4])!;
    return {
      id: 'demo-' + i, title, category, neighborhood, venue,
      description: 'A fictional ' + category.toLowerCase() + ' outing in ' + neighborhood + ' created for the MTL NOW demo.',
      start_time: start.toISOString(), end_time: new Date(+start + (i === 0 ? 180 : 120) * 60_000).toISOString(),
      address: null, price_amount: amount, price_currency: 'CAD', is_free: amount === 0,
      image_url: null, source_name: 'MTL NOW demo', source_url: null, official_url: null, featured: i < 3, demo: true,
    };
  });
}

