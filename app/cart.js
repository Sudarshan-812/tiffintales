import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../lib/store';
import { supabase } from '../lib/supabase';
import PaymentModal from '../components/PaymentModal';
import { COLORS, SHADOW, RADIUS } from '../lib/theme';

// ─── Veg/Non-Veg indicator ────────────────────────────────────────────────────

const VegDot = ({ isVeg }) => (
  <View style={[styles.vegBox, { borderColor: isVeg ? COLORS.success : COLORS.error }]}>
    <View style={[styles.vegDot, { backgroundColor: isVeg ? COLORS.success : COLORS.error }]} />
  </View>
);

// ─── Bill Row ─────────────────────────────────────────────────────────────────

const BillRow = ({ label, value, bold, info }) => (
  <View style={styles.billRow}>
    <View style={styles.billLabel}>
      <Text style={[styles.billLabelText, bold && { color: COLORS.obsidian, fontWeight: '800' }]}>{label}</Text>
      {info && <Ionicons name="information-circle-outline" size={13} color={COLORS.gray} style={{ marginLeft: 4 }} />}
    </View>
    <Text style={[styles.billValue, bold && styles.billValueBold]}>₹{value}</Text>
  </View>
);

// ─── Progress Steps ───────────────────────────────────────────────────────────

const STEPS = [
  { icon: 'bag-handle-outline',       label: 'Cart'    },
  { icon: 'card-outline',             label: 'Payment' },
  { icon: 'checkmark-circle-outline', label: 'Done'    },
];

const OrderProgress = ({ step = 0 }) => (
  <View style={styles.progressWrap}>
    {STEPS.map((s, i) => {
      const active = i <= step;
      const isLast = i === STEPS.length - 1;
      return (
        <React.Fragment key={s.label}>
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, active && styles.stepCircleActive]}>
              <Ionicons name={s.icon} size={16} color={active ? '#FFF' : COLORS.gray} />
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{s.label}</Text>
          </View>
          {!isLast && (
            <View style={[styles.stepLine, active && i < step && styles.stepLineDone]} />
          )}
        </React.Fragment>
      );
    })}
  </View>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyCart = ({ onBack }) => (
  <View style={styles.empty}>
    <StatusBar barStyle="dark-content" />
    <Text style={styles.emptyEmoji}>🛒</Text>
    <Text style={styles.emptyTitle}>Your cart is empty</Text>
    <Text style={styles.emptySub}>Looks like you haven't added anything yet.</Text>
    <TouchableOpacity onPress={onBack} style={styles.browseBtn}>
      <Ionicons name="arrow-back" size={18} color="#FFF" />
      <Text style={styles.browseBtnText}>Browse Menu</Text>
    </TouchableOpacity>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CartScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { cart, addToCart, removeFromCart, clearCart, getCartTotal, getDeliveryFee } = useCart();

  const [loading,     setLoading]     = useState(false);
  const [instruction, setInstruction] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  const itemTotal   = getCartTotal();
  const deliveryFee = getDeliveryFee();
  const platformFee = 5;
  const gst         = Math.round(itemTotal * 0.05);
  const grandTotal  = itemTotal + deliveryFee + platformFee + gst;

  if (cart.length === 0) return <EmptyCart onBack={() => router.back()} />;

  const initiateCheckout = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { Alert.alert('Log In Required', 'Please log in to place an order.'); return; }
    setShowPayment(true);
  };

  const handlePaymentConfirm = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert([{
          user_id:     user.id,
          chef_id:     cart[0].chef_id,
          total_price: grandTotal,
          status:      'pending',
          instruction: instruction.trim(),
        }])
        .select()
        .single();
      if (orderErr) throw orderErr;

      const { error: itemsErr } = await supabase.from('order_items').insert(
        cart.map(item => ({
          order_id:     orderData.id,
          menu_item_id: item.id,
          quantity:     item.quantity,
          price:        item.price,
        }))
      );
      if (itemsErr) throw itemsErr;
      return true;
    } catch (e) {
      Alert.alert('Order Failed', e.message);
      return false;
    }
  };

  const finishOrder = () => {
    setShowPayment(false);
    clearCart();
    router.replace('/(tabs)/orders');
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.obsidian} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Your Order</Text>
          {cart[0]?.profiles?.full_name && (
            <Text style={styles.headerSub}>from Chef {cart[0].profiles.full_name}</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Order progress ── */}
      <View style={styles.progressSection}>
        <OrderProgress step={0} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Items card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
          </Text>

          {cart.map((item, idx) => (
            <View key={item.id}>
              {idx > 0 && <View style={styles.itemDivider} />}
              <View style={styles.itemRow}>
                {/* Image */}
                <Image
                  source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200' }}
                  style={styles.itemImg}
                />
                {/* Info */}
                <View style={styles.itemInfo}>
                  <View style={styles.itemNameRow}>
                    <VegDot isVeg={item.is_veg} />
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  </View>
                  <Text style={styles.itemPrice}>₹{item.price} each</Text>
                </View>
                {/* Stepper */}
                <View style={styles.stepper}>
                  <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.stepBtn}>
                    <Ionicons name="remove" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                  <Text style={styles.stepNum}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => addToCart(item)} style={styles.stepBtn}>
                    <Ionicons name="add" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                {/* Row total */}
                <Text style={styles.rowTotal}>₹{item.price * item.quantity}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addMoreBtn} onPress={() => router.back()}>
            <Ionicons name="add-circle-outline" size={18} color={COLORS.medium} />
            <Text style={styles.addMoreText}>Add more items</Text>
          </TouchableOpacity>
        </View>

        {/* ── Instructions ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="note-text-outline" size={18} color={COLORS.obsidian} />
            <Text style={styles.cardTitle}>Cooking Instructions</Text>
          </View>
          <TextInput
            placeholder="E.g. Less spicy please…"
            placeholderTextColor={COLORS.gray}
            value={instruction}
            onChangeText={setInstruction}
            style={styles.instrInput}
            maxLength={120}
            multiline
          />
          <Text style={styles.charCount}>{instruction.length}/120</Text>
        </View>

        {/* ── Bill ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bill Details</Text>
          <BillRow label="Item Total"               value={itemTotal}   />
          <BillRow label="Delivery Fee"             value={deliveryFee} info />
          <BillRow label="Platform Fee"             value={platformFee} info />
          <BillRow label="GST & Restaurant Charges" value={gst}         info />
          <View style={styles.dashedLine} />
          <BillRow label="To Pay" value={grandTotal} bold />
        </View>

        {/* ── Policy ── */}
        <View style={styles.policy}>
          <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.medium} />
          <Text style={styles.policyText}>
            <Text style={styles.policyBold}>Cancellation Policy: </Text>
            Orders cannot be cancelled once the chef starts cooking. 100% cancellation fee applies.
          </Text>
        </View>
      </ScrollView>

      {/* ── Sticky Footer CTA ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text style={styles.footerTotal}>₹{grandTotal}</Text>
          <Text style={styles.footerSub}>Grand Total</Text>
        </View>
        <TouchableOpacity
          style={styles.placeBtn}
          onPress={initiateCheckout}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.placeBtnText}>Proceed to Pay</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      <PaymentModal
        visible={showPayment}
        amount={grandTotal}
        onClose={() => setShowPayment(false)}
        onConfirmPayment={handlePaymentConfirm}
        onFinish={finishOrder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

  // ── Header ──────────────────────────────────────────
  header: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOW.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.obsidian, letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: COLORS.medium, marginTop: 1, fontWeight: '500' },

  // ── Progress ────────────────────────────────────────
  progressSection: {
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressWrap: { flexDirection: 'row', alignItems: 'center' },
  stepItem: { alignItems: 'center', minWidth: 56 },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: { backgroundColor: COLORS.primary },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.border, marginBottom: 22 },
  stepLineDone: { backgroundColor: COLORS.primary },
  stepLabel: { fontSize: 10, color: COLORS.gray, fontWeight: '600' },
  stepLabelActive: { color: COLORS.primary, fontWeight: '800' },

  scrollContent: { paddingBottom: 130, paddingTop: 4 },

  // ── Cards ────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: RADIUS.xl,
    padding: 18,
    ...SHADOW.sm,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.obsidian, marginBottom: 14 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },

  // ── Items ────────────────────────────────────────────
  itemDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemImg: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.border,
  },
  itemInfo: { flex: 1 },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  vegBox: {
    width: 13,
    height: 13,
    borderWidth: 1.5,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegDot: { width: 5, height: 5, borderRadius: 3 },
  itemName: { fontSize: 14, fontWeight: '700', color: COLORS.dark, flex: 1 },
  itemPrice: { fontSize: 12, color: COLORS.medium, fontWeight: '500' },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    height: 34,
  },
  stepBtn: {
    width: 28,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNum: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    minWidth: 20,
    textAlign: 'center',
  },
  rowTotal: { fontSize: 14, fontWeight: '700', color: COLORS.obsidian, minWidth: 48, textAlign: 'right' },

  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    gap: 8,
  },
  addMoreText: { fontSize: 14, color: COLORS.medium, fontWeight: '500' },

  // ── Instructions ─────────────────────────────────────
  instrInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.light,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.dark,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, color: COLORS.gray, textAlign: 'right', marginTop: 4 },

  // ── Bill ─────────────────────────────────────────────
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  billLabel: { flexDirection: 'row', alignItems: 'center' },
  billLabelText: { fontSize: 14, color: COLORS.medium, fontWeight: '500' },
  billValue: { fontSize: 14, color: COLORS.dark, fontWeight: '600' },
  billValueBold: { fontSize: 18, fontWeight: '900', color: COLORS.obsidian },
  dashedLine: {
    height: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.light,
    marginVertical: 12,
    borderRadius: 1,
  },

  // ── Policy ───────────────────────────────────────────
  policy: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: RADIUS.lg,
    padding: 14,
  },
  policyText: { flex: 1, fontSize: 12, color: COLORS.medium, lineHeight: 18 },
  policyBold: { fontWeight: '700', color: COLORS.dark },

  // ── Sticky Footer ─────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOW.lg,
  },
  footerTotal: { fontSize: 22, fontWeight: '900', color: COLORS.obsidian },
  footerSub:   { fontSize: 11, color: COLORS.medium, fontWeight: '600', marginTop: 1 },
  placeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: RADIUS.full,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 12,
    elevation: 8,
  },
  placeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  // ── Empty ────────────────────────────────────────────
  empty: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: COLORS.obsidian, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.medium, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: RADIUS.full,
    gap: 8,
  },
  browseBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
