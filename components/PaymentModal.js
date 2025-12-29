import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated
} from 'react-native';

// Third-party Imports
import { Ionicons } from '@expo/vector-icons';

// 🎨 Premium Theme Palette
const COLORS = {
  overlay: 'rgba(0,0,0,0.6)',
  surface: '#FFFFFF',
  primary: '#7E22CE',
  obsidian: '#111827',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  border: '#E5E7EB',
  success: '#10B981',
  successLight: '#DCFCE7',
  selectedBg: '#FBF7FF',
};

/**
 * PaymentMethodCard Component
 * Renders a selectable payment option row.
 */
const PaymentMethodCard = ({ id, title, subtitle, icon, color, isSelected, onSelect }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={() => onSelect(id)}
    style={[styles.methodCard, isSelected && styles.methodCardSelected]}
  >
    <View style={styles.cardContent}>
      <View style={[styles.iconBox, { backgroundColor: isSelected ? COLORS.primary : '#F9FAFB' }]}>
        <Ionicons name={icon} size={22} color={isSelected ? 'white' : color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.methodTitle, isSelected && { color: COLORS.primary }]}>{title}</Text>
        <Text style={styles.methodSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <View style={[styles.radioOuter, isSelected && { borderColor: COLORS.primary }]}>
      {isSelected && <View style={styles.radioInner} />}
    </View>
  </TouchableOpacity>
);

/**
 * PaymentModal
 * Handles payment method selection, processing simulation, and success confirmation.
 *
 * @param {object} props
 * @param {boolean} props.visible - Controls modal visibility
 * @param {number} props.amount - Total amount to pay
 * @param {function} props.onClose - Callback to close modal without paying
 * @param {function} props.onConfirmPayment - Async function to process DB transaction
 * @param {function} props.onFinish - Callback after success (navigates away)
 */
export default function PaymentModal({ visible, amount, onClose, onConfirmPayment, onFinish }) {
  const [status, setStatus] = useState('select'); // 'select' | 'processing' | 'success'
  const [selectedMethod, setSelectedMethod] = useState('upi');

  // Animation Refs
  const slideAnim = useRef(new Animated.Value(500)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // 1. Handle Entrance/Exit Animations
  useEffect(() => {
    if (visible) {
      setStatus('select');
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    } else {
      slideAnim.setValue(500);
    }
  }, [visible]);

  // 2. Handle Success Icon Animation
  useEffect(() => {
    if (status === 'success') {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [status]);

  /**
   * Orchestrates the payment flow.
   */
  const handlePay = async () => {
    setStatus('processing');

    // Simulate Network Delay for UX
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Execute actual payment logic passed from parent
    const success = await onConfirmPayment();

    if (success) {
      setStatus('success');
    } else {
      setStatus('select');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>

          {/* 🟢 SUCCESS STATE */}
          {status === 'success' ? (
            <View style={styles.successContainer}>
              
              <Animated.View style={[styles.successIconOuter, { transform: [{ scale: scaleAnim }] }]}>
                <View style={styles.successIconInner}>
                  <Ionicons name="checkmark-sharp" size={50} color="white" />
                </View>
              </Animated.View>

              <Text style={styles.successTitle}>Order Confirmed!</Text>
              <Text style={styles.successSubtitle}>
                Your chef has received the order{"\n"}and will start cooking shortly.
              </Text>

              <View style={styles.receiptBox}>
                <Text style={styles.receiptLabel}>AMOUNT PAID</Text>
                <Text style={styles.receiptValue}>₹{amount}.00</Text>
              </View>

              <TouchableOpacity style={styles.trackButton} onPress={onFinish} activeOpacity={0.8}>
                <Text style={styles.trackButtonText}>Track Order Status</Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </TouchableOpacity>

            </View>
          ) : (
            // 📝 NORMAL & PROCESSING STATES
            <>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.headerTitle}>Checkout</Text>
                  <Text style={styles.headerSubtitle}>Secure Payment Gateway</Text>
                </View>
                {status !== 'processing' && (
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <Ionicons name="close" size={20} color={COLORS.obsidian} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Total Amount Display */}
              <View style={styles.amountContainer}>
                <View>
                  <Text style={styles.totalLabel}>TOTAL TO PAY</Text>
                  <Text style={styles.totalValue}>₹{amount}.00</Text>
                </View>
                <View style={styles.secureBadge}>
                  <Ionicons name="lock-closed" size={12} color={COLORS.success} />
                  <Text style={styles.secureText}>256-BIT SECURE</Text>
                </View>
              </View>

              {/* Processing View */}
              {status === 'processing' ? (
                <View style={styles.processingContainer}>
                  <View style={styles.spinnerBg}>
                    <ActivityIndicator size={40} color={COLORS.primary} />
                  </View>
                  <Text style={styles.processingTitle}>Processing Payment...</Text>
                  <Text style={styles.processingSubtitle}>Please do not close the app</Text>
                </View>
              ) : (
                // Selection View
                <>
                  <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
                  <View style={styles.methodsContainer}>
                    <PaymentMethodCard 
                      id="upi" title="UPI / Google Pay" subtitle="Fast & Secure" icon="qr-code" color="#16A34A" 
                      isSelected={selectedMethod === 'upi'} onSelect={setSelectedMethod} 
                    />
                    <PaymentMethodCard 
                      id="card" title="Credit / Debit Card" subtitle="Visa, Mastercard" icon="card" color="#2563EB" 
                      isSelected={selectedMethod === 'card'} onSelect={setSelectedMethod} 
                    />
                    <PaymentMethodCard 
                      id="cod" title="Cash on Delivery" subtitle="Pay at doorstep" icon="cash" color="#D97706" 
                      isSelected={selectedMethod === 'cod'} onSelect={setSelectedMethod} 
                    />
                  </View>

                  <TouchableOpacity style={styles.payButton} onPress={handlePay} activeOpacity={0.8}>
                    <Text style={styles.payButtonText}>Pay ₹{amount}</Text>
                    <Ionicons name="shield-checkmark" size={18} color="white" />
                  </TouchableOpacity>

                  <View style={styles.footer}>
                    <Text style={styles.footerText}>Secured by Razorpay</Text>
                  </View>
                </>
              )}
            </>
          )}

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    minHeight: 520,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.obsidian,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: COLORS.gray,
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
  },
  // Amount
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray,
    letterSpacing: 1,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.obsidian,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  secureText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
    marginLeft: 6,
  },
  // Selection
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray,
    marginBottom: 12,
    marginLeft: 4,
  },
  methodsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  methodCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.selectedBg,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 14,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.obsidian,
  },
  methodSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  // Pay Button
  payButton: {
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    opacity: 0.5,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '600',
  },
  // Processing
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  spinnerBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.obsidian,
    marginBottom: 8,
  },
  processingSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  // Success Screen
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  successIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.success,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.obsidian,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  receiptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.lightGray,
    width: '100%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
  },
  receiptLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray,
    letterSpacing: 0.5,
  },
  receiptValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.obsidian,
  },
  trackButton: {
    width: '100%',
    backgroundColor: COLORS.obsidian,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.obsidian,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  trackButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});