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
  Alert
} from 'react-native';

// Third-party Imports
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Local Imports
import { supabase } from '../../lib/supabase';

// 🎨 Premium Theme
const COLORS = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  obsidian: '#111827',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  green: '#10B981',
  orange: '#F59E0B',
  blue: '#3B82F6',
  red: '#EF4444',
  border: '#E5E7EB',
};

/**
 * StatusBadge Component
 * Renders a color-coded badge based on the order status.
 * @param {object} props
 * @param {string} props.status - The current status of the order (pending, cooking, etc.)
 */
const StatusBadge = ({ status }) => {
  let color = COLORS.gray;
  let icon = 'time-outline';
  let bg = COLORS.lightGray;
  let label = status;

  switch (status) {
    case 'pending':
      color = COLORS.orange;
      icon = 'hourglass-outline';
      bg = '#FEF3C7';
      label = 'Waiting for Chef';
      break;
    case 'cooking':
      color = COLORS.blue;
      icon = 'flame';
      bg = '#EFF6FF';
      label = 'Cooking Now';
      break;
    case 'ready':
      color = COLORS.green;
      icon = 'bicycle';
      bg = '#D1FAE5';
      label = 'Out for Delivery';
      break;
    case 'delivered':
      color = COLORS.obsidian;
      icon = 'checkmark-circle';
      bg = '#F3F4F6';
      label = 'Delivered';
      break;
    case 'rejected':
      color = COLORS.red;
      icon = 'close-circle';
      bg = '#FEE2E2';
      label = 'Cancelled';
      break;
    default:
      label = status;
  }

  return (
    <View style={[styles.badgeContainer, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={12} color={color} style={styles.badgeIcon} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
};

/**
 * OrderCard Component
 * Renders individual order details in the list.
 * @param {object} props
 * @param {object} props.item - The order data object
 */
const OrderCard = ({ item }) => {
  // Safe navigation to get the first image or fallback
  const firstItemImage = item.order_items?.[0]?.menu_items?.image_url;
  
  // Create a summary string of items (e.g., "2x Burger, 1x Coke")
  const itemsSummary = item.order_items
    .map(i => `${i.quantity}x ${i.menu_items?.name}`)
    .join(', ');

  return (
    <View style={styles.card}>
      {/* Header: Date & Status */}
      <View style={styles.cardHeader}>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.divider} />

      {/* Content Row */}
      <View style={styles.contentRow}>
        <Image
          source={{ uri: firstItemImage || 'https://via.placeholder.com/100' }}
          style={styles.image}
        />

        <View style={styles.info}>
          <Text style={styles.itemsText} numberOfLines={2}>
            {itemsSummary}
          </Text>
          <Text style={styles.price}>₹{item.total_price}</Text>
        </View>
      </View>

      {/* Footer: Order ID */}
      <View style={styles.footer}>
        <Text style={styles.orderId}>ID: #{item.id.toString().slice(-6)}</Text>
      </View>
    </View>
  );
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Fetches the user's order history from Supabase.
   */
  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price,
            menu_items ( name, image_url )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);

    } catch (error) {
      Alert.alert('Error', 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🔄 Fetch on Screen Focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  /**
   * Realtime Listener
   * Subscribes to updates on the 'orders' table to update status live (e.g. pending -> cooking).
   */
  useEffect(() => {
    const channel = supabase.channel('student_orders')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders(currentOrders =>
            currentOrders.map(o =>
              o.id === payload.new.id ? { ...o, status: payload.new.status } : o
            )
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Your Orders</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.obsidian} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <OrderCard item={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color={COLORS.gray} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No active orders</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.browseButton}>
                <Text style={styles.browseButtonText}>Browse Menu</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  screenHeader: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 10,
    backgroundColor: COLORS.background
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.obsidian
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContent: {
    padding: 20,
    paddingBottom: 100
  },
  // Status Badge
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  badgeIcon: {
    marginRight: 4
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  date: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '600'
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginBottom: 12
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
    marginRight: 12
  },
  info: {
    flex: 1
  },
  itemsText: {
    fontSize: 14,
    color: COLORS.obsidian,
    fontWeight: '500',
    marginBottom: 4
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.obsidian
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  orderId: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100
  },
  emptyIcon: {
    opacity: 0.5
  },
  emptyText: {
    marginTop: 16,
    color: COLORS.gray,
    fontSize: 16,
    fontWeight: '600'
  },
  browseButton: {
    marginTop: 20
  },
  browseButtonText: {
    color: COLORS.obsidian,
    fontWeight: '700'
  }
});