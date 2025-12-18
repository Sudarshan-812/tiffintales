import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  StyleSheet 
} from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase'; // ✅ FIXED:  Two dots
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// 🎨 BRAND THEME
const COLORS = {
  background: '#FDFBF7',
  surface: '#FFFFFF',
  obsidian: '#0F172A',
  obsidianLight: '#1E293B',
  gray: '#94A3B8',
  grayDark: '#64748B',
  border: '#E2E8F0',
  error: '#EF4444',
  success: '#10B981',
};

// 🛠️ LOCAL HELPER:  decodeBase64
const decodeBase64 = (base64) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes. buffer;
};

export default function AddDishScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({ name: '', price: '', image: '' });

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker. MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality:  0.4,
      base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
      setErrors({ ...errors, image: '' });
    }
  };

  const validateForm = () => {
    let newErrors = { name: '', price: '', image: '' };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Dish name is required';
      isValid = false;
    }

    if (!price.trim() || parseFloat(price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
      isValid = false;
    }

    if (!image) {
      newErrors.image = 'Photo is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setUploading(true);
    try {
      const { data:  { user } } = await supabase.auth.getUser();

      const fileName = `${user.id}/${Date.now()}.jpg`;

      const { error:  uploadError } = await supabase. storage
        .from('dish-images')
        .upload(fileName, decodeBase64(image.base64), {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('dish-images')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('menu_items')
        .insert([{
          chef_id: user.id,
          name:  name.trim(),
          price: parseFloat(price),
          description: desc.trim(),
          image_url: publicUrl,
        }]);

      if (dbError) throw dbError;

      Alert. alert('Success!  🎉', 'Your dish is now live on the menu.');
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor:  COLORS.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles. backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.obsidian} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Dish</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }} 
          showsVerticalScrollIndicator={false}
        >
          {/* PHOTO PICKER */}
          <Text style={styles.label}>Dish Preview</Text>
          <TouchableOpacity
            onPress={pickImage}
            activeOpacity={0.7}
            style={[
              styles.imageBox,
              {
                borderColor: errors.image 
                  ? COLORS.error 
                  : image 
                  ? COLORS.obsidian 
                  : COLORS.border,
              },
            ]}
          >
            {image ?  (
              <>
                <Image 
                  source={{ uri: image. uri }} 
                  style={styles.previewImage} 
                />
                <View style={styles.changePhotoOverlay}>
                  <Ionicons 
                    name="camera" 
                    size={24} 
                    color={COLORS. background} 
                  />
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </View>
              </>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor:  COLORS.background,
                    justifyContent:  'center',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Ionicons 
                    name="camera-outline" 
                    size={28} 
                    color={COLORS.grayDark} 
                  />
                </View>
                <Text style={styles.uploadText}>Tap to upload photo</Text>
                <Text style={{ ... styles.uploadText, opacity: 0.6, fontSize: 12 }}>
                  JPG, PNG up to 5MB
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.image && (
            <Text style={styles.errorText}>{errors.image}</Text>
          )}

          {/* FORM FIELDS */}
          <View style={{ gap: 24, marginTop: 28 }}>
            {/* Dish Name */}
            <View>
              <Text style={styles. label}>Dish Name</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.name && { borderColor: COLORS.error },
                ]}
                placeholder="e.g.  Grandma's Butter Chicken"
                placeholderTextColor={COLORS. gray}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (text.trim()) setErrors({ ...errors, name: '' });
                }}
                editable={!uploading}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Price */}
            <View>
              <Text style={styles.label}>Price (₹)</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={[
                    styles.priceInput,
                    errors. price && { borderColor: COLORS.error },
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={(text) => {
                    setPrice(text);
                    if (text.trim() && parseFloat(text) > 0) {
                      setErrors({ ...errors, price: '' });
                    }
                  }}
                  editable={!uploading}
                />
              </View>
              {errors. price && (
                <Text style={styles.errorText}>{errors.price}</Text>
              )}
            </View>

            {/* Description */}
            <View>
              <View 
                style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Text style={styles.label}>Description</Text>
                <Text style={{ ...styles.label, marginBottom: 0, fontSize: 11 }}>
                  {desc.length}/150
                </Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the taste, spice level, ingredients..."
                placeholderTextColor={COLORS.gray}
                multiline
                numberOfLines={4}
                value={desc}
                onChangeText={(text) => setDesc(text. slice(0, 150))}
                editable={!uploading}
                maxLength={150}
              />
            </View>
          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={uploading}
            activeOpacity={0.85}
            style={[
              styles.submitBtn,
              {
                backgroundColor: uploading 
                  ? COLORS.gray 
                  : COLORS.obsidian,
                opacity: uploading ? 0.6 : 1,
              },
            ]}
          >
            {uploading ? (
              <ActivityIndicator color="white" size="large" />
            ) : (
              <>
                <Ionicons 
                  name="restaurant" 
                  size={20} 
                  color="white" 
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.submitText}>
                  List Dish in My Kitchen
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS. obsidian,
    letterSpacing: -0.5,
  },
  backBtn: {
    width: 40,
    height:  40,
    borderRadius:  12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageBox: {
    height: 220,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changePhotoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems:  'center',
  },
  changePhotoText: {
    color:  COLORS.background,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  uploadText: {
    color: COLORS.grayDark,
    fontSize:  14,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS. obsidian,
    marginBottom:  8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.obsidian,
    fontWeight: '500',
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
    paddingVertical: 14,
  },
  priceInputContainer:  {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
  },
  currencySymbol:  {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS. obsidian,
    marginRight: 8,
  },
  priceInput: {
    flex:  1,
    paddingVertical: 14,
    fontSize: 16,
    color:  COLORS.obsidian,
    fontWeight: '500',
    borderWidth: 0,
  },
  submitBtn: {
    marginTop: 40,
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.obsidian,
    shadowOffset:  { width: 0, height:  4 },
    shadowOpacity:  0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  errorText: {
    color:  COLORS.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '600',
  },
});