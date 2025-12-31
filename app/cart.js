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
  Dimensions,
  Platform,
  Image
} from 'react-native';

// Third-party Imports
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Local Imports
import { useCart } from '../lib/store';
import { supabase } from '../lib/supabase';
import PaymentModal from '../components/PaymentModal';

const { width } = Dimensions.get('window');

// 🎨 Zomato/Swiggy Style Palette with Obsidian Branding
const COLORS = {
  bg: '#F4F6FB',        // Light gray background for contrast
  white: '#FFFFFF',
  obsidian: '#0F172A',  // Your Brand Primary
  text: '#1C1C1C',      // Dark Charcoal
  gray: '#696969',      // Subtitle Gray
  lightGray: '#E8E8E8',
  border: '#F0F0F0',
  green: '#257E3E',     // Veg Green
  red: '#D1353F',       // Non-Veg Red
  blue: '#2563EB',      // Link Blue
};

/**
 * Authentic Veg/Non-Veg Square Icon
 */
const VegIcon = ({ isVeg }) => (
  <View style={[styles.vegBox, { borderColor: isVeg ? COLORS.green : COLORS.red }]}>
    <View style={[styles.vegDot, { backgroundColor: isVeg ? COLORS.green : COLORS.red }]} />
  </View>
);

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Store
  const { cart, addToCart, removeFromCart, clearCart, getCartTotal, getDeliveryFee } = useCart();
  
  // Local State
  const [loading, setLoading] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  // 💰 Bill Logic
  const itemTotal = getCartTotal();
  const deliveryFee = getDeliveryFee();
  const platformFee = 5; 
  const gst = Math.round(itemTotal * 0.05);
  const grandTotal = itemTotal + deliveryFee + platformFee + gst;

  // --- ACTIONS ---
  const initiateCheckout = async () => {
    if (cart.length === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Log In Required', 'Please log in to place an order.');
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentConfirm = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!cart.length) throw new Error("Cart is empty");

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          chef_id: cart[0].chef_id,
          total_price: grandTotal,
          status: 'pending',
          instruction: instruction.trim()
        }])
        .select().single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      return true;
    } catch (error) {
      Alert.alert('Order Failed', error.message);
      return false;
    }
  };

  const finishOrder = () => {
    setShowPayment(false);
    clearCart();
    router.replace('/(tabs)/orders');
  };

  // 🛒 EMPTY STATE
  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.emptyIconCircle}>
          <Ionicons name="cart" size={48} color={COLORS.gray} />
        </View>
        <Text style={styles.emptyTitle}>Good food is always cooking</Text>
        <Text style={styles.emptySubtitle}>Your cart is empty. Add something from the menu.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.browseBtn}>
          <Text style={styles.browseBtnText}>BROWSE RESTAURANTS</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* --- HEADER --- */}
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Order Summary</Text>
          {cart[0]?.chef_name && (
            <Text style={styles.headerSubtitle}>from {cart[0].chef_name}</Text>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* --- CARD 1: ITEMS --- */}
        <View style={styles.card}>
          {cart.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <VegIcon isVeg={item.is_veg} />
                <View style={styles.textContainer}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>₹{item.price}</Text>
                </View>
              </View>

              {/* Stepper */}
              <View style={styles.stepperContainer}>
                <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.stepBtn}>
                  <Ionicons name="remove" size={14} color={COLORS.green} />
                </TouchableOpacity>
                <Text style={styles.stepText}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => addToCart(item)} style={styles.stepBtn}>
                  <Ionicons name="add" size={14} color={COLORS.green} />
                </TouchableOpacity>
              </View>

              <Text style={styles.rowTotal}>₹{item.price * item.quantity}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.addMoreBtn} onPress={() => router.back()}>
            <Ionicons name="add-circle-outline" size={18} color={COLORS.gray} />
            <Text style={styles.addMoreText}>Add more items</Text>
          </TouchableOpacity>
        </View>

        {/* --- CARD 2: INSTRUCTIONS --- */}
        <View style={styles.card}>
          <View style={styles.instructionHeader}>
            <MaterialCommunityIcons name="note-text-outline" size={18} color={COLORS.text} />
            <Text style={styles.cardTitle}>Cooking Instructions</Text>
          </View>
          <TextInput 
            placeholder="E.g. Don't ring the doorbell"
            placeholderTextColor={COLORS.gray}
            style={styles.input}
            value={instruction}
            onChangeText={setInstruction}
            maxLength={100}
          />
        </View>

        {/* --- CARD 3: BILL SUMMARY --- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bill Details</Text>
          
          <BillRow label="Item Total" value={itemTotal} />
          <BillRow label="Delivery Fee" value={deliveryFee} info />
          <BillRow label="Platform Fee" value={platformFee} info />
          <BillRow label="GST & Restaurant Charges" value={gst} info />
          
          <View style={styles.dashedDivider} />
          
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>To Pay</Text>
            <Text style={styles.grandTotalValue}>₹{grandTotal}</Text>
          </View>
        </View>

        {/* --- CARD 4: POLICY --- */}
        <View style={styles.policyContainer}>
          <Text style={styles.policyTitle}>Cancellation Policy</Text>
          <Text style={styles.policyText}>
            Orders cannot be cancelled once the chef starts preparing the food. 100% cancellation fee will apply to compensate the chef.
          </Text>
        </View>

      </ScrollView>

      {/* --- FOOTER --- */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerTotal}>₹{grandTotal}</Text>
          <Text style={styles.viewBillText}>VIEW BILL</Text>
        </View>

        <TouchableOpacity 
          style={styles.payButton} 
          onPress={initiateCheckout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View style={styles.payBtnContent}>
              <Text style={styles.payBtnText}>Place Order</Text>
              <Ionicons name="caret-forward" size={16} color="white" />
            </View>
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

// Sub-Component for Bill Rows
const BillRow = ({ label, value, info }) => (
  <View style={styles.billRow}>
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <Text style={styles.billLabel}>{label}</Text>
      {info && <Ionicons name="information-circle-outline" size={12} color={COLORS.gray} style={{marginLeft: 4}} />}
    </View>
    <Text style={styles.billValue}>₹{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  
  // Header
  header: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { padding: 4 },
  headerTitleContainer: { marginLeft: 12 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  headerSubtitle: { fontSize: 12, color: COLORS.gray },

  scrollContent: { paddingBottom: 100 },

  // Cards
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    // Gentle Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  // Item Row
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  itemInfo: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  textContainer: { marginLeft: 10 },
  itemName: { fontSize: 14, fontWeight: '500', color: COLORS.text, width: 120 },
  itemPrice: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  
  // Veg Icon
  vegBox: { width: 14, height: 14, borderWidth: 1, borderRadius: 3, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  vegDot: { width: 8, height: 8, borderRadius: 4 },

  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 6,
    backgroundColor: '#FAFAFA',
    height: 30,
  },
  stepBtn: { width: 28, alignItems: 'center', justifyContent: 'center', height: '100%' },
  stepText: { fontSize: 13, fontWeight: '700', color: COLORS.green, width: 20, textAlign: 'center' },
  
  rowTotal: { fontSize: 13, fontWeight: '600', color: COLORS.text, width: 50, textAlign: 'right' },

  addMoreBtn: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  addMoreText: { marginLeft: 8, fontSize: 13, color: COLORS.text },

  // Instructions
  instructionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginLeft: 6 },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.text
  },

  // Bill
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  billLabel: { fontSize: 13, color: COLORS.gray },
  billValue: { fontSize: 13, color: COLORS.text },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderStyle: 'dashed',
    marginVertical: 12,
    borderRadius: 1
  },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandTotalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  grandTotalValue: { fontSize: 16, fontWeight: '800', color: COLORS.text },

  // Policy
  policyContainer: { margin: 16, padding: 12, backgroundColor: '#F0F3F8', borderRadius: 8, borderWidth: 1, borderColor: '#E5E9F0' },
  policyTitle: { fontSize: 12, fontWeight: '700', color: COLORS.gray, marginBottom: 4 },
  policyText: { fontSize: 11, color: COLORS.gray, lineHeight: 16 },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  footerLeft: { flexDirection: 'column' },
  footerTotal: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  viewBillText: { fontSize: 11, fontWeight: '700', color: COLORS.green, marginTop: 2 },
  
  payButton: {
    backgroundColor: COLORS.obsidian, // ✅ Premium Obsidian CTA
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '50%',
  },
  payBtnContent: { flexDirection: 'row', alignItems: 'center' },
  payBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700', marginRight: 6 },

  // Empty State
  emptyContainer: { flex: 1, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: COLORS.gray, textAlign: 'center', marginBottom: 24 },
  browseBtn: { borderWidth: 1, borderColor: COLORS.obsidian, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  browseBtnText: { color: COLORS.obsidian, fontWeight: '800', fontSize: 13 },
});