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
  Platform,
  Image
} from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../lib/store';
import DishCard from '../../components/DishCard'; 

// 🎨 Premium Theme Palette
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
};

// 🥗 VEG / NON-VEG LOGIC 
const isVeg = (item) => {
  if (item.is_veg !== undefined && item.is_veg !== null) return item.is_veg;
  const text = (item.name + " " + item.description).toLowerCase();
  const nonVegKeywords = ['chicken', 'egg', 'mutton', 'fish', 'prawn', 'meat', 'beef'];
  return !nonVegKeywords.some(keyword => text.includes(keyword));
};

// 🏷️ FILTER CHIP COMPONENT
const FilterChip = ({ label, icon, isActive, onPress, count }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={{
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isActive ? COLORS.primary : COLORS.surface, 
      flexDirection: 'row', alignItems: 'center',
      marginRight: 10,
      borderWidth: 1, 
      borderColor: isActive ? COLORS.primary : COLORS.border,
      shadowColor: isActive ? COLORS.primary : 'transparent',
      shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
      elevation: isActive ? 4 : 0
    }}
  >
    {icon && <Ionicons name={icon} size={14} color={isActive ? 'white' : COLORS.gray} style={{ marginRight: 6 }} />}
    <Text style={{ color: isActive ? 'white' : COLORS.gray, fontWeight: isActive ? '700' : '600', fontSize: 12 }}>
      {label}
    </Text>
    {count !== undefined && (
      <View style={{ 
        backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : COLORS.secondary, 
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, marginLeft: 6 
      }}>
        <Text style={{ color: isActive ? 'white' : COLORS.gray, fontSize: 10, fontWeight: '800' }}>{count}</Text>
      </View>
    )}
  </TouchableOpacity>
);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(100)).current; 

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  
  const { cart, getCartTotal, signOut } = useCart();
  const userLocation = { latitude: 16.8302, longitude: 75.7100 };

  useEffect(() => { fetchMenu(); }, []);

  // Animate Cart Entry
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

  async function fetchMenu() {
    try {
      setLoading(true);
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
  }

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const itemIsVeg = isVeg(item);
    let matchesCategory = true;
    if (category === 'Veg') matchesCategory = itemIsVeg;
    if (category === 'Non-Veg') matchesCategory = !itemIsVeg;

    return matchesSearch && matchesCategory;
  });

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = getCartTotal();
  const cartImages = [...new Set(cart.map(item => item.image_url))].slice(0, 3);

  const ListHeader = () => (
    <View style={{ backgroundColor: COLORS.background }}>
      <View style={{ 
        backgroundColor: COLORS.surface, 
        paddingTop: insets.top + 10, paddingBottom: 16, paddingHorizontal: 20,
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
        shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.03, shadowRadius: 10,
        elevation: 5, zIndex: 10
      }}>
        
        {/* 📍 Top Row: Location & Profile */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
             <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Ionicons name="location" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.obsidian, letterSpacing: 0.5 }}>VIJAYAPURA</Text>
                <Ionicons name="chevron-down" size={12} color={COLORS.gray} style={{ marginLeft: 2 }} />
             </View>
             <Text style={{ fontSize: 13, color: COLORS.gray, fontWeight: '500' }}>Station Road, Karnataka</Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => Alert.alert('Log Out', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Log Out', onPress: async () => { await signOut(); router.replace('/login'); }, style: 'destructive' }])}
            style={{ 
                width: 36, height: 36, borderRadius: 18, 
                backgroundColor: COLORS.secondary, 
                justifyContent: 'center', alignItems: 'center',
                borderWidth: 1, borderColor: COLORS.border 
            }}
          >
            <Ionicons name="person" size={18} color={COLORS.obsidian} />
          </TouchableOpacity>
        </View>

        {/* 🥘 Hero Section */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
                <Text style={{ fontSize: 14, color: COLORS.gray, fontWeight: '600', marginBottom: 2 }}>Hungry?</Text>
                <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.obsidian, lineHeight: 28 }}>
                    What's in your{"\n"}
                    <Text style={{ color: COLORS.primary }}>tiffin today?</Text>
                </Text>
            </View>
            <View style={{ 
                width: 50, height: 50, borderRadius: 25, 
                backgroundColor: '#F3E8FF', 
                justifyContent: 'center', alignItems: 'center',
                transform: [{ rotate: '-10deg' }]
            }}>
                <Text style={{ fontSize: 28 }}>🍱</Text>
            </View>
        </View>

        {/* 🔍 Search Bar */}
        <View style={{ 
          flexDirection: 'row', alignItems: 'center', 
          backgroundColor: COLORS.secondary, 
          borderRadius: 25, 
          paddingHorizontal: 14, 
          height: 46, 
          borderWidth: 1, borderColor: COLORS.border
        }}>
          <Ionicons name="search" size={18} color={COLORS.gray} />
          <TextInput 
            value={searchQuery} onChangeText={setSearchQuery}
            placeholder="Search for biryani, paneer..." placeholderTextColor={COLORS.gray}
            style={{ flex: 1, marginLeft: 8, fontSize: 14, fontWeight: '500', color: COLORS.obsidian, height: '100%' }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); Keyboard.dismiss(); }}>
               <Ionicons name="close-circle" size={16} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 🥒 FILTERS */}
      <View style={{ padding: 20, paddingBottom: 10 }}>
        <View style={{ flexDirection: 'row' }}>
          <FilterChip label="All" icon="grid" isActive={category === 'All'} onPress={() => setCategory('All')} count={menuItems.length} />
          <FilterChip label="Veg" icon="leaf" isActive={category === 'Veg'} onPress={() => setCategory('Veg')} count={menuItems.filter(i => isVeg(i)).length} />
          <FilterChip label="Non-Veg" icon="fish" isActive={category === 'Non-Veg'} onPress={() => setCategory('Non-Veg')} count={menuItems.filter(i => !isVeg(i)).length} />
        </View>
        
        <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.obsidian }}>
            {category === 'All' ? 'Near You' : category + ' Menu'} 
            </Text>
            <View style={{ backgroundColor: COLORS.secondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                <Text style={{ fontSize: 11, color: COLORS.gray, fontWeight: '700' }}>{filteredItems.length} ITEMS</Text>
            </View>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={{ paddingHorizontal: 20 }}>
        <DishCard dish={item} userLocation={userLocation} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      
      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
           <ActivityIndicator size="large" color={COLORS.obsidian} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          // Dynamic padding to ensure bottom items aren't hidden by the cart bar
          contentContainerStyle={{ paddingBottom: cart.length > 0 ? 140 : 40 }}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.6 }}>
                <Ionicons name="fast-food-outline" size={60} color={COLORS.gray} />
                <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '600', color: COLORS.gray }}>No dishes found</Text>
            </View>
          }
        />
      )}

      {/* 🛒 ZOMATO STYLE FLOATING CART - Only Render if cart.length > 0 */}
      {cart.length > 0 && (
        <Animated.View 
          style={{ 
            position: 'absolute', 
            bottom: insets.bottom > 0 ? insets.bottom : 20, // Responsive bottom positioning
            left: 16, right: 16, 
            zIndex: 100,
            transform: [{ translateY: slideUpAnim }]
          }}
        >
           <TouchableOpacity 
             onPress={() => router.push('/cart')}
             activeOpacity={0.9}
             style={{ 
               backgroundColor: COLORS.obsidian, 
               borderRadius: 16, 
               padding: 14,
               paddingHorizontal: 16,
               flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
               shadowColor: "#000", shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12
             }}
           >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                 <View style={{ flexDirection: 'row', marginRight: 12 }}>
                    {cartImages.map((uri, index) => (
                      <Image 
                        key={index} 
                        source={{ uri: uri || 'https://via.placeholder.com/50' }} 
                        style={{ 
                          width: 32, height: 32, borderRadius: 16, 
                          borderWidth: 2, borderColor: COLORS.obsidian,
                          marginLeft: index === 0 ? 0 : -14
                        }} 
                      />
                    ))}
                 </View>
                 <View>
                    <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>
                      {cartItemCount} {cartItemCount === 1 ? 'Item' : 'Items'}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' }}>
                      View Cart
                    </Text>
                 </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                 <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '800' }}>₹{cartTotal}</Text>
                 </View>
                 <Ionicons name="arrow-forward-circle" size={28} color="white" />
              </View>
           </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}