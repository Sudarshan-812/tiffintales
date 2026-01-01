import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Animatable from 'react-native-animatable';

import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../../lib/supabase';
import { useCart } from '../../lib/store';
import OrderCard from '../../components/OrderCard';

const COLORS = {
  background: '#F1F5F9',
  obsidian: '#0F172A',
  primary: '#7E22CE',
  accent: '#F59E0B',
  white: '#FFFFFF',
  gray: '#64748B',
  red: '#EF4444',
  border: '#E2E8F0',
  success: '#10B981',
  obsidianGradientStart: '#0F172A',
  obsidianGradientEnd: '#1E293B',
  statLabelLight: 'rgba(255,255,255,0.5)',
  statIconBackground: 'rgba(255,255,255,0.1)',
};

const DashboardHeader = ({ stats, onLogout }) => (
  <View style={styles.headerWrapper}>
    <View style={styles.topRow}>
      <View>
        <Text style={styles.welcomeText}>Kitchen Desk</Text>
        <Text style={styles.statusSubtext}>Live Operations Center</Text>
      </View>
      <TouchableOpacity onPress={onLogout} style={styles.powerBtn}>
        <Ionicons name="power-outline" size={20} color={COLORS.red} />
      </TouchableOpacity>
    </View>

    <View style={styles.mainStatsContainer}>
      <LinearGradient
        colors={[COLORS.obsidianGradientStart, COLORS.obsidianGradientEnd]}
        style={styles.primaryStatCard}
      >
        <View style={styles.statInfo}>
          <Text style={styles.statLabelLight}>TODAY'S REVENUE</Text>
          <Text style={styles.revenueValue}>₹{stats.earnings}</Text>
        </View>
        <View style={styles.statIconCircle}>
          <Ionicons name="wallet-outline" size={24} color={COLORS.white} />
        </View>
      </LinearGradient>

      <View style={styles.secondaryStatCard}>
        <Text style={styles.statLabelDark}>ACTIVE</Text>
        <Text style={styles.activeValue}>{stats.active}</Text>
        <View style={styles.activeIndicator} />
      </View>
    </View>

    <View style={styles.feedHeader}>
      <Animatable.View 
        animation="pulse" 
        iterationCount="infinite" 
        style={styles.liveDot} 
      />
      <Text style={styles.feedTitle}>LIVE ORDER STREAM</Text>
    </View>
  </View>
);

export default function ChefDashboard() {
  const { signOut } = useCart();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ earnings: 0, active: 0 });

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items (*, menu_items ( name, price ))`)
        .eq('chef_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const orderList = data || [];
      setOrders(orderList);

      // Calculate earnings for today only for 'ready' orders
      const today = new Date().toISOString().split('T')[0];
      const todayEarnings = orderList
        .filter(o => o.created_at.startsWith(today) && o.status === 'ready')
        .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);

      // Calculate active orders count
      const activeOrderCount = orderList
        .filter(o => ['pending', 'cooking'].includes(o.status)).length;

      setStats({ earnings: todayEarnings, active: activeOrderCount });
    } catch (error) {
      console.error(error); // console.error for catch blocks as per guidelines
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, []));

  useEffect(() => {
    let channel;
    const connectRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase.channel(`chef_dash_${user.id}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'orders', 
            filter: `chef_id=eq.${user.id}` 
        }, () => fetchDashboardData())
        .subscribe();
    };

    connectRealtime();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <Animatable.View animation="fadeInUp" delay={index * 50}>
               <OrderCard order={item} onUpdate={fetchDashboardData} />
            </Animatable.View>
          )}
          ListHeaderComponent={<DashboardHeader stats={stats} onLogout={signOut} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchDashboardData} />}
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
  safeArea: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerWrapper: {
    padding: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.obsidian,
  },
  statusSubtext: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '600',
  },
  powerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  mainStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 25,
  },
  primaryStatCard: {
    flex: 1.8,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secondaryStatCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statInfo: {
    flex: 1,
  },
  statLabelLight: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.statLabelLight,
    letterSpacing: 1,
  },
  statLabelDark: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gray,
    letterSpacing: 1,
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 4,
  },
  activeValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.obsidian,
    marginTop: 4,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.statIconBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 5,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    marginRight: 8,
  },
  feedTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.gray,
    letterSpacing: 1.5,
  },
});