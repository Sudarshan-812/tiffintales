import { View, Text, Image, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import { useCart } from '../lib/store'; 
import { Ionicons } from '@expo/vector-icons';

// 🎨 Premium Theme
const COLORS = {
  surface: '#FFFFFF',
  obsidian: '#111827',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  green: '#10B981',
  red: '#EF4444',
  border: '#E5E7EB',
};

// 🥗 Veg/Non-Veg Logic
const isVeg = (dish) => {
  if (dish.is_veg !== undefined) return dish.is_veg;
  const text = (dish.name + " " + dish.description).toLowerCase();
  const nonVegKeywords = ['chicken', 'egg', 'mutton', 'fish', 'meat', 'prawn', 'beef'];
  return !nonVegKeywords.some(k => text.includes(k));
};

// 🟢🔴 Indicator Component
const VegIndicator = ({ isVegetarian }) => (
  <View style={{
    width: 16, height: 16,
    borderWidth: 2, borderColor: isVegetarian ? COLORS.green : COLORS.red,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 4, marginTop: 4, marginRight: 8
  }}>
    <View style={{
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: isVegetarian ? COLORS.green : COLORS.red
    }} />
  </View>
);

export default function DishCard({ dish, showAddButton = true, userLocation }) {
  const { addToCart, removeFromCart, cart } = useCart();

  // 1. Distance Calculation
  function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  }

  // 2. Logic Setup
  const chefLat = dish.profiles?.latitude;
  const chefLon = dish.profiles?.longitude;
  
  let distance = 0;
  let isTooFar = false;

  if (userLocation && chefLat) {
    distance = calculateDistance(userLocation.latitude, userLocation.longitude, chefLat, chefLon);
    if (distance > 5) isTooFar = true; 
  }

  const itemIsVeg = isVeg(dish);

  // 🔘 Smart Add Button Component
  const AddButton = () => {
    if (isTooFar) {
      return (
        <View style={styles.disabledBtn}>
            <Text style={styles.disabledText}>Too Far</Text>
        </View>
      );
    }

    const cartItem = cart.find((i) => i.id === dish.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    const handleAdd = () => { Vibration.vibrate(10); addToCart(dish); };
    const handleRemove = () => { Vibration.vibrate(10); removeFromCart(dish.id); };

    if (quantity === 0) {
      return (
        <TouchableOpacity 
          onPress={handleAdd}
          activeOpacity={0.8}
          style={styles.addBtn}
        >
          <Text style={styles.addBtnText}>ADD</Text>
          <Ionicons name="add" size={14} color={COLORS.obsidian} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.counterBtn}>
        <TouchableOpacity onPress={handleRemove} style={styles.counterAction}>
          <Ionicons name="remove" size={16} color="white" />
        </TouchableOpacity>
        <Text style={styles.counterText}>{quantity}</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.counterAction}>
          <Ionicons name="add" size={16} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.container}>
        
        {/* 📝 LEFT: Text Content */}
        <View style={styles.infoContainer}>
            {/* Header: Name + Distance */}
            <View style={styles.headerRow}>
                <View style={{ flexDirection: 'row', flex: 1, paddingRight: 8 }}>
                    <VegIndicator isVegetarian={itemIsVeg} />
                    <Text style={styles.title} numberOfLines={2}>{dish.name}</Text>
                </View>
                
                {/* 📍 MOVED DISTANCE HERE */}
                {userLocation && chefLat && (
                    <View style={styles.distanceBadge}>
                        <Ionicons name={isTooFar ? "warning" : "navigate"} size={10} color={isTooFar ? COLORS.red : COLORS.gray} />
                        <Text style={[styles.distanceText, isTooFar && { color: COLORS.red }]}>
                            {distance.toFixed(1)} km
                        </Text>
                    </View>
                )}
            </View>
            
            <Text style={styles.description} numberOfLines={2}>
                {dish.description || "Freshly prepared home-cooked meal."}
            </Text>

            {/* Meta Row (Time, etc) */}
            {showAddButton && (
                <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={14} color={COLORS.gray} />
                    <Text style={styles.metaText}>25 min</Text>
                </View>
            )}
        </View>

        {/* 🖼️ RIGHT: Image & Button */}
        <View style={styles.imageContainer}>
            <Image 
                source={{ uri: dish.image_url || 'https://via.placeholder.com/150' }} 
                style={styles.image}
            />
            
            {/* 💰 MOVED PRICE HERE (Over Image) */}
            <View style={styles.priceOverlay}>
                <Text style={styles.priceText}>₹{dish.price}</Text>
            </View>

            {/* Button Floats over Image Bottom */}
            <View style={styles.buttonWrapper}>
                <AddButton />
            </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'visible', 
  },
  container: {
    flexDirection: 'row',
    padding: 16,
    minHeight: 140,
  },
  infoContainer: {
    flex: 1,
    paddingRight: 16,
    justifyContent: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.obsidian,
    lineHeight: 22,
  },
  // New Distance Styles
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray,
    marginLeft: 2,
  },
  description: {
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto', // Pushes to bottom of left container
  },
  metaText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Right Side
  imageContainer: {
    alignItems: 'center',
    width: 120,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    resizeMode: 'cover',
  },
  // New Price Overlay Styles
  priceOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.obsidian,
  },
  buttonWrapper: {
    position: 'absolute',
    bottom: -12, 
    width: 100, 
    alignItems: 'center',
  },

  // ✨ BUTTON STYLES
  addBtn: {
    backgroundColor: '#FFF0F3', 
    borderColor: COLORS.obsidian,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.obsidian,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  addBtnText: {
    color: COLORS.obsidian,
    fontWeight: '900',
    fontSize: 14,
  },
  counterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.obsidian,
    borderRadius: 12,
    width: 90,
    paddingVertical: 6,
    shadowColor: COLORS.obsidian,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  counterAction: {
    paddingHorizontal: 10,
  },
  counterText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 15,
  },
  disabledBtn: {
    backgroundColor: COLORS.lightGray,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disabledText: {
    color: COLORS.gray,
    fontSize: 12,
    fontWeight: '700',
  }
});