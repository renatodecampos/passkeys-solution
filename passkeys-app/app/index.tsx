import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Passkey } from 'react-native-passkey';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthentication,
  verifyRegistration,
} from '@/services/api';

type Status = 'idle' | 'loading' | 'error' | 'success';

export default function IndexScreen() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const handleRegister = async () => {
    if (!username.trim()) {
      Alert.alert('Atenção', 'Informe um nome de usuário.');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const options = await generateRegistrationOptions(username.trim());
      const passkeyResponse = await Passkey.create(options as Parameters<typeof Passkey.create>[0]);
      await verifyRegistration(username.trim(), passkeyResponse);
      setStatus('success');
      setMessage('Registro concluído!');
      router.replace({ pathname: '/home', params: { username: username.trim() } });
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Erro ao registrar.');
    }
  };

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Atenção', 'Informe um nome de usuário.');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const options = await generateAuthenticationOptions(username.trim());
      const passkeyResponse = await Passkey.get(options as Parameters<typeof Passkey.get>[0]);
      await verifyAuthentication(username.trim(), passkeyResponse);
      setStatus('success');
      setMessage('Login realizado!');
      router.replace({ pathname: '/home', params: { username: username.trim() } });
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Erro ao autenticar.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Passkeys Demo</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome de usuário"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        editable={status !== 'loading'}
      />

      {status === 'loading' ? (
        <ActivityIndicator size="large" color="#0066CC" style={styles.spinner} />
      ) : (
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.btn} onPress={handleRegister}>
            <Text style={styles.btnText}>Registrar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={handleLogin}>
            <Text style={[styles.btnText, styles.btnTextSecondary]}>Entrar</Text>
          </TouchableOpacity>
        </View>
      )}

      {message ? (
        <Text style={[styles.message, status === 'error' ? styles.error : styles.success]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 32,
    color: '#111',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
    marginBottom: 20,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  btn: {
    backgroundColor: '#0066CC',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#0066CC',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnTextSecondary: {
    color: '#0066CC',
  },
  spinner: {
    marginVertical: 20,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  error: {
    color: '#CC0000',
  },
  success: {
    color: '#007700',
  },
});
