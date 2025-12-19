import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ScrollView, 
  Alert,
  Switch
} from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 🎨 Premium Theme
const COLORS = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  obsidian: '#111827',
  primary: '#7E22CE', // Dark Purple
  secondary: '#F3F4F6',
  gray: '#6B7280',
  red: '#EF4444',
  border: '#E5E7EB',
};

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // In a real app, you'd fetch this from a 'profiles' table
      setProfile({
        email: user.email,
        name: "Foodie Student", // Placeholder
        phone: "+91 98765 43210" // Placeholder
      });
    }
  };

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Log Out", 
        style: "destructive", 
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/login');
        }
      }
    ]);
  };

  // 🔘 Menu Item Component
  const MenuItem = ({ icon, label, subtext, isDestructive, onPress, hasSwitch }) => (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7}
      disabled={hasSwitch}
      style={[styles.menuItem, isDestructive && styles.menuItemDestructive]}
    >
      <View style={[styles.iconBox, isDestructive && { backgroundColor: '#FEE2E2' }]}>
        <Ionicons 
          name={icon} 
          size={20} 
          color={isDestructive ? COLORS.red : COLORS.obsidian} 
        />
      </View>
      
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={[styles.menuLabel, isDestructive && { color: COLORS.red }]}>{label}</Text>
        {subtext && <Text style={styles.menuSubtext}>{subtext}</Text>}
      </View>

      {hasSwitch ? (
        <Switch 
          value={notifications} 
          onValueChange={setNotifications} 
          trackColor={{ false: '#767577', true: COLORS.primary }}
          thumbColor={'#fff'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={COLORS.gray} style={{ opacity: 0.5 }} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* 🟢 Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* 👤 Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
             <Text style={styles.avatarText}>{profile?.email?.[0].toUpperCase() || 'U'}</Text>
          </View>
          <View>
             <Text style={styles.userName}>{profile?.name || 'User'}</Text>
             <Text style={styles.userEmail}>{profile?.email}</Text>
             <Text style={styles.userPhone}>{profile?.phone}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
             <Ionicons name="pencil" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* 📦 Section: Account */}
        <Text style={styles.sectionTitle}>My Account</Text>
        <View style={styles.section}>
           <MenuItem icon="receipt-outline" label="Order History" subtext="Past tiffins & meals" onPress={() => router.push('/(tabs)/orders')} />
           <View style={styles.divider} />
           <MenuItem icon="location-outline" label="Saved Addresses" subtext="Home, Hostel, College" />
           <View style={styles.divider} />
           <MenuItem icon="wallet-outline" label="Payment Methods" subtext="UPI, Cards" />
        </View>

        {/* ⚙️ Section: Settings */}
        <Text style={styles.sectionTitle}>App Settings</Text>
        <View style={styles.section}>
           <MenuItem icon="notifications-outline" label="Push Notifications" hasSwitch={true} />
           <View style={styles.divider} />
           <MenuItem icon="language-outline" label="Language" subtext="English" />
        </View>

        {/* ⚠️ Section: Actions */}
        <Text style={styles.sectionTitle}>More</Text>
        <View style={styles.section}>
           <MenuItem icon="help-buoy-outline" label="Help & Support" />
           <View style={styles.divider} />
           <MenuItem icon="log-out-outline" label="Log Out" isDestructive={true} onPress={handleLogout} />
        </View>

        <Text style={styles.version}>TiffinTales v1.0.2</Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingBottom: 16, backgroundColor: COLORS.background },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.obsidian },

  // Profile Card
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20, marginBottom: 24,
    padding: 20, borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    borderWidth: 1, borderColor: COLORS.border
  },
  avatarContainer: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#F3E8FF', // Light purple
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: COLORS.primary },
  userName: { fontSize: 18, fontWeight: '800', color: COLORS.obsidian },
  userEmail: { fontSize: 14, color: COLORS.gray, marginVertical: 2 },
  userPhone: { fontSize: 13, color: COLORS.gray, fontWeight: '500' },
  editBtn: { position: 'absolute', top: 16, right: 16, padding: 8 },

  // Sections
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.gray, marginLeft: 24, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  section: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20, marginBottom: 24,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border
  },
  divider: { height: 1, backgroundColor: COLORS.secondary, marginLeft: 56 },

  // Menu Item
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuItemDestructive: { backgroundColor: '#FEF2F2' },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center'
  },
  menuLabel: { fontSize: 16, fontWeight: '600', color: COLORS.obsidian },
  menuSubtext: { fontSize: 12, color: COLORS.gray, marginTop: 2 },

  version: { textAlign: 'center', color: COLORS.gray, fontSize: 12, marginBottom: 20, opacity: 0.5 }
});