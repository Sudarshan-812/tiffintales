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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Third-party Imports
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Local Imports
import { supabase } from '../../lib/supabase';

// Brand Theme Constants
const COLORS = {
  background: '#FDFBF7',
  surface: '#FFFFFF',
  obsidian: '#0F172A',
  gray: '#94A3B8',
  grayDark: '#64748B',
  border: '#E2E8F0',
  error: '#EF4444',
  success: '#10B981',
  aiPrimary: '#8B5CF6',
  aiLight: '#F5F3FF',
};

/**
 * Decodes a Base64 string into an ArrayBuffer for Supabase upload.
 * @param {string} base64 - The base64 string from the image picker.
 * @returns {ArrayBuffer} - The binary buffer.
 */
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
  const [description, setDescription] = useState(''); // Renamed from 'desc'
  const [image, setImage] = useState(null);
  const [isVeg, setIsVeg] = useState(true);

  // UI/Loading State
  const [uploading, setUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({ name: '', price: '', image: '' });

  // Animation for AI Glow
  const glowAnim = useRef(new Animated.Value(0)).current;

  /**
   * Opens the system image picker.
   */
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

  /**
   * Simulates AI description generation.
   * NOTE: Integrate actual Gemini API call here in production.
   */
  const handleAIGenerate = async () => {
    if (!name.trim()) {
      Alert.alert("Name Missing", "Tell me the Dish Name first! 🍳");
      return;
    }

    Keyboard.dismiss();
    setIsGenerating(true);

    // Start Glow Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 800, useNativeDriver: false })
      ])
    ).start();

    try {
      // Mocking the AI response (Replace with real API call)
      const mockAiText = `A delicious ${isVeg ? 'vegetarian' : 'savory'} ${name} made with fresh ingredients and authentic spices.`;

      setTimeout(() => {
        setDescription(mockAiText);
        setIsGenerating(false);
        glowAnim.stopAnimation();
        glowAnim.setValue(0);
      }, 1500);

    } catch (e) {
      setIsGenerating(false);
      glowAnim.stopAnimation();
      Alert.alert("Error", "AI generation failed");
    }
  };

  /**
   * Validates form and uploads data to Supabase.
   */
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
      if (!user) throw new Error("User not authenticated");

      const fileName = `${user.id}/${Date.now()}.jpg`;

      // 1. Upload Image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('dish-images')
        .upload(fileName, decodeBase64(image.base64), {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('dish-images')
        .getPublicUrl(fileName);

      // 2. Insert into Menu Table
      const { error: dbError } = await supabase
        .from('menu_items')
        .insert([{
          chef_id: user.id,
          name: name.trim(),
          price: parseFloat(price),
          description: description.trim(),
          image_url: publicUrl,
          is_veg: isVeg,
          available: true
        }]);

      if (dbError) throw dbError;

      Alert.alert('Success! 🎉', 'Dish added to menu.');
      router.back();
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, COLORS.aiPrimary]
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.obsidian} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Dish</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* IMAGE PICKER */}
          <Text style={styles.sectionLabel}>DISH PHOTO</Text>
          <TouchableOpacity
            onPress={pickImage}
            activeOpacity={0.8}
            style={styles.imagePicker}
          >
            {image ? (
              <>
                <Image source={{ uri: image.uri }} style={styles.previewImage} />
                <View style={styles.editBadge}>
                  <Ionicons name="pencil" size={14} color="white" />
                </View>
              </>
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="camera" size={32} color={COLORS.gray} />
                <Text style={styles.placeholderText}>Tap to upload</Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.image ? <Text style={styles.errorText}>Photo is required</Text> : null}

          {/* FORM */}
          <View style={styles.formContainer}>

            {/* Name */}
            <View>
              <Text style={styles.label}>DISH NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Paneer Tikka Masala"
                value={name}
                onChangeText={setName}
              />
              {errors.name ? <Text style={styles.errorText}>Name is required</Text> : null}
            </View>

            {/* Price & Veg Toggle Row */}
            <View style={styles.rowContainer}>
              <View style={styles.flex1}>
                <Text style={styles.label}>PRICE (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={setPrice}
                />
                {errors.price ? <Text style={styles.errorText}>Required</Text> : null}
              </View>

              {/* VEG TOGGLE */}
              <View style={styles.flex1}>
                <Text style={styles.label}>DIETARY TYPE</Text>
                <View style={[styles.toggleBox, { borderColor: isVeg ? COLORS.success : COLORS.error }]}>
                  <Text style={[styles.toggleText, { color: isVeg ? COLORS.success : COLORS.error }]}>
                    {isVeg ? 'Vegetarian' : 'Non-Veg'}
                  </Text>
                  <Switch
                    trackColor={{ false: '#FEE2E2', true: '#D1FAE5' }}
                    thumbColor={isVeg ? COLORS.success : COLORS.error}
                    ios_backgroundColor="#FEE2E2"
                    onValueChange={setIsVeg}
                    value={isVeg}
                  />
                </View>
              </View>
            </View>

            {/* AI DESCRIPTION BOX */}
            <View>
              <View style={styles.aiHeaderRow}>
                <Text style={styles.label}>DESCRIPTION</Text>
                <TouchableOpacity
                  onPress={handleAIGenerate}
                  disabled={isGenerating}
                  style={styles.magicButton}
                >
                  {isGenerating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={12} color="white" style={styles.sparkleIcon} />
                      <Text style={styles.magicButtonText}>Auto-Write</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <Animated.View style={[styles.aiInputContainer, { borderColor: isGenerating ? borderColor : COLORS.border }]}>
                {isGenerating && (
                  <View style={styles.generatingOverlay}>
                    <Text style={styles.generatingText}>✨ Gemini is writing...</Text>
                  </View>
                )}

                <TextInput
                  style={styles.aiTextArea}
                  placeholder="Describe ingredients, taste, or just let AI do it..."
                  placeholderTextColor={COLORS.gray}
                  multiline
                  numberOfLines={6}
                  value={description}
                  onChangeText={setDescription}
                  maxLength={250}
                />

                <View style={styles.aiBadge}>
                  <Ionicons name="logo-google" size={10} color={COLORS.grayDark} />
                  <Text style={styles.aiBadgeText}>Powered by Gemini 2.5</Text>
                </View>
              </Animated.View>
            </View>

          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={uploading}
            style={[styles.submitBtn, { opacity: uploading ? 0.7 : 1 }]}
          >
            {uploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitText}>Add to Menu</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.obsidian,
  },
  headerSpacer: {
    width: 40,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  // Layout
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  formContainer: {
    gap: 20,
    marginTop: 24,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  flex1: {
    flex: 1,
  },
  // Labels & Text
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.grayDark,
    marginBottom: 8,
    letterSpacing: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.obsidian,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  // Inputs
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.obsidian,
  },
  // Image Picker
  imagePicker: {
    height: 200,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    color: COLORS.gray,
    fontWeight: '600',
  },
  editBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: COLORS.obsidian,
    padding: 8,
    borderRadius: 20,
  },
  // Toggles
  toggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // AI Section
  aiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  magicButton: {
    backgroundColor: COLORS.aiPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  sparkleIcon: {
    marginRight: 6,
  },
  magicButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  aiInputContainer: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 140,
  },
  aiTextArea: {
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.obsidian,
    textAlignVertical: 'top',
    height: 140,
  },
  generatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  generatingText: {
    marginTop: 8,
    color: COLORS.aiPrimary,
    fontWeight: '700',
  },
  aiBadge: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.6,
  },
  aiBadgeText: {
    fontSize: 10,
    color: COLORS.grayDark,
    marginLeft: 4,
    fontWeight: '600',
  },
  // Submit Button
  submitBtn: {
    marginTop: 40,
    backgroundColor: COLORS.obsidian,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});