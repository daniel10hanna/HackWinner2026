import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { palette } from '@/components/event-ui';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.border },
      tabBarActiveTintColor: palette.accent,
      tabBarInactiveTintColor: palette.muted,
      sceneStyle: { backgroundColor: palette.background },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Discover', tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" color={typeof color === 'string' ? color : palette.muted} size={size} /> }} />
      <Tabs.Screen name="explore" options={{ title: 'Smart picks', tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={typeof color === 'string' ? color : palette.muted} size={size} /> }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarIcon: ({ color, size }) => <Ionicons name="bookmark-outline" color={typeof color === 'string' ? color : palette.muted} size={size} /> }} />
    </Tabs>
  );
}


