import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../lib/store';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import OrderCard from '../../components/OrderCard';

// 🎨 BRAND THEME
const COLORS = {
  background: '#F8F9FA', 
  obsidian: '#1A0B2E',   
  gold: '#F59E0B',       
  white: '#FFFFFF',
  gray: '#64748B',
  red: '#EF4444',
  border: '#E2E8F0',
};

export default function ChefDashboard() {
  const { user, signOut } = useCart();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ earnings: 0, active: 0 });

  // 🔄 REFRESH DATA LOGIC (Self-Healing Version)
  const fetchDashboardData = async () => {
    
    // 1. 🛡️ Try to get user from Store OR Supabase directly
    let currentUser = user;

    if (!currentUser) {
      console.log("🔄 Store empty. Checking Supabase session...");
      const { data } = await supabase.auth.getUser();
      currentUser = data.user;
    }

    // 2. 🚨 If STILL no user, we are truly logged out.
    if (!currentUser) {
      console.log("❌ No active session. Redirecting to login.");
      setLoading(false);
      // Optional: router.replace('/login'); 
      // (Commented out to prevent accidental kicks during dev, uncomment for production)
      return;
    }
    
    console.log("------------------------------------------------");
    console.log("👨‍🍳 Fetching Orders for Chef ID:", currentUser.id);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items ( name, price )
          )
        `)
        .eq('chef_id', currentUser.id) // 👈 Use the confirmed currentUser
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log(`✅ Success! Found ${data?.length || 0} orders.`);
      setOrders(data || []);

      // Calculate Stats
      const today = new Date().toISOString().split('T')[0];
      const earnings = (data || [])
        .filter(o => o.created_at.startsWith(today) && o.status === 'ready')
        .reduce((sum, o) => sum + parseFloat(o.total_price), 0);
      
      const activeCount = (data || [])
        .filter(o => ['pending', 'cooking'].includes(o.status)).length;

      setStats({ earnings, active: activeCount });

    } catch (error) {
      console.error("🚨 DASHBOARD ERROR:", error.message);
      Alert.alert("Error Loading Dashboard", error.message);
    } finally {
      setLoading(false);
    }
  };

  // ⚡ Auto-Fetch when screen opens
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert("Close Kitchen?", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: async () => {
          await signOut();
          router.replace('/login');
      }}
    ]);
  };

  const Header = () => (
    <View style={styles.headerContainer}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Kitchen Desk</Text>
          <Text style={styles.subGreeting}>Live status overview</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="power" size={20} color={COLORS.red} />
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCardPrimary}>
          <Text style={styles.statLabelLight}>TODAY'S REVENUE</Text>
          <Text style={styles.statValueLarge}>₹{stats.earnings}</Text>
        </View>
        <View style={styles.statCardSecondary}>
          <Text style={styles.statLabelDark}>ACTIVE</Text>
          <Text style={styles.statValueSmall}>{stats.active}</Text>
        </View>
      </View>

      {/* List Title */}
      <View style={styles.sectionHeader}>
        <Ionicons name="list" size={16} color={COLORS.gray} />
        <Text style={styles.sectionTitle}>ORDERS FEED</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {loading && !refreshing ? (
           <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.obsidian} />
              <Text style={{ textAlign: 'center', marginTop: 10, color: COLORS.gray }}>Loading Kitchen...</Text>
           </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <OrderCard order={item} onUpdate={fetchDashboardData} />
            )}
            ListHeaderComponent={Header}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.obsidian} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={50} color={COLORS.border} />
                <Text style={styles.emptyText}>No orders yet</Text>
                <Text style={styles.emptySubtext}>Your menu is live. Waiting for students!</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: { paddingHorizontal: 16, paddingTop: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: 22, fontWeight: '900', color: COLORS.obsidian },
  subGreeting: { fontSize: 13, color: COLORS.gray, fontWeight: '500' },
  logoutBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFEBEB', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCardPrimary: { flex: 2, backgroundColor: COLORS.obsidian, padding: 18, borderRadius: 18, justifyContent: 'center' },
  statCardSecondary: { flex: 1, backgroundColor: COLORS.white, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center' },
  statLabelLight: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 },
  statLabelDark: { fontSize: 11, fontWeight: '700', color: COLORS.gray, letterSpacing: 0.5 },
  statValueLarge: { fontSize: 26, fontWeight: '800', color: 'white', marginTop: 4 },
  statValueSmall: { fontSize: 26, fontWeight: '800', color: COLORS.obsidian, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingLeft: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.gray, letterSpacing: 1 },
  emptyContainer: { alignItems: 'center', marginTop: 60, opacity: 0.8 },
  emptyText: { fontSize: 18, fontWeight: '700', color: COLORS.gray, marginTop: 10 },
  emptySubtext: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
});