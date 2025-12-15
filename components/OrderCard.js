import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function OrderCard({ order, onUpdate }) {
  const [loading, setLoading] = useState(false);

  // 🎨 Status Config
  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          bgGradient: ['#FFFBEB', '#FEF3C7'], 
          accent: '#F59E0B',
          text: '#92400E',
          icon: 'hourglass-outline',
          label: 'New Order',
          borderColor: '#FDE68A'
        };
      case 'cooking':
        return {
          bgGradient: ['#FFF7ED', '#FFEDD5'],
          accent: '#EA580C',
          text: '#9A3412',
          icon: 'flame',
          label: 'Cooking',
          borderColor: '#FED7AA'
        };
      case 'ready':
        return {
          bgGradient: ['#F0FDF4', '#DCFCE7'],
          accent: '#059669',
          text: '#065F46',
          icon: 'checkmark-done-circle',
          label: 'Ready',
          borderColor: '#BBF7D0'
        };
      default:
        return {
          bgGradient: ['#F9FAFB', '#F3F4F6'],
          accent: '#6B7280',
          text: '#374151',
          icon: 'help-circle-outline',
          label: 'Unknown',
          borderColor: '#E5E7EB'
        };
    }
  };

  const status = getStatusConfig(order.status);

  // 🛡️ UPDATED LOGIC: Bulletproof Error Handling
  const updateStatus = async (newStatus) => {
    setLoading(true);
    try {
      console.log(`Attempting to update Order ${order.id} to ${newStatus}`);
      
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) {
        throw error; // Jump to catch block
      }

      console.log("Update successful. Refreshing list...");
      await onUpdate(); // Wait for the screen to refresh
      
    } catch (error) {
      console.error("Update Failed:", error);
      Alert.alert('Action Failed', error.message || "Could not update order.");
    } finally {
      setLoading(false); // 🛑 THIS ALWAYS RUNS. SPINNER WILL STOP.
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMins = Math.floor((now - date) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.cardContainer}>
      
      {/* --- HEADER --- */}
      <LinearGradient
        colors={status.bgGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.headerGradient, { borderBottomColor: status.borderColor }]}
      >
        <View style={styles.headerRow}>
          {/* Left Side: ID & Price */}
          <View>
            <View style={styles.idContainer}>
              <View style={styles.idBadge}>
                <Text style={styles.idText}>#{order.id.slice(0, 5)}</Text>
              </View>
              <Text style={styles.timeText}>{formatTime(order.created_at)}</Text>
            </View>
            <Text style={styles.priceText}>₹{order.total_price}</Text>
          </View>

          {/* Right Side: Status Badge */}
          <View style={[styles.statusBadge, { shadowColor: status.accent }]}>
            <Ionicons name={status.icon} size={18} color={status.accent} />
            <Text style={[styles.statusText, { color: status.text }]}>
              {status.label}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* --- ITEMS LIST --- */}
      <View style={styles.itemsContainer}>
        <Text style={styles.itemsLabel}>
          Items ({order.order_items.length})
        </Text>

        {order.order_items.map((item, index) => (
          <View
            key={index}
            style={[
              styles.itemRow,
              index < order.order_items.length - 1 && styles.itemBorder
            ]}
          >
            <View style={styles.itemLeft}>
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyText}>{item.quantity}x</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.menu_items?.name || 'Unknown Item'}
                </Text>
                <Text style={styles.itemSubtext}>
                  ₹{item.menu_items?.price} / unit
                </Text>
              </View>
            </View>
            <Text style={styles.itemTotal}>
              ₹{item.quantity * item.menu_items?.price}
            </Text>
          </View>
        ))}
      </View>

      {/* --- ACTION BUTTONS --- */}
      <View style={styles.actionsContainer}>
        {loading ? (
          <View style={{ padding: 20 }}>
            <ActivityIndicator size="large" color="#1A0B2E" />
          </View>
        ) : (
          <>
            {/* PENDING STATE BUTTONS */}
            {order.status === 'pending' && (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={() => updateStatus('rejected')}
                  style={styles.declineButton}
                >
                  <Ionicons name="close" size={20} color="#EF4444" />
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => updateStatus('cooking')}
                  style={{ flex: 1.5 }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#1A0B2E', '#2D1B4E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButtonGradient}
                  >
                    <Ionicons name="flame" size={20} color="#F5F3E7" />
                    <Text style={styles.primaryButtonText}>Start Cooking</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* COOKING STATE BUTTON */}
            {order.status === 'cooking' && (
              <TouchableOpacity
                onPress={() => updateStatus('ready')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.fullWidthButton}
                >
                  <Ionicons name="checkmark-done-circle" size={24} color="white" />
                  <Text style={styles.primaryButtonText}>Mark as Ready</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* READY STATE (Waiting) */}
            {order.status === 'ready' && (
              <View style={styles.readyContainer}>
                <View style={styles.readyIconBg}>
                    <Ionicons name="bicycle" size={20} color="#15803D" />
                </View>
                <Text style={styles.readyText}>Waiting for Pickup</Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

// 🎨 EXTRACTED STYLES
const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#1A0B2E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    overflow: 'hidden'
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  idBadge: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  idText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  priceText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A0B2E',
  },
  statusBadge: {
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  statusText: {
    fontWeight: '800',
    fontSize: 12,
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  itemsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
  },
  itemsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  qtyBadge: {
    backgroundColor: '#F3F4F6',
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  qtyText: {
    fontWeight: 'bold',
    color: '#1A0B2E',
  },
  itemName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1A0B2E',
  },
  itemSubtext: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  itemTotal: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#111827',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#FEE2E2',
    borderRadius: 18,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  declineText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 4,
  },
  primaryButtonGradient: {
    flex: 1,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    shadowColor: '#1A0B2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  fullWidthButton: {
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#F5F3E7',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  readyContainer: {
    backgroundColor: '#F0FDF4',
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderStyle: 'dashed',
  },
  readyIconBg: {
    backgroundColor: '#DCFCE7',
    padding: 6,
    borderRadius: 20,
    marginRight: 10,
  },
  readyText: {
    color: '#166534',
    fontWeight: 'bold',
    fontSize: 18,
  },
});