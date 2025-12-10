import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-black p-8 justify-center">
      <Text className="text-orange-500 text-4xl font-bold mb-2">Login</Text>
      <Text className="text-gray-400 text-lg mb-10">Welcome back to TiffinTales</Text>

      {/* Input Field 1 */}
      <View className="mb-4">
        <Text className="text-gray-400 mb-2">Phone Number</Text>
        <TextInput 
          className="bg-gray-800 text-white p-4 rounded-lg"
          placeholder="9876543210" 
          placeholderTextColor="#666"
          keyboardType="phone-pad"
        />
      </View>

      {/* Input Field 2 */}
      <View className="mb-8">
        <Text className="text-gray-400 mb-2">Password</Text>
        <TextInput 
          className="bg-gray-800 text-white p-4 rounded-lg"
          placeholder="••••••" 
          placeholderTextColor="#666"
          secureTextEntry
        />
      </View>

      {/* Login Button */}
      <TouchableOpacity 
        onPress={() => router.replace('/(tabs)')} // <--- Navigate to Main App
        className="bg-orange-500 p-4 rounded-lg items-center"
      >
        <Text className="text-white font-bold text-lg">Sign In</Text>
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity 
        onPress={() => router.back()} // <--- Navigate Back
        className="mt-6 items-center"
      >
        <Text className="text-gray-500">Go Back Home</Text>
      </TouchableOpacity>
    </View>
  );
}