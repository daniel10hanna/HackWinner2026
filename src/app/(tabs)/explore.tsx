import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { AppHeader, Screen } from '@/components/app-shell';
import { Chip, Chips, EventCard, palette, ui } from '@/components/event-ui';
import { matchesSearch } from '@/lib/chillz';
import { useEvents } from '@/lib/event-provider';
import { budgets, categories, recommend, windows, type Budget, type Category, type Window } from '@/lib/events';

export default function Search() {
  const { upcoming, dining, now, demo } = useEvents();
  const [query, setQuery] = useState('');
  const [when, setWhen] = useState<Window>('All Upcoming');
  const [budget, setBudget] = useState<Budget>('Any');
  const [kind, setKind] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [interests, setInterests] = useState<Category[]>([]);
  const [area, setArea] = useState('Anywhere');
  const areas = ['Anywhere', ...new Set([...upcoming, ...dining].flatMap(item => item.neighborhood ? [item.neighborhood] : []))].sort();
  const currentArea = areas.includes(area) ? area : 'Anywhere';
  const events = kind === 'Restaurants' ? [] : recommend(upcoming, now, when, budget, interests, currentArea);
  const restaurants = kind === 'Events' || when !== 'All Upcoming' ? [] : dining.filter(item => {
    if (currentArea !== 'Anywhere' && item.neighborhood !== currentArea) return false;
    if (budget === 'Any') return true;
    if (budget === 'Free') return item.is_free === true;
    return item.is_free === true || (item.price_currency === 'CAD' && item.price_amount != null && item.price_amount < (budget === 'Under $20' ? 20 : 50));
  });
  const results = [...events, ...restaurants].filter(item => matchesSearch(item, query));

  return <Screen>
    <FlatList data={results} keyExtractor={item => item.id} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => <EventCard event={item} />}
      ListHeaderComponent={<View>
        <AppHeader title="Search" subtitle="Find events, restaurants, and neighbourhoods." />
        <View style={[ui.panel, ui.row, { paddingVertical: 5 }]}>
          <Ionicons name="search-outline" color={palette.accent} size={20} />
          <TextInput accessibilityLabel="Search listings" value={query} onChangeText={setQuery} returnKeyType="search"
            placeholder="Search Montréal" placeholderTextColor={palette.muted} style={{ flex: 1, color: palette.text, minHeight: 44, fontSize: 16 }} />
        </View>
        <Chips>{['All', 'Events', 'Restaurants'].map(value => <Chip key={value} label={value} selected={value === kind} onPress={() => {
          setKind(value);
          if (value === 'Restaurants') setWhen('All Upcoming');
        }} />)}</Chips>
        {kind !== 'Restaurants' && <Chips>{windows.map(value => <Chip key={value} label={value} selected={value === when} onPress={() => setWhen(value)} />)}</Chips>}
        <Chips>{budgets.map(value => <Chip key={value} label={value} selected={value === budget} onPress={() => setBudget(value)} />)}</Chips>
        <View style={{ alignItems: 'flex-start', marginVertical: 4 }}>
          <Chip label="Interests and neighbourhoods" selected={showFilters} onPress={() => setShowFilters(value => !value)} />
        </View>
        {showFilters && <View style={ui.panel}>
          {kind !== 'Restaurants' && <><Text style={ui.label}>Prioritize interests</Text>
            <Chips>{categories.map(value => <Chip key={value} label={value} selected={interests.includes(value)}
              onPress={() => setInterests(list => list.includes(value) ? list.filter(item => item !== value) : [...list, value])} />)}</Chips></>}
          <Text style={ui.label}>Neighbourhood</Text>
          <Chips>{areas.map(value => <Chip key={value} label={value} selected={currentArea === value} onPress={() => setArea(value)} />)}</Chips>
        </View>}
        <Text accessibilityLiveRegion="polite" style={[ui.muted, { marginVertical: 12 }]}>{results.length} {results.length === 1 ? 'result' : 'results'}{demo ? ' · Fictional demo' : ''}</Text>
        {when !== 'All Upcoming' && kind === 'All' && <Text style={ui.muted}>Date filters apply to events.</Text>}
      </View>}
      ListEmptyComponent={<View style={ui.panel}><Text style={ui.muted}>No listings match. Try a different search or filter.</Text></View>}
    />
  </Screen>;
}
