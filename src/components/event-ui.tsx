import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, type ComponentProps, type PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { eventDate, price, type Category, type Event } from '@/lib/events';
import { useEvents } from '@/lib/event-provider';
import demoJazz from '@/assets/images/demo-jazz.jpg';

export const palette = {
  background: '#100e19', surface: '#1c182a', border: '#342b46', accent: '#c2a3ff',
  text: '#faf7ff', muted: '#c0b6ce', blue: '#93b4ff',
};
export const ui = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, width: '100%', maxWidth: 720, alignSelf: 'center' },
  brand: { color: palette.accent, fontSize: 12, letterSpacing: 3, fontWeight: '800', marginBottom: 14 },
  title: { color: palette.text, fontSize: 37, fontWeight: '900', letterSpacing: -1.8 },
  heading: { color: palette.text, fontSize: 23, fontWeight: '800', marginTop: 22, marginBottom: 10 },
  text: { color: palette.text, fontSize: 16, lineHeight: 24 },
  muted: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  label: { color: palette.blue, fontSize: 12, letterSpacing: 1, fontWeight: '800', textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  panel: { padding: 16, borderRadius: 18, backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, gap: 8, marginVertical: 10 },
  button: { minHeight: 48, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'center', backgroundColor: palette.accent, alignItems: 'center' },
  buttonText: { color: '#211039', fontWeight: '800', textAlign: 'center' },
});
type Icon = ComponentProps<typeof Ionicons>['name'];
const artwork: Record<Category, [string, string, Icon]> = {
  Music: ['#4d1b79', '#1c399f', 'musical-notes-outline'],
  Food: ['#8c2f59', '#60218c', 'restaurant-outline'],
  Nightlife: ['#271677', '#215fc0', 'moon-outline'],
  Arts: ['#703e9f', '#472c80', 'color-palette-outline'],
  Festivals: ['#5830a6', '#205f8e', 'sparkles-outline'],
  Sports: ['#134f7d', '#4655a2', 'bicycle-outline'],
  Community: ['#633591', '#435189', 'people-outline'],
  Other: ['#563688', '#293d83', 'prism-outline'],
};

export function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" style={ui.button} onPress={onPress}><Text style={ui.buttonText}>{label}</Text></Pressable>;
}
export function Chips({ children }: PropsWithChildren) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 5 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>;
}
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
      style={[ui.button, { backgroundColor: selected ? palette.accent : palette.surface, borderWidth: 1, borderColor: selected ? palette.accent : palette.border }]}>
      <Text style={[ui.buttonText, !selected && { color: palette.muted }]}>{label}</Text>
    </Pressable>
  );
}

export function EventArt({ event, height }: { event: Event; height: number }) {
  const [failed, setFailed] = useState<string | null>(null);
  const [first, second, icon] = artwork[event.category];
  const localCover = event.demo && event.id === 'demo-0' ? demoJazz : null;
  return (
    <LinearGradient colors={[first, second, '#15102a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ height, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <View style={[styles.ring, { width: 270, height: 270 }]} />
      <View style={[styles.ring, { width: 195, height: 195 }]} />
      <View style={[styles.ring, { width: 120, height: 120 }]} />
      <Ionicons name={icon} color="#eee2ff" size={54} />
      {localCover && <Image source={localCover} contentFit="cover" style={StyleSheet.absoluteFill} />}
      {event.image_url && failed !== event.image_url && (
        <Image source={event.image_url} onError={() => setFailed(event.image_url)} contentFit="cover" transition={160} style={StyleSheet.absoluteFill} />
      )}
    </LinearGradient>
  );
}

export function EventCard({ event, featured = false }: { event: Event; featured?: boolean }) {
  const { saved, ready, toggle } = useEvents();
  const bookmarked = saved.some(item => item.id === event.id);
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={'View ' + event.title} onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}>
        <EventArt event={event} height={featured ? 200 : 134} />
        <View style={styles.cardBody}>
          <Text style={ui.label}>{event.category}{event.demo ? ' · Fictional' : ''}</Text>
          <Text style={styles.cardTitle}>{event.title}</Text>
          <Text style={ui.muted}>{eventDate(event.start_time)} · {event.neighborhood ?? event.venue ?? 'Montréal'}</Text>
          <Text style={[ui.text, { color: palette.accent, fontWeight: '700' }]}>{price(event)}</Text>
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={bookmarked ? 'Remove saved event' : 'Save event'} disabled={!ready}
        accessibilityState={{ selected: bookmarked, disabled: !ready }} onPress={() => toggle(event)} style={styles.bookmark}>
        <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} color={palette.text} size={20} />
      </Pressable>
    </View>
  );
}

export function FeedStatus({ empty }: { empty: string }) {
  const { demo, canSwitch, switchMode, loading, error, events, refresh, saveError } = useEvents();
  return (
    <>
      {(demo || error || saveError) && <View style={ui.panel}>
        {demo && <Text style={ui.label}>Demo mode · fictional events</Text>}
        {error ? <Text accessibilityRole="alert" style={ui.text}>{error}</Text> : null}
        {saveError ? <Text accessibilityRole="alert" style={ui.text}>{saveError}</Text> : null}
        {error && <Action label="Retry live feed" onPress={refresh} />}
        {canSwitch && (demo || error) && <Action label={demo ? 'Use live feed' : 'Open fictional demo'} onPress={switchMode} />}
      </View>}
      {loading && events.length === 0 && <View accessibilityLabel="Loading events" accessibilityState={{ busy: true }} style={ui.panel}>
        {[150, 28, 18].map((height, i) => <View key={height} style={{ height, width: i === 0 ? '100%' : i === 1 ? '75%' : '55%', borderRadius: 10, backgroundColor: palette.border }} />)}
      </View>}
      {!loading && !error && empty ? <View style={ui.panel}><Text style={ui.muted}>{empty}</Text></View> : null}
    </>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute', borderColor: '#e8d8ff35', borderWidth: 1, borderRadius: 200, transform: [{ scaleX: 1.4 }, { rotate: '-18deg' }] },
  card: { overflow: 'hidden', borderRadius: 20, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, marginBottom: 14 },
  cardBody: { padding: 15, gap: 4 },
  cardTitle: { color: palette.text, fontSize: 22, letterSpacing: -0.5, fontWeight: '800' },
  bookmark: { position: 'absolute', top: 10, right: 10, height: 46, width: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#161027df' },
});
