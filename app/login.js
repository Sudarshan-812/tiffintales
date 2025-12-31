import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions
} from 'react-native';

// Third-party Imports
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Local Imports
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

// 🎨 Clean Professional Theme
const COLORS = {
  background: '#FFFFFF',
  text: '#1C1C1C',       // Zomato-like near black
  subText: '#696969',    // Subtitle gray
  primary: '#0F172A',    // Obsidian (Brand Color)
  accent: '#7E22CE',     // Purple Accent
  border: '#E8E8E8',     // Very subtle border
  inputBg: '#FFFFFF',
  error: '#EF4444',
  divider: '#F0F0F0'
};

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '372469657984-o1smmjjp5pi0r1j2crhrc5lkeidv0mvv.apps.googleusercontent.com', 
});

/**
 * Zomato-Style Clean Input
 */
const AuthInput = ({ placeholder, value, onChangeText, secureTextEntry, isPassword, togglePasswordVisibility, error }) => (
  <View style={styles.inputWrapper}>
    <View style={[styles.inputContainer, error ? { borderColor: COLORS.error } : null]}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        secureTextEntry={secureTextEntry}
        style={styles.inputField}
      />
      {isPassword && (
        <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
          <Text style={styles.eyeText}>{secureTextEntry ? 'Show' : 'Hide'}</Text>
        </TouchableOpacity>
      )}
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChef, setIsChef] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState('login'); 
  const [errors, setErrors] = useState({ email: '', password: '' });

  const ensureProfileExists = async (user, role, fullName = null) => {
    try {
      const updates = {
        id: user.id,
        email: user.email,
        role: role,
        full_name: fullName || user.user_metadata?.full_name || '',
        updated_at: new Date(),
      };
      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
    } catch (e) {
      console.log('Profile Sync Note:', e.message);
    }
  };

  const validateForm = () => {
    let valid = true;
    let newErrors = { email: '', password: '' };
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!email || !emailRegex.test(email)) {
      newErrors.email = 'Enter a valid email';
      valid = false;
    }
    if (!password || password.length < 6) {
      newErrors.password = 'Min 6 chars required';
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  async function handleAuth() {
    if (!validateForm()) return;
    setLoading(true);
    const selectedRole = isChef ? 'chef' : 'student';

    try {
      if (mode === 'signup') {
        const { data: { user }, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (user) {
          await ensureProfileExists(user, selectedRole);
          Alert.alert('Link Sent', 'Check your email to verify account.');
          setMode('login'); 
        }
      } else {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (user) {
          await ensureProfileExists(user, selectedRole);
          checkRoleAndRedirect();
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const selectedRole = isChef ? 'chef' : 'student';
      
      if (userInfo.data?.idToken) {
        const { data: { session }, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.data.idToken,
        });
        if (error) throw error;
        if (session?.user) {
          await ensureProfileExists(session.user, selectedRole, userInfo.data.user.name);
          checkRoleAndRedirect();
        }
      }
    } catch (error) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Google Sign-In Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkRoleAndRedirect = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const role = profile?.role || 'student';
    
    if (role === 'chef') {
      router.replace('/(chef)');
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* 1. HERO IMAGE (Zomato Style) */}
      <View style={styles.imageHeader}>
        <Image 
          // Replace with a high-quality food image
          source={{ uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop' }} 
          style={styles.heroImage} 
        />
        <View style={styles.heroOverlay} />
        
        <View style={[styles.titleContainer, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.heroTitle}>Tiffin<Text style={{color: '#A78BFA'}}>Tales</Text></Text>
          <Text style={styles.heroSubtitle}>India's #1 Homemade Food App</Text>
        </View>
      </View>

      {/* 2. WHITE CONTENT SHEET */}
      <View style={styles.contentSheet}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Title */}
            <View style={styles.centerHeader}>
              <Text style={styles.authTitle}>
                {mode === 'login' ? 'Login or Signup' : 'Create Account'}
              </Text>
              <View style={styles.separator} />
            </View>

            {/* Inputs */}
            <View style={styles.formGroup}>
              <AuthInput 
                placeholder="Enter Email Address" 
                value={email} 
                onChangeText={(t) => { setEmail(t); if(errors.email) setErrors({...errors, email:''}) }} 
                error={errors.email} 
              />
              <AuthInput 
                placeholder="Enter Password" 
                value={password} 
                onChangeText={(t) => { setPassword(t); if(errors.password) setErrors({...errors, password:''}) }} 
                isPassword={true} 
                secureTextEntry={!showPassword} 
                togglePasswordVisibility={() => setShowPassword(!showPassword)} 
                error={errors.password} 
              />
            </View>

            {/* Role Toggle (Clean Segmented Control) */}
            <View style={styles.roleToggleContainer}>
              <TouchableOpacity onPress={() => setIsChef(false)} style={[styles.roleTab, !isChef && styles.roleTabActive]}>
                <Text style={[styles.roleText, !isChef && styles.roleTextActive]}>Student</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsChef(true)} style={[styles.roleTab, isChef && styles.roleTabActive]}>
                <Text style={[styles.roleText, isChef && styles.roleTextActive]}>Home Chef</Text>
              </TouchableOpacity>
            </View>

            {/* Main Button */}
            <TouchableOpacity onPress={handleAuth} disabled={loading} activeOpacity={0.9} style={styles.primaryBtn}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {mode === 'login' ? 'Continue' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.line} />
            </View>

            {/* Social Login (Clean Circle) */}
            <TouchableOpacity onPress={handleGoogleLogin} style={styles.socialBtn}>
              <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/300/300221.png' }} style={styles.socialIcon} />
              <Text style={styles.socialText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Footer Text */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                {mode === 'login' ? "New to TiffinTales? " : "Already have an account? "}
                <Text onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} style={styles.linkText}>
                  {mode === 'login' ? 'Sign up' : 'Log in'}
                </Text>
              </Text>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Hero Image Section
  imageHeader: { height: height * 0.35, width: '100%', position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.4)', // Darken image for text readability
  },
  titleContainer: { position: 'absolute', bottom: 40, left: 24 },
  heroTitle: { fontSize: 32, fontWeight: '900', color: 'white', letterSpacing: -1 },
  heroSubtitle: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: 4 },

  // Content Sheet
  contentSheet: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: -24, // Pull up over image
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 30 },

  // Header inside sheet
  centerHeader: { alignItems: 'center', marginTop: 16, marginBottom: 24 },
  authTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, letterSpacing: 0.5 },
  separator: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginTop: 12 },

  // Inputs
  formGroup: { gap: 16, marginBottom: 24 },
  inputWrapper: { marginBottom: 0 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, height: 52, paddingHorizontal: 14,
    backgroundColor: COLORS.inputBg,
  },
  inputField: { flex: 1, fontSize: 16, color: COLORS.text, height: '100%' },
  eyeIcon: { padding: 8 },
  eyeText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  errorText: { color: COLORS.error, fontSize: 12, marginTop: 4, marginLeft: 4 },

  // Role Toggle
  roleToggleContainer: {
    flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 24,
  },
  roleTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  roleTabActive: { backgroundColor: COLORS.primary, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  roleText: { fontSize: 14, fontWeight: '600', color: COLORS.subText },
  roleTextActive: { color: 'white', fontWeight: '700' },

  // Primary Button
  primaryBtn: {
    backgroundColor: COLORS.primary,
    height: 54, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, elevation: 4
  },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  // Divider
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.border },
  orText: { marginHorizontal: 12, fontSize: 14, color: '#9CA3AF' },

  // Social
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, height: 54,
    backgroundColor: 'white', marginBottom: 30, gap: 10
  },
  socialIcon: { width: 22, height: 22 },
  socialText: { fontSize: 15, fontWeight: '600', color: COLORS.text },

  // Footer Link
  footerContainer: { alignItems: 'center' },
  footerText: { fontSize: 14, color: COLORS.subText },
  linkText: { color: COLORS.primary, fontWeight: '800' },
});