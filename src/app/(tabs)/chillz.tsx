import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader, Screen } from '@/components/app-shell';
import { Action, Chip, Chips, palette, ui } from '@/components/event-ui';
import { coordinates, drivingRoute, durationLabel, formatCAD, matchesSearch, outingTotals, stopMinutes } from '@/lib/chillz';
import { useEvents } from '@/lib/event-provider';
import { eventDate, price } from '@/lib/events';

type RouteResult = { km: number; minutes: number };
type RouteStatus = { key: string; result: RouteResult | null; loading: boolean };

export default function Chillz() {
  const { chillz, upcoming, dining, saved, ready, createChill, editChill, removeChill, saveError } = useEvents();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [filter, setFilter] = useState('All listings');
  const [route, setRoute] = useState<RouteStatus>();
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  const chill = chillz.find(item => item.id === selected);
  const stops = chill?.stops ?? [];
  const key = JSON.stringify([selected, stops.map(stop => [stop.id, coordinates(stop)])]);
  const routeStatus = route?.key === key ? route : undefined;
  const drive = stops.length < 2 ? { km: 0, minutes: 0 } : routeStatus?.result;
  const totals = outingTotals(stops);
  const catalog = [...new Map([...saved, ...upcoming, ...dining].map(item => [item.id, item])).values()];
  const options = catalog.filter(item => !stops.some(stop => stop.id === item.id) &&
    (filter !== 'Favourites' || saved.some(save => save.id === item.id)) && matchesSearch(item, query));

  function selectChill(id: string) {
    request.current?.abort();
    setSelected(id);
    setRoute(undefined);
    setShowPicker(false);
    setConfirm(false);
    setQuery('');
    setFilter('All listings');
  }

  function create() {
    if (!ready || !name.trim()) return;
    selectChill(createChill(name.trim()));
    setName('');
    setShowPicker(true);
  }

  function changeStops(next: typeof stops) {
    request.current?.abort();
    setRoute(undefined);
    editChill(selected, item => ({ ...item, stops: next }));
  }

  function move(index: number, by: number) {
    const next = [...stops];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    changeStops(next);
  }

  async function calculateRoute() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setRoute({ key, result: null, loading: true });
    const timeout = setTimeout(() => controller.abort(), 12_000);
    let result: RouteResult | null = null;
    try { result = await drivingRoute(stops, controller.signal); } catch { /* Show unavailable. */ }
    finally { clearTimeout(timeout); }
    if (request.current === controller) setRoute({ key, result, loading: false });
  }

  const time = totals.minutes + (drive?.minutes ?? 0);
  const fullTime = totals.unknownTimes === 0 && drive != null;
  return <Screen>
    <ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
      <AppHeader title="Chillz" subtitle="Build an outing with events and places to eat." />
      {saveError ? <Text style={ui.muted} accessibilityRole="alert">{saveError}</Text> : null}
      <View style={[ui.panel, ui.row]}>
        <TextInput accessibilityLabel="Outing name" value={name} onChangeText={setName} placeholder="Name your outing"
          placeholderTextColor={palette.muted} maxLength={64} returnKeyType="done" onSubmitEditing={create} style={styles.input} />
        <Pressable accessibilityRole="button" disabled={!ready || !name.trim()} onPress={create} style={[ui.button, (!ready || !name.trim()) && { opacity: 0.6 }]}>
          <Text style={ui.buttonText}>New Chill</Text>
        </Pressable>
      </View>
      {chillz.length > 0 && <Chips>{chillz.map(item => <Chip key={item.id} label={item.name} selected={item.id === selected} onPress={() => selectChill(item.id)} />)}</Chips>}
      {!chill && <View style={ui.panel}><Text style={ui.muted}>{chillz.length ? 'Select a Chill to see its stops and totals.' : 'Create your first Chill to start planning.'}</Text></View>}
      {chill && <>
        <Text style={ui.heading}>{chill.name}</Text>
        <View style={[ui.panel, styles.metrics]}>
          <View style={styles.metric}><Text style={ui.label}>Cost / person</Text><Text style={styles.metricValue}>{totals.unknownPrices ? '≥ ' : ''}{formatCAD(totals.amount)}</Text></View>
          <View style={styles.metric}><Text style={ui.label}>{fullTime ? 'Total time' : 'Known time'}</Text><Text style={styles.metricValue}>{durationLabel(time)}</Text></View>
          <View style={styles.metric}><Text style={ui.label}>Driving</Text><Text style={styles.metricValue}>{drive ? drive.km.toFixed(1) + ' km' : '—'}</Text></View>
        </View>
        {totals.unknownPrices > 0 && <Text style={ui.muted}>{totals.unknownPrices} {totals.unknownPrices === 1 ? 'stop has' : 'stops have'} no known CAD price.</Text>}
        {totals.unknownTimes > 0 && <Text style={ui.muted}>{totals.unknownTimes} {totals.unknownTimes === 1 ? 'stop has' : 'stops have'} no known duration.</Text>}
        {stops.some(stop => stop.kind === 'restaurant') && <Text style={ui.muted}>Restaurant prices and visit times are estimates.</Text>}
        {stops.length > 1 && <View style={{ gap: 5, marginVertical: 8 }}>
          {drive ? <Text style={ui.muted}>Includes {durationLabel(drive.minutes)} of estimated driving between stops. Waiting time is excluded.</Text>
            : stops.some(stop => !coordinates(stop)) ? <Text style={ui.muted}>Driving needs coordinates for every stop.</Text>
            : <Action label={routeStatus?.loading ? 'Restart driving estimate' : 'Estimate driving time and distance'} onPress={() => void calculateRoute()} />}
          {routeStatus?.loading && <Text style={ui.muted}>Calculating route…</Text>}
          {routeStatus && !routeStatus.loading && !drive && <Text style={ui.muted}>Driving route unavailable. Try again later.</Text>}
        </View>}
        {stops.map((stop, index) => {
          const minutes = stopMinutes(stop);
          return <View style={ui.panel} key={stop.id}>
            <Text style={ui.label}>Stop {index + 1} · {stop.kind === 'restaurant' ? 'Restaurant' : stop.category}</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/event/[id]', params: { id: stop.id } })}><Text style={styles.stopTitle}>{stop.title}</Text></Pressable>
            {stop.description && <Text style={ui.muted}>{stop.description}</Text>}
            <Text style={ui.muted}>{[stop.venue, stop.address ?? stop.neighborhood].filter(Boolean).join(' · ')}</Text>
            {stop.kind !== 'restaurant' && <Text style={ui.muted}>{eventDate(stop.start_time)}{stop.end_time ? ' – ' + eventDate(stop.end_time) : ''}</Text>}
            <Text style={ui.text}>{price(stop)} · {minutes == null ? 'Duration unknown' : durationLabel(minutes)}</Text>
            <View style={ui.row}>
              {index > 0 && <Control label={'Move ' + stop.title + ' earlier'} icon="arrow-up" onPress={() => move(index, -1)} />}
              {index < stops.length - 1 && <Control label={'Move ' + stop.title + ' later'} icon="arrow-down" onPress={() => move(index, 1)} />}
              <Control label={'Remove ' + stop.title} icon="close" onPress={() => changeStops(stops.filter(item => item.id !== stop.id))} />
            </View>
          </View>;
        })}
        <View style={{ marginVertical: 12 }}><Action label={showPicker ? 'Done adding stops' : 'Add events or restaurants'} onPress={() => setShowPicker(value => !value)} /></View>
        {showPicker && <View style={ui.panel}>
          <Text style={ui.label}>Choose stops</Text>
          <TextInput accessibilityLabel="Find a stop" value={query} onChangeText={setQuery} placeholder="Find a stop"
            placeholderTextColor={palette.muted} style={[styles.input, { flex: 0 }]} />
          <Chips>{['All listings', 'Favourites'].map(value => <Chip key={value} label={value} selected={filter === value} onPress={() => setFilter(value)} />)}</Chips>
          {!options.length && <Text style={ui.muted}>No more matching stops.</Text>}
          {options.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={'Add ' + item.title}
            onPress={() => changeStops([...stops, item])} style={[ui.row, styles.option]}>
            <View style={{ flex: 1 }}><Text style={ui.text}>{item.title}</Text><Text style={ui.muted}>{item.kind === 'restaurant' ? 'Restaurant' : item.category} · {price(item)}</Text></View>
            <Ionicons name="add-circle-outline" size={22} color={palette.accent} />
          </Pressable>)}
        </View>}
        {confirm ? <View style={[ui.panel, { gap: 12 }]}>
          <Text style={ui.text}>Delete {chill.name} and all its stops?</Text>
          <Action label="Delete this Chill" onPress={() => { removeChill(chill.id); selectChill(''); }} />
          <Action label="Cancel" onPress={() => setConfirm(false)} />
        </View> : <Pressable accessibilityRole="button" onPress={() => setConfirm(true)} style={{ paddingVertical: 12 }}>
          <Text style={{ color: '#ffacd0', fontWeight: '700' }}>Delete Chill</Text>
        </Pressable>}
      </>}
    </ScrollView>
  </Screen>;
}

function Control({ label, icon, onPress }: { label: string; icon: 'arrow-up' | 'arrow-down' | 'close'; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.control}>
    <Ionicons name={icon} size={20} color={palette.accent} />
  </Pressable>;
}

const styles = StyleSheet.create({
  input: { flex: 1, minHeight: 46, color: palette.text, fontSize: 16, paddingHorizontal: 4 },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  metric: { flex: 1, gap: 5 },
  metricValue: { color: palette.text, fontSize: 19, fontWeight: '800' },
  stopTitle: { color: palette.text, fontSize: 19, fontWeight: '800' },
  control: { width: 44, height: 44, borderWidth: 1, borderColor: palette.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  option: { minHeight: 53, paddingVertical: 6, borderTopWidth: 1, borderColor: palette.border },
});
