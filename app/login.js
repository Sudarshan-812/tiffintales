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
  Dimensions
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context'; 

const { width } = Dimensions.get('window');

// 🎨 PROFESSIONAL CREAM + OBSIDIAN THEME
const COLORS = {
  background: '#FDFBF7', // Cream BG
  surface: '#FFFFFF',    // White inputs/cards
  obsidian: '#1A0B2E',   // Primary Text/Action
  gold: '#F59E0B',       // Accents
  grayDark: '#475569',   // Subtext
  grayLight: '#94A3B8',  // Placeholders
  border: '#E2E8F0',     // Dividers
  error: '#EF4444',
};

const SPACING = { sm: 8, md: 12, lg: 16, xl: 24, xxl: 40 };

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChef, setIsChef] = useState(false); // 👈 Toggles Role
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
        // --- SIGN UP ---
        const { data: { user }, error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { role: isChef ? 'chef' : 'student' } // Save role in metadata too
          }
        });
        if (error) throw error;

        if (user) {
          // Create Profile with selected Role
          await supabase.from('profiles').insert([{
            id: user.id,
            email: user.email,
            role: isChef ? 'chef' : 'student' // 'student' matches your DB constraint likely
          }]);
          
          Alert.alert('Welcome', 'Account created successfully!');
          
          // 🔀 Redirect based on Role
          if (isChef) {
             router.replace('/(chef)');
          } else {
             router.replace('/(tabs)');
          }
        }
      } else {
        // --- LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email, password
        });
        if (error) throw error;
        
        // Check role after login to redirect correctly
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        const role = profile?.role || (isChef ? 'chef' : 'student'); // Fallback to toggle if profile fetch fails

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
      
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: SPACING.xl, justifyContent: 'center' }}
            showsVerticalScrollIndicator={false}
          >
            
            {/* ─── HEADER ─── */}
            <View style={{ alignItems: 'center', marginBottom: SPACING.xl, marginTop: SPACING.lg }}>
              <View style={{ 
                width: 64, height: 64, borderRadius: 16, 
                backgroundColor: COLORS.obsidian, 
                justifyContent: 'center', alignItems: 'center', 
                marginBottom: SPACING.md,
                shadowColor: COLORS.obsidian, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: {height: 4}
              }}>
                <Ionicons name="restaurant" size={32} color={COLORS.gold} />
              </View>
              <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.obsidian, letterSpacing: -0.5 }}>
                TiffinTales
              </Text>
              <Text style={{ color: COLORS.grayDark, marginTop: 8, fontSize: 15, fontWeight: '500' }}>
                {mode === 'login' ? 'Welcome back.' : 'Create your account.'}
              </Text>
            </View>

            {/* ─── TAB SWITCHER ─── */}
            <View style={{ 
              flexDirection: 'row', 
              backgroundColor: COLORS.border, 
              borderRadius: 12, 
              padding: 4, 
              marginBottom: SPACING.lg 
            }}>
              {['login', 'signup'].map((m) => (
                <TouchableOpacity 
                  key={m} 
                  onPress={() => { setMode(m); setErrors({}); }}
                  style={{ 
                    flex: 1, 
                    paddingVertical: 10, 
                    alignItems: 'center', 
                    borderRadius: 10,
                    backgroundColor: mode === m ? COLORS.surface : 'transparent',
                    shadowColor: "#000", 
                    shadowOpacity: mode === m ? 0.05 : 0, 
                    shadowRadius: 4, elevation: mode === m ? 2 : 0
                  }}
                >
                  <Text style={{ 
                    fontWeight: '700', 
                    color: mode === m ? COLORS.obsidian : COLORS.grayDark,
                    fontSize: 13,
                    textTransform: 'capitalize'
                  }}>
                    {m === 'login' ? 'Sign In' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ─── ROLE SELECTOR (VISIBLE FOR BOTH) ─── */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: SPACING.lg }}>
                {['customer', 'chef'].map((role) => {
                const active = (role === 'chef' && isChef) || (role === 'customer' && !isChef);
                return (
                    <TouchableOpacity
                    key={role}
                    onPress={() => setIsChef(role === 'chef')}
                    activeOpacity={0.8}
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 14,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: active ? COLORS.obsidian : COLORS.border,
                        backgroundColor: active ? COLORS.surface : 'transparent',
                        shadowColor: "#000", shadowOpacity: active ? 0.05 : 0, shadowRadius: 4, elevation: active ? 2 : 0
                    }}
                    >
                    <Ionicons 
                        name={role === 'chef' ? 'restaurant-outline' : 'person-outline'} 
                        size={18} 
                        color={active ? COLORS.obsidian : COLORS.grayLight} 
                        style={{ marginRight: 8 }}
                    />
                    <Text style={{ color: active ? COLORS.obsidian : COLORS.grayDark, fontWeight: '600', fontSize: 13 }}>
                        {role === 'chef' ? 'Home Chef' : 'Customer'}
                    </Text>
                    </TouchableOpacity>
                );
                })}
            </View>

            {/* ─── FORM INPUTS ─── */}
            <View style={{ gap: SPACING.lg }}>
              
              {/* Email Input */}
              <View>
                <Text style={{fontSize: 12, fontWeight: '600', color: COLORS.obsidian, marginBottom: 6, marginLeft: 4}}>Email</Text>
                <View style={{ 
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: COLORS.surface, 
                  borderRadius: 12, height: 50, paddingHorizontal: 16,
                  borderWidth: 1, borderColor: errors.email ? COLORS.error : COLORS.border
                }}>
                  <Ionicons name="mail-outline" size={20} color={COLORS.grayLight} />
                  <TextInput
                    placeholder="name@example.com"
                    placeholderTextColor={COLORS.grayLight}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    style={{ flex: 1, marginLeft: 12, color: COLORS.obsidian, fontSize: 15, fontWeight: '500' }}
                  />
                </View>
                {errors.email && <Text style={{ color: COLORS.error, fontSize: 11, marginTop: 4, marginLeft: 4 }}>{errors.email}</Text>}
              </View>

              {/* Password Input */}
              <View>
                <Text style={{fontSize: 12, fontWeight: '600', color: COLORS.obsidian, marginBottom: 6, marginLeft: 4}}>Password</Text>
                <View style={{ 
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: COLORS.surface, 
                  borderRadius: 12, height: 50, paddingHorizontal: 16,
                  borderWidth: 1, borderColor: errors.password ? COLORS.error : COLORS.border
                }}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.grayLight} />
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.grayLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={{ flex: 1, marginLeft: 12, color: COLORS.obsidian, fontSize: 15, fontWeight: '500' }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.grayLight} />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={{ color: COLORS.error, fontSize: 11, marginTop: 4, marginLeft: 4 }}>{errors.password}</Text>}
              </View>

              {/* Forgot Password Link */}
              {mode === 'login' && (
                <TouchableOpacity style={{ alignSelf: 'flex-end' }}>
                  <Text style={{ color: COLORS.obsidian, fontWeight: '600', fontSize: 13 }}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              {/* ─── ACTION BUTTON ─── */}
              <TouchableOpacity 
                onPress={handleAuth}
                disabled={loading}
                style={{ 
                  marginTop: 16,
                  backgroundColor: COLORS.obsidian,
                  height: 52, borderRadius: 14,
                  justifyContent: 'center', alignItems: 'center',
                  shadowColor: COLORS.obsidian, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8
                }}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.surface} />
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.surface }}>
                    {mode === 'login' ? 'Log In' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            
             {/* ─── SOCIALS ─── */}
             <View style={{ marginTop: SPACING.xxl, alignItems: 'center' }}>
              <View style={{flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20}}>
                  <View style={{flex: 1, height: 1, backgroundColor: COLORS.border}} />
                  <Text style={{ color: COLORS.grayDark, fontSize: 12, marginHorizontal: 16, fontWeight: '500' }}>Or continue with</Text>
                  <View style={{flex: 1, height: 1, backgroundColor: COLORS.border}} />
              </View>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                {['logo-google', 'logo-apple'].map((icon, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={{ 
                      width: 56, height: 56, borderRadius: 14, 
                      backgroundColor: COLORS.surface, 
                      justifyContent: 'center', alignItems: 'center',
                      borderWidth: 1, borderColor: COLORS.border
                    }}
                  >
                    <Ionicons name={icon} size={24} color={COLORS.obsidian} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ─── FOOTER ─── */}
            <View style={{marginTop: SPACING.xl, marginBottom: SPACING.xl}}>
               <Text style={{textAlign: 'center', fontSize: 11, color: COLORS.grayLight}}>
                 By continuing, you agree to our Terms & Privacy Policy.
               </Text>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}