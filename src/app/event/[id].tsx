import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Action, EventArt, palette, ui } from '@/components/event-ui';
import { useEvents } from '@/lib/event-provider';
import { active, eventDate, price } from '@/lib/events';

export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events, saved, loading, toggle, ready, saveError, now } = useEvents();
  const [error, setError] = useState('');
  const event = events.find(item => item.id === id) ?? saved.find(item => item.id === id);
  const bookmarked = saved.some(item => item.id === id);
  const open = (url: string) => {
    if (/^https?:\/\//i.test(url)) void Linking.openURL(url).catch(() => setError('This link could not be opened.'));
  };
  const location = event?.address ?? event?.venue;
  const back = () => router.canGoBack() ? router.back() : router.replace('/');
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView contentContainerStyle={ui.content}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} style={{ width: 48, height: 48, justifyContent: 'center' }}>
          <Ionicons name="arrow-back" color={palette.text} size={25} />
        </Pressable>
        {event ? <>
          <View style={{ overflow: 'hidden', borderRadius: 22, marginBottom: 16 }}><EventArt event={event} height={230} /></View>
          <Text style={ui.label}>{event.category}{event.demo ? ' · Fictional demo' : ''}{active(event, now) ? '' : ' · Past event'}</Text>
          <Text accessibilityRole="header" style={ui.title}>{event.title}</Text>
          <View style={ui.panel}>
            <Text style={ui.label}>Montréal time</Text>
            <Text style={ui.text}>{eventDate(event.start_time)}</Text>
            {event.end_time && <Text style={ui.muted}>Ends {eventDate(event.end_time)}</Text>}
            {event.venue && <Text style={ui.text}>{event.venue}</Text>}
            {event.address && <Text style={ui.muted}>{event.address}</Text>}
            {event.neighborhood && <Text style={ui.muted}>{event.neighborhood}</Text>}
            <Text style={ui.text}>{price(event)}</Text>
          </View>
          {event.description && <View style={ui.panel}>
            <Text style={ui.label}>{event.demo ? 'Fictional event description' : 'AI-generated summary'}</Text>
            <Text style={ui.text}>{event.description}</Text>
          </View>}
          <View style={ui.panel}>
            <Text style={ui.label}>Source</Text>
            <Text style={ui.text}>{event.source_name}</Text>
            {event.source_url && <Action label="Open original source" onPress={() => open(event.source_url!)} />}
            {event.official_url && <Action label="Official details or tickets" onPress={() => open(event.official_url!)} />}
          </View>
          <View style={{ gap: 8 }}>
            {ready && <Action label={bookmarked ? 'Remove from saved' : 'Save event'} onPress={() => toggle(event)} />}
            <Action label="Share event" onPress={() => {
              const message = [event.demo ? 'Fictional MTL NOW demo event' : undefined, event.title, eventDate(event.start_time), event.official_url ?? event.source_url].filter(Boolean).join('\n');
              void Share.share({ message }).catch(() => setError('This event could not be shared.'));
            }} />
            {location && !event.demo && <Action label="Open directions" onPress={() => open('https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(location + ', Montréal, QC'))} />}
          </View>
          {error || saveError ? <Text accessibilityRole="alert" style={ui.text}>{error || saveError}</Text> : null}
        </> : <Text style={ui.text}>{loading ? 'Loading event…' : 'This event is unavailable.'}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}
