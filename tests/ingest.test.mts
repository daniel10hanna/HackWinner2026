import assert from 'node:assert/strict';
import test from 'node:test';

test('URL import stores one grounded, deduplicated pending event using server credentials', async context => {
  const source = 'https://example.org';
  const sourceId = '1a1a0000-0000-0000-0000-000000000001';
  const original = source + '/article';
  const official = source + '/tickets';
  const evidence = 'May 1, 2099 at 6:00 p.m.';
  const previousArgs = process.argv;
  const env = { SUPABASE_URL: 'https://database.example', SUPABASE_SERVER_KEY: 'mock-secret', OPENAI_API_KEY: 'mock-openai' };
  const oldEnv = Object.fromEntries(Object.keys(env).map(key => [key, process.env[key]]));
  Object.assign(process.env, env);
  process.argv = ['node', 'scripts/ingest.mts', 'url', sourceId, original];
  context.after(() => {
    process.argv = previousArgs;
    for (const [key, value] of Object.entries(oldEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  const event = {
    title: 'Jazz in Montréal', category: 'Music', description: 'A jazz performance in Montréal.',
    day: '2099-05-01', start: '18:00', end_day: null, end: null, venue: null, address: null,
    neighborhood: null, official_url: official, price_currency: null, price_amount: null,
    is_free: null, date_evidence: evidence,
  };
  const calls = context.mock.method(globalThis, 'fetch', async (url: string | URL, init?: RequestInit) => {
    const target = new URL(url);
    if (target.href === original) {
      assert.equal(init?.redirect, 'error');
      return new Response('<article><p>' + evidence + '</p><a href="' + official + '">Tickets</a></article>');
    }
    if (target.hostname === 'api.openai.com') {
      const payload = JSON.parse(String(init?.body));
      assert.equal(payload.store, false);
      assert.equal(payload.text.format.strict, true);
      assert.ok(payload.input.includes(official));
      return Response.json({
        status: 'completed',
        output: [{ content: [{ type: 'output_text', text: JSON.stringify({
          events: [event, event, { ...event, title: 'Unknown event', date_evidence: 'unverified' }],
        }) }] }],
      });
    }
    assert.equal(new Headers(init?.headers).get('apikey'), env.SUPABASE_SERVER_KEY);
    if (target.pathname.endsWith('/sources') && init?.method === 'GET') {
      return Response.json([{ id: sourceId, name: 'Test source', url: source, feed_url: null }]);
    }
    if (target.pathname.endsWith('/events') && init?.method === 'POST') {
      const rows = JSON.parse(String(init.body));
      assert.equal(rows.length, 1);
      assert.equal(rows[0].status, 'pending');
      assert.equal(rows[0].start_time, '2099-05-01T22:00:00.000Z');
      assert.equal(rows[0].source_url, original);
      assert.equal(rows[0].official_url, official);
      assert.equal(rows[0].price_amount, null);
      return Response.json(rows);
    }
    if (target.pathname.endsWith('/sources') && init?.method === 'PATCH') return new Response(null, { status: 204 });
    throw new Error('Unexpected endpoint ' + target.href);
  });
  await import('../scripts/ingest.mts');
  assert.equal(calls.mock.callCount(), 5);
});
