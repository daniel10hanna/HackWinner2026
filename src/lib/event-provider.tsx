import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { configured, loadEvents, loadRestaurants } from './feed';
import { demoRestaurants } from './demo';
import type { Chill } from './chillz';
import type { Account } from './auth';
import { active, type Event } from './events';

const storageKey = 'mtlnow.saved.v1';
const plansKey = 'mtlnow.chillz.v1';
type Plans = { likes: string[]; chillz: Chill[] };
const emptyPlans: Plans = { likes: [], chillz: [] };
function useEventState() {
  const [demo, setDemo] = useState(process.env.EXPO_PUBLIC_DEMO_MODE === 'true' || !configured);
  const [snapshot, setSnapshot] = useState<{ demo: boolean; events: Event[] }>({ demo, events: [] });
  const [restaurants, setRestaurants] = useState<{ demo: boolean; items: Event[] }>({ demo, items: [] });
  const [restaurantError, setRestaurantError] = useState('');
  const [plans, setPlans] = useState(emptyPlans);
  const plansRef = useRef(emptyPlans);
  const [account, setAccount] = useState<Account | null>(null);
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
    if (!account) return;
    const timer = setTimeout(() => setAccount(null), Math.max(0, account.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [account]);

  useEffect(() => {
    Promise.allSettled([
      AsyncStorage.getItem(storageKey).then(raw => {
        const state = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(state)) throw new Error('Invalid favourites');
        savedRef.current = state;
        setSaved(state);
      }),
      AsyncStorage.getItem(plansKey).then(raw => {
        const state = raw ? JSON.parse(raw) : emptyPlans;
        if (!Array.isArray(state.likes) || !Array.isArray(state.chillz)) throw new Error('Invalid plans');
        plansRef.current = state;
        setPlans(state);
      }),
    ]).then(results => {
      if (results.some(result => result.status === 'rejected')) setSaveError('Some saved activity could not be read.');
      setReady(true);
    });
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

  useEffect(() => {
    const controller = new AbortController();
    const request = demo ? Promise.resolve(demoRestaurants(new Date())) : loadRestaurants(controller.signal);
    request.then(items => {
      if (!controller.signal.aborted) setRestaurants({ demo, items });
    }).catch(() => {
      if (!controller.signal.aborted) setRestaurantError('The restaurant catalog could not be loaded.');
    });
    return () => controller.abort();
  }, [demo, version]);

  function refresh() {
    setNow(new Date());
    setError('');
    setRestaurantError('');
    setLoading(true);
    setVersion(value => value + 1);
  }

  function persist(key: string, value: unknown) {
    saving.current = saving.current.then(async () => {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
        setSaveError('');
      } catch {
        setSaveError('Changes could not be saved to this device.');
      }
    });
  }

  function toggle(event: Event, forceSave = false) {
    if (!ready) return;
    const exists = savedRef.current.some(item => item.id === event.id);
    if (exists && forceSave) return;
    const next = exists ? savedRef.current.filter(item => item.id !== event.id) : [...savedRef.current, event];
    savedRef.current = next;
    setSaved(next);
    persist(storageKey, next);
  }

  function updatePlans(change: (state: Plans) => Plans) {
    if (!ready) return;
    const next = change(plansRef.current);
    plansRef.current = next;
    setPlans(next);
    persist(plansKey, next);
  }

  function like(id: string, forceLike = false) {
    updatePlans(state => ({
      ...state,
      likes: state.likes.includes(id) ? forceLike ? state.likes : state.likes.filter(item => item !== id) : [...state.likes, id],
    }));
  }

  function createChill(name: string) {
    const id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    updatePlans(state => ({ ...state, chillz: [{ id, name, stops: [] }, ...state.chillz] }));
    return id;
  }

  function editChill(id: string, change: (chill: Chill) => Chill) {
    updatePlans(state => ({ ...state, chillz: state.chillz.map(chill => chill.id === id ? change(chill) : chill) }));
  }

  function removeChill(id: string) {
    updatePlans(state => ({ ...state, chillz: state.chillz.filter(chill => chill.id !== id) }));
  }

  const events = snapshot.demo === demo ? snapshot.events : [];
  const dining = restaurants.demo === demo ? restaurants.items : [];
  return {
    events, dining, restaurantError, ...plans, like, createChill, editChill, removeChill, account, setAccount, upcoming: events.filter(event => active(event, now)), saved, ready, saveError, now, demo,
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
