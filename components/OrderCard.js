import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Alert,
  ActivityIndicator, StyleSheet, Animated, LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { COLORS, SHADOW, RADIUS } from '../lib/theme';
import AnimatedIcon from './AnimatedIcon';

// ─── Animated Status Badge ─────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const CFG = {
    pending:  { color: COLORS.warning,  bg: COLORS.warningLight,  label: 'NEW',     name: 'hourglass',          anim: 'spin'    },
    cooking:  { color: COLORS.primary,  bg: COLORS.primaryLight,  label: 'COOKING', name: 'flame',              anim: 'pulse'   },
    ready:    { color: COLORS.success,  bg: COLORS.successLight,  label: 'READY',   name: 'checkmark-circle',   anim: 'tada'    },
    rejected: { color: COLORS.error,    bg: COLORS.errorLight,    label: 'REJECTED',name: 'close-circle',       anim: 'none'    },
    delivered:{ color: COLORS.dark,     bg: COLORS.border,        label: 'DONE',    name: 'bag-check',          anim: 'none'    },
  };
  const cfg = CFG[status] || CFG.pending;

  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      <AnimatedIcon
        name={cfg.name}
        size={20}
        iconSize={11}
        color={cfg.color}
        bg="transparent"
        borderColor="transparent"
        animation={cfg.anim}
        radius={10}
      />
      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

// ─── Order Item Row ────────────────────────────────────────────────────────────

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

// ─── Main Component ────────────────────────────────────────────────────────────

export default function OrderCard({ order, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (order.status === 'cooking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
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
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
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

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Large animated status icon */}
          {order.status === 'pending' && (
            <AnimatedIcon name="hourglass" size={46} iconSize={22} color={COLORS.warning} bg={COLORS.warningLight} animation="spin" glow radius={14} />
          )}
          {order.status === 'cooking' && (
            <AnimatedIcon name="flame" size={46} iconSize={22} color={COLORS.primary} bg={COLORS.primaryLight} animation="pulse" glow radius={14} />
          )}
          {order.status === 'ready' && (
            <AnimatedIcon name="checkmark-circle" size={46} iconSize={22} color={COLORS.success} bg={COLORS.successLight} animation="bounce" glow radius={14} />
          )}
          {order.status === 'rejected' && (
            <AnimatedIcon name="close-circle" size={46} iconSize={22} color={COLORS.error} bg={COLORS.errorLight} animation="none" radius={14} />
          )}
          {order.status === 'delivered' && (
            <AnimatedIcon name="bag-check" size={46} iconSize={22} color={COLORS.dark} bg={COLORS.border} animation="none" radius={14} />
          )}
          <View style={styles.headerMeta}>
            <Text style={styles.orderId}>Order #{order.id.toString().slice(-4)}</Text>
            <Text style={styles.timestamp}>
              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.totalPrice}>₹{order.total_price}</Text>
          <StatusBadge status={order.status} />
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── Items ── */}
      <View style={styles.itemsContainer}>
        {order.order_items.map((item, index) => (
          <OrderItem key={index} item={item} />
        ))}
        {order.instruction ? (
          <View style={styles.noteBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={13} color={COLORS.medium} />
            <Text style={styles.noteText}>"{order.instruction}"</Text>
          </View>
        ) : null}
      </View>

      {/* ── Action Footer ── */}
      <View style={styles.footer}>
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {order.status === 'pending' && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() => handleStatusUpdate('rejected')}
                  style={styles.rejectBtn}
                >
                  <Ionicons name="close" size={15} color={COLORS.error} />
                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleStatusUpdate('cooking')}
                  style={styles.acceptBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="flame" size={16} color="#FFF" />
                  <Text style={styles.acceptText}>Accept & Cook</Text>
                </TouchableOpacity>
              </View>
            )}

            {order.status === 'cooking' && (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  onPress={() => handleStatusUpdate('ready')}
                  style={styles.markReadyBtn}
                  activeOpacity={0.85}
                >
                  <AnimatedIcon
                    name="checkmark-done-circle"
                    size={30}
                    iconSize={16}
                    color="#FFF"
                    bg="rgba(255,255,255,0.2)"
                    borderColor="rgba(255,255,255,0.3)"
                    animation="none"
                    radius={9}
                  />
                  <Text style={styles.markReadyText}>Mark as Ready</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {order.status === 'ready' && (
              <View style={styles.readyBanner}>
                <AnimatedIcon
                  name="bicycle"
                  size={36}
                  iconSize={18}
                  color={COLORS.success}
                  bg={COLORS.successLight}
                  animation="bounce"
                  radius={11}
                />
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
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    marginBottom: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.light,
    ...SHADOW.md,
  },

  // ── Header ─────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerMeta: {},
  orderId: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.obsidian,
    letterSpacing: 0.2,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.medium,
    fontWeight: '500',
    marginTop: 2,
  },
  headerRight: { alignItems: 'flex-end', gap: 6 },
  totalPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.obsidian,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },

  // ── Items ──────────────────────────────────────────
  itemsContainer: { padding: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  qtyBox: {
    backgroundColor: COLORS.primaryLight,
    width: 24, height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  qtyText:   { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  itemName:  { flex: 1, fontSize: 14, color: COLORS.obsidian, fontWeight: '500' },
  itemPrice: { fontSize: 14, color: COLORS.medium, fontWeight: '600' },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: COLORS.inputBg,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  noteText: { fontSize: 12, color: COLORS.medium, fontStyle: 'italic', flex: 1 },

  // ── Footer ─────────────────────────────────────────
  footer: { padding: 16, paddingTop: 0 },
  loaderBox: { height: 50, justifyContent: 'center', alignItems: 'center' },

  // ── Buttons ────────────────────────────────────────
  actionRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.errorLight,
    backgroundColor: COLORS.errorLight,
    gap: 5,
  },
  rejectText: { color: COLORS.error, fontWeight: '700', fontSize: 14 },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.obsidian,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    gap: 8,
    shadowColor: COLORS.obsidian,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  acceptText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  markReadyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  markReadyText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  readyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.successLight,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
    gap: 10,
  },
  readyBannerText: { color: COLORS.success, fontWeight: '800', fontSize: 14 },
});
