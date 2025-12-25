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
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../lib/store';
import { supabase } from '../lib/supabase';

// 🎨 Premium Theme
const COLORS = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  obsidian: '#111827',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  green: '#10B981',
  red: '#EF4444',
  border: '#E5E7EB',
};

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // 🛒 Get Cart Actions
  const { cart, addToCart, removeFromCart, clearCart, getCartTotal } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [instruction, setInstruction] = useState('');

  // 💰 Bill Calculation
  const itemTotal = getCartTotal();
  const deliveryFee = itemTotal > 0 ? 40 : 0;
  const platformFee = itemTotal > 0 ? 5 : 0;
  const gst = Math.round(itemTotal * 0.05); // 5% GST
  const grandTotal = itemTotal + deliveryFee + platformFee + gst;

  // 🛍️ Checkout Logic
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      // 1. Check User Session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in to place an order.');

      // 2. Create Order (Instructions Enabled ✅)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          chef_id: cart[0].chef_id, // Assumes 1 chef per order
          total_price: grandTotal,
          status: 'pending',
          instruction: instruction // 👈 UNCOMMENTED: Saves the note!
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Create Order Items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 4. Success
      clearCart();
      Alert.alert("Order Placed! 🥘", "Your tiffin is being prepared.", [
        { text: "Track Order", onPress: () => router.replace('/(tabs)/orders') }
      ]);

    } catch (error) {
      Alert.alert('Checkout Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Veg/Non-Veg Indicator Component
  const VegIndicator = ({ isVeg }) => (
    <View style={[styles.vegBox, { borderColor: isVeg ? COLORS.green : COLORS.red }]}>
      <View style={[styles.vegDot, { backgroundColor: isVeg ? COLORS.green : COLORS.red }]} />
    </View>
  );

  const renderItem = ({ item }) => {
    const isVegetarian = item.is_veg !== false; 
    return (
      <View style={styles.itemRow}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start' }}>
           <VegIndicator isVeg={isVegetarian} />
           <View style={{ marginLeft: 8 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price}</Text>
           </View>
        </View>

        <View style={styles.counterContainer}>
           <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.counterBtn}>
              <Ionicons name="remove" size={16} color={COLORS.green} />
           </TouchableOpacity>
           <Text style={styles.counterText}>{item.quantity}</Text>
           <TouchableOpacity onPress={() => addToCart(item)} style={styles.counterBtn}>
              <Ionicons name="add" size={16} color={COLORS.green} />
           </TouchableOpacity>
        </View>

        <Text style={styles.rowTotal}>₹{item.price * item.quantity}</Text>
      </View>
    );
  };

  // 🛑 Empty State
  if (cart.length === 0) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
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
      {/* 🏡 Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
           <Ionicons name="arrow-back" size={24} color={COLORS.obsidian} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {/* 📦 Items List */}
        <View style={styles.section}>
           <FlatList
             data={cart}
             keyExtractor={item => item.id.toString()}
             renderItem={renderItem}
             scrollEnabled={false}
           />
        </View>

        {/* 📝 Instructions */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Cooking Instructions</Text>
           <View style={styles.inputBox}>
              <Ionicons name="create-outline" size={20} color={COLORS.gray} style={{ marginRight: 8 }} />
              <TextInput 
                placeholder="e.g. Less spicy, no cutlery..."
                placeholderTextColor={COLORS.gray}
                style={styles.input}
                value={instruction}
                onChangeText={setInstruction}
              />
           </View>
        </View>

        {/* 🧾 Bill Details */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Bill Details</Text>
           <View style={styles.billRow}><Text style={styles.billLabel}>Item Total</Text><Text style={styles.billValue}>₹{itemTotal}</Text></View>
           <View style={styles.billRow}><Text style={styles.billLabel}>Delivery Fee</Text><Text style={styles.billValue}>₹{deliveryFee}</Text></View>
           <View style={styles.billRow}><Text style={styles.billLabel}>Platform Fee</Text><Text style={styles.billValue}>₹{platformFee}</Text></View>
           <View style={styles.billRow}><Text style={styles.billLabel}>GST (5%)</Text><Text style={styles.billValue}>₹{gst}</Text></View>
           <View style={styles.divider} />
           <View style={styles.totalRow}><Text style={styles.totalLabel}>To Pay</Text><Text style={styles.totalValue}>₹{grandTotal}</Text></View>
        </View>

        {/* 🛡️ Trust Badge */}
        <View style={styles.trustBadge}>
           <Ionicons name="shield-checkmark" size={16} color={COLORS.green} />
           <Text style={styles.trustText}>Safe & Hygienic Delivery</Text>
        </View>

      </ScrollView>

      {/* 💸 Footer Payment Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
         <View style={styles.footerInfo}>
            <Text style={styles.footerTotal}>₹{grandTotal}</Text>
            <Text style={styles.footerLink}>View Bill</Text>
         </View>

         <TouchableOpacity onPress={handleCheckout} disabled={loading} style={styles.payBtn}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.payText}>Place Order</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </>
            )}
         </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.obsidian },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: COLORS.lightGray },
  section: { backgroundColor: COLORS.surface, marginTop: 12, padding: 20, borderRadius: 16, marginHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.obsidian, marginBottom: 12, letterSpacing: 0.5 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  itemName: { fontSize: 16, fontWeight: '700', color: COLORS.obsidian },
  itemPrice: { fontSize: 12, fontWeight: '500', color: COLORS.gray, marginTop: 2 },
  rowTotal: { fontSize: 14, fontWeight: '700', color: COLORS.obsidian, width: 50, textAlign: 'right' },
  vegBox: { width: 16, height: 16, borderWidth: 1, borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginTop: 3 },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  counterContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 8, borderWidth: 1, borderColor: '#D1FAE5', paddingVertical: 4, paddingHorizontal: 4 },
  counterBtn: { padding: 4 },
  counterText: { fontSize: 14, fontWeight: '800', color: COLORS.green, marginHorizontal: 8 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 12, color: COLORS.obsidian, fontSize: 14 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billLabel: { fontSize: 14, color: COLORS.gray },
  billValue: { fontSize: 14, color: COLORS.obsidian, fontWeight: '500' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.border },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 18, fontWeight: '800', color: COLORS.obsidian },
  totalValue: { fontSize: 18, fontWeight: '800', color: COLORS.obsidian },
  trustBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, backgroundColor: '#ECFDF5', padding: 12, borderRadius: 12, marginHorizontal: 16 },
  trustText: { color: COLORS.green, fontWeight: '700', marginLeft: 8, fontSize: 12 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface, padding: 20, paddingTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, shadowColor: '#000', shadowOffset: {width: 0, height: -4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10 },
  footerInfo: { justifyContent: 'center' },
  footerTotal: { fontSize: 20, fontWeight: '800', color: COLORS.obsidian },
  footerLink: { fontSize: 12, fontWeight: '700', color: COLORS.green },
  payBtn: { backgroundColor: COLORS.obsidian, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, shadowColor: COLORS.obsidian, shadowOpacity: 0.3, shadowOffset: {width: 0, height: 4}, elevation: 5 },
  payText: { color: 'white', fontWeight: '800', fontSize: 16, marginRight: 8 },
  emptyCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: COLORS.obsidian, marginBottom: 8 },
  emptySubtitle: { fontSize: 16, color: COLORS.gray, marginBottom: 32, textAlign: 'center' },
  browseBtn: { backgroundColor: COLORS.obsidian, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
  browseText: { color: 'white', fontWeight: '800', fontSize: 16 },
});