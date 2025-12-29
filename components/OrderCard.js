import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Premium Theme Palette
const COLORS = {
  background: '#FFFFFF',
  obsidian: '#111827',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  primary: '#7E22CE',   // Purple
  success: '#10B981',   // Green
  warning: '#F59E0B',   // Gold
  danger: '#EF4444',    // Red
  cooking: '#F97316',   // Orange
  border: '#E5E7EB',
};

// Helper Components

const StatusBadge = ({ status }) => {
  let config = { color: COLORS.gray, bg: COLORS.lightGray, label: status, icon: 'help' };

  switch (status) {
    case 'pending':
      config = { color: COLORS.warning, bg: '#FEF3C7', label: 'NEW', icon: 'hourglass' };
      break;
    case 'cooking':
      config = { color: COLORS.cooking, bg: '#FFEDD5', label: 'COOKING', icon: 'flame' };
      break;
    case 'ready':
      config = { color: COLORS.success, bg: '#D1FAE5', label: 'READY', icon: 'checkmark-circle' };
      break;
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={12} color={config.color} style={{ marginRight: 4 }} />
      <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const OrderItem = ({ item }) => (
  <View style={styles.itemRow}>
    <View style={styles.qtyBox}>
      <Text style={styles.qtyText}>{item.quantity}</Text>
    </View>
    <Text style={styles.itemName} numberOfLines={1}>
      {item.menu_items?.name || 'Unknown Item'}
    </Text>
    <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
  </View>
);


// Main Component


export default function OrderCard({ order, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse Animation for "Cooking" State buttons
  useEffect(() => {
    if (order.status === 'cooking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [order.status]);

  const handleStatusUpdate = async (newStatus) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
      
      {/* ─── 1. Header ─── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.orderId}>Order #{order.id.toString().slice(-4)}</Text>
          <Text style={styles.timestamp}>
            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.totalPrice}>₹{order.total_price}</Text>
          <StatusBadge status={order.status} />
        </View>
      </View>

      <View style={styles.divider} />

      {/* ─── 2. Items List ─── */}
      <View style={styles.itemsContainer}>
        {order.order_items.map((item, index) => (
          <OrderItem key={index} item={item} />
        ))}
        {order.instruction && (
          <View style={styles.noteContainer}>
            <Ionicons name="reader-outline" size={14} color={COLORS.gray} />
            <Text style={styles.noteText}>"{order.instruction}"</Text>
          </View>
        )}
      </View>

      {/* ─── 3. Action Footer ─── */}
      <View style={styles.footer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.obsidian} />
          </View>
        ) : (
          <>
            {/* PENDING ACTIONS */}
            {order.status === 'pending' && (
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  onPress={() => handleStatusUpdate('rejected')} 
                  style={styles.rejectBtn}
                >
                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleStatusUpdate('cooking')} 
                  style={styles.acceptBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.acceptText}>Accept Order</Text>
                  <Ionicons name="arrow-forward" size={16} color="white" />
                </TouchableOpacity>
              </View>
            )}

            {/* COOKING ACTION (Pulsing) */}
            {order.status === 'cooking' && (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity 
                  onPress={() => handleStatusUpdate('ready')} 
                  style={styles.markReadyBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-done-circle" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.markReadyText}>Mark as Ready</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* READY STATUS */}
            {order.status === 'ready' && (
              <View style={styles.readyBanner}>
                <Ionicons name="bicycle" size={18} color={COLORS.success} />
                <Text style={styles.readyBannerText}>Waiting for Pickup</Text>
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
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    // Modern Shadow
    shadowColor: COLORS.obsidian,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.obsidian,
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
    marginTop: 2,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 16,
  },

  // Items
  itemsContainer: {
    padding: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  qtyBox: {
    backgroundColor: COLORS.lightGray,
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.obsidian,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.obsidian,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  noteText: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginLeft: 6
  },

  // Footer
  footer: {
    padding: 16,
    paddingTop: 0,
  },
  loadingContainer: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFF',
  },
  rejectText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 14,
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: COLORS.obsidian,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    shadowColor: COLORS.obsidian,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  acceptText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  markReadyBtn: {
    backgroundColor: COLORS.cooking,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    shadowColor: COLORS.cooking,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  markReadyText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 15,
  },
  readyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    gap: 8,
  },
  readyBannerText: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 14,
  },
});