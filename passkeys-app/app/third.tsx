import React from 'react';
import { Button, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Link } from 'expo-router';

export default function ThirdScreen() {
  return (
    <View className="items-center flex-1 justify-center p-4">
      <ThemedText type="title">Third</ThemedText>
      <Link href="/" asChild>
        <Button title="Voltar" />
      </Link>
    </View>
  );
}
