/**
 * TiffinTales — Shared Design Tokens
 * Single source of truth for all visual constants.
 */

export const COLORS = {
  // ─── Brand (Swiggy/Zomato Warmth) ────────────────────────
  primary:        '#FC8019',   // Swiggy Orange — drives action/appetite
  primaryDark:    '#D96204',
  primaryLight:   '#FEF2E8',
  primaryFaint:   '#FFF9F5',

  // ─── Semantic ─────────────────────────────────────────────
  success:        '#06C167',   // Uber Eats Green
  successLight:   '#E6F9F0',
  warning:        '#F59E0B',
  warningLight:   '#FEF3C7',
  error:          '#EF4444',
  errorLight:     '#FEE2E2',
  info:           '#3B82F6',
  infoLight:      '#DBEAFE',

  // ─── Cooking alias (used in orders) ───────────────────────
  cooking:        '#F59E0B',
  cookingLight:   '#FEF3C7',

  // ─── Neutrals (High Contrast, Uber Eats Style) ────────────
  obsidian:       '#000000',   // Pure black for primary headings
  dark:           '#1C1C1E',   // Secondary text (iOS native feel)
  medium:         '#6B7280',   // Muted text / descriptions
  gray:           '#9CA3AF',   // Placeholders
  muted:          '#D1D5DB',   // Disabled states
  light:          '#E5E7EB',   // Borders
  border:         '#F3F4F6',   // Standard thin border
  divider:        '#F9FAFB',   // Very subtle section dividers
  surface:        '#FFFFFF',   // Pure white for cards
  background:     '#F4F4F5',   // Slightly off-white app background
  backgroundAlt:  '#EBEBEC',   // Alternate background
  inputBg:        '#F9FAFB',   // Input fields

  // ─── Order Status ─────────────────────────────────────────
  pending:        '#D97706',
  pendingBg:      '#FEF3C7',
  ready:          '#06C167',
  readyBg:        '#E6F9F0',
  delivered:      '#1C1C1E',
  rejected:       '#EF4444',
  rejectedBg:     '#FEE2E2',

  // ─── Overlay / Shadow ─────────────────────────────────────
  overlay:        'rgba(0,0,0,0.6)',
  shadow:         '#000000',
};

export const FONTS = {
  xs:   11,
  sm:   12,
  base: 14,
  md:   15,
  lg:   16,
  xl:   18,
  '2xl':20,
  '3xl':24,
  '4xl':28,
  '5xl':32,
  '6xl':36,
};

export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl':24,
  '3xl':32,
  full: 999,
};

export const SHADOW = {
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 16,
  },
};

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};
