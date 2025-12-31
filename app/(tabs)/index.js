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
  Platform,
  Dimensions,
  ScrollView
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

const { width } = Dimensions.get('window');

// 🎨 Premium Theme Palette (From Code 2)
const COLORS = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  obsidian: '#0F172A', // Obsidian
  primary: '#7E22CE',
  secondary: '#F3F4F6',
  gray: '#6B7280',
  border: '#E5E7EB',
  green: '#10B981',
  red: '#EF4444',
  cartShadow: '#000',
  primaryLight: '#F3E8FF',
};

// --- HELPER FUNCTIONS ---
const isVeg = (item) => {
  if (item.is_veg !== undefined && item.is_veg !== null) return item.is_veg;
  const text = (item.name + " " + item.description).toLowerCase();
  const nonVegKeywords = ['chicken', 'egg', 'mutton', 'fish', 'prawn', 'meat', 'beef'];
  return !nonVegKeywords.some(keyword => text.includes(keyword));
};

// --- COMPONENTS ---

// 1. Promotional Banners (From Code 2)
const PromotionalBanner = () => (
  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false} 
    style={styles.promoScrollView}
    contentContainerStyle={styles.promoContentContainer}
  >
    {/* Offer 1 */}
    <View style={[styles.promoCard, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
      <View style={styles.promoContent}>
        <Text style={[styles.promoTitle, { color: '#C2410C' }]}>50% OFF</Text>
        <Text style={[styles.promoSubtitle, { color: '#9A3412' }]}>First 3 Orders</Text>
        <View style={{backgroundColor: 'rgba(255,255,255,0.6)', paddingHorizontal:6, paddingVertical:2, borderRadius:4, alignSelf:'flex-start'}}>
           <Text style={[styles.promoCode, { color: '#9A3412' }]}>TIFFIN50</Text>
        </View>
      </View>
      <Image 
        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/7541/7541673.png' }} 
        style={styles.promoImage} 
      />
    </View>

    {/* Offer 2 */}
    <View style={[styles.promoCard, { backgroundColor: '#EEF2FF', borderColor: '#E0E7FF', marginLeft: 12 }]}>
      <View style={styles.promoContent}>
        <Text style={[styles.promoTitle, { color: '#3730A3' }]}>Free Delivery</Text>
        {/* Fixed JSX syntax for greater than symbol */}
        <Text style={[styles.promoSubtitle, { color: '#312E81' }]}>Orders {'>'} ₹150</Text>
        <TouchableOpacity style={{backgroundColor: '#4338CA', paddingHorizontal:10, paddingVertical:4, borderRadius:6, alignSelf:'flex-start'}}>
           <Text style={{color:'white', fontSize:10, fontWeight:'700'}}>Order Now</Text>
        </TouchableOpacity>
      </View>
      <Image 
        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png' }} 
        style={styles.promoImage} 
      />
    </View>
  </ScrollView>
);

// 2. Filter Chips (From Code 2)
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
        size={16}
        color={isActive ? 'white' : COLORS.gray}
        style={styles.filterIcon}
      />
    )}
    <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
      {label}
    </Text>
    {isActive && (
      <View style={styles.countBadgeActive}>
        <Text style={styles.countTextActive}>{count}</Text>
      </View>
    )}
  </TouchableOpacity>
);

// 3. Home Header (From Code 2)
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
  <View style={styles.headerWrapper}>
    <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
      
      {/* Location Row */}
      <View style={styles.topRow}>
        <View style={styles.locationContainer}>
          <View style={styles.locationIconBg}>
            <Ionicons name="location" size={20} color={COLORS.obsidian} />
          </View>
          <View>
            <Text style={styles.locationLabel}>DELIVERING TO</Text>
            <TouchableOpacity style={styles.locationSelector}>
              <Text style={styles.locationTitle}>VIJAYAPURA</Text>
              <Ionicons name="caret-down" size={12} color={COLORS.obsidian} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={onLogout} style={styles.profileButton}>
          <Image 
            source={{ uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Chef' }} 
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      {/* Hero Text */}
      <View style={styles.heroTextContainer}>
        <Text style={styles.heroGreeting}>Hungry?</Text>
        <Text style={styles.heroQuestion}>Order homemade food.</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchFloatingContainer}>
        <Ionicons name="search" size={20} color={COLORS.obsidian} style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search 'Paneer', 'Thali'..."
          placeholderTextColor={COLORS.gray}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => { setSearchQuery(''); Keyboard.dismiss(); }}>
            <Ionicons name="close-circle" size={18} color={COLORS.gray} />
          </TouchableOpacity>
        ) : (
          <View style={styles.micButton}>
             <Ionicons name="mic" size={18} color={COLORS.gray} />
          </View>
        )}
      </View>
    </View>

    {/* Filters & Banners */}
    <View style={styles.bodyContentContainer}>
      <PromotionalBanner />
      
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Eat what makes you happy</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 20 }}>
        <FilterChip
          label="All"
          isActive={category === 'All'}
          onPress={() => setCategory('All')}
          count={menuItems.length}
        />
        <FilterChip
          label="Veg Only"
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
      </ScrollView>

      <View style={styles.listDivider} />
    </View>
  </View>
);

// 4. FLOATING CART (From Code 1 - Logic & Position)
const FloatingCart = ({ cart, total, count, slideUpAnim, insets, onPress }) => {
  const cartImages = [...new Set(cart.map(item => item.image_url))].slice(0, 3);

  return (
    <Animated.View
      style={[
        styles.floatingCartContainer,
        {
          // ✅ Position Exactly from Code 1
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


// --- MAIN SCREEN ---
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(100)).current;

  // State
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [userPosition, setUserPosition] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Locating...');

  // Store
  const { cart, getCartTotal, signOut, setUserLocation } = useCart();

  useEffect(() => {
    initializeData();
  }, []);

  // Cart Animation
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

      const { data, error } = await supabase
        .from('menu_items')
        .select(`*, profiles:chef_id ( latitude, longitude )`);

      if (error) throw error;
      setMenuItems(data || []);

    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
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

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.obsidian} />
          <Text style={{marginTop: 10, color: COLORS.gray, fontWeight: '500'}}>Setting up the kitchen...</Text>
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
              <Ionicons name="fast-food-outline" size={60} color={COLORS.border} />
              <Text style={styles.emptyStateTitle}>No items found</Text>
              <Text style={styles.emptyStateText}>Try searching for 'Roti' or 'Dal'</Text>
            </View>
          }
        />
      )}

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
    backgroundColor: COLORS.background,
  },
  cardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  listDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 10
  },
  
  // --- HEADER STYLES (From Code 2) ---
  headerWrapper: { backgroundColor: COLORS.background },
  headerContainer: {
    backgroundColor: COLORS.surface,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationContainer: { flexDirection: 'row', alignItems: 'center' },
  locationIconBg: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  locationLabel: { fontSize: 10, color: COLORS.gray, fontWeight: '700', letterSpacing: 0.5 },
  locationSelector: { flexDirection: 'row', alignItems: 'center' },
  locationTitle: { fontSize: 14, fontWeight: '800', color: COLORS.obsidian },
  profileButton: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  profileImage: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: COLORS.surface },

  heroTextContainer: { marginBottom: 20 },
  heroGreeting: { fontSize: 16, color: COLORS.gray, fontWeight: '600', marginBottom: 2 },
  heroQuestion: { fontSize: 24, fontWeight: '900', color: COLORS.obsidian },

  searchFloatingContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 16, paddingHorizontal: 16, height: 52,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.obsidian, height: '100%' },
  micButton: { paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: COLORS.border },

  // --- CONTENT STYLES (From Code 2) ---
  bodyContentContainer: { marginTop: 16 },
  
  promoScrollView: { marginBottom: 24 },
  promoContentContainer: { paddingHorizontal: 20 },
  promoCard: {
    width: width * 0.72, height: 130, borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1
  },
  promoContent: { flex: 1 },
  promoTitle: { fontSize: 20, fontWeight: '900', marginBottom: 2 },
  promoSubtitle: { fontSize: 12, fontWeight: '600', marginBottom: 10 },
  promoCode: { fontSize: 10, fontWeight: '800' },
  promoImage: { width: 70, height: 70, resizeMode: 'contain' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.obsidian },
  
  filterScroll: { marginBottom: 10 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, flexDirection: 'row',
    alignItems: 'center', marginRight: 10, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.obsidian, borderColor: COLORS.obsidian },
  filterChipInactive: {},
  filterIcon: { marginRight: 6 },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  filterTextActive: { color: 'white', fontWeight: '700' },
  countBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  countTextActive: { color: 'white', fontSize: 9, fontWeight: '800' },

  emptyStateContainer: { alignItems: 'center', marginTop: 40 },
  emptyStateTitle: { fontSize: 18, fontWeight: '700', color: COLORS.obsidian, marginTop: 10 },
  emptyStateText: { marginTop: 4, fontSize: 14, color: COLORS.gray },

  // --- FLOATING CART STYLES (From Code 1) ---
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