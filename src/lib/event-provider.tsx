import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { configured, loadEvents } from './feed';
import { active, type Event } from './events';

const storageKey = 'mtlnow.saved.v1';
function useEventState() {
  const [demo, setDemo] = useState(process.env.EXPO_PUBLIC_DEMO_MODE === 'true');
  const [snapshot, setSnapshot] = useState<{ demo: boolean; events: Event[] }>({ demo, events: [] });
  const [saved, setSaved] = useState<Event[]>([]);
  const savedRef = useRef<Event[]>([]);
  const saving = useRef(Promise.resolve());
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then(raw => {
      if (!raw) return;
      savedRef.current = JSON.parse(raw);
      setSaved(savedRef.current);
    }).catch(() => setSaveError('Saved events could not be read.'))
      .finally(() => setReady(true));
    const tick = () => setNow(new Date());
    const timer = setInterval(tick, 15_000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') tick(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadEvents(demo, controller.signal).then(events => {
      if (!controller.signal.aborted) setSnapshot({ demo, events });
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'The feed could not be loaded.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [demo, version]);

  function refresh() {
    setNow(new Date());
    setError('');
    setLoading(true);
    setVersion(value => value + 1);
  }

  function toggle(event: Event) {
    if (!ready) return;
    const next = savedRef.current.some(item => item.id === event.id)
      ? savedRef.current.filter(item => item.id !== event.id) : [...savedRef.current, event];
    savedRef.current = next;
    setSaved(next);
    saving.current = saving.current.then(async () => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(next));
        setSaveError('');
      } catch {
        setSaveError('Changes could not be saved to this device.');
      }
    });
  }

  const events = snapshot.demo === demo ? snapshot.events : [];
  return {
    events, upcoming: events.filter(event => active(event, now)), saved, ready, saveError, now, demo,
    canSwitch: demo ? configured : true, switchMode: () => { setDemo(value => !value); refresh(); },
    loading, error, refresh, toggle,
  };
}
const EventContext = createContext<ReturnType<typeof useEventState> | null>(null);
export function EventProvider({ children }: PropsWithChildren) {
  const value = useEventState();
  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}
export function useEvents() {
  const value = useContext(EventContext);
  if (!value) throw new Error('EventProvider is missing');
  return value;
}
