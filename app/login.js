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
  Dimensions,
  Image // 👈 Ensure Image is imported
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 

const { height } = Dimensions.get('window');

// 🎨 OBSIDIAN + CREAM THEME
const COLORS = {
  background: '#FDFBF7',      // Cream Background
  surface: '#FFFFFF',         // White Card
  obsidian: '#111827',        // Main Dark Color
  primary: '#7E22CE',         // Purple Accent
  primaryLight: '#F3E8FF',    // Light Purple
  gray: '#6B7280',            // Gray Text
  border: '#E5E7EB',          // Light Border
  error: '#EF4444',           // Red Error
};

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

  // 🧪 VALIDATION
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

  // 🔐 AUTH LOGIC
  async function handleAuth() {
    if (!validateForm()) return;
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data: { user }, error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { role: isChef ? 'chef' : 'student' }
          }
        });
        if (error) throw error;

        if (user) {
          await supabase.from('profiles').insert([{
            id: user.id,
            email: user.email,
            role: isChef ? 'chef' : 'student'
          }]);
          
          Alert.alert('Welcome', 'Account created successfully!');
          
          if (isChef) {
            router.replace('/(chef)');
          } else {
            router.replace('/(tabs)');
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email, password
        });
        if (error) throw error;
        
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        const role = profile?.role || (isChef ? 'chef' : 'student');

        if (role === 'chef') {
          router.replace('/(chef)');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar style="dark" />
      
      {/* 🟢 Top Header Area */}
      <View style={{ paddingTop: insets.top + 10, paddingBottom: 20, alignItems: 'center', justifyContent: 'center' }}>
         <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.obsidian, letterSpacing: -1 }}>
            Tiffin<Text style={{ color: COLORS.primary }}>Tales</Text>
         </Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ 
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
        }}>
          <ScrollView 
            contentContainerStyle={{ 
              paddingHorizontal: 24,
              paddingTop: 40, 
              paddingBottom: 40
            }}
            showsVerticalScrollIndicator={false}
          >
            
            {/* ─── HEADER WITH LOGO ─── */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              
              {/* 👇 REPLACED ICON WITH LOGO IMAGE */}
              <View style={{ 
                width: 80, height: 80, borderRadius: 24,
                backgroundColor: '#FFF',
                justifyContent: 'center', alignItems: 'center',
                marginBottom: 16,
                borderWidth: 1, borderColor: COLORS.border,
                shadowColor: COLORS.primary, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
              }}>
                <Image 
                  source={require('../assets/loginlogo.png')}
                  style={{ width: 60, height: 60, borderRadius: 12 }}
                  resizeMode="contain"
                />
              </View>
              
              <Text style={{ 
                fontSize: 26, 
                fontWeight: '800', 
                color: COLORS.obsidian,
                letterSpacing: -0.5,
                marginBottom: 6
              }}>
                {mode === 'login' ? 'Welcome Back' : 'Get Started'}
              </Text>
              <Text style={{ 
                color: COLORS.gray, 
                fontSize: 15, 
                fontWeight: '500',
                letterSpacing: 0.2
              }}>
                {mode === 'login' ? 'Enter details to login.' : 'Create your free account.'}
              </Text>
            </View>

            {/* ─── INPUTS ─── */}
            <View style={{ gap: 16, marginBottom: 24 }}>
              
              {/* Email */}
              <View>
                <View style={{ 
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: COLORS.background,
                  borderRadius: 14, height: 56,
                  paddingHorizontal: 16,
                  borderWidth: 1, borderColor: errors.email ? COLORS.error : COLORS.border
                }}>
                  <Ionicons name="mail-outline" size={20} color={COLORS.gray} style={{ marginRight: 12 }} />
                  <TextInput
                    placeholder="Email Address"
                    placeholderTextColor={COLORS.gray}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    autoCapitalize="none"
                    style={{ flex: 1, color: COLORS.obsidian, fontSize: 16, fontWeight: '600' }}
                  />
                </View>
                {errors.email && <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4, marginLeft: 4 }}>{errors.email}</Text>}
              </View>

              {/* Password */}
              <View>
                <View style={{ 
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: COLORS.background,
                  borderRadius: 14, height: 56,
                  paddingHorizontal: 16,
                  borderWidth: 1, borderColor: errors.password ? COLORS.error : COLORS.border
                }}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} style={{ marginRight: 12 }} />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor={COLORS.gray}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    secureTextEntry={!showPassword}
                    style={{ flex: 1, color: COLORS.obsidian, fontSize: 16, fontWeight: '600' }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.gray} />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4, marginLeft: 4 }}>{errors.password}</Text>}
              </View>
            </View>

            {/* ─── FORGOT PASSWORD ─── */}
            {mode === 'login' && (
              <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 24 }}>
                <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 13, letterSpacing: 0.3 }}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* ─── ROLE TOGGLE (Signup Only) ─── */}
            {mode === 'signup' && (
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                {['student', 'chef'].map((role) => {
                  const active = (role === 'chef' && isChef) || (role === 'student' && !isChef);
                  return (
                    <TouchableOpacity
                      key={role}
                      onPress={() => setIsChef(role === 'chef')}
                      style={{
                        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                        paddingVertical: 14, borderRadius: 12,
                        borderWidth: 1.5, borderColor: active ? COLORS.obsidian : COLORS.border,
                        backgroundColor: active ? COLORS.obsidian : 'transparent',
                      }}
                    >
                      <Ionicons 
                        name={role === 'chef' ? 'restaurant-outline' : 'school-outline'} 
                        size={18} 
                        color={active ? 'white' : COLORS.gray}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={{ color: active ? 'white' : COLORS.gray, fontWeight: '700', fontSize: 13 }}>
                        {role === 'chef' ? 'Home Chef' : 'Student'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* ─── ACTION BUTTON ─── */}
            <TouchableOpacity 
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.85}
              style={{ 
                backgroundColor: COLORS.obsidian,
                height: 56, borderRadius: 16,
                justifyContent: 'center', alignItems: 'center',
                marginBottom: 24,
                shadowColor: COLORS.obsidian, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { height: 4, width: 0 },
                elevation: 4
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: '800', color: 'white', letterSpacing: 0.5 }}>
                  {mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'}
                </Text>
              )}
            </TouchableOpacity>

            {/* ─── DIVIDER ─── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
              <Text style={{ color: COLORS.gray, fontSize: 12, marginHorizontal: 16, fontWeight: '600' }}>OR CONTINUE WITH</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
            </View>

            {/* ─── GOOGLE BTN ─── */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                height: 54, borderRadius: 16,
                backgroundColor: '#FFF',
                justifyContent: 'center', alignItems: 'center',
                borderWidth: 1, borderColor: COLORS.border,
                flexDirection: 'row', gap: 8,
                marginBottom: 32
              }}
            >
              <Ionicons name="logo-google" size={20} color={COLORS.obsidian} />
              <Text style={{ color: COLORS.obsidian, fontWeight: '700', fontSize: 14 }}>Google</Text>
            </TouchableOpacity>

            {/* ─── SWITCH MODE ─── */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              <Text style={{ color: COLORS.gray, fontSize: 14, fontWeight: '500' }}>
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
                <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 14 }}>
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