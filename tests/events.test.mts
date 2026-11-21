import assert from 'node:assert/strict';
import test from 'node:test';
import { active, dayAfter, localDay, matchesWindow, recommend, torontoTime } from '../src/lib/events.ts';
import { demoEvents } from '../src/lib/demo.ts';
import type { Event } from '../src/lib/events.ts';

const now = new Date('2026-11-21T23:00:00Z');
const base: Event = {
  id: 'base', category: 'Music', title: 'Example', start_time: '2026-11-21T22:30:00Z',
  end_time: '2026-11-22T01:00:00Z', description: null, venue: null, address: null,
  neighborhood: 'Mile End', price_amount: null, price_currency: null, is_free: null,
  image_url: null, source_name: 'Test', source_url: null, official_url: null, featured: false,
};

test('Toronto dates observe DST and reject invalid or ambiguous wall-clock times', () => {
  assert.equal(localDay(new Date('2026-11-22T03:00:00Z')), '2026-11-21');
  assert.equal(torontoTime('2026-07-01', '18:00')?.toISOString(), '2026-07-01T22:00:00.000Z');
  assert.equal(torontoTime('2026-11-21', '18:00')?.toISOString(), '2026-11-21T23:00:00.000Z');
  assert.equal(torontoTime('2026-03-08', '02:30'), null);
  assert.equal(torontoTime('2026-11-01', '01:30'), null);
  assert.equal(torontoTime('2026-02-30', '18:00'), null);
  assert.equal(dayAfter('2026-12-31', 1), '2027-01-01');
});
test('windows include ongoing events and exclude expired events or unknown ends in the past', () => {
  assert.equal(matchesWindow(base, 'Now', now), true);
  assert.equal(matchesWindow(base, 'Tonight', now), true);
  assert.equal(matchesWindow(base, 'Tomorrow', now), false);
  assert.equal(active({ ...base, end_time: null }, now), false);
  assert.equal(matchesWindow({ ...base, end_time: '2026-11-21T22:55:00Z' }, 'Today', now), false);
  const sunday = { ...base, start_time: '2026-11-22T20:00:00Z', end_time: null };
  assert.equal(matchesWindow(sunday, 'This Weekend', now), true);
  assert.equal(matchesWindow(sunday, 'Tomorrow', now), true);
  assert.equal(matchesWindow(sunday, 'This Weekend', new Date('2026-11-22T18:00:00Z')), true);
  assert.equal(matchesWindow({ ...sunday, start_time: '2026-11-23T05:00:00Z' }, 'This Weekend', now), false);
});
test('recommendations respect strict budget and neighbourhood and rank interests first', () => {
  const options: Event[] = [
    { ...base, id: 'unknown' },
    { ...base, id: 'music', price_amount: 19.99, price_currency: 'CAD' },
    { ...base, id: 'free', is_free: true, category: 'Arts' },
    { ...base, id: 'limit', price_amount: 20, price_currency: 'CAD' },
    { ...base, id: 'foreign', price_amount: 10, price_currency: 'USD' },
    { ...base, id: 'other-area', is_free: true, neighborhood: 'Verdun' },
  ];
  assert.deepEqual(recommend(options, now, 'Now', 'Under $20', ['Music'], 'Mile End').map(item => item.id), ['music', 'free']);
  assert.deepEqual(recommend(options, now, 'Now', 'Free', [], 'Mile End').map(item => item.id), ['free']);
});
test('demo records are distinct, fictional and generated for the current calendar', () => {
  const events = demoEvents(now);
  assert.equal(events.length, 12);
  assert.equal(new Set(events.map(event => event.id)).size, 12);
  assert.ok(events.every(event => event.demo && !event.source_url));
  assert.ok(events.some(event => matchesWindow(event, 'Now', now)));
  assert.ok(events.some(event => matchesWindow(event, 'Tomorrow', now)));
});
