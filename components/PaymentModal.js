import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

const { height } = Dimensions.get('window');

// 🎨 Obsidian + Cream Theme Palette
const COLORS = {
  overlay: 'rgba(0,0,0,0.6)',
  surface: '#FFFFFF',
  obsidian: '#0F172A',  // Main Brand Color
  cream: '#FEF3C7',     // Accent Color
  gray: '#64748B',
  lightGray: '#F8FAFC',
  border: '#E2E8F0',
  green: '#10B981',
  selectedBg: '#FFFBEB',
};

const PaymentMethodCard = ({ id, title, subtitle, icon, isSelected, onSelect }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={() => onSelect(id, title)}
    style={[styles.methodCard, isSelected && styles.methodCardSelected]}
  >
    <View style={styles.cardContent}>
      <View style={[styles.iconBox, { backgroundColor: isSelected ? COLORS.obsidian : COLORS.lightGray }]}>
        <Ionicons name={icon} size={20} color={isSelected ? COLORS.cream : COLORS.gray} />
      </View>
      <View style={styles.methodTextContainer}>
        <Text style={[styles.methodTitle, isSelected && { color: COLORS.obsidian }]}>{title}</Text>
        <Text style={styles.methodSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <View style={[styles.radioOuter, isSelected && { borderColor: COLORS.obsidian }]}>
      {isSelected && <View style={styles.radioInner} />}
    </View>
  </TouchableOpacity>
);

export default function PaymentModal({ visible, amount, onClose, onConfirmPayment, onSelectMethod, onFinish }) {
  const [status, setStatus] = useState('select'); // 'select' | 'processing' | 'success'
  const [selectedMethod, setSelectedMethod] = useState('upi');
  
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      setStatus('select');
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 60
      }).start();
    } else {
      slideAnim.setValue(height);
    }
  }, [visible]);

  const handleSelect = (methodId, label) => {
    setSelectedMethod(methodId);
    if (onSelectMethod) onSelectMethod(label);
  };

  const handlePay = async () => {
    setStatus('processing');
    
    // 1. Simulate Network Delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Mock Success Logic
    let success = true;
    if (onConfirmPayment) {
        try {
            const result = await onConfirmPayment();
            if (result === false) success = false;
        } catch (e) {
            console.log("Payment Error:", e);
        }
    }

    if (success) {
        setStatus('success'); 
        // Note: We removed the auto-close timeout here so the user sees the button
    } else {
        setStatus('select');
    }
  };

  const handleDone = () => {
    onClose(); 
    // This triggers the redirection logic passed from CartScreen
    if (onFinish) {
        setTimeout(() => onFinish(), 300); // Small delay for smooth modal close
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayTouch} onPress={status === 'success' ? handleDone : onClose} activeOpacity={1} />

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          
          {/* --- HEADER (Hidden on Success) --- */}
          {status !== 'success' && (
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
          )}

          {/* --- CONTENT BASED ON STATUS --- */}
          {status === 'processing' ? (
             <View style={styles.centerContainer}>
               <ActivityIndicator size={50} color={COLORS.obsidian} />
               <Text style={styles.processingTitle}>Processing Payment...</Text>
               <Text style={styles.processingSubtitle}>Please do not close the app</Text>
             </View>

          ) : status === 'success' ? (
             <View style={styles.centerContainer}>
               {/* ✅ SUCCESS LOTTIE ANIMATION */}
               <LottieView
                 source={{ uri: 'https://lottie.host/b9edd07b-2a52-4486-92f8-39a7f511ac00/XmAfnVpIpc.lottie' }}
                 autoPlay
                 loop={false}
                 style={{ width: 220, height: 220 }}
               />
               <Text style={styles.successTitle}>Order Placed!</Text>
               <Text style={styles.successSubtitle}>Your tiffin is being prepared.</Text>

               {/* ✅ NEW DONE BUTTON */}
               <TouchableOpacity 
                 style={styles.doneButton} 
                 onPress={handleDone}
                 activeOpacity={0.8}
               >
                 <Text style={styles.doneButtonText}>Done</Text>
                 <Ionicons name="checkmark-circle" size={20} color={COLORS.cream} />
               </TouchableOpacity>
             </View>

          ) : (
            <>
              {/* --- DEFAULT PAYMENT FORM --- */}
              <View style={styles.amountContainer}>
                <View>
                  <Text style={styles.totalLabel}>TOTAL TO PAY</Text>
                  <Text style={styles.totalValue}>₹{amount}.00</Text>
                </View>
                <View style={styles.secureBadge}>
                  <Ionicons name="lock-closed" size={12} color={COLORS.obsidian} />
                  <Text style={styles.secureText}>256-BIT SECURE</Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
              
              <View style={styles.methodsList}>
                <PaymentMethodCard 
                  id="upi" title="UPI / Google Pay" subtitle="Instant Payment" icon="qr-code" 
                  isSelected={selectedMethod === 'upi'} onSelect={handleSelect} 
                />
                <PaymentMethodCard 
                  id="card" title="Credit / Debit Card" subtitle="Visa, Mastercard" icon="card" 
                  isSelected={selectedMethod === 'card'} onSelect={handleSelect} 
                />
                <PaymentMethodCard 
                  id="cod" title="Cash on Delivery" subtitle="Pay at doorstep" icon="cash" 
                  isSelected={selectedMethod === 'cod'} onSelect={handleSelect} 
                />
              </View>

              <TouchableOpacity style={styles.payButton} onPress={handlePay} activeOpacity={0.8}>
                <Text style={styles.payButtonText}>Pay ₹{amount}</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.cream} />
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Secured by Razorpay</Text>
              </View>
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
  overlayTouch: {
    flex: 1,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    minHeight: 550,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
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
    alignSelf: 'flex-start',
  },

  // Amount Section
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
    fontWeight: '800',
    color: COLORS.gray,
    letterSpacing: 1,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.obsidian,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cream, 
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  secureText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.obsidian,
    marginLeft: 6,
  },

  // Selection
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray,
    marginBottom: 16,
    marginLeft: 4,
  },
  methodsList: {
    gap: 12,
    marginBottom: 30,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  methodCardSelected: {
    borderColor: COLORS.obsidian,
    backgroundColor: COLORS.selectedBg,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodTextContainer: {
    marginLeft: 16,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.obsidian,
  },
  methodSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
    fontWeight: '500',
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
    backgroundColor: COLORS.obsidian,
  },

  // Pay Button
  payButton: {
    backgroundColor: COLORS.obsidian,
    height: 64,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
    shadowColor: COLORS.obsidian,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  payButtonText: {
    color: COLORS.cream, 
    fontSize: 18,
    fontWeight: '900',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    opacity: 0.5,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Processing & Success State
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400, // Taller to fit the done button comfortably
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.obsidian,
    marginTop: 20,
    marginBottom: 8,
  },
  processingSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.obsidian,
    marginTop: 10,
  },
  successSubtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 5,
    marginBottom: 30,
  },
  // ✅ NEW DONE BUTTON STYLES
  doneButton: {
    backgroundColor: COLORS.obsidian,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: COLORS.obsidian,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  doneButtonText: {
    color: COLORS.cream,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});