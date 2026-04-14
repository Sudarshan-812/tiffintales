import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator, RefreshControl,
  Animated, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import { COLORS, SHADOW, RADIUS } from '../../lib/theme';

// ─── Menu Item Card ───────────────────────────────────────────────────────────

const MenuItemCard = ({ item, onDelete }) => {
  const isVeg = item.is_veg !== false;

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200' }}
        style={styles.cardImg}
      />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <TouchableOpacity onPress={() => onDelete(item.id, item.name)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={17} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description || 'No description provided.'}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>₹{item.price}</Text>
          <View style={[styles.vegBadge, { backgroundColor: isVeg ? COLORS.successLight : COLORS.errorLight }]}>
            <View style={[styles.vegDot, { backgroundColor: isVeg ? COLORS.success : COLORS.error }]} />
            <Text style={[styles.vegText, { color: isVeg ? COLORS.success : COLORS.error }]}>
              {isVeg ? 'VEG' : 'NON-VEG'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChefMenuScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [menuItems,  setMenuItems]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fabOpen,    setFabOpen]    = useState(false);

  const fabAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => { fetchMenu(); }, []));

  const fetchMenu = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('menu_items').select('*').eq('chef_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMenuItems(data || []);
    } catch {
      Alert.alert('Error', 'Could not load menu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete Dish', `Remove "${name}" from your menu?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('menu_items').delete().eq('id', id);
          if (error) Alert.alert('Error', error.message);
          else fetchMenu();
        },
      },
    ]);
  };

  const toggleFab = () => {
    Animated.spring(fabAnim, {
      toValue: fabOpen ? 0 : 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
    setFabOpen(!fabOpen);
  };

  const fabRotate  = fabAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
  const menuOpacity = fabAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
  const menuScale   = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTag}>MY KITCHEN</Text>
          <Text style={styles.headerTitle}>Menu</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{menuItems.length}</Text>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={menuItems}
          keyExtractor={i => i.id.toString()}
          renderItem={({ item }) => <MenuItemCard item={item} onDelete={handleDelete} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchMenu(); }}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🍳</Text>
              <Text style={styles.emptyTitle}>Your Menu is Empty</Text>
              <Text style={styles.emptySub}>Tap + below to add your first dish!</Text>
            </View>
          }
        />
      )}

      {/* Overlay */}
      {fabOpen && (
        <TouchableWithoutFeedback onPress={toggleFab}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {/* FAB */}
      <View style={styles.fabWrap}>
        <Animated.View style={[styles.fabMenu, { opacity: menuOpacity, transform: [{ scale: menuScale }] }]}>

          <TouchableOpacity
            style={styles.fabMenuItem}
            onPress={() => { toggleFab(); router.push('/(chef)/add'); }}
          >
            <View style={[styles.fabMenuIcon, { backgroundColor: COLORS.primaryFaint }]}>
              <Ionicons name="sparkles" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.fabMenuLabel}>AI Quick Add</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fabMenuItem}
            onPress={() => { toggleFab(); router.push('/(chef)/add'); }}
          >
            <View style={[styles.fabMenuIcon, { backgroundColor: COLORS.border }]}>
              <Ionicons name="create" size={18} color={COLORS.dark} />
            </View>
            <Text style={styles.fabMenuLabel}>Manual Entry</Text>
          </TouchableOpacity>

        </Animated.View>

        <TouchableWithoutFeedback onPress={toggleFab}>
          <Animated.View style={[styles.fab, { transform: [{ rotate: fabRotate }] }]}>
            <Ionicons name="add" size={30} color="#FFF" />
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Header ───────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOW.sm,
  },
  headerTag: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.obsidian,
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: COLORS.primaryLight,
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryFaint,
  },
  countText: { fontSize: 18, fontWeight: '900', color: COLORS.primary },

  // ── List ─────────────────────────────────────────────
  list: { padding: 16, paddingBottom: 110 },

  // ── Card ─────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.light,
    ...SHADOW.sm,
  },
  cardImg: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.border,
  },
  cardBody:   { flex: 1, marginLeft: 14, justifyContent: 'space-between' },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardName:   { fontSize: 15, fontWeight: '800', color: COLORS.obsidian, flex: 1, marginRight: 8 },
  deleteBtn:  { padding: 4 },
  cardDesc:   { fontSize: 12, color: COLORS.medium, lineHeight: 17, marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  cardPrice:  { fontSize: 16, fontWeight: '900', color: COLORS.obsidian },
  vegBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  vegText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },

  // ── Empty ─────────────────────────────────────────────
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.obsidian, marginBottom: 8 },
  emptySub:   { textAlign: 'center', color: COLORS.medium, fontSize: 14, lineHeight: 22 },

  // ── FAB ───────────────────────────────────────────────
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 1 },
  fabWrap:  { position: 'absolute', bottom: 28, right: 24, alignItems: 'center', zIndex: 2 },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 10,
  },
  fabMenu: {
    position: 'absolute',
    bottom: 72,
    right: 0,
    alignItems: 'flex-end',
    gap: 8,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.lg,
    gap: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.light,
    ...SHADOW.md,
  },
  fabMenuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabMenuLabel: { fontSize: 14, fontWeight: '700', color: COLORS.obsidian },
});
