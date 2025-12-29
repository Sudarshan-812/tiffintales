import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Third-party Imports
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Local Imports
import { supabase } from '../../lib/supabase';
import { useCart } from '../../lib/store';
import OrderCard from '../../components/OrderCard';

// 🎨 Brand Theme Constants
const COLORS = {
  background: '#F8F9FA',
  obsidian: '#1A0B2E',
  gold: '#F59E0B',
  white: '#FFFFFF',
  gray: '#64748B',
  red: '#EF4444',
  border: '#E2E8F0',
  success: '#10B981',
  loadingBg: '#FFEBEB',
};

/**
 * DashboardHeader Component
 * Displays the kitchen status, logout button, and financial summaries.
 * Extracted for performance optimization.
 */
const DashboardHeader = ({ stats, onLogout }) => (
  <View style={styles.headerContainer}>
    <View style={styles.topBar}>
      <View>
        <Text style={styles.greeting}>Kitchen Desk</Text>
        <Text style={styles.subGreeting}>Live status overview</Text>
      </View>
      <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
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
      <View style={styles.statusDot} />
      <Text style={styles.sectionTitle}>LIVE FEED</Text>
    </View>
  </View>
);

/**
 * ChefDashboard Screen
 * Main control center for chefs to view orders, revenue, and active status.
 * Handles realtime subscriptions to Supabase for incoming orders.
 */
export default function ChefDashboard() {
  const { user, signOut } = useCart();
  const router = useRouter();

  // State Management
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ earnings: 0, active: 0 });

  /**
   * Fetches orders from Supabase and calculates local dashboard statistics.
   * Handles user session validation internally.
   */
  const fetchDashboardData = async () => {
    let currentUser = user;

    // Fallback: Check Supabase session if store user is missing
    if (!currentUser) {
      const { data } = await supabase.auth.getUser();
      currentUser = data.user;
    }

    if (!currentUser) {
      setLoading(false);
      return;
    }

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

      const orderList = data || [];
      setOrders(orderList);

      // --- Client-side Stats Calculation ---
      const today = new Date().toISOString().split('T')[0];

      // 1. Calculate Today's Earnings (Completed orders only)
      const todayEarnings = orderList
        .filter(o => o.created_at.startsWith(today) && o.status === 'ready')
        .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);

      // 2. Calculate Active Orders (Pending or Cooking)
      const activeOrderCount = orderList
        .filter(o => ['pending', 'cooking'].includes(o.status)).length;

      setStats({ earnings: todayEarnings, active: activeOrderCount });

    } catch (error) {
      // In production, log this to a monitoring service (e.g., Sentry)
      Alert.alert("Error", "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  // Initial Load & Focus Effect
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [user])
  );

  /**
   * Realtime Listener
   * Subscribes to the 'orders' table for INSERT events specific to this chef.
   */
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('chef-dashboard')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `chef_id=eq.${user.id}`,
        },
        () => {
          Alert.alert("🔔 New Tiffin Order!", "A student just placed an order.");
          fetchDashboardData(); // Refresh list immediately
        }
      )
      .subscribe();

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
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace('/login');
        }
      }
    ]);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.obsidian} />
        <Text style={styles.loadingText}>Connecting to Kitchen...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container} edges={['top']}>
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <OrderCard order={item} onUpdate={fetchDashboardData} />
          )}
          ListHeaderComponent={
            <DashboardHeader stats={stats} onLogout={handleLogout} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.obsidian}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={50} color={COLORS.border} />
              <Text style={styles.emptyText}>No active orders</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 10,
    color: COLORS.gray,
  },
  listContent: {
    paddingBottom: 100,
  },
  // Header Styles
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.obsidian,
  },
  subGreeting: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.loadingBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Stats Cards
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCardPrimary: {
    flex: 2,
    backgroundColor: COLORS.obsidian,
    padding: 18,
    borderRadius: 18,
    justifyContent: 'center',
  },
  statCardSecondary: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
  },
  statLabelLight: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  statLabelDark: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray,
    letterSpacing: 0.5,
  },
  statValueLarge: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
    marginTop: 4,
  },
  statValueSmall: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.obsidian,
    marginTop: 4,
  },
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray,
    letterSpacing: 1,
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray,
    marginTop: 10,
  },
});