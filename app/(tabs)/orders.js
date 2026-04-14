import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, RefreshControl, ActivityIndicator,
  StyleSheet, Image, TouchableOpacity, Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { supabase } from '../../lib/supabase';
import { COLORS, SHADOW, RADIUS } from '../../lib/theme';
import AnimatedIcon from '../../components/AnimatedIcon';

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:   { label: 'Order Received',   icon: 'hourglass',          color: COLORS.warning, bg: COLORS.warningLight,  border: COLORS.warning  + '40', anim: 'spin',    progress: 0.2  },
  cooking:   { label: 'Cooking Now',      icon: 'flame',              color: COLORS.primary, bg: COLORS.primaryLight,  border: COLORS.primary  + '40', anim: 'pulse',   progress: 0.55 },
  ready:     { label: 'Ready for Pickup', icon: 'bicycle',            color: COLORS.success, bg: COLORS.successLight,  border: COLORS.success  + '40', anim: 'bounce',  progress: 0.8  },
  delivered: { label: 'Delivered',        icon: 'bag-check',          color: COLORS.dark,    bg: COLORS.border,        border: COLORS.light,           anim: 'none',    progress: 1.0  },
  rejected:  { label: 'Cancelled',        icon: 'close-circle',       color: COLORS.error,   bg: COLORS.errorLight,    border: COLORS.error    + '40', anim: 'none',    progress: 0    },
};

// ─── Status Badge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <AnimatedIcon
        name={cfg.icon}
        size={18}
        iconSize={10}
        color={cfg.color}
        bg="transparent"
        borderColor="transparent"
        animation={cfg.anim}
        radius={9}
      />
      <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

// ─── Progress Steps ────────────────────────────────────────────────────────────

const STEPS = ['Received', 'Cooking', 'Ready', 'Delivered'];
const STEP_IDX = { pending: 0, cooking: 1, ready: 2, delivered: 3, rejected: -1 };

const ProgressSteps = ({ status }) => {
  if (status === 'rejected') {
    return (
      <View style={styles.cancelledBar}>
        <AnimatedIcon name="close-circle" size={28} iconSize={14} color={COLORS.error} bg={COLORS.errorLight} animation="none" radius={9} />
        <Text style={styles.cancelledText}>Order was cancelled</Text>
      </View>
    );
  }
  const active = STEP_IDX[status] ?? 0;
  return (
    <View style={styles.stepsRow}>
      {STEPS.map((step, i) => {
        const done   = i <= active;
        const isLast = i === STEPS.length - 1;
        return (
          <React.Fragment key={step}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, done && { backgroundColor: COLORS.primary }]}>
                {done
                  ? <Ionicons name="checkmark" size={10} color="#FFF" />
                  : <View style={styles.stepDot} />}
              </View>
              <Text style={[styles.stepLabel, done && { color: COLORS.primary, fontWeight: '800' }]}>{step}</Text>
            </View>
            {!isLast && (
              <View style={[styles.stepLine, done && i < active && { backgroundColor: COLORS.primary }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

// ─── Status Animation (Lottie for cooking/ready/rejected, AnimatedIcon otherwise) ─

const StatusAnimation = ({ status }) => {
  const lottieMap = {
    cooking:  'https://lottie.host/f83bf95f-ec6a-4c4c-939c-97d56fa85beb/kXUGrR2XiI.lottie',
    ready:    'https://lottie.host/2f4d2d29-496f-4c11-acdf-4fe9141ba241/eOpmUQ1LDI.lottie',
    rejected: 'https://lottie.host/dc405669-d1f8-47a0-887b-a5c62c15da39/00vc7FA6Ei.lottie',
  };
  const lottie = lottieMap[status];
  const cfg    = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  if (lottie) {
    return (
      <LottieView
        source={{ uri: lottie }}
        autoPlay
        loop={status !== 'rejected'}
        style={{ width: 56, height: 56 }}
      />
    );
  }
  return (
    <AnimatedIcon
      name={cfg.icon}
      size={56}
      iconSize={26}
      color={cfg.color}
      bg={cfg.bg}
      animation={cfg.anim}
      glow={status === 'pending'}
      radius={18}
    />
  );
};

// ─── Format Date ──────────────────────────────────────────────────────────────

const formatDate = (iso) => {
  const d = new Date(iso);
  const isToday = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return isToday
    ? `Today, ${time}`
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + `, ${time}`;
};

// ─── Order Card ────────────────────────────────────────────────────────────────

const OrderCard = ({ item }) => {
  const cfg        = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  const firstItem  = item.order_items?.[0];
  const isLive     = ['pending', 'cooking', 'ready'].includes(item.status);
  const extraItems = item.order_items.length - 1;

  return (
    <View style={styles.card}>
      {/* Status header */}
      <View style={[styles.cardStatus, { backgroundColor: cfg.bg, borderBottomColor: cfg.border }]}>
        <View style={styles.statusLeft}>
          <StatusAnimation status={item.status} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.statusTitle, { color: cfg.color }]}>{cfg.label}</Text>
            <Text style={styles.statusDate}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>

      {/* Progress steps */}
      <View style={styles.progressWrap}>
        <ProgressSteps status={item.status} />
      </View>

      {/* Food info */}
      <View style={styles.cardBody}>
        <Image
          source={{ uri: firstItem?.menu_items?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200' }}
          style={styles.foodImg}
        />
        <View style={styles.foodInfo}>
          <View style={styles.foodTopRow}>
            <Text style={styles.foodName} numberOfLines={1}>
              {firstItem?.menu_items?.name || 'Tiffin Meal'}
            </Text>
            <Text style={styles.foodPrice}>₹{item.total_price}</Text>
          </View>
          <Text style={styles.foodMeta}>
            {extraItems > 0 ? `+${extraItems} more item${extraItems > 1 ? 's' : ''}` : '1 item'}
            {' · '}
            <Text style={{ color: COLORS.gray }}>Order #{item.id.toString().slice(-4).toUpperCase()}</Text>
          </Text>
          <View style={styles.itemList}>
            {item.order_items.map((oi, idx) => (
              <Text key={idx} style={styles.itemListText} numberOfLines={1}>
                {oi.quantity}× {oi.menu_items?.name}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* CTA */}
      {isLive && (
        <View style={styles.cardFooter}>
          <TouchableOpacity style={styles.trackBtn} activeOpacity={0.85}>
            <AnimatedIcon name="navigate" size={28} iconSize={14} color="#FFF" bg="rgba(255,255,255,0.2)" borderColor="rgba(255,255,255,0.3)" animation="none" radius={9} />
            <Text style={styles.trackBtnText}>Track Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.helpBtn} activeOpacity={0.85}>
            <Text style={styles.helpBtnText}>Need help?</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ─── Empty State ───────────────────────────────────────────────────────────────

const EmptyOrders = () => (
  <View style={styles.empty}>
    <AnimatedIcon
      name="bag-handle"
      size={88}
      iconSize={42}
      color={COLORS.primary}
      bg={COLORS.primaryLight}
      animation="float"
      glow
      radius={28}
    />
    <Text style={styles.emptyTitle}>No orders yet</Text>
    <Text style={styles.emptySub}>Your placed orders will appear here once you start ordering.</Text>
  </View>
);

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(quantity, price, menu_items(name, image_url))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (e) {
      console.error('Orders fetch:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchOrders(); }, []));

  useEffect(() => {
    let channel;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase
        .channel(`orders_user_${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (payload.eventType === 'UPDATE') {
              setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
            } else {
              fetchOrders();
            }
          }
        )
        .subscribe();
    };
    init();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.screenHeader}>
        <View>
          <Text style={styles.headerTag}>YOUR HISTORY</Text>
          <Text style={styles.screenTitle}>My Orders</Text>
        </View>
        {orders.length > 0 && (
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{orders.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <OrderCard item={item} />}
          contentContainerStyle={[styles.list, orders.length === 0 && styles.listEmpty]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrders(); }}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyOrders />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Header ─────────────────────────────────────────
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 18,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOW.sm,
  },
  headerTag: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.6,
    marginBottom: 2,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.obsidian,
    letterSpacing: -0.5,
  },
  countPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primaryFaint,
  },
  countPillText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
  },

  list:      { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
  listEmpty: { flexGrow: 1 },

  // ── Card ───────────────────────────────────────────
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.light,
    ...SHADOW.md,
  },

  // ── Status Header ──────────────────────────────────
  cardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  statusLeft:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statusTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2, marginBottom: 2 },
  statusDate:  { fontSize: 11, color: COLORS.medium, fontWeight: '500' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    gap: 4,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },

  // ── Progress Steps ─────────────────────────────────
  progressWrap: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepsRow:    { flexDirection: 'row', alignItems: 'center' },
  stepItem:    { alignItems: 'center' },
  stepCircle: {
    width: 22, height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.muted },
  stepLine: {
    flex: 1, height: 2,
    backgroundColor: COLORS.border,
    marginBottom: 22,
    marginHorizontal: 4,
  },
  stepLabel: {
    fontSize: 9,
    color: COLORS.muted,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 52,
  },
  cancelledBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.errorLight,
    padding: 10,
    borderRadius: RADIUS.md,
  },
  cancelledText: { fontSize: 12, fontWeight: '700', color: COLORS.error },

  // ── Body ───────────────────────────────────────────
  cardBody:    { flexDirection: 'row', padding: 16, gap: 14 },
  foodImg:     { width: 72, height: 72, borderRadius: RADIUS.lg, backgroundColor: COLORS.border },
  foodInfo:    { flex: 1 },
  foodTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  foodName:    { fontSize: 15, fontWeight: '700', color: COLORS.dark, flex: 1, marginRight: 8 },
  foodPrice:   { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  foodMeta:    { fontSize: 12, color: COLORS.medium, fontWeight: '500', marginBottom: 8 },
  itemList:    { gap: 2 },
  itemListText:{ fontSize: 12, color: COLORS.medium, fontWeight: '500' },

  // ── Footer ─────────────────────────────────────────
  cardFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
  trackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.obsidian,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    gap: 8,
    shadowColor: COLORS.obsidian,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  trackBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  helpBtn: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBtnText: { color: COLORS.medium, fontWeight: '700', fontSize: 13 },

  // ── Empty ──────────────────────────────────────────
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 14,
  },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: COLORS.obsidian },
  emptySub:   { fontSize: 14, color: COLORS.medium, textAlign: 'center', lineHeight: 22 },
});
