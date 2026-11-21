import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventCard, palette, ui } from '@/components/event-ui';
import { useEvents } from '@/lib/event-provider';
import { byStart } from '@/lib/events';

export default function Saved() {
  const { events, saved, ready, saveError } = useEvents();
  const current = new Map(events.map(event => [event.id, event]));
  const displayed = saved.map(event => current.get(event.id) ?? event).sort(byStart);
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: palette.background }}>
      <FlatList data={displayed} keyExtractor={event => event.id} contentContainerStyle={ui.content}
        ListHeaderComponent={<View style={{ marginBottom: 16 }}>
          <Text style={ui.brand}>MTL NOW</Text>
          <Text accessibilityRole="header" style={ui.title}>Saved events</Text>
          {saveError ? <Text accessibilityRole="alert" style={ui.text}>{saveError}</Text> : null}
        </View>}
        ListEmptyComponent={<View style={ui.panel}><Text style={ui.muted}>{ready ? 'Bookmark events to keep them here.' : 'Loading your saved events…'}</Text></View>}
        renderItem={({ item }) => <EventCard event={item} />} />
    </SafeAreaView>
  );
}
