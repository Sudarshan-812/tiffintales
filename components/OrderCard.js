import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { supabase } from '../lib/supabase';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 🎨 THEME PALETTE
const COLORS = {
  bg: '#FFFFFF',
  text: '#1F2937',
  subText: '#6B7280',
  primary: '#1A0B2E', // Obsidian
  accent: '#F59E0B', // Gold
  success: '#10B981',
  danger: '#EF4444',
  cooking: '#F97316', // Orange for cooking
  border: '#E5E7EB',
  surface: '#F9FAFB'
};

export default function OrderCard({ order, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current; // For Cooking Pulse

  // 🔄 Pulse Animation for "Cooking" State
  useEffect(() => {
    if (order.status === 'cooking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1); // Reset
    }
  }, [order.status]);

  // 🏷️ Status Config
  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { color: '#B45309', bg: '#FFFBEB', label: 'NEW ORDER', icon: 'notifications' };
      case 'cooking':
        return { color: '#C2410C', bg: '#FFF7ED', label: 'COOKING', icon: 'flame' };
      case 'ready':
        return { color: '#047857', bg: '#ECFDF5', label: 'READY', icon: 'bicycle' };
      default:
        return { color: '#374151', bg: '#F3F4F6', label: status, icon: 'help' };
    }
  };

  const status = getStatusConfig(order.status);

  // ⚡ Update Action
  const updateStatus = async (newStatus) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); // Smooth Transition
    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;
      await onUpdate();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      
      {/* ─── 1. HEADER (ID & Time) ─── */}
      <View style={styles.header}>
        <View style={styles.orderIdContainer}>
          <View style={[styles.iconBox, { backgroundColor: status.bg }]}>
             {/* Animated Icon for Cooking */}
             {order.status === 'cooking' ? (
               <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                 <Ionicons name={status.icon} size={18} color={status.color} />
               </Animated.View>
             ) : (
               <Ionicons name={status.icon} size={18} color={status.color} />
             )}
          </View>
          <View>
            <Text style={styles.orderId}>Order #{order.id.toString().slice(-4)}</Text>
            <Text style={styles.timestamp}>
              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>₹{order.total_price}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ─── 2. ITEMS LIST ─── */}
      <View style={styles.itemsContainer}>
        {order.order_items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.qtyBox}>
              <Text style={styles.qtyText}>{item.quantity}x</Text>
            </View>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.menu_items?.name || 'Loading Item...'}
            </Text>
            <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
          </View>
        ))}
      </View>

      {/* ─── 3. ACTION FOOTER ─── */}
      <View style={styles.footer}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>Updating...</Text>
          </View>
        ) : (
          <>
            {/* STATE: PENDING (Reject / Accept) */}
            {order.status === 'pending' && (
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  onPress={() => updateStatus('rejected')} 
                  style={styles.rejectBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => updateStatus('cooking')} 
                  style={styles.acceptBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.acceptText}>Accept Order</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </TouchableOpacity>
              </View>
            )}

            {/* STATE: COOKING (Mark Ready) */}
            {order.status === 'cooking' && (
              <TouchableOpacity 
                onPress={() => updateStatus('ready')} 
                style={styles.readyBtn}
                activeOpacity={0.8}
              >
                <Animated.View style={{ transform: [{ scale: pulseAnim }], flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="checkmark-done-circle" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.readyBtnText}>Mark Food Ready</Text>
                </Animated.View>
              </TouchableOpacity>
            )}

            {/* STATE: READY (Waiting) */}
            {order.status === 'ready' && (
              <View style={styles.infoBanner}>
                <Ionicons name="bicycle" size={20} color={COLORS.success} />
                <Text style={styles.infoText}>Waiting for Pickup</Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FAFAFA',
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.subText,
    fontWeight: '500',
  },
  priceTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },

  // Items
  itemsContainer: {
    padding: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qtyBox: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 10,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 14,
    color: COLORS.subText,
    fontWeight: '500',
  },

  // Footer Actions
  footer: {
    padding: 16,
    paddingTop: 0,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectBtn: {
    flex: 0.35,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 14,
  },
  acceptBtn: {
    flex: 0.65,
    backgroundColor: COLORS.success,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    shadowColor: COLORS.success,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  acceptText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  readyBtn: {
    backgroundColor: COLORS.cooking,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.cooking,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  readyBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    gap: 8,
  },
  infoText: {
    color: '#0F766E',
    fontWeight: '700',
    fontSize: 14,
  },
  loadingBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  loadingText: {
    color: COLORS.subText,
    fontSize: 14,
  }
});