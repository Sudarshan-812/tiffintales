import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import LottieView from 'lottie-react-native';

import { supabase } from '../lib/supabase';
import { COLORS, SHADOW, RADIUS } from '../lib/theme';

WebBrowser.maybeCompleteAuthSession();

const { height } = Dimensions.get('window');

// ─── Input ────────────────────────────────────────────────────────────────────

const AuthInput = ({ placeholder, value, onChangeText, secureTextEntry, isPassword, togglePasswordVisibility, error }) => (
  <View style={styles.inputWrap}>
    <View style={[styles.inputBox, error && styles.inputBoxError]}>
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
        <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.medium} />
        </TouchableOpacity>
      )}
    </View>
    {error ? <Text style={styles.fieldError}>{error}</Text> : null}
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [loading,      setLoading]      = useState(false);
  const [isChef,       setIsChef]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode,         setMode]         = useState('login');
  const [errors,       setErrors]       = useState({ email: '', password: '' });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const ensureProfileExists = async (user, role) => {
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        role,
        full_name: user.user_metadata?.full_name || '',
        updated_at: new Date(),
      });
      if (error) throw error;
    } catch (e) {
      console.error('Profile sync:', e.message);
    }
  };

  const validateForm = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const newErrors = { email: '', password: '' };
    let valid = true;
    if (!email || !emailRegex.test(email))   { newErrors.email    = 'Please enter a valid email'; valid = false; }
    if (!password || password.length < 6)    { newErrors.password = 'Min 6 characters required';  valid = false; }
    setErrors(newErrors);
    return valid;
  };

  const checkRoleAndRedirect = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    router.replace(profile?.role === 'chef' ? '/(chef)' : '/(tabs)');
  };

  // ── Auth Handlers ────────────────────────────────────────────────────────────

  const handleAuth = async () => {
    if (!validateForm()) return;
    setLoading(true);
    const role = isChef ? 'chef' : 'student';
    try {
      if (mode === 'signup') {
        const { data: { user }, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (user) {
          await ensureProfileExists(user, role);
          Alert.alert('Verification Email Sent', 'Please check your inbox.');
          setMode('login');
        }
      } else {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (user) { await ensureProfileExists(user, role); checkRoleAndRedirect(); }
      }
    } catch (error) {
      Alert.alert('Authentication Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const role = isChef ? 'chef' : 'student';
      const redirectTo = Linking.createURL('/login');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('No sign-in URL returned.');

      let androidCallbackUrl = null;
      const linkingSub = Linking.addEventListener('url', ({ url }) => { androidCallbackUrl = url; });

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      linkingSub.remove();

      const callbackUrl = result.url || androidCallbackUrl;
      if (callbackUrl) {
        const fragment = callbackUrl.includes('#') ? callbackUrl.split('#')[1] : callbackUrl.split('?')[1] || '';
        const params = new URLSearchParams(fragment);
        const accessToken  = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken) {
          const { error: setErr } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken || '' });
          if (setErr) throw setErr;
        }
      }

      await new Promise(r => setTimeout(r, 300));
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await ensureProfileExists(session.user, role);
        checkRoleAndRedirect();
      } else if (result.type !== 'cancel' && result.type !== 'dismiss') {
        throw new Error('Sign-in completed but no session was created.');
      }
    } catch (error) {
      Alert.alert('Google Sign-In Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* ── Header with Lottie ── */}
      <View style={styles.headerArea}>
        <LottieView
          source={{ uri: 'https://lottie.host/4f1862d5-88a1-4d80-85d9-9bdf5683500e/VKw4jder1r.lottie' }}
          autoPlay loop
          style={styles.lottie}
          resizeMode="cover"
        />
        <View style={styles.headerOverlay} />
        <View style={[styles.brandContainer, { paddingTop: insets.top + 20 }]}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>🍱 TiffinTales</Text>
          </View>
          <Text style={styles.brandTitle}>
            Welcome{'\n'}<Text style={{ color: COLORS.primary }}>Back</Text>
          </Text>
          <Text style={styles.brandSub}>Homemade meals, delivered.</Text>
        </View>
      </View>

      {/* ── Card Sheet ── */}
      <View style={styles.sheet}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Mode heading */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{mode === 'login' ? 'Sign In' : 'Get Started'}</Text>
              <Text style={styles.sheetSub}>{mode === 'login' ? 'Enter your credentials to continue' : 'Create a new account'}</Text>
            </View>

            {/* Inputs */}
            <View style={styles.formGroup}>
              <AuthInput
                placeholder="Email Address"
                value={email}
                onChangeText={t => { setEmail(t); if (errors.email) setErrors({ ...errors, email: '' }); }}
                error={errors.email}
              />
              <AuthInput
                placeholder="Password"
                value={password}
                onChangeText={t => { setPassword(t); if (errors.password) setErrors({ ...errors, password: '' }); }}
                isPassword
                secureTextEntry={!showPassword}
                togglePasswordVisibility={() => setShowPassword(!showPassword)}
                error={errors.password}
              />
            </View>

            {/* Role Toggle */}
            <View style={styles.roleRow}>
              <TouchableOpacity
                onPress={() => setIsChef(false)}
                style={[styles.roleBtn, !isChef && styles.roleBtnActive]}
              >
                <View style={[styles.roleIcon, !isChef && { backgroundColor: COLORS.primaryLight }]}>
                  <Ionicons name="school-outline" size={18} color={!isChef ? COLORS.primary : COLORS.medium} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleLabel, !isChef && { color: COLORS.primary }]}>Student</Text>
                  <Text style={styles.roleSub}>Ordering food</Text>
                </View>
                {!isChef && <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsChef(true)}
                style={[styles.roleBtn, isChef && styles.roleBtnActive]}
              >
                <View style={[styles.roleIcon, isChef && { backgroundColor: COLORS.primaryLight }]}>
                  <Ionicons name="restaurant-outline" size={18} color={isChef ? COLORS.primary : COLORS.medium} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleLabel, isChef && { color: COLORS.primary }]}>Home Chef</Text>
                  <Text style={styles.roleSub}>Cooking food</Text>
                </View>
                {isChef && <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />}
              </TouchableOpacity>
            </View>

            {/* Primary Button */}
            <TouchableOpacity onPress={handleAuth} disabled={loading} style={styles.primaryBtn}>
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.primaryBtnText}>{mode === 'login' ? 'Sign In' : 'Sign Up'}</Text>
              }
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            <TouchableOpacity onPress={handleGoogleLogin} style={styles.googleBtn}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Guest Section */}
            <View style={styles.guestSection}>
              <View style={styles.guestDivRow}>
                <View style={styles.guestLine} />
                <Text style={styles.guestLabel}>Browse as guest</Text>
                <View style={styles.guestLine} />
              </View>
              <View style={styles.guestCards}>
                <TouchableOpacity style={styles.guestCard} onPress={() => router.replace('/(tabs)')}>
                  <View style={styles.guestEmojiBox}>
                    <Text style={styles.guestEmoji}>🎓</Text>
                  </View>
                  <Text style={styles.guestCardTitle}>Student</Text>
                  <Text style={styles.guestCardSub}>Order food</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.guestCard} onPress={() => router.replace('/(chef)')}>
                  <View style={styles.guestEmojiBox}>
                    <Text style={styles.guestEmoji}>👨‍🍳</Text>
                  </View>
                  <Text style={styles.guestCardTitle}>Chef</Text>
                  <Text style={styles.guestCardSub}>Sell food</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <Text onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} style={styles.footerLink}>
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
  screen: { flex: 1, backgroundColor: COLORS.surface },

  // ── Header ───────────────────────────────────────────
  headerArea: {
    height: height * 0.36,
    width: '100%',
    position: 'relative',
    backgroundColor: COLORS.dark,
  },
  lottie: { width: '100%', height: '100%' },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  brandContainer: {
    position: 'absolute',
    bottom: 36,
    left: 24,
  },
  brandBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: 10,
  },
  brandBadgeText: { fontSize: 11, color: '#FFF', fontWeight: '700' },
  brandTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
    lineHeight: 40,
    marginBottom: 6,
  },
  brandSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },

  // ── Sheet ────────────────────────────────────────────
  sheet: {
    flex: 1,
    backgroundColor: COLORS.surface,
    marginTop: -22,
    borderTopLeftRadius: RADIUS['3xl'],
    borderTopRightRadius: RADIUS['3xl'],
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  sheetHeader: { marginBottom: 22 },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.obsidian,
    letterSpacing: -0.5,
  },
  sheetSub: { fontSize: 14, color: COLORS.medium, marginTop: 4 },

  // ── Inputs ───────────────────────────────────────────
  formGroup: { gap: 14, marginBottom: 20 },
  inputWrap:  {},
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.light,
    borderRadius: RADIUS.md,
    height: 54,
    paddingHorizontal: 16,
    backgroundColor: COLORS.inputBg,
  },
  inputBoxError: { borderColor: COLORS.error },
  inputField: { flex: 1, fontSize: 15, color: COLORS.obsidian, height: '100%' },
  eyeBtn: { padding: 4 },
  fieldError: { color: COLORS.error, fontSize: 11, marginTop: 4, marginLeft: 2, fontWeight: '500' },

  // ── Role Toggle ──────────────────────────────────────
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.light,
    backgroundColor: COLORS.surface,
    gap: 8,
    ...SHADOW.xs,
  },
  roleBtnActive: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: COLORS.primaryFaint,
  },
  roleIcon: {
    width: 34, height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleLabel: { fontSize: 13, fontWeight: '700', color: COLORS.medium },
  roleSub:   { fontSize: 10, color: COLORS.gray, marginTop: 1 },

  // ── Primary Button ───────────────────────────────────
  primaryBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 8,
  },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  // ── Divider ──────────────────────────────────────────
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { marginHorizontal: 14, fontSize: 11, color: COLORS.medium, fontWeight: '700', letterSpacing: 0.5 },

  // ── Google Button ─────────────────────────────────────
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.light,
    borderRadius: RADIUS.md,
    height: 54,
    backgroundColor: COLORS.surface,
    marginBottom: 24,
    gap: 10,
    ...SHADOW.xs,
  },
  googleIcon: {
    width: 26, height: 26,
    borderRadius: 13,
    backgroundColor: '#4285F4',
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 26,
    overflow: 'hidden',
  },
  googleText: { fontSize: 15, fontWeight: '600', color: COLORS.obsidian },

  // ── Guest Section ─────────────────────────────────────
  guestSection: { marginBottom: 10 },
  guestDivRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  guestLine:  { flex: 1, height: 1, backgroundColor: COLORS.border },
  guestLabel: { fontSize: 11, color: COLORS.medium, fontWeight: '600', letterSpacing: 0.3 },
  guestCards: { flexDirection: 'row', gap: 12 },
  guestCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: COLORS.light,
    gap: 4,
    ...SHADOW.xs,
  },
  guestEmojiBox: {
    width: 46, height: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  guestEmoji:     { fontSize: 22 },
  guestCardTitle: { fontSize: 14, fontWeight: '800', color: COLORS.obsidian },
  guestCardSub:   { fontSize: 11, color: COLORS.medium, fontWeight: '500' },

  // ── Footer ───────────────────────────────────────────
  footerRow: { alignItems: 'center', marginTop: 10 },
  footerText: { fontSize: 14, color: COLORS.medium },
  footerLink: { color: COLORS.primary, fontWeight: '800' },
});
