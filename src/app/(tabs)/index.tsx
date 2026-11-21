import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip, Chips, EventCard, FeedStatus, palette, ui } from '@/components/event-ui';
import { useEvents } from '@/lib/event-provider';
import { categories, matchesWindow, windows, zone, type Category, type Window } from '@/lib/events';

export default function Discover() {
  const { upcoming, now, loading, refresh } = useEvents();
  const [query, setQuery] = useState('');
  const [window, setWindow] = useState<Window>('All Upcoming');
  const [category, setCategory] = useState<Category>();
  const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const filtered = upcoming.filter(event => matchesWindow(event, window, now) &&
    (!category || event.category === category) &&
    normalize([event.title, event.category, event.venue, event.neighborhood].join(' ')).includes(normalize(query.trim())));
  const featured = filtered.filter(event => event.featured).slice(0, 3);
  const spotlight = featured[0];
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', hourCycle: 'h23' }).format(now));
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: zone, weekday: 'long', month: 'long', day: 'numeric' }).format(now);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: palette.background }}>
      <FlatList contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled"
        data={filtered.filter(event => event.id !== spotlight?.id)} keyExtractor={event => event.id}
        refreshing={loading} onRefresh={refresh} renderItem={({ item }) => <EventCard event={item} />}
        ListHeaderComponent={
          <View>
            <Text style={ui.brand}>MTL NOW</Text>
            <Text style={ui.label}>{date}</Text>
            <Text accessibilityRole="header" style={ui.title}>Discover Montréal</Text>
            <Text style={ui.muted}>Good {hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}. What’s on your radar?</Text>
            <View style={styles.search}>
              <Ionicons name="search-outline" size={20} color={palette.accent} />
              <TextInput value={query} onChangeText={setQuery} accessibilityLabel="Search events" placeholder="Search events or neighbourhoods"
                placeholderTextColor={palette.muted} style={styles.input} returnKeyType="search" />
            </View>
            <Chips>{windows.map(value => <Chip key={value} label={value} selected={window === value} onPress={() => setWindow(value)} />)}</Chips>
            <Chips><Chip label="All categories" selected={!category} onPress={() => setCategory(undefined)} />
              {categories.map(value => <Chip key={value} label={value} selected={category === value} onPress={() => setCategory(category === value ? undefined : value)} />)}</Chips>
            <FeedStatus empty={filtered.length ? '' : 'No events match. Try another date, category, or search.'} />
            {spotlight && <><Text accessibilityRole="header" style={ui.heading}>Featured</Text><EventCard event={spotlight} featured /></>}
            {filtered.length > (spotlight ? 1 : 0) && <Text accessibilityRole="header" style={ui.heading}>Coming up</Text>}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  search: { ...ui.row, backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 15, marginTop: 18, marginBottom: 7, paddingHorizontal: 14 },
  input: { flex: 1, minHeight: 50, color: palette.text, fontSize: 16 },
});
