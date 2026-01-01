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
  Dimensions,
} from 'react-native';

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import LottieView from 'lottie-react-native';

import { supabase } from '../lib/supabase';

const { height } = Dimensions.get('window');

const COLORS = {
  background: '#FFFFFF',
  text: '#111827',
  subText: '#6B7280',
  primary: '#0F172A',
  accent: '#7C3AED',
  border: '#E5E7EB',
  inputBg: '#F9FAFB',
  error: '#EF4444',
  divider: '#E5E7EB',
  headerBg: '#F3E8FF',
  white: '#FFFFFF',
  placeholder: '#9CA3AF',
  violetText: '#A78BFA',
  overlay: 'rgba(15, 23, 42, 0.4)',
  brandSubtitle: 'rgba(255,255,255,0.9)',
  
  // Roles
  roleCardBg: '#FFFFFF',
  roleCardActiveBg: '#F8FAFC',
  roleIconBg: '#F3F4F6',
  roleIconBgActive: '#FFFFFF',
  roleSubtitle: '#9CA3AF',
  
  // Shadows
  shadow: '#000000',
  textShadow: '#000000',
};

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '372469657984-o1smmjjp5pi0r1j2crhrc5lkeidv0mvv.apps.googleusercontent.com', 
});

/**
 * Modern Input Component
 */
const AuthInput = ({ placeholder, value, onChangeText, secureTextEntry, isPassword, togglePasswordVisibility, error }) => (
  <View style={styles.inputWrapper}>
    <View style={[styles.inputContainer, error ? styles.inputError : null]}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        secureTextEntry={secureTextEntry}
        style={styles.inputField}
      />
      {isPassword && (
        <TouchableOpacity 
          onPress={togglePasswordVisibility} 
          style={styles.eyeIcon} 
          hitSlop={styles.hitSlop}
        >
          <Ionicons 
            name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'} 
            size={20} 
            color={COLORS.subText} 
          />
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
      console.error('Profile Sync Note:', e.message);
    }
  };

  const validateForm = () => {
    let valid = true;
    let newErrors = { email: '', password: '' };
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!email || !emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email';
      valid = false;
    }
    if (!password || password.length < 6) {
      newErrors.password = 'Min 6 characters required';
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
          Alert.alert('Verification Email Sent', 'Please check your inbox.');
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
      Alert.alert('Authentication Failed', error.message);
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
    
    if (profile?.role === 'chef') {
      router.replace('/(chef)');
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 1. HEADER AREA (Lottie Animation) */}
      <View style={styles.headerArea}>
        <LottieView
          source={{ uri: 'https://lottie.host/4f1862d5-88a1-4d80-85d9-9bdf5683500e/VKw4jder1r.lottie' }}
          autoPlay
          loop
          style={styles.headerLottie}
          resizeMode="cover" 
        />
        
        <View style={styles.headerOverlay} />
        
        <View style={[styles.brandContainer, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.brandTitle}>Tiffin<Text style={{color: COLORS.violetText}}>Tales</Text></Text>
          <Text style={styles.brandSubtitle}>Homemade meals, delivered.</Text>
        </View>
      </View>

      {/* 2. CARD CONTENT */}
      <View style={styles.contentContainer}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Title Row */}
            <View style={styles.titleRow}>
              <Text style={styles.authTitle}>
                {mode === 'login' ? 'Welcome Back' : 'Get Started'}
              </Text>
              <Text style={styles.authSubtitle}>
                {mode === 'login' ? 'Sign in to continue' : 'Create a new account'}
              </Text>
            </View>

            {/* Inputs */}
            <View style={styles.formGroup}>
              <AuthInput 
                placeholder="Email Address" 
                value={email} 
                onChangeText={(t) => { setEmail(t); if(errors.email) setErrors({...errors, email:''}) }} 
                error={errors.email} 
              />
              <AuthInput 
                placeholder="Password" 
                value={password} 
                onChangeText={(t) => { setPassword(t); if(errors.password) setErrors({...errors, password:''}) }} 
                isPassword={true} 
                secureTextEntry={!showPassword} 
                togglePasswordVisibility={() => setShowPassword(!showPassword)} 
                error={errors.password} 
              />
            </View>

            {/* Role Selection */}
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setIsChef(false)} 
                style={[styles.roleCard, !isChef && styles.roleCardActive]}
              >
                <View style={[styles.roleIconBg, !isChef && styles.roleIconBgActive]}>
                  <Ionicons name="school-outline" size={20} color={!isChef ? COLORS.primary : COLORS.subText} />
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={[styles.roleTitle, !isChef && styles.roleTitleActive]}>Student</Text>
                  <Text style={styles.roleSubtitle}>Ordering food</Text>
                </View>
                {!isChef && (
                  <View style={styles.activeCheck}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setIsChef(true)} 
                style={[styles.roleCard, isChef && styles.roleCardActive]}
              >
                <View style={[styles.roleIconBg, isChef && styles.roleIconBgActive]}>
                  <Ionicons name="restaurant-outline" size={20} color={isChef ? COLORS.primary : COLORS.subText} />
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={[styles.roleTitle, isChef && styles.roleTitleActive]}>Home Chef</Text>
                  <Text style={styles.roleSubtitle}>Cooking food</Text>
                </View>
                {isChef && (
                  <View style={styles.activeCheck}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Main Action Button */}
            <TouchableOpacity onPress={handleAuth} disabled={loading} activeOpacity={0.8} style={styles.primaryBtn}>
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {mode === 'login' ? 'Sign In' : 'Sign Up'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.line} />
            </View>

            {/* Google Button */}
            <TouchableOpacity onPress={handleGoogleLogin} style={styles.googleBtn} activeOpacity={0.7}>
              <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/300/300221.png' }} style={styles.googleIcon} />
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Footer Text */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <Text onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} style={styles.linkText}>
                  {mode === 'login' ? 'Sign Up' : 'Log In'}
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Header Area with Lottie
  headerArea: { 
    height: height * 0.35, 
    width: '100%', 
    position: 'relative',
    backgroundColor: COLORS.headerBg,
  },
  headerLottie: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: COLORS.overlay,
  }, 
  brandContainer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
  },
  brandTitle: { 
    fontSize: 36, 
    fontWeight: '900', 
    color: COLORS.white, 
    letterSpacing: -1,
    textShadowColor: COLORS.textShadow,
    textShadowOffset: { width: -1, height: -1 },
    textShadowRadius: 3,
  },
  brandSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.brandSubtitle,
    marginTop: 4,
  },

  // Content Sheet
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: -24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },

  // Title Section
  titleRow: {
    marginBottom: 24,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  authSubtitle: {
    fontSize: 14,
    color: COLORS.subText,
    marginTop: 4,
  },

  // Inputs
  formGroup: {
    gap: 16,
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: 54,
    paddingHorizontal: 16,
    backgroundColor: COLORS.inputBg,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  hitSlop: {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Role Selector Cards
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roleCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.roleCardBg,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.02,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1, 
  },
  roleCardActive: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: COLORS.roleCardActiveBg,
  },
  roleIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.roleIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  roleIconBgActive: {
    backgroundColor: COLORS.roleIconBgActive,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.subText,
  },
  roleTitleActive: {
    color: COLORS.primary, 
    fontWeight: '700',
  },
  roleSubtitle: {
    fontSize: 11,
    color: COLORS.roleSubtitle,
    marginTop: 2,
  },
  activeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  // Primary Button
  primaryBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.divider,
  },
  orText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: COLORS.subText,
    fontWeight: '600',
  },

  // Social Button
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    height: 56,
    backgroundColor: COLORS.white,
    marginBottom: 24,
    gap: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Footer
  footerRow: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.subText,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});