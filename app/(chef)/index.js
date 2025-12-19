
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
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

  // 🔄 1. DATA FETCHING LOGIC
  const fetchDashboardData = async () => {
    let currentUser = user;
    if (!currentUser) {
      const { data } = await supabase.auth.getUser();
      currentUser = data.user;
    }
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    // console.log("👨‍🍳 Refreshing Kitchen Board..."); // Commented out to reduce noise

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
        .eq('chef_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);

      // Stats
      const today = new Date().toISOString().split('T')[0];
      const earnings = (data || [])
        .filter(o => o.created_at.startsWith(today) && o.status === 'ready')
        .reduce((sum, o) => sum + parseFloat(o.total_price), 0);
      
      const activeCount = (data || [])
        .filter(o => ['pending', 'cooking'].includes(o.status)).length;

      setStats({ earnings, active: activeCount });

    } catch (error) {
      console.error("🚨 DASHBOARD ERROR:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // ⚡ 2. INITIAL LOAD
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [user])
  );

  // 🔔 3. REALTIME LISTENER (The Magic Part)
  useEffect(() => {
    if (!user) return;

    console.log("📡 Connecting to Realtime Order Stream...");

    const channel = supabase
      .channel('chef-dashboard')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Listen specifically for NEW orders
          schema: 'public',
          table: 'orders',
          filter: `chef_id=eq.${user.id}`, // Only listen for MY orders
        },
        (payload) => {
          console.log("🔔 DING! New Order Received:", payload.new.id);
          
          // 1. Play Sound / Vibrate (Native Alert for now)
          Alert.alert("🔔 New Tiffin Order!", "A student just placed an order.");
          
          // 2. Instantly reload the list to show the new card
          fetchDashboardData();
        }
      )
      .subscribe();

    // Cleanup: Unsubscribe when leaving the screen
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert("Close Kitchen?", "Log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: async () => {
          await signOut();
          router.replace('/login');
      }}
    ]);
  };

  // ... (Header and UI components remain EXACTLY the same as before) ...
  const Header = () => (
    <View style={styles.headerContainer}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Kitchen Desk</Text>
          <Text style={styles.subGreeting}>Live status overview</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="power" size={20} color={COLORS.red} />
        </TouchableOpacity>
      </View>

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

      <View style={styles.sectionHeader}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 }} />
        <Text style={styles.sectionTitle}>LIVE FEED</Text>
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
              <Text style={{ textAlign: 'center', marginTop: 10, color: COLORS.gray }}>Connecting to Kitchen...</Text>
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
                <Text style={styles.emptyText}>No active orders</Text>
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
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingLeft: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.gray, letterSpacing: 1 },
  emptyContainer: { alignItems: 'center', marginTop: 60, opacity: 0.8 },
  emptyText: { fontSize: 18, fontWeight: '700', color: COLORS.gray, marginTop: 10 },
});