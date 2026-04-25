import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Passkey } from 'react-native-passkey';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthentication,
  verifyRegistration,
} from '@/services/api';

const T = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  border: '#CBD5E1',
  primary: '#2563EB',
  primaryPressed: '#1D4ED8',
  success: '#16A34A',
  error: '#DC2626',
  infoSurface: '#EFF6FF',
  errorSurface: '#FEF2F2',
} as const;

type Flow = 'register' | 'login';

type PasskeyErrorShape = { error: string; message: string };

function isPasskeyError(err: unknown): err is PasskeyErrorShape {
  return typeof err === 'object' && err !== null && 'error' in err;
}

function mapPasskeyError(err: unknown, flow: Flow): string {
  if (isPasskeyError(err)) {
    if (err.error === 'UserCancelled') {
      return 'Passkey confirmation was cancelled.';
    }
    if (err.error === 'NoCredentials') {
      return flow === 'login'
        ? 'No passkey found for this username. Create one first.'
        : 'No viable credential is available. Try again or check device setup.';
    }
    if (err.error === 'RequestFailed' && flow === 'login') {
      return 'No passkey found for this username. Create one first.';
    }
    if (err.error === 'BadConfiguration') {
      return 'App or server setup may be wrong. Check Digital Asset Links, HTTPS, and adb reverse.';
    }
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Something went wrong.';
}

function mapHttpError(err: unknown, flow: Flow): string {
  if (!(err instanceof Error)) {
    return 'Something went wrong.';
  }
  const m = err.message;
  if (m === 'Network failure' || m.includes('Network request failed') || m.includes('Failed to connect')) {
    return 'Could not reach the secure local server. Check HTTPS, mkcert CA on the device, and adb reverse.';
  }
  if (flow === 'login' && m.startsWith('HTTP 404') && m.includes('User not found')) {
    return 'No passkey found for this username. Create one first.';
  }
  if (/^HTTP [45]/.test(m)) {
    return m;
  }
  return m;
}

/** Space below the last card content when the keyboard is open (px above the IME / scroll end). */
const KEYBOARD_TRAILING = 40;

/** Nudge scroll when the keyboard opens (px), relative to the current offset. */
const KEYBOARD_OPEN_SCROLL_NUDGE = 50;

export default function IndexScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardH, setKeyboardH] = useState(0);
  const [username, setUsername] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'info' | 'error' | 'success' | 'loading'>('info');

  const setEmptyUsername = () => {
    setMessage('Enter a username to continue.');
    setTone('error');
  };

  useEffect(() => {
    const nameShow = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const nameHide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(nameShow, (e) => {
      setKeyboardH(e.endCoordinates?.height ?? 0);
      const y = scrollY.current + KEYBOARD_OPEN_SCROLL_NUDGE;
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollRef.current?.scrollTo({ y, animated: true });
        }, 100);
      });
    });
    const hide = Keyboard.addListener(nameHide, () => {
      setKeyboardH(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const onScroll = (ev: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = ev.nativeEvent.contentOffset.y;
  };

  const runRegister = async () => {
    if (!username.trim()) {
      setEmptyUsername();
      return;
    }
    setLoading(true);
    setMessage('Contacting server…');
    setTone('loading');
    try {
      const options = await generateRegistrationOptions(username.trim());
      setMessage('Android will ask you to confirm with fingerprint, face, or screen lock.');
      setTone('info');
      const passkeyResponse = await Passkey.create(
        options as Parameters<typeof Passkey.create>[0]
      );
      setMessage('Verifying with server…');
      setTone('loading');
      const verifyResult = (await verifyRegistration(
        username.trim(),
        passkeyResponse
      )) as { verified?: boolean };
      setTone('success');
      setMessage('Passkey verified by server.');
      router.replace({
        pathname: '/home',
        params: {
          username: username.trim(),
          verified: String(verifyResult.verified === true),
          authMethod: 'passkey',
          responseType: 'JSON',
        },
      });
    } catch (err: unknown) {
      setTone('error');
      if (isPasskeyError(err) || (err instanceof Error && !err.message.startsWith('HTTP'))) {
        setMessage(mapPasskeyError(err, 'register'));
      } else {
        setMessage(mapHttpError(err, 'register'));
      }
    } finally {
      setLoading(false);
    }
  };

  const runLogin = async () => {
    if (!username.trim()) {
      setEmptyUsername();
      return;
    }
    setLoading(true);
    setMessage('Contacting server…');
    setTone('loading');
    try {
      const options = await generateAuthenticationOptions(username.trim());
      setMessage('Android will ask you to confirm with fingerprint, face, or screen lock.');
      setTone('info');
      const passkeyResponse = await Passkey.get(
        options as Parameters<typeof Passkey.get>[0]
      );
      setMessage('Verifying with server…');
      setTone('loading');
      const verifyResult = (await verifyAuthentication(
        username.trim(),
        passkeyResponse
      )) as { verified?: boolean };
      setTone('success');
      setMessage('Passkey verified by server.');
      router.replace({
        pathname: '/home',
        params: {
          username: username.trim(),
          verified: String(verifyResult.verified === true),
          authMethod: 'passkey',
          responseType: 'JSON',
        },
      });
    } catch (err: unknown) {
      setTone('error');
      if (isPasskeyError(err) || (err instanceof Error && !err.message.startsWith('HTTP'))) {
        setMessage(mapPasskeyError(err, 'login'));
      } else {
        setMessage(mapHttpError(err, 'login'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Android: IME may overlay; cap ScrollView height so “scroll end” matches the top of the keyboard
  // when needed. If the window already shrank (adjustResize), rawScrollMax is small—skip the cap
  // and rely on small trailing padding only.
  const rawScrollMax =
    keyboardH > 0 ? windowHeight - keyboardH - insets.top - 4 : 0;
  const useAndroidMaxH = Platform.OS === 'android' && rawScrollMax >= 180;
  const paddingBottom =
    24 + insets.bottom + (keyboardH > 0 ? KEYBOARD_TRAILING : 32);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        enabled={Platform.OS === 'ios'}
        behavior="padding"
        keyboardVerticalOffset={8}
      >
        <ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={
            useAndroidMaxH ? { maxHeight: rawScrollMax, flex: 1 } : styles.flex
          }
          contentContainerStyle={[styles.scroll, { paddingBottom }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <MaterialIcons name="fingerprint" size={32} color={T.primary} />
              </View>
              <Text style={styles.heroTitle} accessibilityRole="header">
                Sign in with a passkey
              </Text>
              <Text style={styles.heroBody}>
                Use your device to sign in without a password. Create a passkey first, or sign in
                if you already have one for this app.
              </Text>
            </View>

            <Text style={styles.label} nativeID="usernameLabel">
              Username
            </Text>
            <TextInput
              style={[styles.input, inputFocused && styles.inputFocused]}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="e.g. demo"
              placeholderTextColor={T.textSecondary}
              accessibilityLabel="Username"
              accessibilityLabelledBy="usernameLabel"
            />

            <View style={styles.btnCol}>
              <Pressable
                onPress={runRegister}
                disabled={loading}
                style={({ pressed }) => [
                  styles.btnPrimary,
                  loading && styles.btnDisabled,
                  pressed && !loading && { backgroundColor: T.primaryPressed },
                ]}
                accessibilityLabel="Create passkey"
                accessibilityState={{ disabled: loading }}
              >
                <Text style={styles.btnPrimaryText}>Create passkey</Text>
              </Pressable>
              <Pressable
                onPress={runLogin}
                disabled={loading}
                style={({ pressed }) => [
                  styles.btnSecondary,
                  loading && styles.btnDisabled,
                  pressed && !loading && styles.btnSecondaryPressed,
                ]}
                accessibilityLabel="Sign in with passkey"
                accessibilityState={{ disabled: loading }}
              >
                <Text style={styles.btnSecondaryText}>Sign in with passkey</Text>
              </Pressable>
            </View>

            {(message || loading) && (
              <View
                style={[
                  styles.statusBox,
                  tone === 'error' && styles.statusError,
                  (tone === 'info' || tone === 'success' || tone === 'loading') && styles.statusInfo,
                ]}
                accessibilityLiveRegion="polite"
              >
                {tone === 'loading' && (
                  <ActivityIndicator
                    size="small"
                    color={T.primary}
                    style={styles.statusSpinner}
                  />
                )}
                {message ? (
                  <Text
                    style={[
                      styles.statusText,
                      tone === 'error' && { color: T.error },
                      tone === 'success' && { color: T.success },
                    ]}
                  >
                    {message}
                  </Text>
                ) : null}
                {tone === 'loading' && !message ? (
                  <Text style={styles.statusText}>Working…</Text>
                ) : null}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: T.bg,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 32,
    justifyContent: 'flex-start',
  },
  card: {
    backgroundColor: T.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    padding: 20,
  },
  hero: {
    marginBottom: 24,
    alignItems: 'center',
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: T.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: T.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroBody: {
    fontSize: 15,
    color: T.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: T.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: T.text,
    minHeight: 48,
  },
  inputFocused: {
    borderColor: T.primary,
  },
  btnCol: {
    marginTop: 20,
    gap: 10,
  },
  btnPrimary: {
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: T.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  btnSecondary: {
    minHeight: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: T.primary,
    backgroundColor: T.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: T.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  btnSecondaryPressed: {
    backgroundColor: T.infoSurface,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  statusBox: {
    marginTop: 20,
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfo: {
    backgroundColor: T.infoSurface,
  },
  statusError: {
    backgroundColor: T.errorSurface,
  },
  statusSpinner: {
    marginRight: 10,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: T.textSecondary,
  },
});
