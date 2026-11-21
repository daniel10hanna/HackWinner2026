import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useRef, useState, type ComponentProps, type PropsWithChildren } from 'react';
import { Animated, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { eventDate, price, type Category, type Event } from '@/lib/events';
import { useEvents } from '@/lib/event-provider';
import demoJazz from '@/assets/images/demo-jazz.jpg';
import market from '@/assets/images/chillz/market.webp';
import park from '@/assets/images/chillz/park.webp';

export const palette = {
  background: '#100e19', surface: '#1b1727', border: '#322940', accent: '#c7a8ff',
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
  const localCover = event.demo
    ? ({ 'demo-0': demoJazz, 'demo-1': market, 'demo-5': park, 'demo-8': park, 'demo-restaurant-1': market } as Record<string, number>)[event.id]
    : null;
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

export function EventCard({ event }: { event: Event }) {
  const { saved, ready, toggle, likes, like } = useEvents();
  const bookmarked = saved.some(item => item.id === event.id);
  const liked = likes.includes(event.id);
  const [shift] = useState(() => new Animated.Value(0));
  const [heart] = useState(() => new Animated.Value(0));
  const lastTap = useRef(0);
  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, { dx, dy }) => dx < -12 && Math.abs(dx) > Math.abs(dy) * 1.5,
    onPanResponderGrant: () => shift.stopAnimation(),
    onPanResponderMove: (_, { dx }) => shift.setValue(Math.max(-110, Math.min(0, dx))),
    onPanResponderRelease: (_, { dx }) => {
      if (dx < -65) toggle(event, true);
      Animated.spring(shift, { toValue: 0, useNativeDriver: Platform.OS !== 'web' }).start();
    },
    onPanResponderTerminate: () => Animated.spring(shift, { toValue: 0, useNativeDriver: Platform.OS !== 'web' }).start(),
  }), [event, shift, toggle]);

  function tapCard() {
    if (!ready) return;
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 325) {
      lastTap.current = 0;
      like(event.id, true);
      heart.setValue(1);
      Animated.timing(heart, { toValue: 0, duration: 540, useNativeDriver: Platform.OS !== 'web' }).start();
    } else lastTap.current = now;
  }

  const detail = () => router.push({ pathname: '/event/[id]', params: { id: event.id } });
  const location = event.neighborhood ?? event.venue ?? 'Montréal';
  return (
    <View style={styles.swipeContainer} {...swipe.panHandlers}>
      <View style={styles.reveal}>
        <Ionicons name="bookmark" color="#211039" size={21} />
        <Text style={ui.buttonText}>{bookmarked ? 'Saved' : 'Save'}</Text>
      </View>
      <Animated.View style={[styles.card, { transform: [{ translateX: shift }] }]}>
        <Pressable onPress={tapCard} accessible={false} style={styles.cardMain} onTouchMove={() => { lastTap.current = 0; }}>
          <View style={styles.thumbnail}><EventArt event={event} height={114} /></View>
          <View style={styles.cardBody}>
            <Text style={styles.cardCategory}>{event.kind === 'restaurant' ? 'Restaurant' : event.category} · {location}</Text>
            <Text style={styles.cardTitle}>{event.title}</Text>
            {event.description && <Text numberOfLines={2} style={styles.description}>{event.description}</Text>}
          </View>
          <Animated.View pointerEvents="none" style={[styles.heartFlash, { opacity: heart }]}>
            <Ionicons name="heart" color="#ff95c4" size={57} />
          </Animated.View>
        </Pressable>
        <View style={styles.cardFooter}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.cardPrice}>{price(event)}{event.kind === 'restaurant' && event.price_amount != null ? ' avg.' : ''}</Text>
            {event.kind !== 'restaurant' && <Text style={styles.date}>{eventDate(event.start_time)}</Text>}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={(liked ? 'Unlike ' : 'Like ') + event.title} accessibilityState={{ selected: liked }}
            disabled={!ready} onPress={() => like(event.id)} style={styles.iconButton}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} color={liked ? '#ff95c4' : palette.muted} size={20} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={(bookmarked ? 'Remove favourite ' : 'Save favourite ') + event.title}
            accessibilityState={{ selected: bookmarked }} disabled={!ready} onPress={() => toggle(event)} style={styles.iconButton}>
            <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} color={bookmarked ? palette.accent : palette.muted} size={19} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={'View ' + event.title} onPress={detail} style={styles.iconButton}>
            <Ionicons name="arrow-forward" color={palette.accent} size={19} />
          </Pressable>
        </View>
      </Animated.View>
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
  swipeContainer: { overflow: 'hidden', borderRadius: 20, marginBottom: 12 },
  reveal: { ...StyleSheet.absoluteFill, backgroundColor: palette.accent, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 23, gap: 4 },
  card: { overflow: 'hidden', borderRadius: 20, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  cardMain: { padding: 11, flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumbnail: { width: 105, borderRadius: 12, overflow: 'hidden' },
  cardBody: { flex: 1, gap: 4 },
  cardCategory: { color: palette.accent, fontSize: 10, textTransform: 'uppercase', fontWeight: '800', letterSpacing: 0.65 },
  cardTitle: { color: palette.text, fontSize: 19, letterSpacing: -0.45, fontWeight: '800' },
  description: { color: palette.muted, fontSize: 13, lineHeight: 17 },
  cardFooter: { marginHorizontal: 11, paddingLeft: 3, minHeight: 56, borderTopWidth: 1, borderColor: palette.border, flexDirection: 'row', alignItems: 'center' },
  cardPrice: { color: palette.text, fontSize: 13, fontWeight: '800' },
  date: { color: palette.muted, fontSize: 11 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  heartFlash: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
