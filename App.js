import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { styled } from 'nativewind';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-900">
      <Text className="text-white text-3xl font-bold">
        HELLO
      </Text>
      <Text className="text-gray-400 text-lg mt-2">
        NativeWind Setup Success!
      </Text>
      <StatusBar style="light" />
    </View>
  );
}