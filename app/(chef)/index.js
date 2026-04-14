import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  StyleSheet, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../../lib/supabase';
import { useCart } from '../../lib/store';
import OrderCard from '../../components/OrderCard';
import { COLORS, SHADOW, RADIUS } from '../../lib/theme';
import AnimatedIcon from '../../components/AnimatedIcon';

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon, gradient, badge }) => (
  <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCard}>
    <View style={styles.statTop}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statIconCircle}>
        <Ionicons name={icon} size={16} color="#FFF" />
      </View>
    </View>
    <Text style={styles.statValue}>{value}</Text>
    {badge ? (
      <View style={styles.statBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.statBadgeText}>{badge}</Text>
      </View>
    ) : null}
  </LinearGradient>
);

// ─── Live Pulse Dot ───────────────────────────────────────────────────────────

function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.8, duration: 800, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ width: 14, height: 14, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={{
        position: 'absolute',
        width: 14, height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.success + '40',
        transform: [{ scale }],
      }} />
      <View style={styles.pulseCore} />
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyOrders = () => (
  <View style={styles.empty}>
    <Text style={styles.emptyEmoji}>🍳</Text>
    <Text style={styles.emptyTitle}>Kitchen's quiet</Text>
    <Text style={styles.emptySub}>New orders will appear here in real-time.</Text>
  </View>
);

// ─── Dashboard Header ─────────────────────────────────────────────────────────

const DashboardHeader = ({ stats, onLogout }) => (
  <View style={styles.header}>
    <View style={styles.topRow}>
      <View>
        <Text style={styles.headerTag}>CHEF DASHBOARD</Text>
        <Text style={styles.headerTitle}>Kitchen Desk</Text>
      </View>
      <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
      </TouchableOpacity>
    </View>

    <View style={styles.statsRow}>
      <StatCard
        label="REVENUE"
        value={`₹${stats.earnings}`}
        icon="wallet-outline"
        gradient={[COLORS.obsidian, COLORS.dark]}
      />
      <StatCard
        label="ACTIVE"
        value={stats.active.toString()}
        icon="flame-outline"
        gradient={[COLORS.primary, COLORS.primaryDark]}
        badge={stats.active > 0 ? 'Live' : undefined}
      />
      <StatCard
        label="DONE"
        value={stats.done.toString()}
        icon="checkmark-circle-outline"
        gradient={[COLORS.success, '#059952']}
      />
    </View>

    <View style={styles.streamRow}>
      <PulseDot />
      <Text style={styles.streamText}>LIVE ORDER STREAM</Text>
    </View>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChefDashboard() {
  const { signOut } = useCart();
  const router = useRouter();

  const [orders,     setOrders]     = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [stats,      setStats]      = useState({ earnings: 0, active: 0, done: 0 });

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, menu_items(name, price))')
        .eq('chef_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const list  = data || [];
      const today = new Date().toISOString().split('T')[0];

      setOrders(list);
      setStats({
        earnings: list
          .filter(o => o.created_at.startsWith(today) && ['ready', 'delivered'].includes(o.status))
          .reduce((s, o) => s + parseFloat(o.total_price || 0), 0),
        active: list.filter(o => ['pending', 'cooking'].includes(o.status)).length,
        done:   list.filter(o => o.created_at.startsWith(today) && o.status === 'delivered').length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  useEffect(() => {
    let channel;
    const connect = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase
        .channel(`chef_orders_${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'orders',
          filter: `chef_id=eq.${user.id}`,
        }, fetchData)
        .subscribe();
    };
    connect();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Exit your kitchen?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => { await signOut(); router.replace('/login'); },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <OrderCard order={item} onUpdate={fetchData} />}
          ListHeaderComponent={<DashboardHeader stats={stats} onLogout={handleLogout} />}
          ListEmptyComponent={<EmptyOrders />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchData(); }}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: COLORS.background },
  safe:        { flex: 1 },
  listContent: { paddingBottom: 100 },
  loader:      { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  // ── Header ───────────────────────────────────────────
  header: {
    padding: 20,
    paddingBottom: 18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTag: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.obsidian,
    letterSpacing: -0.5,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  // ── Stat Cards ───────────────────────────────────────
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  statCard: {
    flex: 1,
    borderRadius: RADIUS.xl,
    padding: 14,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.8,
    maxWidth: 60,
    lineHeight: 12,
  },
  statIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue:     { fontSize: 21, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  statBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  liveDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  statBadgeText: { fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },

  // ── Live stream row ───────────────────────────────────
  streamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseCore: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  streamText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.medium,
    letterSpacing: 1.8,
  },

  // ── Empty ─────────────────────────────────────────────
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.obsidian, marginBottom: 8 },
  emptySub:   { fontSize: 14, color: COLORS.medium, textAlign: 'center', lineHeight: 20 },
});
