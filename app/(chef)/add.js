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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../../lib/supabase';
import { COLORS, SHADOW, RADIUS } from '../../lib/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const decodeBase64 = (base64) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AddDishScreen() {
  const router = useRouter();

  const [name,         setName]         = useState('');
  const [price,        setPrice]        = useState('');
  const [description,  setDescription]  = useState('');
  const [image,        setImage]        = useState(null);
  const [isVeg,        setIsVeg]        = useState(true);

  const [uploading,    setUploading]    = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors,       setErrors]       = useState({ name: '', price: '', image: '' });

  const glowAnim = useRef(new Animated.Value(0)).current;
  const glowLoop = useRef(null);

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
        setErrors(prev => ({ ...prev, image: '' }));
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleAIGenerate = () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Enter a dish name first!');
      return;
    }
    Keyboard.dismiss();
    setIsGenerating(true);

    glowLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    );
    glowLoop.current.start();

    setTimeout(() => {
      const mockText = `Freshly prepared ${name}, featuring authentic spices and premium ingredients. A perfectly balanced ${isVeg ? 'vegetarian' : 'savory'} meal designed for a healthy student lifestyle.`;
      setDescription(mockText);
      setIsGenerating(false);
      glowLoop.current?.stop();
      glowAnim.setValue(0);
    }, 1500);
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!name.trim())  newErrors.name  = 'Required';
    if (!price.trim()) newErrors.price = 'Required';
    if (!image)        newErrors.image = 'Required';

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
        available: true,
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
    outputRange: [COLORS.border, COLORS.primary],
  });

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe}>

        {/* Nav */}
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="close" size={22} color={COLORS.obsidian} />
          </TouchableOpacity>
          <View style={styles.navCenter}>
            <Text style={styles.navTag}>MY KITCHEN</Text>
            <Text style={styles.navTitle}>Add Dish</Text>
          </View>
          <View style={styles.spacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Photo Card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>PHOTO</Text>
            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
              {image ? (
                <Image source={{ uri: image.uri }} style={styles.fullImg} />
              ) : (
                <LinearGradient
                  colors={[COLORS.primaryFaint, COLORS.primaryLight]}
                  style={styles.placeholder}
                >
                  <View style={styles.cameraCircle}>
                    <Ionicons name="camera-outline" size={28} color={COLORS.primary} />
                  </View>
                  <Text style={styles.placeholderText}>Tap to add photo</Text>
                </LinearGradient>
              )}
              <View style={styles.floatingBtn}>
                <Ionicons name={image ? 'sync' : 'add'} size={17} color="#FFF" />
              </View>
            </TouchableOpacity>
            {errors.image ? <Text style={styles.errorText}>Image is required</Text> : null}
          </View>

          {/* Details Card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>DETAILS</Text>

            <Text style={styles.inputLabel}>DISH NAME</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="e.g. Paneer Tikka Masala"
              placeholderTextColor={COLORS.medium}
              value={name}
              onChangeText={v => { setName(v); setErrors(p => ({ ...p, name: '' })); }}
            />

            <View style={styles.row}>
              <View style={{ flex: 1.5 }}>
                <Text style={styles.inputLabel}>PRICE (₹)</Text>
                <TextInput
                  style={[styles.input, errors.price && styles.inputError]}
                  placeholder="e.g. 120"
                  placeholderTextColor={COLORS.medium}
                  keyboardType="numeric"
                  value={price}
                  onChangeText={v => { setPrice(v); setErrors(p => ({ ...p, price: '' })); }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>TYPE</Text>
                <TouchableOpacity
                  onPress={() => setIsVeg(!isVeg)}
                  style={[styles.typeToggle, { borderColor: isVeg ? COLORS.success : COLORS.error }]}
                >
                  <View style={[styles.dot, { backgroundColor: isVeg ? COLORS.success : COLORS.error }]} />
                  <Text style={[styles.typeText, { color: isVeg ? COLORS.success : COLORS.error }]}>
                    {isVeg ? 'VEG' : 'N-VEG'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Description Card */}
          <View style={styles.card}>
            <View style={styles.descHeader}>
              <Text style={styles.cardLabel}>DESCRIPTION</Text>
              <TouchableOpacity onPress={handleAIGenerate} style={styles.aiBtn}>
                <Ionicons name="sparkles" size={12} color="#FFF" />
                <Text style={styles.aiBtnText}>{isGenerating ? 'Drafting…' : 'Magic Write'}</Text>
              </TouchableOpacity>
            </View>
            <Animated.View style={[styles.aiBox, { borderColor: aiBorderColor }]}>
              <TextInput
                style={styles.textArea}
                multiline
                placeholder="e.g. Spicy paneer cubes grilled with veggies…"
                placeholderTextColor={COLORS.medium}
                value={description}
                onChangeText={setDescription}
              />
              <View style={styles.aiFooter}>
                <Ionicons name="logo-google" size={10} color={COLORS.medium} />
                <Text style={styles.aiFooterText}>Powered by Gemini</Text>
              </View>
            </Animated.View>
          </View>

          {/* Submit */}
          <TouchableOpacity onPress={handleSubmit} disabled={uploading} style={styles.submitBtn}>
            {uploading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.submitText}>Add to Menu</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  safe:   { flex: 1 },

  // ── Nav ──────────────────────────────────────────────
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOW.sm,
  },
  navCenter: { alignItems: 'center' },
  navTag: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.4,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.obsidian,
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.light,
  },
  spacer: { width: 40 },

  // ── Scroll ───────────────────────────────────────────
  scroll: { padding: 20, paddingBottom: 48 },

  // ── Card ─────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.light,
    ...SHADOW.sm,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.medium,
    letterSpacing: 1.2,
    marginBottom: 14,
  },

  // ── Image picker ─────────────────────────────────────
  imagePicker: {
    height: 158,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  cameraCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  fullImg: { width: '100%', height: '100%' },
  floatingBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },

  // ── Inputs ───────────────────────────────────────────
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.light,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.obsidian,
    marginBottom: 14,
    borderWidth: 1,
  },
  inputError: { borderColor: COLORS.error },
  row: { flexDirection: 'row', gap: 12 },
  typeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    gap: 6,
    marginBottom: 14,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  typeText: { fontSize: 12, fontWeight: '800' },

  // ── Description / AI ─────────────────────────────────
  descHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  aiBtnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  aiBox: {
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryFaint,
    borderWidth: 2,
    overflow: 'hidden',
  },
  textArea: {
    padding: 12,
    fontSize: 14,
    minHeight: 82,
    textAlignVertical: 'top',
    color: COLORS.obsidian,
  },
  aiFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 4,
  },
  aiFooterText: { fontSize: 9, fontWeight: '700', color: COLORS.medium },

  // ── Submit ───────────────────────────────────────────
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: RADIUS.full,
    marginTop: 8,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 10,
  },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  // ── Error ────────────────────────────────────────────
  errorText: { color: COLORS.error, fontSize: 11, marginTop: 4 },
});
