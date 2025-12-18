import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function OrderCard({ order, onUpdate }) {
  const [loading, setLoading] = useState(false);

  // 🎨 Status Config (Compact Colors)
  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { color: '#F59E0B', bg: '#FEF3C7', label: 'New', icon: 'hourglass-outline' };
      case 'cooking':
        return { color: '#EA580C', bg: '#FFEDD5', label: 'Cooking', icon: 'flame' };
      case 'ready':
        return { color: '#10B981', bg: '#D1FAE5', label: 'Ready', icon: 'checkmark-circle' };
      default:
        return { color: '#64748B', bg: '#F1F5F9', label: 'Unknown', icon: 'help-circle-outline' };
    }
  };

  const status = getStatusConfig(order.status);

  const updateStatus = async (newStatus) => {
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
    <View style={styles.container}>
      {/* ─── LEFT STRIP (Status Color) ─── */}
      <View style={[styles.statusStrip, { backgroundColor: status.color }]} />

      <View style={styles.content}>
        
        {/* ─── HEADER ROW ─── */}
        <View style={styles.header}>
          <View>
            <View style={styles.idRow}>
              <Text style={styles.idText}>#{order.id.slice(0, 5)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
            <Text style={styles.timeText}>
              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={styles.priceText}>₹{order.total_price}</Text>
        </View>

        {/* ─── ITEMS LIST (Compact) ─── */}
        <View style={styles.itemsContainer}>
          {order.order_items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.qty}>{item.quantity}x</Text>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.menu_items?.name || 'Loading Item...'}
              </Text>
            </View>
          ))}
        </View>

        {/* ─── COMPACT ACTIONS ─── */}
        <View style={styles.actions}>
          {loading ? (
            <ActivityIndicator size="small" color="#1A0B2E" />
          ) : (
            <>
              {/* PENDING: Reject (Small) | Cook (Big) */}
              {order.status === 'pending' && (
                <>
                  <TouchableOpacity onPress={() => updateStatus('rejected')} style={styles.btnSmallOutline}>
                    <Ionicons name="close" size={18} color="#EF4444" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => updateStatus('cooking')} style={styles.btnPrimary}>
                    <Text style={styles.btnText}>Start Cooking</Text>
                    <Ionicons name="flame" size={16} color="white" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </>
              )}

              {/* COOKING: Mark Ready */}
              {order.status === 'cooking' && (
                <TouchableOpacity onPress={() => updateStatus('ready')} style={styles.btnSuccess}>
                  <Text style={styles.btnText}>Mark Ready</Text>
                  <Ionicons name="checkmark" size={16} color="white" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              )}

              {/* READY: Static Info */}
              {order.status === 'ready' && (
                <View style={styles.readyInfo}>
                  <Ionicons name="bicycle" size={16} color="#10B981" />
                  <Text style={styles.readyText}>Waiting for Pickup</Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statusStrip: {
    width: 6,
    height: '100%',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  idText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A0B2E',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A0B2E',
  },
  itemsContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  qty: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    width: 24,
  },
  itemName: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  btnSmallOutline: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  btnPrimary: {
    backgroundColor: '#1A0B2E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnSuccess: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  btnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  readyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  readyText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
});