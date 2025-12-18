import { View, Text, Image, TouchableOpacity, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../lib/store';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 🎨 God-Tier Design System
const COLORS = {
  background: '#F8F9FC', 
  surface: '#FFFFFF',
  obsidian: '#0F172A',   
  subtext: '#64748B',    
  border: '#E2E8F0',
  accent: '#10B981',     
  primary: '#1A0B2E',    
  inputBg: '#F1F5F9',
};

const SHADOWS = {
  card: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  float: {
    shadowColor: '#1A0B2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  }
};

const SPACING = { sm: 8, md: 16, lg: 24, xl: 32 };

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  // 👇 Added 'placeOrder' from store
  const { cart, removeFromCart, addToCart, clearCart, getCartTotal, placeOrder } = useCart(); 
  const router = useRouter();
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false); // 👈 Loading state for button

  // 🧮 Calculations
  const itemTotal = getCartTotal();
  const deliveryFee = itemTotal > 200 || itemTotal === 0 ? 0 : 40;
  const platformFee = itemTotal > 0 ? 5 : 0;
  const taxes = itemTotal * 0.05;
  const discount = itemTotal > 200 ? 30 : 0;
  const grandTotal = itemTotal + deliveryFee + platformFee + taxes - discount;

  // 🛒 HANDLE CHECKOUT LOGIC
  const handleCheckout = async () => {
    setLoading(true);
    
    // 1. Call the store action we created
    const result = await placeOrder();

    setLoading(false);

    if (result.success) {
      // 2. Success: Redirect to Orders Page
      Alert.alert("Success! 🎉", "Your tiffin is being prepared.", [
        { text: "Track Order", onPress: () => router.replace('/(tabs)/orders') }
      ]);
    } else {
      // 3. Error: Show alert
      Alert.alert("Order Failed", result.error);
    }
  };

  // 🛑 EMPTY STATE
  if (!cart || cart.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.surface, paddingTop: insets.top }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <View style={{ 
            width: 100, height: 100, borderRadius: 50, 
            backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 24 
          }}>
            <Ionicons name="basket-outline" size={48} color={COLORS.subtext} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.obsidian, marginBottom: 8 }}>
            Your cart is empty
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.subtext, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
            Good food is waiting for you. Add some delicious tiffins to get started!
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: '100%', borderRadius: 16, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={['#1A0B2E', '#2D1B4E']}
              style={{ paddingVertical: 18, alignItems: 'center' }}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Browse Menu</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        
        {/* ─── HEADER ─── */}
        <View style={{ 
          paddingTop: insets.top + 10, 
          paddingBottom: SPACING.md, 
          paddingHorizontal: SPACING.lg, 
          borderBottomWidth: 1, 
          borderBottomColor: COLORS.border,
          backgroundColor: COLORS.surface,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: SPACING.md, padding: 4 }}>
              <Ionicons name="chevron-back" size={26} color={COLORS.obsidian} />
            </TouchableOpacity>
            <View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.obsidian, letterSpacing: -0.5 }}>Checkout</Text>
                <Text style={{ fontSize: 12, color: COLORS.subtext, fontWeight: '500' }}>{cart.length} Items</Text>
            </View>
          </View>
          <TouchableOpacity onPress={clearCart} style={{ backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
            <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '700' }}>CLEAR</Text>
          </TouchableOpacity>
        </View>

        {/* ─── SCROLLABLE CONTENT ─── */}
        <ScrollView 
          style={{ flex: 1, backgroundColor: COLORS.background }}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 150 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Discount Banner */}
          {itemTotal > 0 && itemTotal < 200 ? (
             <LinearGradient
                colors={['#FFF7ED', '#FFEDD5']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, padding: 16, marginBottom: SPACING.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FED7AA' }}
             >
                <View style={{ backgroundColor: '#F97316', padding: 8, borderRadius: 10, marginRight: 12 }}>
                   <Ionicons name="gift" size={20} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: '#9A3412', fontWeight: '700', fontSize: 14 }}>Add ₹{200 - itemTotal} more</Text>
                    <Text style={{ color: '#C2410C', fontSize: 12 }}>Unlock ₹30 OFF & Free Delivery</Text>
                </View>
             </LinearGradient>
          ) : (
             <LinearGradient
                colors={['#ECFDF5', '#D1FAE5']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, padding: 16, marginBottom: SPACING.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#6EE7B7' }}
             >
                <View style={{ backgroundColor: COLORS.accent, padding: 8, borderRadius: 10, marginRight: 12 }}>
                   <Ionicons name="checkmark-circle" size={20} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: '#065F46', fontWeight: '700', fontSize: 14 }}>Best Price Unlocked!</Text>
                    <Text style={{ color: '#047857', fontSize: 12 }}>Free Delivery & Discount Applied</Text>
                </View>
             </LinearGradient>
          )}

          {/* Cart Items */}
          {cart.map((item) => (
            <View key={item.id} style={{ 
                backgroundColor: COLORS.surface, 
                borderRadius: 20, 
                padding: 16, 
                marginBottom: 16, 
                flexDirection: 'row',
                ...SHADOWS.card 
            }}>
              <Image 
                source={{ uri: item.image_url }} 
                style={{ width: 70, height: 70, borderRadius: 14, backgroundColor: COLORS.background }} 
              />
              
              <View style={{ flex: 1, marginLeft: 16, justifyContent: 'space-between' }}>
                <View>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.obsidian }} numberOfLines={1}>{item.name}</Text>
                    <Text style={{ fontSize: 13, color: COLORS.subtext, marginTop: 2 }}>₹{item.price} per plate</Text>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    {/* Premium Stepper */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 10, padding: 4 }}>
                        <TouchableOpacity onPress={() => removeFromCart(item.id)} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface, borderRadius: 8, ...SHADOWS.card }}>
                            <Ionicons name="remove" size={16} color={COLORS.obsidian} />
                        </TouchableOpacity>
                        <Text style={{ marginHorizontal: 12, fontWeight: '700', color: COLORS.obsidian }}>{item.quantity}</Text>
                        <TouchableOpacity onPress={() => addToCart(item)} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.obsidian, borderRadius: 8 }}>
                            <Ionicons name="add" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.obsidian }}>₹{item.price * item.quantity}</Text>
                </View>
              </View>
            </View>
          ))}

          {/* 📝 Special Request Input */}
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.obsidian, marginBottom: 8, marginLeft: 4 }}>
              COOKING INSTRUCTIONS
            </Text>
            <View style={{ 
                backgroundColor: COLORS.surface, 
                borderRadius: 16, 
                borderWidth: 1, 
                borderColor: COLORS.border,
                padding: 16,
                ...SHADOWS.card
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Ionicons name="create-outline" size={20} color={COLORS.subtext} style={{ marginTop: 2, marginRight: 8 }} />
                    <TextInput 
                        placeholder="e.g. Less spicy, no onions, extra gravy..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        maxLength={100}
                        style={{ 
                            flex: 1, 
                            fontSize: 14, 
                            color: COLORS.obsidian, 
                            minHeight: 60,
                            textAlignVertical: 'top'
                        }}
                        value={instructions}
                        onChangeText={setInstructions}
                    />
                </View>
                <Text style={{ textAlign: 'right', fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                    {instructions.length}/100
                </Text>
            </View>
          </View>
        </ScrollView>

        {/* ─── DOCK ─── */}
        <View style={{ 
            backgroundColor: COLORS.surface, 
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.lg,
            paddingBottom: insets.bottom + 10,
            borderTopLeftRadius: 32, 
            borderTopRightRadius: 32,
            ...SHADOWS.float
        }}>
            {/* Bill Summary */}
            <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ color: COLORS.subtext }}>Item Total</Text>
                    <Text style={{ color: COLORS.obsidian, fontWeight: '600' }}>₹{itemTotal}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ color: COLORS.subtext }}>Delivery Fee</Text>
                    <Text style={{ color: deliveryFee === 0 ? COLORS.accent : COLORS.obsidian, fontWeight: '600' }}>
                        {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ color: COLORS.subtext }}>Platform & Tax</Text>
                    <Text style={{ color: COLORS.obsidian, fontWeight: '600' }}>₹{(platformFee + taxes).toFixed(0)}</Text>
                </View>
                {discount > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                        <Text style={{ color: COLORS.accent }}>Total Savings</Text>
                        <Text style={{ color: COLORS.accent, fontWeight: '700' }}>-₹{discount}</Text>
                    </View>
                )}
                
                {/* Dashed Line Simulator */}
                <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.border }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: COLORS.obsidian, fontWeight: '800', fontSize: 18 }}>To Pay</Text>
                    <Text style={{ color: COLORS.obsidian, fontWeight: '900', fontSize: 24 }}>₹{grandTotal.toFixed(0)}</Text>
                </View>
            </View>

            {/* Gradient Checkout Button - NOW WITH REAL LOGIC */}
            <TouchableOpacity onPress={handleCheckout} disabled={loading}>
                <LinearGradient
                    colors={['#1A0B2E', '#2D1B4E']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ borderRadius: 20, paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, marginRight: 8 }}>Place Order</Text>
                            <Ionicons name="arrow-forward-circle" size={24} color="white" />
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </View>
  );
}