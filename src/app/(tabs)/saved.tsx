import { FlatList, Text, View } from 'react-native';
import { AppHeader, Screen } from '@/components/app-shell';
import { EventCard, ui } from '@/components/event-ui';
import { useEvents } from '@/lib/event-provider';

export default function Saved() {
  const { events, dining, saved, ready, saveError } = useEvents();
  const current = new Map([...events, ...dining].map(event => [event.id, event]));
  const displayed = saved.map(event => current.get(event.id) ?? event).reverse();
  return (
    <Screen>
      <FlatList data={displayed} keyExtractor={event => event.id} contentContainerStyle={ui.content}
        ListHeaderComponent={<View style={{ marginBottom: 16 }}>
          <AppHeader title="Favourites" subtitle="Events and restaurants you’ve saved." />
          {saveError ? <Text accessibilityRole="alert" style={ui.text}>{saveError}</Text> : null}
        </View>}
        ListEmptyComponent={<View style={ui.panel}><Text style={ui.muted}>{ready ? 'Swipe left on a listing or tap its bookmark to save it.' : 'Loading your favourites…'}</Text></View>}
        renderItem={({ item }) => <EventCard event={item} />} />
    </Screen>
  );
}
