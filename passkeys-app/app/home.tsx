import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function HomeScreen() {
  const { username } = useLocalSearchParams<{ username?: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Olá, {username ?? 'usuário'}!</Text>
      <Text style={styles.subtitle}>Você está autenticado com passkey.</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.replace('/')}>
        <Text style={styles.btnText}>Sair</Text>
      </TouchableOpacity>
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
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    marginBottom: 40,
    textAlign: 'center',
  },
  btn: {
    borderWidth: 1.5,
    borderColor: '#CC0000',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  btnText: {
    color: '#CC0000',
    fontSize: 16,
    fontWeight: '600',
  },
});
