/**
 * GazeTalk — App configuration & Design System
 */
import { Dimensions, NativeModules } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Backend ──────────────────────────────────────────
// Automatically extract the host IP from the React Native bundle server
let backendIp = '172.26.206.83'; // Fallback IP
if (__DEV__) {
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/^https?:\/\/([^:]+)/);
    if (match && match[1]) {
      backendIp = match[1];
    }
  }
}
export const BACKEND_URL = `http://${backendIp}:8000`;

// ─── Keyboard Layout ──────────────────────────────────
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export const NUMBERS = '1234567890'.split('');
export const PUNCTUATION = ['.', ',', '?', '!', "'", '-'];

export const COLUMNS = 7;
export const BUTTON_SIZE = (SCREEN_WIDTH - 50) / COLUMNS;

// ─── Gaze / Dwell ─────────────────────────────────────
export const DEFAULT_DWELL_TIME = 1500;    // ms to select key via gaze dwell
export const BLINK_COOLDOWN = 1000;        // ms between blink selections
export const SMOOTHING_FACTOR = 0.35;      // EMA smoothing (lower = smoother)
export const SENSITIVITY = 2.2;            // Gaze amplification factor

// ─── Dimensions ───────────────────────────────────────
export const SCREEN = { width: SCREEN_WIDTH, height: SCREEN_HEIGHT };

// ═══════════════════════════════════════════════════════
// ─── DESIGN SYSTEM & THEME ENGINE ─────────────────────
// ═══════════════════════════════════════════════════════

export type ThemeId = 'deep_space' | 'cyber_neon' | 'ocean_glass';

export const THEMES = {
  deep_space: {
    id: 'deep_space',
    name: 'Deep Space',
    primary:      '#00f2fe',   // Cyan
    primaryDim:   'rgba(0, 242, 254, 0.25)',
    secondary:    '#a855f7',   // Purple
    secondaryDim: 'rgba(168, 85, 247, 0.25)',
    accent:       '#4facfe',   // Blue
    accentDim:    'rgba(79, 172, 254, 0.2)',
    success:      '#43e97b',
    successGlow:  'rgba(67, 233, 123, 0.5)',
    danger:       '#ff3b30',
    warning:      '#ff9500',
    bg:           '#050510',
    bgCard:       'rgba(10, 10, 30, 0.85)',
    bgKeyTop:     'rgba(30, 30, 60, 0.6)',
    bgKeyBottom:  'rgba(8, 8, 20, 0.8)',
    textPrimary:  '#ffffff',
    textSecondary:'rgba(255, 255, 255, 0.7)',
    textMuted:    'rgba(255, 255, 255, 0.4)',
    textInverse:  '#0a0a1a',
    borderGlass:  'rgba(255, 255, 255, 0.08)',
    borderActive: 'rgba(0, 242, 254, 0.6)',
  },
  cyber_neon: {
    id: 'cyber_neon',
    name: 'Cyber Neon',
    primary:      '#ff00ff',   // Hot Pink
    primaryDim:   'rgba(255, 0, 255, 0.25)',
    secondary:    '#00ffff',   // Electric Blue
    secondaryDim: 'rgba(0, 255, 255, 0.25)',
    accent:       '#fcee0a',   // Cyber Yellow
    accentDim:    'rgba(252, 238, 10, 0.2)',
    success:      '#00ff00',
    successGlow:  'rgba(0, 255, 0, 0.5)',
    danger:       '#ff003c',
    warning:      '#ff8a00',
    bg:           '#000000',
    bgCard:       'rgba(15, 0, 15, 0.85)',
    bgKeyTop:     'rgba(40, 0, 40, 0.6)',
    bgKeyBottom:  'rgba(10, 0, 10, 0.8)',
    textPrimary:  '#ffffff',
    textSecondary:'rgba(255, 255, 255, 0.8)',
    textMuted:    'rgba(255, 255, 255, 0.5)',
    textInverse:  '#000000',
    borderGlass:  'rgba(255, 0, 255, 0.15)',
    borderActive: 'rgba(0, 255, 255, 0.8)',
  },
  ocean_glass: {
    id: 'ocean_glass',
    name: 'Ocean Glass',
    primary:      '#00ff87',   // Sea Green
    primaryDim:   'rgba(0, 255, 135, 0.25)',
    secondary:    '#60efff',   // Aqua
    secondaryDim: 'rgba(96, 239, 255, 0.25)',
    accent:       '#0061ff',   // Deep Blue
    accentDim:    'rgba(0, 97, 255, 0.2)',
    success:      '#00ff87',
    successGlow:  'rgba(0, 255, 135, 0.5)',
    danger:       '#ff4b2b',
    warning:      '#f7b733',
    bg:           '#001020',
    bgCard:       'rgba(0, 20, 40, 0.85)',
    bgKeyTop:     'rgba(0, 40, 70, 0.6)',
    bgKeyBottom:  'rgba(0, 10, 25, 0.8)',
    textPrimary:  '#ffffff',
    textSecondary:'rgba(255, 255, 255, 0.8)',
    textMuted:    'rgba(255, 255, 255, 0.5)',
    textInverse:  '#001020',
    borderGlass:  'rgba(96, 239, 255, 0.12)',
    borderActive: 'rgba(0, 255, 135, 0.6)',
  }
};

export type ThemeColors = typeof THEMES.deep_space;

export const SHADOWS = {
  glow: (color: string, radius = 12, opacity = 0.8) => ({
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  }),
  glassBead: {
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  }
} as const;

export const RADII = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ─── Defaults ─────────────────────────────────────────
export const DEFAULT_SETTINGS = {
  dwellTime: DEFAULT_DWELL_TIME,
  smoothing: SMOOTHING_FACTOR,
  sensitivity: SENSITIVITY,
  autoSpeak: true,
  hapticFeedback: true,
  showNumbers: false,
  theme: 'deep_space' as ThemeId,
};

export type AppSettings = typeof DEFAULT_SETTINGS;
