import { View, Text, FlatList, Image, TouchableOpacity, TextInput, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../lib/store'; 
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 

// 🎨 Theme Colors
const COLORS = {
  background: '#FDFBF7', // Cream
  surface: '#FFFFFF',
  obsidian: '#1A0B2E',
  gold: '#F59E0B',
  gray: '#94A3B8',
  red: '#EF4444'
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets(); 
  const router = useRouter(); 
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 🛒 Get Actions from Store
  const { addToCart, cart, getCartTotal, signOut } = useCart(); 

  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    setLoading(true);
    const { data, error } = await supabase
      .from('menu_items')
      .select('*, chef_id'); 
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setMenuItems(data);
    }
    setLoading(false);
  }

  // Filter Logic
  const filteredItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 🧮 Calculate Totals for Floating Bar
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = getCartTotal();

  const ListHeader = () => (
    <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: COLORS.background }}>
      {/* Location & Logout Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <View>
          <Text style={{ color: COLORS.gray, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Delivering To</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="location" size={20} color="#E11D48" />
            <Text style={{ color: COLORS.obsidian, fontSize: 18, fontWeight: '800', marginLeft: 4 }}>Vijayapura</Text>
          </View>
        </View>
        
        <TouchableOpacity 
           onPress={() => {
             Alert.alert("Log Out", "Are you sure you want to exit?", [
               { text: "Cancel", style: "cancel" },
               { text: "Log Out", style: "destructive", onPress: async () => {
                   await signOut();
                   router.replace('/login');
                 }
               }
             ]);
           }}
           style={{ backgroundColor: 'white', padding: 10, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' }}
        >
           <Ionicons name="log-out-outline" size={22} color={COLORS.red} />
        </TouchableOpacity>
      </View>

      {/* Hero Title */}
      <Text style={{ fontSize: 32, fontWeight: '800', color: COLORS.obsidian, lineHeight: 40 }}>
        What's in your{"\n"}
        <Text style={{ color: '#E11D48' }}>tiffin today?</Text> 🥘
      </Text>

      {/* Search Bar */}
      <View style={{ 
          flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', 
          padding: 14, borderRadius: 16, marginTop: 24, borderWidth: 1, borderColor: '#E2E8F0',
          shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2
      }}>
        <Ionicons name="search" size={20} color={COLORS.gray} />
        <TextInput 
          placeholder="Search for homemade food..." 
          placeholderTextColor={COLORS.gray}
          style={{ flex: 1, marginLeft: 10, fontSize: 16, color: COLORS.obsidian, fontWeight: '500' }}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={{ 
        backgroundColor: 'white', borderRadius: 24, marginBottom: 20, marginHorizontal: 20, 
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 3,
        borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden'
    }}>
      <Image 
        source={{ uri: item.image_url }} 
        style={{ width: '100%', height: 180, backgroundColor: '#E2E8F0' }} 
        resizeMode="cover" 
      />
      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.obsidian, marginBottom: 4 }}>{item.name}</Text>
                <Text style={{ color: COLORS.gray, fontSize: 14, lineHeight: 20 }} numberOfLines={2}>{item.description}</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.obsidian }}>₹{item.price}</Text>
        </View>
        
        <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity 
                onPress={() => addToCart(item)}
                style={{ 
                    backgroundColor: COLORS.obsidian, paddingHorizontal: 20, paddingVertical: 12, 
                    borderRadius: 14, flexDirection: 'row', alignItems: 'center' 
                }}
            >
                <Text style={{ color: '#FDFBF7', fontWeight: '700', marginRight: 8 }}>Add to Tiffin</Text>
                <Ionicons name="add" size={20} color="#FDFBF7" />
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="dark-content" />
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.obsidian} style={{ marginTop: 100 }} />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ paddingBottom: 150 }} // Extra padding so list doesn't hide behind floating bar
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 🛑 FLOATING CART BAR (Only shows if cart has items) */}
      {cart.length > 0 && (
        <View style={{ 
            position: 'absolute', bottom: 90, left: 20, right: 20, // Positioned above Tab Bar
            zIndex: 50 
        }}>
          <TouchableOpacity 
            onPress={() => router.push('/cart')} // 👈 Navigates to Cart Screen
            style={{ 
              backgroundColor: COLORS.obsidian, borderRadius: 20, padding: 16,
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)', width: 40, height: 40, 
                    borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 
                }}>
                    <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>{cartItemCount}</Text>
                </View>
                <View>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>Total</Text>
                    <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>₹{cartTotal}</Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 16, marginRight: 8 }}>View Cart</Text>
                <Ionicons name="arrow-forward-circle" size={24} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}