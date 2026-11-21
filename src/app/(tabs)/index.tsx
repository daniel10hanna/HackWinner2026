import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Screen } from '@/components/app-shell';
import { Action, Chip, Chips, EventCard, FeedStatus, palette, ui } from '@/components/event-ui';
import { useEvents } from '@/lib/event-provider';
import { matchesWindow, windows, type Window } from '@/lib/events';
import skyline from '@/assets/images/chillz/montreal.webp';

export default function Discover() {
  const { upcoming, dining, restaurantError, now, loading, refresh, demo, canSwitch, switchMode, error, saveError } = useEvents();
  const [mode, setMode] = useState<'events' | 'restaurants'>('events');
  const [window, setWindow] = useState<Window>('All Upcoming');
  const events = mode === 'events';
  const filtered = events ? upcoming.filter(event => matchesWindow(event, window, now)) : dining;
  return (
    <Screen>
      <View style={[ui.content, { paddingBottom: 10 }]}>
        <AppHeader />
        <View style={styles.segments}>
          {(['events', 'restaurants'] as const).map(item => <Pressable key={item} accessibilityRole="tab"
            accessibilityState={{ selected: mode === item }} onPress={() => setMode(item)}
            style={[styles.segment, item === mode && styles.segmentActive]}>
            <Ionicons name={item === 'events' ? 'calendar-outline' : 'restaurant-outline'} size={17} color={item === mode ? '#271842' : palette.muted} />
            <Text style={[styles.segmentText, item === mode && { color: '#271842' }]}>{item === 'events' ? 'Current events' : 'Restaurants'}</Text>
          </Pressable>)}
        </View>
      </View>
      <FlatList contentContainerStyle={[ui.content, { paddingTop: 0 }]}
        data={filtered} keyExtractor={item => item.id} refreshing={loading} onRefresh={refresh}
        renderItem={({ item }) => <EventCard event={item} />}
        ListHeaderComponent={<View>
          <View style={styles.hero}>
            <Image source={skyline} contentFit="cover" style={StyleSheet.absoluteFill} />
            <LinearGradient colors={['#16102222', '#100e19ef']} style={StyleSheet.absoluteFill} />
            <Text style={styles.heroTitle} accessibilityRole="header">{events ? 'What’s on in Montréal' : 'Where to eat in Montréal'}</Text>
          </View>
          {events && <Chips>{windows.map(value => <Chip key={value} label={value} selected={window === value} onPress={() => setWindow(value)} />)}</Chips>}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{events ? 'Coming up' : 'Places to eat'}</Text>
            <Text style={ui.muted}>{demo ? 'Fictional demo' : filtered.length + ' listings'}</Text>
          </View>
          {events && (!demo || canSwitch || loading || Boolean(error || saveError)) && <FeedStatus empty={filtered.length ? '' : 'No events for this date filter.'} />}
          {events && demo && !loading && !error && !canSwitch && !filtered.length && <Text style={ui.muted}>No events for this date filter.</Text>}
          {!events && !filtered.length && <View style={ui.panel}>
            <Text style={ui.muted}>{restaurantError || 'No restaurants are listed yet.'}</Text>
            {restaurantError && <Action label="Retry" onPress={refresh} />}
            {canSwitch && !demo && <Action label="Open fictional demo" onPress={switchMode} />}
          </View>}
          {filtered.length > 0 && <Text style={styles.hint}>Double-tap to like · Swipe left to save</Text>}
        </View>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  segments: { flexDirection: 'row', gap: 5, backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 15, padding: 4 },
  segment: { flex: 1, minHeight: 43, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  segmentActive: { backgroundColor: palette.accent },
  segmentText: { color: palette.muted, fontWeight: '800', fontSize: 13 },
  hero: { height: 159, borderRadius: 19, overflow: 'hidden', padding: 17, justifyContent: 'flex-end', marginBottom: 10 },
  heroTitle: { color: palette.text, fontSize: 29, fontWeight: '900', letterSpacing: -1 },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 3 },
  sectionTitle: { color: palette.text, fontWeight: '800', fontSize: 21, letterSpacing: -0.6 },
  hint: { color: palette.muted, marginBottom: 10, fontSize: 12 },
});
