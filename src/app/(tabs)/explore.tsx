import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip, Chips, EventCard, FeedStatus, palette, ui } from '@/components/event-ui';
import { useEvents } from '@/lib/event-provider';
import { budgets, recommend, type Budget, type Category, type Window } from '@/lib/events';

const times = ['Now', 'Tonight', 'Tomorrow', 'This Weekend'] as const;
const interests = ['Music', 'Food', 'Arts', 'Nightlife', 'Sports', 'Community'] as const;

export default function SmartDiscovery() {
  const { upcoming, now, refresh, loading } = useEvents();
  const [when, setWhen] = useState<Window>('Tonight');
  const [budget, setBudget] = useState<Budget>('Any');
  const [selected, setSelected] = useState<Category[]>([]);
  const [area, setArea] = useState('Anywhere');
  const areas = ['Anywhere', ...Array.from(new Set(upcoming.flatMap(event => event.neighborhood ? [event.neighborhood] : []))).sort()];
  const currentArea = areas.includes(area) ? area : 'Anywhere';
  const results = recommend(upcoming, now, when, budget, selected, currentArea);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: palette.background }}>
      <FlatList data={results} keyExtractor={event => event.id} contentContainerStyle={ui.content}
        renderItem={({ item }) => <EventCard event={item} />} onRefresh={refresh} refreshing={loading}
        ListHeaderComponent={<View>
          <Text style={ui.brand}>MTL NOW</Text>
          <Text accessibilityRole="header" style={ui.title}>What should I do?</Text>
          <View style={ui.panel}>
            <Text style={ui.label}>When</Text>
            <Chips>{times.map(value => <Chip key={value} label={value} selected={when === value} onPress={() => setWhen(value)} />)}</Chips>
            <Text style={ui.label}>Budget</Text>
            <Chips>{budgets.map(value => <Chip key={value} label={value} selected={budget === value} onPress={() => setBudget(value)} />)}</Chips>
            <Text style={ui.label}>Interests</Text>
            <Chips>{interests.map(value => <Chip key={value} label={value} selected={selected.includes(value)}
              onPress={() => setSelected(items => items.includes(value) ? items.filter(item => item !== value) : [...items, value])} />)}</Chips>
            <Text style={ui.label}>Neighbourhood</Text>
            <Chips>{areas.map(value => <Chip key={value} label={value} selected={currentArea === value} onPress={() => setArea(value)} />)}</Chips>
          </View>
          <FeedStatus empty={results.length ? '' : 'No matches for these picks. Try another time, budget, or neighbourhood.'} />
          {results.length > 0 && <Text accessibilityRole="header" style={ui.heading}>Best matches</Text>}
        </View>}
      />
    </SafeAreaView>
  );
}
