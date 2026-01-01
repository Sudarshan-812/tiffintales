import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';

import { supabase } from '../../lib/supabase';

const COLORS = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  obsidian: '#111827',
  primary: '#7E22CE',
  primaryLight: '#F3E8FF',
  text: '#1F293B',
  subtext: '#64748B',
  border: '#E2E8F0',
  white: '#FFFFFF',
  
  // Status Colors
  pending: '#B45309',
  cooking: '#1D4ED8',
  ready: '#047857',
  delivered: '#111827',
  rejected: '#EF4444',
  
  // UI Specific
  cardHeaderBg: '#FAFAFA',
  cardHeaderBorder: '#F3F4F6',
  progressBarBg: '#E5E7EB',
};

/**
 * Animated Status Component
 * Displays Lottie animations based on order status
 */
const OrderStatus = ({ status }) => {
  let config = { color: COLORS.subtext, label: 'Unknown', progress: 0 };
  let lottieSource = null;

  switch (status) {
    case 'pending':
      config = { color: COLORS.pending, label: 'Order Received', progress: 0.2 };
      break;
    case 'cooking':
      config = { color: COLORS.cooking, label: 'Cooking Now', progress: 0.5 };
      lottieSource = "https://lottie.host/f83bf95f-ec6a-4c4c-939c-97d56fa85beb/kXUGrR2XiI.lottie";
      break;
    case 'ready':
      config = { color: COLORS.ready, label: 'Ready for Pickup', progress: 0.8 };
      lottieSource = "https://lottie.host/2f4d2d29-496f-4c11-acdf-4fe9141ba241/eOpmUQ1LDI.lottie";
      break;
    case 'delivered':
      config = { color: COLORS.delivered, label: 'Delivered', progress: 1.0 };
      break;
    case 'rejected':
      config = { color: COLORS.rejected, label: 'Order Cancelled', progress: 0 };
      lottieSource = "https://lottie.host/dc405669-d1f8-47a0-887b-a5c62c15da39/00vc7FA6Ei.lottie";
      break;
  }

  return (
    <View style={styles.statusContainer}>
      <View style={styles.statusHeader}>
        <View style={styles.statusLabelContainer}>
          <Text style={[styles.statusTitle, { color: config.color }]}>{config.label}</Text>
          <Text style={styles.statusSub}>
             {status === 'cooking' ? 'Chef is at work' : status === 'ready' ? 'Rider is on the way' : 'Update pending'}
          </Text>
        </View>

        {lottieSource ? (
          <View style={styles.lottieWrapper}>
            <LottieView source={{ uri: lottieSource }} autoPlay loop style={styles.lottie} />
          </View>
        ) : (
          <View style={[styles.staticIcon, { backgroundColor: config.color + '15' }]}>
             <Ionicons name={status === 'delivered' ? 'checkmark' : 'time'} size={18} color={config.color} />
          </View>
        )}
      </View>

      {/* Progress Bar for Active Orders */}
      {status !== 'rejected' && status !== 'delivered' && (
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${config.progress * 100}%`, backgroundColor: config.color }]} />
        </View>
      )}
    </View>
  );
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Fetch Orders (Initial and for large changes)
  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items (quantity, price, menu_items ( name, image_url ))`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.log('Fetch Error:', error); // Retained per guidelines for catch blocks
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchOrders(); }, []));

  // 2. ⚡️ REALTIME LISTENER
  useEffect(() => {
    let channel;

    const initializeRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Unique channel prevents "binding mismatch" errors
      channel = supabase.channel(`public:orders:user=${user.id}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'orders',
            filter: `user_id=eq.${user.id}` 
          },
          (payload) => {
            if (payload.eventType === 'UPDATE') {
              // Optimistic UI update: only swap the modified order
              setOrders((prev) => 
                prev.map((o) => o.id === payload.new.id ? { ...o, ...payload.new } : o)
              );
            } else {
              // For INSERT/DELETE, do a fresh fetch to get related data
              fetchOrders();
            }
          }
        )
        .subscribe();
    };

    initializeRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // Card Rendering Helper
  const OrderCard = ({ item }) => {
    const firstItem = item.order_items?.[0];
    const isLive = ['pending', 'cooking', 'ready'].includes(item.status);

    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
            <OrderStatus status={item.status} />
        </View>
        <View style={styles.cardContent}>
          <Image 
            source={{ uri: firstItem?.menu_items?.image_url || 'https://via.placeholder.com/100' }} 
            style={styles.foodImage} 
          />
          <View style={styles.infoColumn}>
            <View style={styles.rowBetween}>
               <Text style={styles.foodTitle} numberOfLines={1}>{firstItem?.menu_items?.name || "Tiffin Meal"}</Text>
               <Text style={styles.priceTag}>₹{item.total_price}</Text>
            </View>
            <Text style={styles.foodSubtitle}>
              {item.order_items.length > 1 ? `+${item.order_items.length - 1} more items` : '1 Item'}
            </Text>
          </View>
        </View>
        {isLive && (
          <View style={styles.cardFooter}>
            <TouchableOpacity style={styles.trackButton}>
              <Text style={styles.trackButtonText}>Track Order</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>My Orders</Text>
      </View>
      {loading ? (
        <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <OrderCard item={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  screenHeader: {
    padding: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.obsidian,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  cardContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: COLORS.cardHeaderBg,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardHeaderBorder,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  statusSub: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  lottieWrapper: {
    width: 50,
    height: 50,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  staticIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: COLORS.progressBarBg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  infoColumn: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  foodTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  priceTag: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  foodSubtitle: {
    fontSize: 13,
    color: COLORS.subtext,
  },
  cardFooter: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  trackButton: {
    backgroundColor: COLORS.obsidian,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    marginRight: 8,
  },
});