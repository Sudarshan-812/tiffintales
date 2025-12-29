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
  Platform
} from 'react-native';

// Third-party Imports
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Local Imports
import { supabase } from '../../lib/supabase';
import { useCart } from '../../lib/store';
import { getCurrentLocation } from '../../lib/location';
import DishCard from '../../components/DishCard';

// Premium Theme Palette
const COLORS = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  obsidian: '#111827',
  primary: '#7E22CE',
  secondary: '#F3F4F6',
  gray: '#6B7280',
  border: '#E5E7EB',
  green: '#10B981',
  red: '#EF4444',
  cartShadow: '#000',
  primaryLight: '#F3E8FF',
};

/**
 * Determines if a dish is Vegetarian based on flag or keywords.
 * @param {object} item - The menu item
 * @returns {boolean}
 */
const isVeg = (item) => {
  if (item.is_veg !== undefined && item.is_veg !== null) return item.is_veg;
  const text = (item.name + " " + item.description).toLowerCase();
  const nonVegKeywords = ['chicken', 'egg', 'mutton', 'fish', 'prawn', 'meat', 'beef'];
  return !nonVegKeywords.some(keyword => text.includes(keyword));
};

/**
 * FilterChip Component
 * Renders a selectable category chip.
 */
const FilterChip = ({ label, icon, isActive, onPress, count }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={[
      styles.filterChip,
      isActive ? styles.filterChipActive : styles.filterChipInactive
    ]}
  >
    {icon && (
      <Ionicons
        name={icon}
        size={14}
        color={isActive ? 'white' : COLORS.gray}
        style={styles.filterIcon}
      />
    )}
    <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
      {label}
    </Text>
    {count !== undefined && (
      <View style={isActive ? styles.countBadgeActive : styles.countBadgeInactive}>
        <Text style={[styles.countText, isActive && styles.countTextActive]}>
          {count}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

/**
 * HomeHeader Component
 * Contains Location, Profile, Hero text, Search, and Filters.
 */
const HomeHeader = ({
  insets,
  locationStatus,
  searchQuery,
  setSearchQuery,
  category,
  setCategory,
  menuItems,
  filteredCount,
  onLogout
}) => (
  <View style={styles.headerBackground}>
    <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>

      {/* Top Row: Location & Profile */}
      <View style={styles.topRow}>
        <View>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={COLORS.primary} style={styles.locationIcon} />
            <Text style={styles.locationTitle}>VIJAYAPURA</Text>
            <Ionicons name="chevron-down" size={12} color={COLORS.gray} style={styles.locationChevron} />
          </View>
          <Text style={styles.locationStatus}>{locationStatus}</Text>
        </View>

        <TouchableOpacity
          onPress={onLogout}
          style={styles.profileButton}
        >
          <Ionicons name="person" size={18} color={COLORS.obsidian} />
        </TouchableOpacity>
      </View>

      {/* 🥘 Hero Section */}
      <View style={styles.heroSection}>
        <View>
          <Text style={styles.heroSubtitle}>Hungry?</Text>
          <Text style={styles.heroTitle}>
            What's in your{"\n"}
            <Text style={{ color: COLORS.primary }}>tiffin today?</Text>
          </Text>
        </View>
        <View style={styles.heroIconCircle}>
          <Text style={styles.heroEmoji}>🍱</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.gray} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for biryani, paneer..."
          placeholderTextColor={COLORS.gray}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); Keyboard.dismiss(); }}>
            <Ionicons name="close-circle" size={16} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>
    </View>

    {/* FILTERS */}
    <View style={styles.filterSection}>
      <View style={styles.chipRow}>
        <FilterChip
          label="All"
          icon="grid"
          isActive={category === 'All'}
          onPress={() => setCategory('All')}
          count={menuItems.length}
        />
        <FilterChip
          label="Veg"
          icon="leaf"
          isActive={category === 'Veg'}
          onPress={() => setCategory('Veg')}
          count={menuItems.filter(i => isVeg(i)).length}
        />
        <FilterChip
          label="Non-Veg"
          icon="fish"
          isActive={category === 'Non-Veg'}
          onPress={() => setCategory('Non-Veg')}
          count={menuItems.filter(i => !isVeg(i)).length}
        />
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          {category === 'All' ? 'Near You' : category + ' Menu'}
        </Text>
        <View style={styles.resultsBadge}>
          <Text style={styles.resultsBadgeText}>{filteredCount} ITEMS</Text>
        </View>
      </View>
    </View>
  </View>
);

/**
 * FloatingCart Component
 * Sticky footer showing cart summary.
 */
const FloatingCart = ({ cart, total, count, slideUpAnim, insets, onPress }) => {
  const cartImages = [...new Set(cart.map(item => item.image_url))].slice(0, 3);

  return (
    <Animated.View
      style={[
        styles.floatingCartContainer,
        {
          bottom: insets.bottom > 0 ? insets.bottom : 20,
          transform: [{ translateY: slideUpAnim }]
        }
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={styles.floatingCartButton}
      >
        <View style={styles.cartLeftSection}>
          <View style={styles.cartImagesContainer}>
            {cartImages.map((uri, index) => (
              <Image
                key={index}
                source={{ uri: uri || 'https://via.placeholder.com/50' }}
                style={[
                  styles.cartThumbnail,
                  { marginLeft: index === 0 ? 0 : -14 }
                ]}
              />
            ))}
          </View>
          <View>
            <Text style={styles.cartCountText}>
              {count} {count === 1 ? 'Item' : 'Items'}
            </Text>
            <Text style={styles.viewCartText}>View Cart</Text>
          </View>
        </View>

        <View style={styles.cartRightSection}>
          <View style={styles.cartTotalContainer}>
            <Text style={styles.cartTotalText}>₹{total}</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={28} color="white" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(100)).current;

  // State
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [userPosition, setUserPosition] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Locating...');

  // Store
  const { cart, getCartTotal, signOut, setUserLocation } = useCart();

  useEffect(() => {
    initializeData();
  }, []);

  // Cart Animation Effect
  useEffect(() => {
    if (cart.length > 0) {
      Animated.spring(slideUpAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40
      }).start();
    } else {
      Animated.timing(slideUpAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [cart.length]);

  const initializeData = async () => {
    setLoading(true);
    try {
      // A. Get GPS
      try {
        const coords = await getCurrentLocation();
        if (coords) {
          setUserPosition(coords);
          setUserLocation(coords);
          setLocationStatus('Current Location');
        } else {
          setLocationStatus('Location Denied');
        }
      } catch (e) {
        setLocationStatus('Vijayapura (Default)');
      }

      // B. Fetch Menu
      const { data, error } = await supabase
        .from('menu_items')
        .select(`*, profiles:chef_id ( latitude, longitude )`);

      if (error) throw error;
      setMenuItems(data || []);

    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const itemIsVeg = isVeg(item);
    let matchesCategory = true;
    if (category === 'Veg') matchesCategory = itemIsVeg;
    if (category === 'Non-Veg') matchesCategory = !itemIsVeg;

    return matchesSearch && matchesCategory;
  });

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.cardWrapper}>
      <DishCard dish={item} userLocation={userPosition} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.obsidian} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          ListHeaderComponent={
            <HomeHeader
              insets={insets}
              locationStatus={locationStatus}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              category={category}
              setCategory={setCategory}
              menuItems={menuItems}
              filteredCount={filteredItems.length}
              onLogout={handleLogout}
            />
          }
          contentContainerStyle={{ paddingBottom: cart.length > 0 ? 140 : 40 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <Ionicons name="fast-food-outline" size={60} color={COLORS.gray} />
              <Text style={styles.emptyStateText}>No dishes found</Text>
            </View>
          }
        />
      )}

      {/* ZOMATO STYLE FLOATING CART */}
      {cart.length > 0 && (
        <FloatingCart
          cart={cart}
          count={cart.reduce((sum, item) => sum + item.quantity, 0)}
          total={getCartTotal()}
          slideUpAnim={slideUpAnim}
          insets={insets}
          onPress={() => router.push('/cart')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    paddingHorizontal: 20,
  },
  emptyStateContainer: {
    alignItems: 'center',
    marginTop: 40,
    opacity: 0.6,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
  },
  // Header Styles
  headerBackground: {
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    backgroundColor: COLORS.surface,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  locationIcon: {
    marginRight: 4,
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.obsidian,
    letterSpacing: 0.5,
  },
  locationChevron: {
    marginLeft: 2,
  },
  locationStatus: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  // Hero Styles
  heroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.obsidian,
    lineHeight: 28,
  },
  heroIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-10deg' }],
  },
  heroEmoji: {
    fontSize: 28,
  },
  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 25,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.obsidian,
    height: '100%',
  },
  // Filter Styles
  filterSection: {
    padding: 20,
    paddingBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    elevation: 4,
  },
  filterChipInactive: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    shadowColor: 'transparent',
    elevation: 0,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontSize: 12,
  },
  filterTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  filterTextInactive: {
    color: COLORS.gray,
    fontWeight: '600',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 6,
  },
  countBadgeInactive: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 6,
  },
  countText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gray,
  },
  countTextActive: {
    color: 'white',
  },
  resultsHeader: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.obsidian,
  },
  resultsBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  resultsBadgeText: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '700',
  },
  // Floating Cart Styles
  floatingCartContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
  },
  floatingCartButton: {
    backgroundColor: COLORS.obsidian,
    borderRadius: 16,
    padding: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.cartShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cartLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartImagesContainer: {
    flexDirection: 'row',
    marginRight: 12,
  },
  cartThumbnail: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.obsidian,
  },
  cartCountText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },
  viewCartText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
  },
  cartRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartTotalContainer: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  cartTotalText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
});