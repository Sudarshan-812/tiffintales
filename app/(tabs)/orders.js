import { View, Text, FlatList, RefreshControl, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Fetch Student's Orders
  async function fetchOrders() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 🛑 FIXED QUERY: Removed 'email' from chef request
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          chef:chef_id (role), 
          order_items (
            quantity,
            menu_items (name, price)
          )
        `)
        .eq('user_id', user.id) // Only MY orders
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);

    } catch (error) {
      console.error("Order Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  // 🎨 Status Visuals (Student View)
  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { 
          bgGradient: ['#FFFBEB', '#FEF3C7'], 
          accent: '#F59E0B',
          text: '#92400E',
          label: 'Sent to Chef',
          icon: 'paper-plane',
          desc: 'Waiting for chef to accept...'
        };
      case 'cooking':
        return { 
          bgGradient: ['#FFF7ED', '#FFEDD5'], 
          accent: '#EA580C',
          text: '#9A3412',
          label: 'Being Prepared',
          icon: 'flame',
          desc: 'Your food is on the stove!'
        };
      case 'ready':
        return { 
          bgGradient: ['#F0FDF4', '#DCFCE7'], 
          accent: '#059669',
          text: '#065F46',
          label: 'Ready for Pickup',
          icon: 'gift',
          desc: 'Head to the kitchen to collect.'
        };
      default:
        return { 
            bgGradient: ['#F3F4F6', '#E5E7EB'], 
            accent: '#6B7280', 
            text: '#374151',
            label: 'Unknown',
            icon: 'help',
            desc: 'Status unknown'
        };
    }
  };

  // --- RENDER ITEM ---
  const renderOrder = ({ item }) => {
    const status = getStatusConfig(item.status);

    return (
      <View style={styles.cardContainer}>
        {/* Header Gradient */}
        <LinearGradient
          colors={status.bgGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerRow}>
            <View>
                <Text style={styles.dateText}>
                    {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
                <Text style={styles.chefText}>Order #{item.id.slice(0,5)}</Text>
            </View>
            <View style={[styles.statusBadge, { shadowColor: status.accent }]}>
                <Ionicons name={status.icon} size={14} color={status.accent} />
                <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.contentContainer}>
            {/* Status Description */}
            <View style={styles.statusMessage}>
                <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
                <Text style={styles.statusDesc}>{status.desc}</Text>
            </View>

            {/* Items */}
            {item.order_items.map((orderItem, index) => (
                <View key={index} style={styles.itemRow}>
                    <Text style={styles.itemText}>
                        <Text style={{fontWeight: 'bold'}}>{orderItem.quantity}x </Text>
                        {orderItem.menu_items?.name}
                    </Text>
                    <Text style={styles.itemPrice}>₹{orderItem.menu_items?.price * orderItem.quantity}</Text>
                </View>
            ))}

            <View style={styles.divider} />
            
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Paid</Text>
                <Text style={styles.totalAmount}>₹{item.total_price}</Text>
            </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>My Orders 📦</Text>
        </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1A0B2E" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No orders yet.</Text>
                <TouchableOpacity onPress={() => router.push('/')} style={styles.browseButton}>
                    <Text style={styles.browseText}>Browse Menu</Text>
                </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { padding: 24, paddingTop: 60, backgroundColor: 'white' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1A0B2E' },
  cardContainer: {
    backgroundColor: 'white', borderRadius: 20, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4,
    overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6'
  },
  headerGradient: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 10, color: '#6B7280', fontWeight: '600', marginBottom: 4 },
  chefText: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  statusBadge: { backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  statusText: { fontSize: 10, fontWeight: '800', marginLeft: 4, textTransform: 'uppercase' },
  contentContainer: { padding: 16 },
  statusMessage: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 10, borderRadius: 10, marginBottom: 16 },
  statusDesc: { fontSize: 13, color: '#4B5563', marginLeft: 8, fontWeight: '500' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemText: { fontSize: 14, color: '#374151' },
  itemPrice: { fontSize: 14, color: '#6B7280' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 12, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase' },
  totalAmount: { fontSize: 20, fontWeight: '800', color: '#1A0B2E' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, color: '#9CA3AF', marginBottom: 20 },
  browseButton: { backgroundColor: '#1A0B2E', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30 },
  browseText: { color: 'white', fontWeight: 'bold' }
});