import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  Switch,
  Image
} from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 🎨 Premium Theme
const COLORS = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  primary: '#7E22CE',
  primaryLight: '#F3E8FF',
  text: '#1E293B',
  subtext: '#64748B',
  border: '#E2E8F0',
  red: '#EF4444',
  redLight: '#FEF2F2',
  blueLight: '#DBEAFE',
  blue: '#2563EB',
  orangeLight: '#FFEDD5',
  orange: '#F97316',
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
      setProfile({
        email: user.email,
        name: "Foodie Student",
        phone: "+91 98765 43210",
        joined: "Aug 2024"
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

  // 🧱 Quick Stat Component
  const QuickStat = ({ label, value, icon }) => (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
         <Ionicons name={icon} size={12} color={COLORS.subtext} style={{ marginRight: 4 }} />
         <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  // 🔘 Menu Item Component
  const MenuItem = ({ icon, color, bg, label, subtext, onPress, hasSwitch, isDestructive }) => (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7}
      disabled={hasSwitch}
      style={styles.menuItem}
    >
      {/* Icon */}
      <View style={[styles.iconBox, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      
      {/* Text */}
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={[styles.menuLabel, isDestructive && { color: COLORS.red }]}>{label}</Text>
        {subtext && <Text style={styles.menuSubtext}>{subtext}</Text>}
      </View>

      {/* Action */}
      {hasSwitch ? (
        <Switch 
          value={notifications} 
          onValueChange={setNotifications} 
          trackColor={{ false: '#CBD5E1', true: COLORS.primary }}
          thumbColor={'#fff'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* 👤 Header Profile */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
             <Text style={styles.avatarText}>{profile?.email?.[0].toUpperCase() || 'U'}</Text>
             <TouchableOpacity style={styles.editBadge}>
                <Ionicons name="camera" size={12} color="white" />
             </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{profile?.name || 'Loading...'}</Text>
          <Text style={styles.userHandle}>{profile?.email}</Text>
          <Text style={styles.userPhone}>{profile?.phone}</Text>
        </View>

        {/* 📊 Quick Stats */}
        <View style={styles.statsRow}>
           <QuickStat label="Orders" value="12" icon="receipt" />
           <View style={styles.vertDivider} />
           <QuickStat label="Saved" value="₹450" icon="wallet" />
           <View style={styles.vertDivider} />
           <QuickStat label="Joined" value={profile?.joined || "2024"} icon="calendar" />
        </View>

        {/* 📦 Section: My Account */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>MY ACCOUNT</Text>
          <View style={styles.sectionCard}>
             <MenuItem 
                icon="fast-food" color={COLORS.orange} bg={COLORS.orangeLight} 
                label="Your Orders" subtext="Track active & past orders" 
                onPress={() => router.push('/(tabs)/orders')} 
             />
             <View style={styles.divider} />
             <MenuItem 
                icon="location" color={COLORS.blue} bg={COLORS.blueLight} 
                label="Address Book" subtext="Manage delivery locations" 
             />
          </View>
        </View>

        {/* ⚙️ Section: Settings */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.sectionCard}>
             <MenuItem 
                icon="notifications" color={COLORS.primary} bg={COLORS.primaryLight} 
                label="Notifications" hasSwitch={true} 
             />
             <View style={styles.divider} />
             <MenuItem 
                icon="moon" color="#475569" bg="#F1F5F9" 
                label="Dark Mode" subtext="Coming soon" 
             />
          </View>
        </View>

        {/* ⚠️ Section: Danger */}
        <View style={styles.sectionContainer}>
           <View style={styles.sectionCard}>
             <MenuItem 
                icon="log-out" color={COLORS.red} bg={COLORS.redLight} 
                label="Log Out" isDestructive={true} 
                onPress={handleLogout} 
             />
           </View>
        </View>

        <View style={{ alignItems: 'center', marginTop: 20 }}>
           <Text style={styles.versionText}>TiffinTales v1.0.2 • Made with ❤️</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Profile Header
  profileHeader: { alignItems: 'center', marginTop: 20, marginBottom: 24 },
  avatarContainer: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3, borderColor: COLORS.surface,
    shadowColor: COLORS.primary, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: {width:0, height:4}, elevation: 5
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: COLORS.primary },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: COLORS.primary, width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.surface
  },
  userName: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  userHandle: { fontSize: 14, color: COLORS.subtext, marginTop: 2 },
  userPhone: { fontSize: 13, color: COLORS.subtext, marginTop: 2, fontWeight: '500' },

  // Stats Row
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center',
    backgroundColor: COLORS.surface, marginHorizontal: 20, paddingVertical: 16, borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, marginBottom: 30
  },
  statItem: { alignItems: 'center', width: '30%' },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 11, fontWeight: '600', color: COLORS.subtext },
  vertDivider: { width: 1, height: 24, backgroundColor: COLORS.border },

  // Sections
  sectionContainer: { marginBottom: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.subtext, marginBottom: 8, marginLeft: 8, letterSpacing: 1 },
  sectionCard: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden'
  },
  
  // Menu Items
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 18 },
  iconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  menuSubtext: { fontSize: 12, color: COLORS.subtext, marginTop: 2 },
  
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 70 }, // Indented divider
  versionText: { fontSize: 12, color: COLORS.subtext, opacity: 0.6 }
});