import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const T = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  border: '#CBD5E1',
  error: '#C62828',
  success: '#16A34A',
} as const;

export default function HomeScreen() {
  const { username, verified, authMethod, responseType, biometryBinding } = useLocalSearchParams<{
    username?: string;
    verified?: string;
    authMethod?: string;
    responseType?: string;
    biometryBinding?: string;
  }>();

  const v = verified === 'true' ? 'true' : (verified ?? '—');
  const method = authMethod ?? 'passkey';
  const rtype = responseType ?? 'JSON';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        accessibilityLabel="Home content"
      >
        <Text style={styles.title} accessibilityRole="header">
          Signed in
        </Text>
        <Text style={styles.name} accessibilityRole="text">
          {username ?? '—'}
        </Text>

        <View style={styles.card} accessibilityLabel="Server verification proof">
          <View style={styles.cardHeader}>
            <MaterialIcons name="verified-user" size={24} color={T.success} />
            <Text style={styles.cardTitle}>Server verification</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.k}>verified</Text>
            <Text style={styles.v} accessibilityLabel={`verified ${v}`}>
              {v}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.k}>method</Text>
            <Text style={styles.v}>{method}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.k}>response type</Text>
            <Text style={styles.v}>{rtype}</Text>
          </View>
          {biometryBinding ? (
            <View style={styles.row}>
              <Text style={styles.k}>binding (PoC)</Text>
              <Text
                style={[
                  styles.v,
                  biometryBinding === 'ok' && { color: T.success },
                  biometryBinding === 'lost' && { color: T.error },
                ]}
              >
                {biometryBinding === 'ok'
                  ? 'ok — keystore intact'
                  : biometryBinding === 'not_present'
                  ? 'not present'
                  : biometryBinding}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.hint}>
          This screen shows the proof state after the server verified your passkey (JSON). Log out
          returns to the sign-in screen without removing your passkey.
        </Text>

        <Pressable
          onPress={() => router.replace('/')}
          style={({ pressed }) => [styles.logout, pressed && { opacity: 0.9 }]}
          accessibilityLabel="Log out and return to sign in"
        >
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: T.bg,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: T.textSecondary,
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: T.text,
    marginBottom: 24,
  },
  card: {
    backgroundColor: T.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: T.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  k: {
    fontSize: 14,
    color: T.textSecondary,
  },
  v: {
    fontSize: 15,
    fontWeight: '600',
    color: T.text,
  },
  hint: {
    fontSize: 14,
    color: T.textSecondary,
    lineHeight: 20,
    marginTop: 20,
    marginBottom: 24,
  },
  logout: {
    minHeight: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: T.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: T.error,
    fontSize: 16,
    fontWeight: '600',
  },
});
