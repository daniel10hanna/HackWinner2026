import { Ionicons } from '@expo/vector-icons';
import { router, useIsFocused } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, ui } from './event-ui';

export function Screen({ children }: PropsWithChildren) {
  const focused = useIsFocused();
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}
    aria-hidden={!focused} importantForAccessibility={focused ? 'auto' : 'no-hide-descendants'}>{children}</SafeAreaView>;
}

export function AppHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  return <View style={styles.header}>
    <View style={styles.top}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open feed" onPress={() => router.navigate('/')} style={styles.brand}>
        <View style={styles.mark}><Ionicons name="flash" size={18} color={palette.background} /></View>
        <Text style={styles.logo}>MTL<Text style={{ color: palette.accent }}> NOW</Text></Text>
      </Pressable>
      {title && <Pressable accessibilityRole="button" accessibilityLabel="Back to feed" onPress={() => router.navigate('/')} style={styles.feed}>
        <Ionicons name="grid-outline" color={palette.accent} size={16} /><Text style={styles.feedText}>Feed</Text>
      </Pressable>}
      {!title && <Text style={styles.city}><Ionicons name="location-outline" size={14} color={palette.accent} /> Montréal, QC</Text>}
    </View>
    {title && <><Text style={ui.title} accessibilityRole="header">{title}</Text>{subtitle && <Text style={ui.muted}>{subtitle}</Text>}</>}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  header: { gap: 5, marginBottom: 14 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46, marginBottom: 9 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  mark: { width: 30, height: 30, backgroundColor: palette.accent, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 19, fontWeight: '900', letterSpacing: -0.6, color: palette.text },
  city: { color: palette.muted, fontWeight: '700', fontSize: 12 },
  feed: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, minHeight: 44, backgroundColor: palette.surface, borderRadius: 12 },
  feedText: { color: palette.text, fontWeight: '700', fontSize: 13 },
});
