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
  Animated 
} from 'react-native';
import { useState, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { generateDishDescription } from '../../lib/gemini';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// 🎨 BRAND THEME
const COLORS = {
  background: '#FDFBF7',
  surface: '#FFFFFF',
  obsidian: '#0F172A',
  gray: '#94A3B8',
  grayDark: '#64748B',
  border: '#E2E8F0',
  error: '#EF4444',
  aiPrimary: '#8B5CF6', // 🟣 Gemini Purple
  aiLight: '#F5F3FF',   // 🟣 Light Purple Bg
};

// 🛠️ HELPER: Decode Base64
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
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState(null);
  
  const [uploading, setUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState({ name: '', price: '', image: '' });

  // Animation for AI Glow
  const glowAnim = useRef(new Animated.Value(0)).current;

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.4,
      base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
      setErrors({ ...errors, image: '' });
    }
  };

  // ✨ AI HANDLER
  const handleAIGenerate = async () => {
    if (!name.trim()) {
      Alert.alert("Name Missing", "Tell me the Dish Name first! 🍳");
      return;
    }
    
    Keyboard.dismiss();
    setIsGenerating(true);
    
    // Start Pulse Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 800, useNativeDriver: false })
      ])
    ).start();
    
    // Call Gemini
    const aiText = await generateDishDescription(name);
    
    setIsGenerating(false);
    glowAnim.stopAnimation();
    glowAnim.setValue(0); // Reset

    if (aiText) {
      setDesc(aiText);
    } else {
      Alert.alert("AI Error", "Could not generate description.");
    }
  };

  const handleSubmit = async () => {
    // Validation Logic
    let newErrors = {};
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

      // 1. Upload Image
      const { error: uploadError } = await supabase.storage
        .from('dish-images')
        .upload(fileName, decodeBase64(image.base64), { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('dish-images')
        .getPublicUrl(fileName);

      // 2. Insert into DB
      const { error: dbError } = await supabase
        .from('menu_items')
        .insert([{
          chef_id: user.id,
          name: name.trim(),
          price: parseFloat(price),
          description: desc.trim(),
          image_url: publicUrl,
        }]);

      if (dbError) throw dbError;

      Alert.alert('Success! 🎉', 'Dish added to menu.');
      router.back();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  // Dynamic Border Color for AI Box
  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, COLORS.aiPrimary]
  });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.obsidian} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Dish</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          
          {/* 📸 IMAGE PICKER */}
          <Text style={styles.sectionLabel}>DISH PHOTO</Text>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.imagePicker}>
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
          {errors.image && <Text style={styles.errorText}>Photo is required</Text>}

          {/* 📝 FORM */}
          <View style={{ gap: 20, marginTop: 24 }}>
            
            {/* Name */}
            <View>
              <Text style={styles.label}>DISH NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Paneer Tikka Masala"
                value={name}
                onChangeText={setName}
              />
              {errors.name && <Text style={styles.errorText}>Name is required</Text>}
            </View>

            {/* Price */}
            <View>
              <Text style={styles.label}>PRICE (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />
              {errors.price && <Text style={styles.errorText}>Price is required</Text>}
            </View>

            {/* ✨ MAGICAL AI DESCRIPTION BOX */}
            <View>
              <View style={styles.aiHeaderRow}>
                <Text style={styles.label}>DESCRIPTION</Text>
                
                {/* MAGIC BUTTON */}
                <TouchableOpacity 
                  onPress={handleAIGenerate}
                  disabled={isGenerating}
                  style={styles.magicButton}
                >
                  {isGenerating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={12} color="white" style={{ marginRight: 6 }} />
                      <Text style={styles.magicButtonText}>Auto-Write</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* ANIMATED INPUT BOX */}
              <Animated.View style={[styles.aiInputContainer, { borderColor: isGenerating ? borderColor : COLORS.border }]}> 
                {isGenerating ? (
                  <View style={styles.generatingOverlay}>
                    <Text style={styles.generatingText}>✨ Gemini is writing...</Text>
                  </View>
                ) : null}

                <TextInput
                  style={styles.aiTextArea}
                  placeholder="Describe ingredients, taste, or just let AI do it..."
                  placeholderTextColor={COLORS.gray}
                  multiline
                  numberOfLines={6}
                  value={desc}
                  onChangeText={setDesc}
                  maxLength={250}
                />
                
                {/* AI Badge inside box */}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.obsidian },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  
  sectionLabel: { fontSize: 12, fontWeight: '800', color: COLORS.grayDark, marginBottom: 8, letterSpacing: 1 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.obsidian, marginBottom: 6, letterSpacing: 0.5 },
  
  imagePicker: { height: 200, borderRadius: 16, backgroundColor: '#F1F5F9', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.border },
  previewImage: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center' },
  placeholderText: { marginTop: 8, color: COLORS.gray, fontWeight: '600' },
  editBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: COLORS.obsidian, padding: 8, borderRadius: 20 },
  
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 16, fontWeight: '500', color: COLORS.obsidian },
  errorText: { color: COLORS.error, fontSize: 11, marginTop: 4, fontWeight: '600' },

  // ✨ AI STYLES
  aiHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  magicButton: { backgroundColor: COLORS.aiPrimary, flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, shadowColor: COLORS.aiPrimary, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  magicButtonText: { color: 'white', fontSize: 12, fontWeight: '700' },
  
  aiInputContainer: { backgroundColor: COLORS.surface, borderWidth: 2, borderRadius: 16, overflow: 'hidden', position: 'relative', minHeight: 140 }, // Bigger Box
  aiTextArea: { padding: 16, fontSize: 16, lineHeight: 24, color: COLORS.obsidian, textAlignVertical: 'top', height: 140 },
  
  generatingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  generatingText: { marginTop: 8, color: COLORS.aiPrimary, fontWeight: '700' },
  
  aiBadge: { position: 'absolute', bottom: 8, right: 12, flexDirection: 'row', alignItems: 'center', opacity: 0.6 },
  aiBadgeText: { fontSize: 10, color: COLORS.grayDark, marginLeft: 4, fontWeight: '600' },

  submitBtn: { marginTop: 40, backgroundColor: COLORS.obsidian, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  submitText: { color: 'white', fontSize: 16, fontWeight: '700' },
});