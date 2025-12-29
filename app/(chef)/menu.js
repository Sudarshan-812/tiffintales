import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
  TouchableWithoutFeedback
} from 'react-native';

// Third-party Imports
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Local Imports
import { supabase } from '../../lib/supabase';

// Brand Theme Constants
const COLORS = {
  background: '#FDFBF7',
  surface: '#FFFFFF',
  obsidian: '#0F172A',
  gray: '#94A3B8',
  grayDark: '#64748B',
  border: '#E2E8F0',
  error: '#EF4444',
  success: '#10B981',
  primary: '#7E22CE', // Purple
};

/**
 * MenuItemCard
 * Renders individual dish details and handles delete interactions.
 * @param {object} props
 * @param {object} props.item - The menu item data object
 * @param {function} props.onDelete - Callback when delete is pressed
 */
const MenuItemCard = ({ item, onDelete }) => {
  // Logic: Treat null or undefined as Veg; only strict false is Non-Veg
  const isVeg = item.is_veg !== false;

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
        style={styles.image}
      />
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <TouchableOpacity onPress={() => onDelete(item.id, item.name)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
        <Text style={styles.desc} numberOfLines={2}>
          {item.description || 'No description provided.'}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>₹{item.price}</Text>
          <View style={[styles.badge, { backgroundColor: isVeg ? '#ECFDF5' : '#FEF2F2' }]}>
            <View style={[styles.dot, { backgroundColor: isVeg ? COLORS.success : COLORS.error }]} />
            <Text style={[styles.badgeText, { color: isVeg ? COLORS.success : COLORS.error }]}>
              {isVeg ? 'VEG' : 'NON-VEG'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function ChefMenuScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Data State
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation State
  const [menuOpen, setMenuOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  // Initial Data Load
  useFocusEffect(
    useCallback(() => {
      fetchMenu();
    }, [])
  );

  /**
   * Fetches menu items for the current authenticated chef.
   */
  const fetchMenu = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('chef_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      Alert.alert('Error', 'Could not load menu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMenu();
  };

  /**
   * Handles deletion confirmation and database removal.
   * @param {string} id - Item ID
   * @param {string} name - Item Name (for alert context)
   */
  const handleDelete = (id, name) => {
    Alert.alert(
      'Delete Dish',
      `Are you sure you want to remove "${name}" from your menu?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('menu_items').delete().eq('id', id);
            if (error) Alert.alert('Error', error.message);
            else fetchMenu();
          }
        }
      ]
    );
  };

  /**
   * Toggles the Floating Action Button (FAB) state with spring animation.
   */
  const toggleMenu = () => {
    const toValue = menuOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      friction: 6,
      useNativeDriver: true,
    }).start();
    setMenuOpen(!menuOpen);
  };

  // FAB Interpolations
  const rotation = {
    transform: [
      {
        rotate: animation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '45deg'],
        }),
      },
    ],
  };

  const opacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Kitchen Menu 📜</Text>
          <Text style={styles.subtitle}>{menuItems.length} dishes active</Text>
        </View>
      </View>

      {/* LIST CONTENT */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={menuItems}
          keyExtractor={i => i.id.toString()}
          renderItem={({ item }) => <MenuItemCard item={item} onDelete={handleDelete} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="fast-food-outline" size={48} color={COLORS.gray} />
              </View>
              <Text style={styles.emptyTitle}>Your Menu is Empty</Text>
              <Text style={styles.emptyText}>Tap the + button to add your first delicious dish!</Text>
            </View>
          }
        />
      )}

      {/* 🪄 FAB & OVERLAY */}
      {menuOpen && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.fabContainer}>
        {/* Animated Menu Options */}
        <Animated.View style={[styles.menuItemsContainer, { opacity, transform: [{ scale: animation }] }]}>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { toggleMenu(); router.push('/(chef)/add'); }}
          >
            <View style={[styles.menuIconBg, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="sparkles" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.menuLabel}>AI Quick Add</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { toggleMenu(); router.push('/(chef)/add'); }}
          >
            <View style={[styles.menuIconBg, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="create" size={20} color={COLORS.obsidian} />
            </View>
            <Text style={styles.menuLabel}>Manual Entry</Text>
          </TouchableOpacity>

        </Animated.View>

        {/* Main Toggle Button */}
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <Animated.View style={[styles.fab, rotation]}>
            <Ionicons name="add" size={32} color="white" />
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.obsidian
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.grayDark,
    fontWeight: '600',
    marginTop: 2
  },
  // List
  listContent: {
    padding: 20,
    paddingBottom: 100
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 14,
    backgroundColor: '#F1F5F9'
  },
  content: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.obsidian,
    flex: 1,
    marginRight: 8
  },
  deleteBtn: {
    padding: 4
  },
  desc: {
    fontSize: 12,
    color: COLORS.gray,
    lineHeight: 16,
    marginTop: 4
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.obsidian
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.obsidian,
    marginBottom: 8
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 14,
    lineHeight: 22
  },
  // FAB Styles
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    alignItems: 'center'
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 1
  },
  menuItemsContainer: {
    position: 'absolute',
    bottom: 80,
    right: 0,
    alignItems: 'flex-end',
    gap: 16,
    zIndex: 2
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 12
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.obsidian
  }
});