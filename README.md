# MTL NOW

MTL NOW is an Expo SDK 58 mobile app for planning outings in Montréal. The feed has Current Events and Restaurants. Double-tap a listing to like it, or swipe left to save it to Favourites. The bottom tabs are Chillz, Search, Profile, Map, and Favourites.

- **Chillz** groups ordered stops and totals per-person CAD prices and known visit durations. Use the driving estimate button for actual road distance and travel time between stops. It sends venue coordinates to an OSRM-compatible route service and excludes waiting time. Set `EXPO_PUBLIC_ROUTING_URL` to your own route endpoint for deployment.
- **Profile** uses Supabase email/password auth when configured. Sessions live in memory and end on expiration or app restart. Likes, Favourites, and Chillz are stored on the device.
- **Map** uses published listing coordinates with OpenStreetMap data and CARTO tiles. Demo pins are fictional. Listings with missing coordinates stay off the map.

## Run the app

Use Node.js 24, npm and the matching Expo Go client. On Windows PowerShell, use `npm.cmd` and `npx.cmd` if the execution policy blocks the PowerShell wrappers.

```sh
npm ci
npx expo start
```

Scan the QR code with Expo Go on Android. On iOS, open the QR code with Camera. The app opens in fictional demo mode when Supabase is unconfigured. To force demo mode, set `EXPO_PUBLIC_DEMO_MODE=true` in `.env.local` before starting Expo. Sample events and restaurants are fictional, and event dates are calculated at refresh. Without demo mode, the app uses the configured live feed and offers the demo if the feed fails.

Tonight runs from 5 p.m. to midnight Montréal time. This Weekend covers Saturday and Sunday, including the current weekend when today is Sunday. An event with no end time leaves the upcoming feed after its start time. Budget limits are strict, apply to CAD prices, and exclude unknown prices. Interests affect ranking.

Run `npm run web` for a browser preview. Use Expo Go for native touch testing.

## Environment variables

| File | Variables |
| --- | --- |
| `.env.local` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, optional `EXPO_PUBLIC_DEMO_MODE=true` |
| `.env.server.local` | `SUPABASE_URL`, `SUPABASE_SERVER_KEY` (Supabase secret key or legacy service-role key), `OPENAI_API_KEY`, optional `OPENAI_MODEL` (defaults to `gpt-4.1-mini`) |

Use [the environment template](.env.example) as a reference. The mobile app needs only its public values. Keep the server file local to the importer.

## Set up Supabase

1. Create a Supabase project. In its SQL Editor, run [the migration](supabase/migrations/20261121000000_events.sql) once. Run [the restaurant migration](supabase/migrations/20261121000001_restaurants.sql) after it. The public client can select only published events and restaurants. Set `published=true` for reviewed restaurants and add latitude and longitude to both kinds of listings before mapping them. The source registry and writes are restricted to trusted operators.
2. Set the project's URL and publishable key in `.env.local`. Restart Metro. The live feed is empty until you publish events.
3. Add only sources that permit this use. In the SQL Editor, replace the example values and keep the returned UUID.

```sql
insert into public.sources (name, url, feed_url, source_type, enabled)
values ('Approved source name', 'https://example.org', null, 'website', true)
returning id;
```

Set `feed_url` to a permitted public HTTPS RSS or Atom feed to enable feed imports. A source is disabled by default unless enabled explicitly.

## Import and publish events

The private Node CLI reads `.env.server.local`. It uses OpenAI Structured Outputs, interprets explicit event dates in Toronto time, rejects incomplete or expired candidates, and deposits valid rows in the pending queue. Repeat imports ignore duplicate normalized title and start-time combinations. Review each draft against the source before publishing.

```sh
npm run ingest -- text SOURCE_UUID ./article.txt https://example.org/original-article
npm run ingest -- url SOURCE_UUID https://example.org/original-article
npm run ingest -- rss SOURCE_UUID
npm run ingest -- review
npm run ingest -- publish EVENT_UUID
npm run ingest -- reject EVENT_UUID
```

The text command accepts article text or a permitted local export and requires the original public article URL. The URL command works for readable HTML on the enabled source origin. It does not follow redirects or bypass access controls. RSS handles up to eight RSS or Atom entries per source per run using the available entry content. Omit the RSS UUID to process all enabled feeds. You can schedule that same CLI in a trusted server job. This repository does not configure a hosted schedule.

Review and correct fields in Supabase Table Editor before publishing. Add an `image_url` only when you have rights to use the image. Mark selected records with `featured=true` to spotlight them. The app labels AI-generated summaries on event details. The importer stores a short original summary and source URL rather than the article. Avoid importing nonpublic content or material you are not permitted to process.

## Checks and Android APK

```sh
npm run lint
npm run typecheck
npm test
npx expo export --platform android
```

When ready to start a cloud build, authenticate with Expo, link the project, and run the demo APK profile.

```sh
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile preview
```

For a live APK, set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the EAS production environment and build with `--profile live-apk`. Both profiles produce installable APKs. Open the build link to download and install the APK on Android.
