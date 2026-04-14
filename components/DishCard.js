import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../lib/store';
import { COLORS } from '../lib/theme';

// ─── Utilities ───────────────────────────────────────────────────────────────

const isVeg = (dish) => {
  if (dish.is_veg !== undefined && dish.is_veg !== null) return dish.is_veg;
  const text = (dish.name + ' ' + (dish.description || '')).toLowerCase();
  const nonVegWords = ['chicken', 'egg', 'mutton', 'fish', 'meat', 'prawn', 'beef', 'pork'];
  return !nonVegWords.some(k => text.includes(k));
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

const VegIndicator = ({ isVegetarian }) => (
  <View style={[styles.vegBox, { borderColor: isVegetarian ? COLORS.success : COLORS.error }]}>
    <View style={[styles.vegDot, { backgroundColor: isVegetarian ? COLORS.success : COLORS.error }]} />
  </View>
);

const StarRating = ({ rating = 4.5, count = 42 }) => (
  <View style={styles.ratingRow}>
    <Ionicons name="star" size={11} color={COLORS.warning} />
    <Text style={styles.ratingNum}>{rating}</Text>
    <Text style={styles.ratingCount}> ({count})</Text>
  </View>
);

const MetaPill = ({ icon, label }) => (
  <View style={styles.metaPill}>
    <Ionicons name={icon} size={11} color={COLORS.medium} />
    <Text style={styles.metaText}>{label}</Text>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DishCard({ dish, showAddButton = true, userLocation }) {
  const { addToCart, removeFromCart, cart } = useCart();
  const [isFav, setIsFav] = useState(false);

  const distanceInfo = useMemo(() => {
    const chefLat = dish.profiles?.latitude;
    const chefLon = dish.profiles?.longitude;
    if (userLocation && chefLat) {
      const dist = calculateDistance(
        userLocation.latitude, userLocation.longitude,
        chefLat, chefLon
      );
      return { value: dist, isTooFar: dist > 5 };
    }
    return { value: 0, isTooFar: false };
  }, [userLocation, dish.profiles]);

  const vegItem      = isVeg(dish);
  const cartItem     = cart.find(i => i.id === dish.id);
  const quantity     = cartItem ? cartItem.quantity : 0;
  const isBestseller = (dish.order_count ?? 0) > 10;

  const handleAdd    = () => { Vibration.vibrate(10); addToCart(dish); };
  const handleRemove = () => { Vibration.vibrate(10); removeFromCart(dish.id); };
  const toggleFav    = () => setIsFav(v => !v);

  return (
    <View style={styles.card}>
      {/* ── Left: Info ────────────────────── */}
      <View style={styles.infoCol}>

        {/* Veg tag row */}
        <View style={styles.tagRow}>
          <VegIndicator isVegetarian={vegItem} />
          <Text style={[
            styles.tagLabel,
            { color: vegItem ? COLORS.success : COLORS.error }
          ]}>
            {vegItem ? 'VEG' : 'NON-VEG'}
          </Text>
          {isBestseller && (
            <View style={styles.bestsellerBadge}>
              <Ionicons name="flame" size={9} color={COLORS.primary} />
              <Text style={styles.bestsellerText}>BESTSELLER</Text>
            </View>
          )}
        </View>

        {/* Name */}
        <Text style={styles.name} numberOfLines={2}>{dish.name}</Text>

        {/* Rating */}
        <StarRating />

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{dish.price}</Text>
          {dish.old_price ? (
            <Text style={styles.oldPrice}>₹{dish.old_price}</Text>
          ) : null}
        </View>

        {/* Description */}
        <Text style={styles.desc} numberOfLines={2}>
          {dish.description || 'Freshly prepared home-cooked meal made with authentic spices.'}
        </Text>

        {/* Meta: distance + time */}
        <View style={styles.metaRow}>
          {distanceInfo.value > 0 && (
            <MetaPill icon="navigate-outline" label={`${distanceInfo.value.toFixed(1)} km`} />
          )}
          <MetaPill icon="time-outline" label="25 min" />
        </View>
      </View>

      {/* ── Right: Image + CTA ────────────── */}
      <View style={styles.imageCol}>

        {/* Image with favourite overlay */}
        <View style={styles.imgWrapper}>
          <Image
            source={{ uri: dish.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300' }}
            style={styles.img}
          />
          <TouchableOpacity style={styles.heartBtn} onPress={toggleFav} activeOpacity={0.8}>
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={16}
              color={isFav ? COLORS.error : COLORS.surface}
            />
          </TouchableOpacity>
        </View>

        {/* Add / Counter button */}
        {showAddButton && (
          <View style={styles.ctaContainer}>
            {distanceInfo.isTooFar ? (
              <View style={styles.disabledBtn}>
                <Ionicons name="location-outline" size={12} color={COLORS.gray} />
                <Text style={styles.disabledText}>Too Far</Text>
              </View>
            ) : quantity === 0 ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleAdd}
                style={styles.addBtn}
              >
                <Text style={styles.addBtnText}>ADD</Text>
                <Ionicons name="add" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.counter}>
                <TouchableOpacity onPress={handleRemove} style={styles.counterBtn}>
                  <Ionicons name="remove" size={16} color={COLORS.surface} />
                </TouchableOpacity>
                <Text style={styles.counterNum}>{quantity}</Text>
                <TouchableOpacity onPress={handleAdd} style={styles.counterBtn}>
                  <Ionicons name="add" size={16} color={COLORS.surface} />
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
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.light,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },

  // ── Left column ────────────────────────
  infoCol: {
    flex: 1,
    paddingRight: 14,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
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
  tagLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  bestsellerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryFaint,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  bestsellerText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.obsidian,
    lineHeight: 22,
    letterSpacing: -0.2,
    marginBottom: 5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingNum: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.dark,
    marginLeft: 3,
  },
  ratingCount: {
    fontSize: 11,
    color: COLORS.medium,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  price: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.obsidian,
    letterSpacing: -0.5,
  },
  oldPrice: {
    fontSize: 12,
    color: COLORS.gray,
    textDecorationLine: 'line-through',
    marginLeft: 6,
    fontWeight: '500',
  },
  desc: {
    fontSize: 12,
    color: COLORS.medium,
    lineHeight: 17,
    marginBottom: 10,
    fontWeight: '400',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.border,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  metaText: {
    fontSize: 10,
    color: COLORS.medium,
    fontWeight: '600',
  },

  // ── Right column ───────────────────────
  imageCol: {
    width: 118,
    alignItems: 'center',
  },
  imgWrapper: {
    width: 118,
    height: 112,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
    position: 'relative',
  },
  img: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heartBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── ADD / Counter ──────────────────────
  ctaContainer: {
    marginTop: -16,
    zIndex: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    gap: 3,
  },
  addBtnText: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    height: 36,
    paddingHorizontal: 4,
  },
  counterBtn: {
    width: 28,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterNum: {
    color: COLORS.surface,
    fontWeight: '800',
    fontSize: 14,
    minWidth: 18,
    textAlign: 'center',
  },
  disabledBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.light,
    gap: 4,
  },
  disabledText: {
    color: COLORS.gray,
    fontSize: 11,
    fontWeight: '700',
  },
});
