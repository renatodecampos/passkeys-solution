import React from 'react';
import { Button, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Link } from 'expo-router';

export default function SecondScreen() {
    return (
        <View className='justify-center items-center flex-1 p-4'>
            <ThemedText type='title'>Second</ThemedText>
            <Link href="/" push asChild>
                <Button title='Go to second' />
            </Link>
        </View>
    );
}
