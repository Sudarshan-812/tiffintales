import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl, ScrollView, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase'; // 👈 Real Database
import { useCart } from '../../lib/store';     // 👈 Get User ID

const { width } = Dimensions.get('window');

// 🎨 OBSIDIAN + CREAM THEME
const COLORS = {
  background: '#FDFBF7', 
  surface: '#FFFFFF',    
  obsidian: '#1A0B2E',   
  gray: '#9CA3AF',       
  border: '#E5E7EB',
  gold: '#F59E0B',       
  green: '#10B981',      
  red: '#EF4444',        
};

const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

// 🎯 STATUS CONFIG
const getStatusConfig = (status) => {
  const configs = {
    ready: { // Changed from 'Delivered' to match DB 'ready'
      bg: '#ECFDF5', 
      text: COLORS.green,
      icon: 'checkmark-circle',
      action: 'Reorder',
    },
    Preparing: {
      bg: '#FFFBEB', 
      text: COLORS.gold,
      icon: 'flame',
      action:  'Track',
    },
    rejected: { // Changed from 'Cancelled' to match DB 'rejected'
      bg: '#FEF2F2', 
      text: COLORS.red,
      icon: 'close-circle',
      action: 'Support',
    },
  };
  return configs[status] || configs['Preparing'];
};

// 📝 ORDER CARD COMPONENT
const OrderCard = ({ item }) => {
  const statusConfig = getStatusConfig(item.status);

  // Parse Date
  const dateStr = new Date(item.created_at).toLocaleDateString() + ', ' + new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={{
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        marginBottom: SPACING.lg,
        padding: SPACING.lg,
        shadowColor: COLORS.obsidian,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      {/* Top Row: ID & Status */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.background, marginRight: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="receipt" size={24} color={COLORS.obsidian} />
            </View>
            <View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.obsidian }}>Order #{item.id.toString().slice(-4)}</Text>
                <Text style={{ fontSize: 12, color: COLORS.gray, fontWeight: '500' }}>{dateStr}</Text>
            </View>
        </View>

        {/* Status Badge */}
        <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: statusConfig.bg,
            paddingHorizontal: 10, paddingVertical: 6,
            borderRadius: 12,
        }}>
            <Ionicons name={statusConfig.icon} size={12} color={statusConfig.text} style={{ marginRight: 4 }} />
            <Text style={{ color: statusConfig.text, fontWeight: '700', fontSize: 11, textTransform: 'capitalize' }}>{item.status}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: SPACING.md }} />

      {/* Items Summary */}
      <View style={{ marginBottom: SPACING.md }}>
        {item.order_items.map((food, index) => (
            <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: COLORS.gray, fontSize: 14 }}>
                    <Text style={{ fontWeight: '700', color: COLORS.obsidian }}>{food.quantity}x</Text>  
                    {/* We need to fetch item names ideally, but for now we show ID or fallback */}
                     {' '}Item #{food.menu_item_id.toString().slice(0,5)}...
                </Text>
                <Text style={{ fontWeight: '600', color: COLORS.obsidian }}>₹{food.price}</Text>
            </View>
        ))}
      </View>

      {/* Bottom Row: Total */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 11, color: COLORS.gray, textTransform: 'uppercase', fontWeight: '600' }}>Total Paid</Text>
        <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.obsidian }}>₹{item.total_price}</Text>
      </View>
    </View>
  );
};

// 🎯 MAIN COMPONENT
export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useCart(); // Get User ID
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);

  // 📥 Fetch My Orders
  const fetchOrders = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) Alert.alert("Error", error.message);
    else setOrders(data || []);
  };

  // ⚡ REALTIME LISTENER
  useEffect(() => {
    if (!user) return;

    fetchOrders(); // Initial load

    // Listen for changes to MY orders
    const subscription = supabase
      .channel('user_orders')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Chef changed status
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Update the specific order in the list instantly
          setOrders((currentOrders) =>
            currentOrders.map((order) =>
              order.id === payload.new.id
                ? { ...order, status: payload.new.status } // Update status
                : order
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={{
          paddingTop: insets.top + 10,
          paddingBottom: SPACING.md,
          paddingHorizontal: SPACING.lg,
          backgroundColor: COLORS.background,
      }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.obsidian, letterSpacing: -0.5 }}>
          Orders
        </Text>
      </View>

      {/* ORDERS LIST */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <OrderCard item={item} />}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.obsidian} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 100 }}>
             <Ionicons name="receipt-outline" size={60} color={COLORS.border} />
             <Text style={{ marginTop: 16, color: COLORS.gray, fontSize: 16, fontWeight: '600' }}>No orders yet.</Text>
          </View>
        }
      />
    </View>
  );
}