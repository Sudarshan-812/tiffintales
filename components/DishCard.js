import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Vibration 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../lib/store'; 

// Your Obsidian Theme
const COLORS = {
  surface: '#FFFFFF',
  obsidian: '#111827',    
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  green: '#10B981',       
  red: '#EF4444',         
  primary: '#7E22CE',     
  border: '#E5E7EB',
  shadow: '#000000',
  gold: '#F59E0B',
};

// Utility Functions

const isVeg = (dish) => {
  if (dish.is_veg !== undefined && dish.is_veg !== null) return dish.is_veg;
  const text = (dish.name + " " + dish.description).toLowerCase();
  const nonVegKeywords = ['chicken', 'egg', 'mutton', 'fish', 'meat', 'prawn', 'beef'];
  return !nonVegKeywords.some(k => text.includes(k));
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

// Sub-Components

const VegIndicator = ({ isVegetarian }) => (
  <View style={[styles.vegBox, { borderColor: isVegetarian ? COLORS.green : COLORS.red }]}>
    <View style={[styles.vegDot, { backgroundColor: isVegetarian ? COLORS.green : COLORS.red }]} />
  </View>
);

const RatingBadge = () => (
  <View style={styles.ratingBadge}>
    <View style={styles.starsRow}>
      {[1,2,3,4].map(i => <Ionicons key={i} name="star" size={10} color={COLORS.gold} />)}
      <Ionicons name="star-half" size={10} color={COLORS.gold} />
    </View>
    <Text style={styles.ratingCount}>(42)</Text>
  </View>
);


// Main Component

export default function DishCard({ dish, showAddButton = true, userLocation }) {
  const { addToCart, removeFromCart, cart } = useCart();

  // Optimization: Recalculate distance only when coordinates change
  const distanceInfo = useMemo(() => {
    const chefLat = dish.profiles?.latitude;
    const chefLon = dish.profiles?.longitude;
    
    if (userLocation && chefLat) {
      const dist = calculateDistance(userLocation.latitude, userLocation.longitude, chefLat, chefLon);
      return { value: dist, isTooFar: dist > 5 };
    }
    return { value: 0, isTooFar: false };
  }, [userLocation, dish.profiles]);

  const itemIsVeg = isVeg(dish);
  const cartItem = cart.find((i) => i.id === dish.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => { Vibration.vibrate(10); addToCart(dish); };
  const handleRemove = () => { Vibration.vibrate(10); removeFromCart(dish.id); };

  return (
    <View style={styles.cardContainer}>
      
      {/* LEFT: Information Column */}
      <View style={styles.infoColumn}>
        <View style={styles.iconRow}>
          <VegIndicator isVegetarian={itemIsVeg} />
          {itemIsVeg ? 
            <Text style={[styles.tagText, { color: COLORS.green }]}>VEG</Text> : 
            <Text style={[styles.tagText, { color: COLORS.red }]}>NON-VEG</Text>
          }
        </View>

        <Text style={styles.dishName}>{dish.name}</Text>
        
        <RatingBadge />

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{dish.price}</Text>
          {dish.old_price && <Text style={styles.oldPrice}>₹{dish.old_price}</Text>}
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {dish.description || "Freshly prepared home-cooked meal made with authentic spices."}
        </Text>

        {/* Distance/Time Meta */}
        <View style={styles.metaContainer}>
          {distanceInfo.value > 0 && (
            <View style={styles.metaPill}>
              <Ionicons name="location-sharp" size={10} color={COLORS.gray} />
              <Text style={styles.metaText}>{distanceInfo.value.toFixed(1)} km</Text>
            </View>
          )}
          <View style={styles.metaPill}>
            <Ionicons name="time" size={10} color={COLORS.gray} />
            <Text style={styles.metaText}>25 min</Text>
          </View>
        </View>
      </View>

      {/* RIGHT: Image & Action Column */}
      <View style={styles.imageColumn}>
        <View style={styles.imageWrapper}>
          <Image 
            source={{ uri: dish.image_url || 'https://via.placeholder.com/150' }} 
            style={styles.dishImage}
          />
        </View>

        {/* Floating Action Button */}
        {showAddButton && (
          <View style={styles.addButtonContainer}>
            {distanceInfo.isTooFar ? (
               <View style={styles.disabledBtn}>
                 <Text style={styles.disabledText}>Too Far</Text>
               </View>
            ) : quantity === 0 ? (
              <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={handleAdd} 
                style={styles.addButton}
              >
                {/* 👇 OBSIDIAN Text Color */}
                <Text style={styles.addButtonText}>ADD</Text>
                <View style={styles.plusIconAbsolute}>
                  <Ionicons name="add" size={12} color={COLORS.obsidian} />
                </View>
              </TouchableOpacity>
            ) : (
              // 👇 OBSIDIAN Background Color
              <View style={[styles.counterContainer, { backgroundColor: COLORS.obsidian }]}>
                <TouchableOpacity onPress={handleRemove} style={styles.counterAction}>
                  <Ionicons name="remove" size={18} color="white" />
                </TouchableOpacity>
                <Text style={styles.counterText}>{quantity}</Text>
                <TouchableOpacity onPress={handleAdd} style={styles.counterAction}>
                  <Ionicons name="add" size={18} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  
  // Left Column
  infoColumn: {
    flex: 1,
    paddingRight: 12,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  vegBox: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.obsidian,
    marginBottom: 4,
    lineHeight: 20,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    marginRight: 4,
  },
  ratingCount: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.obsidian,
  },
  oldPrice: {
    fontSize: 12,
    color: COLORS.gray,
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  description: {
    fontSize: 12,
    color: COLORS.gray,
    lineHeight: 16,
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaText: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '600',
    marginLeft: 2,
  },

  // Right Column
  imageColumn: {
    width: 120,
    alignItems: 'center',
  },
  imageWrapper: {
    width: 120,
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.lightGray,
  },
  dishImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  // Button Styles
  addButtonContainer: {
    marginTop: -18,
    zIndex: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  addButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    paddingHorizontal: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  addButtonText: {
    color: COLORS.obsidian, // 👈 Updated to Obsidian
    fontWeight: '900',
    fontSize: 14,
  },
  plusIconAbsolute: {
    position: 'absolute',
    top: 2,
    right: 4,
  },
  
  // Counter Styles
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    height: 36,
    paddingHorizontal: 4,
    // Background color set inline in JSX to use COLORS.obsidian
  },
  counterAction: {
    width: 30,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 14,
    marginHorizontal: 4,
    minWidth: 16,
    textAlign: 'center',
  },
  
  // Disabled State
  disabledBtn: {
    backgroundColor: COLORS.lightGray,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disabledText: {
    color: COLORS.gray,
    fontSize: 12,
    fontWeight: '700',
  },
});