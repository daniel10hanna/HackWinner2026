import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Screen } from '@/components/app-shell';
import { Chip, Chips, palette, ui } from '@/components/event-ui';
import { coordinates, type Coordinates } from '@/lib/chillz';
import { useEvents } from '@/lib/event-provider';

const tileSize = 256;
const montreal = { latitude: 45.505, longitude: -73.587 };
function project({ longitude, latitude }: Coordinates, zoom: number) {
  const world = 2 ** zoom;
  const radians = Math.max(-85.05, Math.min(85.05, latitude)) * Math.PI / 180;
  return { x: (longitude + 180) / 360 * world, y: (1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2 * world };
}

export default function MapScreen() {
  const { upcoming, dining, refresh, loading, demo, error, restaurantError } = useEvents();
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState('');
  const [center, setCenter] = useState(montreal);
  const [zoom, setZoom] = useState(12);
  const [width, setWidth] = useState(0);
  const [failedTiles, setFailedTiles] = useState(false);
  const height = 310;
  const items = [...(filter === 'Restaurants' ? [] : upcoming), ...(filter === 'Events' ? [] : dining)];
  const places = items.flatMap(event => {
    const point = coordinates(event);
    return point ? [{ event, point }] : [];
  });
  const focus = places.find(({ event }) => event.id === selected);
  const origin = project(center, zoom);
  const left = origin.x - width / tileSize / 2;
  const top = origin.y - height / tileSize / 2;
  const tiles = [];
  for (let x = Math.floor(left); width > 0 && x < left + width / tileSize; x++) {
    for (let y = Math.floor(top); y < top + height / tileSize; y++) tiles.push({ x, y });
  }

  function zoomBy(step: number) {
    setFailedTiles(false);
    setZoom(value => Math.max(10, Math.min(16, value + step)));
  }

  return <Screen>
    <ScrollView contentContainerStyle={ui.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={palette.accent} />}>
      <AppHeader title="Map" subtitle={demo ? 'Fictional demo pins across Montréal.' : 'Browse current listings by location.'} />
      <Chips>{['All', 'Events', 'Restaurants'].map(value => <Chip key={value} label={value} selected={filter === value} onPress={() => {
        setFilter(value); setSelected('');
      }} />)}</Chips>
      <View style={[styles.map, { height }]} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
        {tiles.map(tile => <Image key={zoom + '/' + tile.x + '/' + tile.y} onError={() => setFailedTiles(true)}
          source={{ uri: 'https://basemaps.cartocdn.com/dark_all/' + zoom + '/' + tile.x + '/' + tile.y + '.png' }}
          contentFit="fill" style={{ position: 'absolute', width: tileSize + 1, height: tileSize + 1, left: (tile.x - left) * tileSize, top: (tile.y - top) * tileSize }} />)}
        {places.map(({ event, point }) => {
          const pixel = project(point, zoom);
          const x = (pixel.x - left) * tileSize;
          const y = (pixel.y - top) * tileSize;
          if (width === 0 || x < 16 || x > width - 16 || y < 16 || y > height - 28) return null;
          const active = selected === event.id;
          return <Pressable key={event.id} accessibilityRole="button" accessibilityLabel={'Map pin: ' + event.title}
            onPress={() => setSelected(event.id)} style={[styles.pin, { left: x - 15, top: y - 15, zIndex: active ? 4 : 2,
              backgroundColor: active ? '#fff' : event.kind === 'restaurant' ? '#ffaec9' : palette.accent }]}>
            <Ionicons name={event.kind === 'restaurant' ? 'restaurant' : 'calendar'} size={14} color={palette.background} />
          </Pressable>;
        })}
        <View style={styles.controls}>
          <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" disabled={zoom >= 16} onPress={() => zoomBy(1)} style={styles.control}><Ionicons name="add" color={palette.text} size={19} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" disabled={zoom <= 10} onPress={() => zoomBy(-1)} style={styles.control}><Ionicons name="remove" color={palette.text} size={19} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Reset Montréal map" onPress={() => {
            setCenter(montreal); setZoom(12); setSelected('');
          }} style={styles.control}><Ionicons name="locate-outline" color={palette.text} size={19} /></Pressable>
        </View>
        <View style={styles.attribution}>
          <Text accessibilityRole="link" onPress={() => void Linking.openURL('https://www.openstreetmap.org/copyright').catch(() => {})} style={styles.credit}>© OpenStreetMap</Text>
          <Text accessibilityRole="link" onPress={() => void Linking.openURL('https://carto.com/attributions').catch(() => {})} style={styles.credit}>© CARTO</Text>
        </View>
      </View>
      {failedTiles && <Text style={ui.muted}>The basemap couldn’t load. Select a listing below to view its details.</Text>}
      {focus && <View style={ui.panel}>
        <Text style={ui.label}>{focus.event.kind === 'restaurant' ? 'Restaurant' : 'Event'}</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/event/[id]', params: { id: focus.event.id } })}>
          <Text style={ui.text}>{focus.event.title}  ↗</Text>
        </Pressable>
        <Text style={ui.muted}>{focus.event.address ?? focus.event.neighborhood ?? 'Montréal'}</Text>
      </View>}
      <Text style={ui.heading}>{places.length} plottable {places.length === 1 ? 'location' : 'locations'}</Text>
      {places.length < items.length && <Text style={ui.muted}>{items.length - places.length} listings are missing coordinates.</Text>}
      {!demo && Boolean(error || restaurantError) && <Text style={ui.muted}>{error || restaurantError}</Text>}
      {places.map(({ event, point }) => <Pressable key={event.id} accessibilityRole="button" accessibilityLabel={'Centre map on ' + event.title}
        onPress={() => { setCenter(point); setSelected(event.id); setFailedTiles(false); }}
        style={[ui.row, styles.row]}>
        <Ionicons name={event.kind === 'restaurant' ? 'restaurant-outline' : 'location-outline'} color={palette.accent} size={20} />
        <View style={{ flex: 1 }}><Text style={ui.text}>{event.title}</Text><Text style={ui.muted}>{event.neighborhood ?? 'Montréal'}</Text></View>
        <Ionicons name="locate-outline" color={palette.muted} size={18} />
      </Pressable>)}
    </ScrollView>
  </Screen>;
}

const styles = StyleSheet.create({
  map: { position: 'relative', overflow: 'hidden', backgroundColor: '#222930', borderRadius: 18, marginVertical: 10 },
  pin: { position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: palette.background, justifyContent: 'center', alignItems: 'center' },
  controls: { position: 'absolute', zIndex: 5, right: 8, top: 8, borderRadius: 10, overflow: 'hidden' },
  control: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface, borderBottomWidth: 1, borderColor: palette.border },
  attribution: { flexDirection: 'row', gap: 5, position: 'absolute', zIndex: 5, bottom: 0, right: 0, paddingHorizontal: 5, backgroundColor: palette.background },
  credit: { color: palette.muted, fontSize: 10, paddingVertical: 2 },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderColor: palette.border },
});
