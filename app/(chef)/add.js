import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  Animated,
  Switch,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Third-party Imports
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Local Imports
import { supabase } from '../../lib/supabase';

const COLORS = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  obsidian: '#0F172A',
  primary: '#7E22CE',
  gray: '#94A3B8',
  grayDark: '#475569',
  border: '#E2E8F0',
  error: '#EF4444',
  success: '#10B981',
  aiPrimary: '#8B5CF6',
};

const decodeBase64 = (base64) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export default function AddDishScreen() {
  const router = useRouter();

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [isVeg, setIsVeg] = useState(true);

  // UI State
  const [uploading, setUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({ name: '', price: '', image: '' });

  const glowAnim = useRef(new Animated.Value(0)).current;

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.4,
        base64: true,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
        setErrors((prev) => ({ ...prev, image: '' }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleAIGenerate = () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Enter a dish name first! 👨‍🍳");
      return;
    }
    Keyboard.dismiss();
    setIsGenerating(true);

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1000, useNativeDriver: false })
      ])
    ).start();

    setTimeout(() => {
      const mockAiText = `Freshly prepared ${name}, featuring authentic spices and premium ingredients. A perfectly balanced ${isVeg ? 'vegetarian' : 'savory'} meal designed for a healthy student lifestyle.`;
      setDescription(mockAiText);
      setIsGenerating(false);
      glowAnim.stopAnimation();
    }, 1500);
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Required';
    if (!price.trim()) newErrors.price = 'Required';
    if (!image) newErrors.image = 'Required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileName = `${user.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('dish-images')
        .upload(fileName, decodeBase64(image.base64), { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('dish-images').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('menu_items').insert([{
        chef_id: user.id,
        name: name.trim(),
        price: parseFloat(price),
        description: description.trim(),
        image_url: publicUrl,
        is_veg: isVeg,
        available: true
      }]);

      if (dbError) throw dbError;
      router.back();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  const aiBorderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, COLORS.aiPrimary]
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="close" size={22} color={COLORS.obsidian} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Add Dish</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {/* PHOTO SECTION */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>PHOTO</Text>
            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
              {image ? (
                <Image source={{ uri: image.uri }} style={styles.fullImg} />
              ) : (
                <LinearGradient colors={['#F8FAFC', '#E2E8F0']} style={styles.placeholderGradient}>
                  <Ionicons name="camera-outline" size={32} color={COLORS.gray} />
                  <Text style={styles.placeholderText}>Tap to add photo</Text>
                </LinearGradient>
              )}
              <View style={styles.floatingBtn}>
                <Ionicons name={image ? "sync" : "add"} size={18} color="white" />
              </View>
            </TouchableOpacity>
            {errors.image && <Text style={styles.errorText}>Image is required</Text>}
          </View>

          {/* DETAILS SECTION */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>DETAILS</Text>
            
            <Text style={styles.inputLabel}>DISH NAME</Text>
            <TextInput 
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="ex - Paneer Tikka Masala" // <--- Updated Placeholder
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />

            <View style={styles.row}>
              <View style={{ flex: 1.5 }}>
                <Text style={styles.inputLabel}>PRICE (₹)</Text>
                <TextInput 
                  style={[styles.input, errors.price && styles.inputError]}
                  placeholder="ex - 120" // <--- Updated Placeholder
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>TYPE</Text>
                <TouchableOpacity 
                  onPress={() => setIsVeg(!isVeg)}
                  style={[styles.typeToggle, { borderColor: isVeg ? COLORS.success : COLORS.error }]}
                >
                  <View style={[styles.dot, { backgroundColor: isVeg ? COLORS.success : COLORS.error }]} />
                  <Text style={[styles.typeText, { color: isVeg ? COLORS.success : COLORS.error }]}>{isVeg ? 'VEG' : 'N-VEG'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* DESCRIPTION SECTION */}
          <View style={styles.card}>
            <View style={styles.aiHeader}>
              <Text style={styles.sectionTitle}>DESCRIPTION</Text>
              <TouchableOpacity onPress={handleAIGenerate} style={styles.aiBtn}>
                <Ionicons name="sparkles" size={12} color="white" />
                <Text style={styles.aiBtnText}>{isGenerating ? 'Drafting...' : 'Magic Write'}</Text>
              </TouchableOpacity>
            </View>
            <Animated.View style={[styles.aiContainer, { borderColor: aiBorderColor }]}>
              <TextInput 
                style={styles.textArea}
                multiline
                placeholder="ex - Spicy paneer cubes grilled with veggies..." // <--- Updated Placeholder
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
              />
              <View style={styles.aiFooter}>
                <Ionicons name="logo-google" size={10} color={COLORS.gray} />
                <Text style={styles.aiFooterText}>Powered by Gemini</Text>
              </View>
            </Animated.View>
          </View>

          <TouchableOpacity onPress={handleSubmit} disabled={uploading} style={styles.submitBtn}>
            {uploading ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>Add to Menu</Text>}
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  navTitle: { fontSize: 18, fontWeight: '800' },
  scroll: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: COLORS.gray, letterSpacing: 1, marginBottom: 15 },
  imagePicker: { height: 160, borderRadius: 20, overflow: 'hidden' },
  placeholderGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { marginTop: 8, fontSize: 12, fontWeight: '700', color: COLORS.gray },
  fullImg: { width: '100%', height: '100%' },
  floatingBtn: { position: 'absolute', bottom: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.obsidian, justifyContent: 'center', alignItems: 'center' },
  inputLabel: { fontSize: 10, fontWeight: '700', color: COLORS.grayDark, marginBottom: 6 },
  input: { backgroundColor: '#F8FAFC', borderColor: COLORS.border, borderRadius: 12, padding: 12, fontSize: 15, fontWeight: '600', marginBottom: 12, borderWidth: 1 },
  inputError: { borderColor: COLORS.error },
  row: { flexDirection: 'row', gap: 12 },
  typeToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, borderWidth: 1.5, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  typeText: { fontSize: 12, fontWeight: '800' },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  aiBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.aiPrimary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4 },
  aiBtnText: { color: 'white', fontSize: 11, fontWeight: '700' },
  aiContainer: { borderRadius: 16, backgroundColor: '#FAF9FF', borderWidth: 2 },
  textArea: { padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top', color: '#0F172A' },
  aiFooter: { flexDirection: 'row', alignItems: 'center', padding: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 4 },
  aiFooterText: { fontSize: 9, fontWeight: '700', color: COLORS.gray },
  submitBtn: { backgroundColor: COLORS.obsidian, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  submitText: { color: 'white', fontSize: 16, fontWeight: '800' },
  errorText: { color: COLORS.error, fontSize: 11, marginTop: 5 }
});