import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
  Keyboard,
  Animated,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '../../lib/supabase';
import { useCart } from '../../lib/store';
import { getCurrentLocation } from '../../lib/location';
import DishCard from '../../components/DishCard';
import { COLORS, SHADOW } from '../../lib/theme';

const { width } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isVeg = (item) => {
  if (item.is_veg !== undefined && item.is_veg !== null) return item.is_veg;
  const text = (item.name + ' ' + (item.description || '')).toLowerCase();
  return !['chicken','egg','mutton','fish','prawn','meat','beef'].some(k => text.includes(k));
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { emoji: '🌅', text: 'Good morning' };
  if (h < 17) return { emoji: '☀️', text: 'Good afternoon' };
  return { emoji: '🌙', text: 'Good evening' };
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────

const SkeletonCard = () => {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonLeft}>
        <View style={[styles.skeletonLine, { width: '30%', height: 10, marginBottom: 10 }]} />
        <View style={[styles.skeletonLine, { width: '80%', height: 16, marginBottom: 8 }]} />
        <View style={[styles.skeletonLine, { width: '40%', height: 12, marginBottom: 8 }]} />
        <View style={[styles.skeletonLine, { width: '60%', height: 18, marginBottom: 8 }]} />
        <View style={[styles.skeletonLine, { width: '90%', height: 11 }]} />
      </View>
      <View style={styles.skeletonImage} />
    </Animated.View>
  );
};

// ─── Promo Banners ────────────────────────────────────────────────────────────

const PromoCard = ({ gradientColors, emoji, title, subtitle, codeOrBtn }) => (
  <LinearGradient
    colors={gradientColors}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.promoCard}
  >
    <View style={styles.promoContent}>
      <Text style={styles.promoEmoji}>{emoji}</Text>
      <Text style={styles.promoTitle}>{title}</Text>
      <Text style={styles.promoSub}>{subtitle}</Text>
      {codeOrBtn}
    </View>
    <View style={styles.promoCircle} />
    <View style={styles.promoCircle2} />
  </LinearGradient>
);

const PromoBanners = () => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.promoScrollContent}
    style={styles.promoScroll}
  >
    <PromoCard
      gradientColors={[COLORS.primary, COLORS.primaryDark]}
      emoji="🎉"
      title="50% OFF"
      subtitle="First 3 orders"
      codeOrBtn={
        <View style={styles.promoCode}>
          <Text style={styles.promoCodeText}>TIFFIN50</Text>
        </View>
      }
    />
    <PromoCard
      gradientColors={['#06C167', '#059952']}
      emoji="🛵"
      title="Free Delivery"
      subtitle="Orders above ₹150"
      codeOrBtn={
        <TouchableOpacity style={styles.promoBtn}>
          <Text style={styles.promoBtnText}>Order Now</Text>
        </TouchableOpacity>
      }
    />
    <PromoCard
      gradientColors={['#3B82F6', '#2563EB']}
      emoji="👨‍🍳"
      title="Chef Picks"
      subtitle="Curated weekly meals"
      codeOrBtn={
        <TouchableOpacity style={styles.promoBtn}>
          <Text style={styles.promoBtnText}>See Menu</Text>
        </TouchableOpacity>
      }
    />
  </ScrollView>
);

// ─── Category Chips ───────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'All',       label: 'All',      emoji: '🍽️' },
  { id: 'Veg',       label: 'Veg',      emoji: '🥗' },
  { id: 'Non-Veg',   label: 'Non-Veg',  emoji: '🍗' },
  { id: 'Thali',     label: 'Thali',    emoji: '🍛' },
  { id: 'Rice',      label: 'Rice',     emoji: '🍚' },
  { id: 'Roti',      label: 'Roti',     emoji: '🫓' },
  { id: 'Biryani',   label: 'Biryani',  emoji: '🍲' },
  { id: 'Snacks',    label: 'Snacks',   emoji: '🥙' },
];

const CategoryChip = ({ cat, isActive, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={[styles.chip, isActive && styles.chipActive]}
  >
    <Text style={styles.chipEmoji}>{cat.emoji}</Text>
    <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>{cat.label}</Text>
  </TouchableOpacity>
);

// ─── Header ───────────────────────────────────────────────────────────────────

const HomeHeader = ({
  insets, greeting, locationStatus,
  searchQuery, setSearchQuery,
  category, setCategory,
  menuItems, onLogout,
}) => (
  <View>
    {/* Top white header */}
    <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
      {/* Row 1: Location + Avatar */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.locationBtn} activeOpacity={0.7}>
          <Ionicons name="location" size={16} color={COLORS.primary} />
          <View style={styles.locationText}>
            <Text style={styles.locationLabel}>DELIVERING TO</Text>
            <View style={styles.locationNameRow}>
              <Text style={styles.locationName} numberOfLines={1}>
                {locationStatus === 'Current Location' ? 'Current Location' : 'Vijayapura'}
              </Text>
              <Ionicons name="chevron-down" size={13} color={COLORS.obsidian} style={{ marginLeft: 2 }} />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={onLogout} activeOpacity={0.8} style={styles.avatarBtn}>
          <Text style={styles.avatarInitial}>U</Text>
        </TouchableOpacity>
      </View>

      {/* Row 2: Greeting */}
      <View style={styles.greetingRow}>
        <Text style={styles.greetingEmoji}>{greeting.emoji}</Text>
        <View>
          <Text style={styles.greetingText}>{greeting.text}!</Text>
          <Text style={styles.greetingSub}>What's on your plate today?</Text>
        </View>
      </View>

      {/* Row 3: Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={19} color={COLORS.gray} style={{ marginRight: 10 }} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search 'Paneer', 'Biryani'..."
          placeholderTextColor={COLORS.gray}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={Keyboard.dismiss}
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => { setSearchQuery(''); Keyboard.dismiss(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={COLORS.gray} />
          </TouchableOpacity>
        ) : (
          <View style={styles.micDivider}>
            <Ionicons name="mic-outline" size={18} color={COLORS.medium} />
          </View>
        )}
      </View>
    </View>

    {/* Promo Banners */}
    <View style={styles.promoSection}>
      <PromoBanners />
    </View>

    {/* Section label */}
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>Popular Near You</Text>
      <TouchableOpacity>
        <Text style={styles.sectionLink}>See all</Text>
      </TouchableOpacity>
    </View>

    {/* Category chips */}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipScroll}
      style={{ marginBottom: 8 }}
    >
      {CATEGORIES.map(cat => (
        <CategoryChip
          key={cat.id}
          cat={cat}
          isActive={category === cat.id}
          onPress={() => setCategory(cat.id)}
        />
      ))}
    </ScrollView>

    <View style={styles.listDivider} />
  </View>
);

// ─── Floating Cart ────────────────────────────────────────────────────────────

const FloatingCart = ({ cart, total, count, slideAnim, insets, onPress }) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(pulse, { toValue: 1.04, useNativeDriver: true, friction: 4 }),
      Animated.spring(pulse, { toValue: 1,    useNativeDriver: true, friction: 4 }),
    ]).start();
  }, [count]);

  return (
    <Animated.View style={[styles.floatContainer, {
      bottom: insets.bottom > 0 ? insets.bottom + 8 : 20,
      transform: [{ translateY: slideAnim }, { scale: pulse }],
    }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.floatBtn}>

        {/* Left — badge + label */}
        <View style={styles.floatLeft}>
          <View style={styles.floatBadge}>
            <Ionicons name="bag-handle" size={15} color={COLORS.primary} />
            <Text style={styles.floatBadgeNum}>{count}</Text>
          </View>
          <Text style={styles.floatItemsText}>
            {count === 1 ? '1 item added' : `${count} items added`}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.floatDivider} />

        {/* Right — price + caret */}
        <View style={styles.floatRight}>
          <Text style={styles.floatTotal}>₹{total}</Text>
          <View style={styles.floatArrow}>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </View>
        </View>

      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const slideAnim = useRef(new Animated.Value(120)).current;

  const [menuItems, setMenuItems]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory]     = useState('All');
  const [userPosition, setUserPos]  = useState(null);
  const [locationStatus, setLocSts] = useState('Loading...');

  const { cart, getCartTotal, signOut, setUserLocation } = useCart();
  const greeting = getGreeting();

  useEffect(() => { initData(); }, []);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: cart.length > 0 ? 0 : 120,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [cart.length]);

  const initData = async () => {
    setLoading(true);
    try {
      // Location
      try {
        const coords = await getCurrentLocation();
        if (coords) { setUserPos(coords); setUserLocation(coords); setLocSts('Current Location'); }
        else setLocSts('Location off');
      } catch { setLocSts('Location off'); }

      // Menu
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, profiles:chef_id(latitude, longitude)');
      if (error) throw error;
      setMenuItems(data || []);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchSearch = item.name.toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q);

    const vegItem = isVeg(item);
    let matchCat = true;
    if (category === 'Veg')     matchCat = vegItem;
    if (category === 'Non-Veg') matchCat = !vegItem;
    if (!['All','Veg','Non-Veg'].includes(category)) {
      const nameDesc = (item.name + ' ' + (item.description || '')).toLowerCase();
      matchCat = nameDesc.includes(category.toLowerCase());
    }
    return matchSearch && matchCat;
  });

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await signOut();
        router.replace('/login');
      }},
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.cardPad}>
      <DishCard dish={item} userLocation={userPosition} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {loading ? (
        <FlatList
          data={[...Array(3)]}
          keyExtractor={(_, i) => `sk-${i}`}
          renderItem={() => <View style={styles.cardPad}><SkeletonCard /></View>}
          ListHeaderComponent={
            <HomeHeader
              insets={insets}
              greeting={greeting}
              locationStatus={locationStatus}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              category={category}
              setCategory={setCategory}
              menuItems={[]}
              onLogout={handleLogout}
            />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          ListHeaderComponent={
            <HomeHeader
              insets={insets}
              greeting={greeting}
              locationStatus={locationStatus}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              category={category}
              setCategory={setCategory}
              menuItems={menuItems}
              onLogout={handleLogout}
            />
          }
          contentContainerStyle={{ paddingBottom: cart.length > 0 ? 150 : 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={styles.emptyTitle}>Nothing found</Text>
              <Text style={styles.emptySub}>
                {searchQuery ? `No results for "${searchQuery}"` : 'No dishes in this category yet'}
              </Text>
              {searchQuery ? (
                <TouchableOpacity style={styles.clearSearchBtn} onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchText}>Clear Search</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}

      {cart.length > 0 && (
        <FloatingCart
          cart={cart}
          count={cart.reduce((s, i) => s + i.quantity, 0)}
          total={getCartTotal()}
          slideAnim={slideAnim}
          insets={insets}
          onPress={() => router.push('/cart')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ── Top Header ────────────────────────────────────
  topHeader: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingBottom: 20,
    ...SHADOW.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: { marginLeft: 8 },
  locationLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  locationNameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  locationName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.obsidian,
    maxWidth: width * 0.5,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarInitial: { color: COLORS.surface, fontSize: 16, fontWeight: '800' },

  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  greetingEmoji: { fontSize: 26 },
  greetingText: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.obsidian,
    letterSpacing: -0.5,
  },
  greetingSub: {
    fontSize: 13,
    color: COLORS.medium,
    fontWeight: '500',
    marginTop: 1,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1.5,
    borderColor: COLORS.light,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.obsidian,
    height: '100%',
  },
  micDivider: {
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.light,
  },

  // ── Promo ──────────────────────────────────────────
  promoSection: { marginTop: 18 },
  promoScroll: {},
  promoScrollContent: { paddingHorizontal: 20, gap: 12 },
  promoCard: {
    width: width * 0.68,
    height: 138,
    borderRadius: 20,
    padding: 16,
    paddingBottom: 14,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
  },
  promoContent: { zIndex: 1, flex: 1, justifyContent: 'space-between' },
  promoEmoji: { fontSize: 20, marginBottom: 0 },
  promoTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5, lineHeight: 26 },
  promoSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginBottom: 8, lineHeight: 15 },
  promoCode: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  promoCodeText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  promoBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  promoBtnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  promoCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.07)',
    right: -20,
    bottom: -30,
  },
  promoCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.06)',
    right: 50,
    top: -20,
  },

  // ── Section / Chips ────────────────────────────────
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: COLORS.obsidian, letterSpacing: -0.3 },
  sectionLink: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  chipScroll: { paddingHorizontal: 20, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.light,
    gap: 5,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 13, fontWeight: '600', color: COLORS.medium },
  chipLabelActive: { color: COLORS.surface, fontWeight: '800' },

  listDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },

  // ── Cards ──────────────────────────────────────────
  cardPad: { paddingHorizontal: 16, marginBottom: 14 },

  // ── Skeleton ───────────────────────────────────────
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.light,
  },
  skeletonLeft: { flex: 1, paddingRight: 14 },
  skeletonLine: { backgroundColor: COLORS.border, borderRadius: 6, marginBottom: 6 },
  skeletonImage: {
    width: 118,
    height: 112,
    borderRadius: 16,
    backgroundColor: COLORS.border,
  },

  // ── Empty State ────────────────────────────────────
  emptyState: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.obsidian, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.medium, textAlign: 'center', lineHeight: 20 },
  clearSearchBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
  },
  clearSearchText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },

  // ── Floating Cart ──────────────────────────────────
  floatContainer: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 100,
  },
  floatBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
  },
  floatLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  floatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 5,
  },
  floatBadgeNum: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
  },
  floatItemsText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
  floatDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.light,
    marginHorizontal: 12,
  },
  floatRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  floatTotal: { fontSize: 18, fontWeight: '900', color: COLORS.obsidian },
  floatArrow: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
