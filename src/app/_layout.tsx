import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { EventProvider } from '@/lib/event-provider';
import { palette } from '@/components/event-ui';

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <EventProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="event/[id]" />
        </Stack>
      </EventProvider>
    </ThemeProvider>
  );
}
