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
  StyleSheet
} from 'react-native';

// Third-party Imports
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Local Imports
import { supabase } from '../lib/supabase';

// Theme Constants
const COLORS = {
  background: '#FDFBF7',
  surface: '#FFFFFF',
  obsidian: '#111827',
  primary: '#7E22CE',
  primaryLight: '#F3E8FF',
  gray: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
};

/**
 * Reusable Input Component for Email/Password
 */
const AuthInput = ({ 
  icon, 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry, 
  isPassword, 
  togglePasswordVisibility, 
  error 
}) => (
  <View>
    <View style={[styles.inputContainer, error ? { borderColor: COLORS.error } : null]}>
      <Ionicons name={icon} size={20} color={COLORS.gray} style={styles.inputIcon} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        secureTextEntry={secureTextEntry}
        style={styles.inputField}
      />
      {isPassword && (
        <TouchableOpacity onPress={togglePasswordVisibility} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.gray} />
        </TouchableOpacity>
      )}
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

/**
 * Component to toggle between Student and Chef roles
 */
const RoleSelector = ({ isChef, setIsChef }) => (
  <View style={styles.roleContainer}>
    {['student', 'chef'].map((role) => {
      const active = (role === 'chef' && isChef) || (role === 'student' && !isChef);
      return (
        <TouchableOpacity
          key={role}
          onPress={() => setIsChef(role === 'chef')}
          style={[
            styles.roleButton,
            active ? styles.roleButtonActive : styles.roleButtonInactive
          ]}
        >
          <Ionicons
            name={role === 'chef' ? 'restaurant-outline' : 'school-outline'}
            size={18}
            color={active ? 'white' : COLORS.gray}
            style={styles.roleIcon}
          />
          <Text style={[styles.roleText, { color: active ? 'white' : COLORS.gray }]}>
            {role === 'chef' ? 'Home Chef' : 'Student'}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChef, setIsChef] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [errors, setErrors] = useState({ email: '', password: '' });

  /**
   * Validates email format and password length.
   */
  const validateForm = () => {
    let valid = true;
    let newErrors = { email: '', password: '' };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      newErrors.email = 'Valid email required';
      valid = false;
    }

    if (!password || password.length < 6) {
      newErrors.password = 'Min 6 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  /**
   * Handles Login and Signup logic using Supabase.
   */
  async function handleAuth() {
    if (!validateForm()) return;
    setLoading(true);

    try {
      if (mode === 'signup') {
        // 1. Sign Up
        const { data: { user }, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: isChef ? 'chef' : 'student' }
          }
        });
        if (error) throw error;

        // 2. Create Profile
        if (user) {
          await supabase.from('profiles').insert([{
            id: user.id,
            email: user.email,
            role: isChef ? 'chef' : 'student'
          }]);

          Alert.alert('Welcome', 'Account created successfully!');
          router.replace(isChef ? '/(chef)' : '/(tabs)');
        }
      } else {
        // 1. Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;

        // 2. Check Role
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        // Default to mode selection if profile role is missing (safety fallback)
        const role = profile?.role || (isChef ? 'chef' : 'student');

        router.replace(role === 'chef' ? '/(chef)' : '/(tabs)');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Header Area */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.appTitle}>
          Tiffin<Text style={{ color: COLORS.primary }}>Tales</Text>
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.bottomSheet}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >

            {/* ─── HEADER WITH LOGO ─── */}
            <View style={styles.headerContainer}>
              <View style={styles.logoBox}>
                <Image
                  source={require('../assets/loginlogo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.welcomeTitle}>
                {mode === 'login' ? 'Welcome Back' : 'Get Started'}
              </Text>
              <Text style={styles.welcomeSubtitle}>
                {mode === 'login' ? 'Enter details to login.' : 'Create your free account.'}
              </Text>
            </View>

            {/* ─── INPUTS ─── */}
            <View style={styles.formContainer}>
              <AuthInput
                icon="mail-outline"
                placeholder="Email Address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                error={errors.email}
              />

              <AuthInput
                icon="lock-closed-outline"
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                isPassword={true}
                secureTextEntry={!showPassword}
                togglePasswordVisibility={() => setShowPassword(!showPassword)}
                error={errors.password}
              />
            </View>

            {/* ─── FORGOT PASSWORD ─── */}
            {mode === 'login' && (
              <TouchableOpacity style={styles.forgotPasswordBtn}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* ─── ROLE TOGGLE (Signup Only) ─── */}
            {mode === 'signup' && (
              <RoleSelector isChef={isChef} setIsChef={setIsChef} />
            )}

            {/* ─── ACTION BUTTON ─── */}
            <TouchableOpacity
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.85}
              style={styles.actionBtn}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.actionBtnText}>
                  {mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'}
                </Text>
              )}
            </TouchableOpacity>

            {/* ─── DIVIDER ─── */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ─── GOOGLE BTN ─── */}
            <TouchableOpacity activeOpacity={0.8} style={styles.googleBtn}>
              <Ionicons name="logo-google" size={20} color={COLORS.obsidian} />
              <Text style={styles.googleBtnText}>Google</Text>
            </TouchableOpacity>

            {/* ─── SWITCH MODE ─── */}
            <View style={styles.switchModeContainer}>
              <Text style={styles.switchModeText}>
                {mode === 'login' ? "New here?" : 'Already have an account?'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setErrors({});
                  setEmail('');
                  setPassword('');
                }}
              >
                <Text style={styles.switchModeAction}>
                  {mode === 'login' ? 'Create Account' : 'Log In'}
                </Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  topHeader: {
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.obsidian,
    letterSpacing: -1
  },
  keyboardView: {
    flex: 1
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { height: -5, width: 0 },
    elevation: 5,
    overflow: 'hidden'
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40
  },
  // Header
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 12
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.obsidian,
    letterSpacing: -0.5,
    marginBottom: 6
  },
  welcomeSubtitle: {
    color: COLORS.gray,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2
  },
  // Inputs
  formContainer: {
    gap: 16,
    marginBottom: 24
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  inputIcon: {
    marginRight: 12
  },
  inputField: {
    flex: 1,
    color: COLORS.obsidian,
    fontSize: 16,
    fontWeight: '600'
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4
  },
  forgotPasswordBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3
  },
  // Roles
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5
  },
  roleButtonActive: {
    borderColor: COLORS.obsidian,
    backgroundColor: COLORS.obsidian
  },
  roleButtonInactive: {
    borderColor: COLORS.border,
    backgroundColor: 'transparent'
  },
  roleIcon: {
    marginRight: 8
  },
  roleText: {
    fontWeight: '700',
    fontSize: 13
  },
  // Action Button
  actionBtn: {
    backgroundColor: COLORS.obsidian,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: COLORS.obsidian,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { height: 4, width: 0 },
    elevation: 4
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5
  },
  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border
  },
  dividerText: {
    color: COLORS.gray,
    fontSize: 12,
    marginHorizontal: 16,
    fontWeight: '600'
  },
  // Google Btn
  googleBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32
  },
  googleBtnText: {
    color: COLORS.obsidian,
    fontWeight: '700',
    fontSize: 14
  },
  // Switch Mode
  switchModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6
  },
  switchModeText: {
    color: COLORS.gray,
    fontSize: 14,
    fontWeight: '500'
  },
  switchModeAction: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 14
  }
});