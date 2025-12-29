import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';

// Third-party Imports
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Local Imports
import { useCart } from '../lib/store';
import { supabase } from '../lib/supabase';
import PaymentModal from '../components/PaymentModal';

// 🎨 Theme Constants
const COLORS = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  obsidian: '#111827',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  green: '#10B981',
  red: '#EF4444',
  border: '#E5E7EB',
  greenLight: '#ECFDF5',
  greenBorder: '#D1FAE5',
};

/**
 * Visual indicator for Veg/Non-Veg items.
 */
const VegIndicator = ({ isVeg }) => (
  <View style={[styles.vegBox, { borderColor: isVeg ? COLORS.green : COLORS.red }]}>
    <View style={[styles.vegDot, { backgroundColor: isVeg ? COLORS.green : COLORS.red }]} />
  </View>
);

/**
 * CartItem Component
 * Renders individual rows in the cart list.
 */
const CartItem = ({ item, onAdd, onRemove }) => {
  const isVegetarian = item.is_veg !== false;
  
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemInfoContainer}>
        <VegIndicator isVeg={isVegetarian} />
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>₹{item.price}</Text>
        </View>
      </View>

      <View style={styles.counterContainer}>
        <TouchableOpacity onPress={() => onRemove(item.id)} style={styles.counterBtn}>
          <Ionicons name="remove" size={16} color={COLORS.green} />
        </TouchableOpacity>
        <Text style={styles.counterText}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => onAdd(item)} style={styles.counterBtn}>
          <Ionicons name="add" size={16} color={COLORS.green} />
        </TouchableOpacity>
      </View>

      <Text style={styles.rowTotal}>₹{item.price * item.quantity}</Text>
    </View>
  );
};

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Store
  const { cart, addToCart, removeFromCart, clearCart, getCartTotal, getDeliveryFee } = useCart();
  
  // Local State
  const [loading, setLoading] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  // 💰 Bill Calculation logic
  const itemTotal = getCartTotal();
  const deliveryFee = getDeliveryFee();
  const platformFee = itemTotal > 0 ? 5 : 0;
  const gst = Math.round(itemTotal * 0.05);
  const grandTotal = itemTotal + deliveryFee + platformFee + gst;

  /**
   * Validates user session and opens payment modal.
   */
  const initiateCheckout = async () => {
    if (cart.length === 0) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Log In Required', 'Please log in to place an order.');
      return;
    }
    
    setShowPayment(true);
  };

  /**
   * Handles the actual order creation in Supabase.
   * Returns true if successful, false otherwise.
   */
  const handlePaymentConfirm = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!cart.length) throw new Error("Cart is empty");

      // 1. Create Order Record
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          chef_id: cart[0].chef_id,
          total_price: grandTotal,
          status: 'pending',
          instruction: instruction.trim()
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create Order Items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      return true; // Success signal

    } catch (error) {
      console.error("Payment Error:", error);
      Alert.alert('Order Failed', error.message || 'Something went wrong.');
      return false;
    }
  };

  /**
   * Cleans up cart and navigates to Orders tab upon success.
   */
  const finishOrder = () => {
    setShowPayment(false);
    clearCart();
    router.replace('/(tabs)/orders');
  };

  // 🛒 Empty State
  if (cart.length === 0) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <View style={styles.emptyCircle}>
          <Ionicons name="cart-outline" size={64} color={COLORS.gray} />
        </View>
        <Text style={styles.emptyTitle}>Your Tiffin is Empty</Text>
        <Text style={styles.emptySubtitle}>Looks like you haven't added any food yet.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.browseBtn}>
          <Text style={styles.browseText}>Browse Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.obsidian} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Cart Items List */}
        <View style={styles.section}>
          <FlatList
            data={cart}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <CartItem 
                item={item} 
                onAdd={addToCart} 
                onRemove={removeFromCart} 
              />
            )}
            scrollEnabled={false}
          />
        </View>

        {/* Instructions Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cooking Instructions</Text>
          <View style={styles.inputBox}>
            <Ionicons name="create-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
            <TextInput
              placeholder="e.g. Less spicy, no cutlery..."
              placeholderTextColor={COLORS.gray}
              style={styles.input}
              value={instruction}
              onChangeText={setInstruction}
              maxLength={150}
            />
          </View>
        </View>

        {/* Bill Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          <BillRow label="Item Total" value={itemTotal} />
          <BillRow label="Delivery Fee" value={deliveryFee} />
          <BillRow label="Platform Fee" value={platformFee} />
          <BillRow label="GST (5%)" value={gst} />
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>To Pay</Text>
            <Text style={styles.totalValue}>₹{grandTotal}</Text>
          </View>
        </View>

        {/* Trust Badge */}
        <View style={styles.trustBadge}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.green} />
          <Text style={styles.trustText}>Safe & Hygienic Delivery</Text>
        </View>
      </ScrollView>

      {/* Footer / Pay Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerTotal}>₹{grandTotal}</Text>
          <Text style={styles.footerLink}>View Bill</Text>
        </View>

        <TouchableOpacity 
          onPress={initiateCheckout} 
          disabled={loading} 
          style={styles.payBtn}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.payText}>Pay Now</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
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

// Helper Component for Bill Rows
const BillRow = ({ label, value }) => (
  <View style={styles.billRow}>
    <Text style={styles.billLabel}>{label}</Text>
    <Text style={styles.billValue}>₹{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  scrollContent: {
    paddingBottom: 120
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.obsidian
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray
  },
  headerSpacer: {
    width: 40
  },
  // Sections
  section: {
    backgroundColor: COLORS.surface,
    marginTop: 12,
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.obsidian,
    marginBottom: 12,
    letterSpacing: 0.5
  },
  // Cart Item
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  itemInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  itemTextContainer: {
    marginLeft: 8
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.obsidian
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray,
    marginTop: 2
  },
  rowTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.obsidian,
    width: 50,
    textAlign: 'right'
  },
  vegBox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 3
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greenLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    paddingVertical: 4,
    paddingHorizontal: 4
  },
  counterBtn: {
    padding: 4
  },
  counterText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.green,
    marginHorizontal: 8
  },
  // Input
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12
  },
  inputIcon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: COLORS.obsidian,
    fontSize: 14
  },
  // Bill
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  billLabel: {
    fontSize: 14,
    color: COLORS.gray
  },
  billValue: {
    fontSize: 14,
    color: COLORS.obsidian,
    fontWeight: '500'
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.obsidian
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.obsidian
  },
  // Trust Badge
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    backgroundColor: COLORS.greenLight,
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 16
  },
  trustText: {
    color: COLORS.green,
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 12
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: 20,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10
  },
  footerInfo: {
    justifyContent: 'center'
  },
  footerTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.obsidian
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.green
  },
  payBtn: {
    backgroundColor: COLORS.obsidian,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: COLORS.obsidian,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5
  },
  payText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
    marginRight: 8
  },
  // Empty State
  emptyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.obsidian,
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 32,
    textAlign: 'center'
  },
  browseBtn: {
    backgroundColor: COLORS.obsidian,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16
  },
  browseText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16
  },
});