import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/components/event-ui';

const tabs = [
  ['chillz', 'Chillz', 'layers-outline'],
  ['explore', 'Search', 'search-outline'],
  ['profile', 'Profile', 'person-circle-outline'],
  ['map', 'Map', 'map-outline'],
  ['saved', 'Favourites', 'bookmark-outline'],
] as const satisfies readonly (readonly [string, string, ComponentProps<typeof Ionicons>['name']])[];

export default function TabsLayout() {
  const { bottom } = useSafeAreaInsets();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.border, height: 58 + bottom, paddingBottom: bottom + 4 },
      tabBarActiveTintColor: palette.accent,
      tabBarInactiveTintColor: palette.muted,
      tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
      sceneStyle: { backgroundColor: palette.background },
    }}>
      <Tabs.Screen name="index" options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
      {tabs.map(([name, title, icon]) => <Tabs.Screen key={name} name={name} options={{
        title, tabBarIcon: ({ color, size }) => <Ionicons name={icon} color={typeof color === 'string' ? color : palette.muted} size={size} />,
      }} />)}
    </Tabs>
  );
}
