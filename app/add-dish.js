import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Icons

export default function AddDishScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  // 1. Pick Image Logic
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Compress to save data
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  // 2. Upload Logic
  const handleSubmit = async () => {
    if (!name || !price || !image) {
      Alert.alert('Missing Fields', 'Please add a name, price, and image.');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // A. Upload Image to Storage
      const fileExt = image.uri.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const formData = new FormData();
      formData.append('file', {
        uri: image.uri,
        name: fileName,
        type: `image/${fileExt}`
      });

      const { error: uploadError } = await supabase.storage
        .from('dish-images')
        .upload(filePath, formData);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('dish-images')
        .getPublicUrl(filePath);

      // B. Insert Data into DB
      const { error: dbError } = await supabase
        .from('menu_items')
        .insert([
          {
            chef_id: user.id,
            name: name,
            price: parseFloat(price),
            description: desc,
            image_url: publicUrl
          }
        ]);

      if (dbError) throw dbError;

      Alert.alert('Success', 'Dish added to your menu!');
      router.back();

    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-cream p-6">
      <Text className="text-3xl font-bold text-obsidian mb-6">Add New Dish</Text>

      {/* Image Picker */}
      <TouchableOpacity 
        onPress={pickImage}
        className="h-48 bg-white border-2 border-dashed border-gray-300 rounded-xl items-center justify-center mb-6 overflow-hidden"
      >
        {image ? (
          <Image source={{ uri: image.uri }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="items-center">
            <Ionicons name="camera" size={40} color="#9CA3AF" />
            <Text className="text-gray-400 mt-2">Tap to upload photo</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Inputs */}
      <View className="space-y-4">
        <View>
          <Text className="text-obsidian font-medium mb-1">Dish Name</Text>
          <TextInput 
            className="bg-white p-4 rounded-xl border border-gray-200"
            placeholder="e.g. Paneer Butter Masala"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View>
          <Text className="text-obsidian font-medium mb-1">Price (₹)</Text>
          <TextInput 
            className="bg-white p-4 rounded-xl border border-gray-200"
            placeholder="150"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
        </View>

        <View>
          <Text className="text-obsidian font-medium mb-1">Description</Text>
          <TextInput 
            className="bg-white p-4 rounded-xl border border-gray-200 h-24"
            placeholder="Spicy, creamy, homemade..."
            multiline
            value={desc}
            onChangeText={setDesc}
          />
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity 
        onPress={handleSubmit}
        disabled={uploading}
        className={`mt-8 p-4 rounded-xl items-center ${uploading ? 'bg-gray-400' : 'bg-obsidian'}`}
      >
        {uploading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-cream font-bold text-lg">Add to Menu</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}